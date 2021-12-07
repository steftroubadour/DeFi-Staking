import React, { Component } from 'react';

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';

import ERC20Contract from "../contracts/ERC20.json";

class Pool extends Component {

  constructor(props) {
    super(props);

    this.web3 = this.props.web3
    this.contract = this.props.contract
    this.networkId = this.props.networkId
    this.pool = {
      token: {
        address: this.props.poolToken,
        name: null,
        symbol: null,
        decimals: null,
        icon: null
      },
      yield: 0,
    }
    this.rewardToken =  {
      address: this.props.rewardToken.address,
      name: this.props.rewardToken.name,
      symbol: this.props.rewardToken.symbol,
      decimals: this.props.rewardToken.decimals,
      icon: './images/tokens/' + this.props.rewardToken.symbol.toLowerCase() + '.svg',
    }
    this.user = {
      account: this.props.account,
      rewardTokenBalance: this.props.rewardTokenBalance,
    }
    // functions
    this.updateRewardTokenBalance = this.props.updateRewardTokenBalance // .bind(this) si on a besoin du contexte de Pool
    this.retrievePoolPriceFeed = this.props.retrievePoolPriceFeed // Ici on a bien besoin du contexte de App, donc rien
    //
    this.amountToStake = 0

    this.state = {
      poolBalance: 0,
      userStakeAmount: 0,
      userPendingRewards: 0,
      userBalance: 0,

      isStakeModalShown: false,
      isPerforming: false,

      rewardTokenPrice: this.props.rewardTokenPrice,
      poolTokenPrice: 0
    }
  }

  async componentDidMount() {
    const pool = await this.contract.methods.pools(this.pool.token.address).call()
    this.pool.yield = parseInt(pool.yield)

    this.poolTokenInstance = new this.web3.eth.Contract(ERC20Contract.abi, this.pool.token.address)

    const symbol = await this.poolTokenInstance.methods.symbol().call()
    this.pool.token.symbol = symbol
    this.pool.token.icon = './images/tokens/' + symbol.toLowerCase() + '.svg'

    this.pool.token.name = await this.poolTokenInstance.methods.name().call()
    this.pool.token.decimals = await this.poolTokenInstance.methods.decimals().call()

    const aggregatorV3InterfaceABI = [{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint80", "name": "_roundId", "type": "uint80" }], "name": "getRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }]
    const poolTokenPriceFeed = await this.retrievePoolPriceFeed(this.pool.token.address)
    this.poolTokenPriceFeedContract = new this.web3.eth.Contract(aggregatorV3InterfaceABI, poolTokenPriceFeed)

    this.updateValues()
  }

  updateValues = () => {
    this.updatePoolTokenPrice()
    this.updatePoolBalance()
    this.updateUserBalanceInPool()
    this.updatePoolTokenUserBalance()
    this.updateUserPendingRewards()
  }

  updatePoolTokenPrice = () => {
    if (this.networkId === 1337) {
      this.setState({ poolTokenPrice : 1 })

      return
    }

    this.poolTokenPriceFeedContract.methods.latestRoundData().call()
      .then((roundData) => {
        this.setState({ poolTokenPrice: this.web3.utils.fromWei(roundData.answer + "0000000000", 'ether') })
      })
  }

  updatePoolBalance = () => {
    this.contract.methods.getPoolBalance(this.pool.token.address).call()
      .then((balance) => this.pool.balance = Number(this.web3.utils.fromWei(balance, 'ether')).toFixed(2))
  }

  updateUserBalanceInPool = () => {
    this.contract.methods.getUserBalanceInPool(this.pool.token.address, this.user.account).call()
      .then((balance) => {
        this.setState({ userStakeAmount: Number(this.web3.utils.fromWei(balance, 'ether'))})
      })
  }

  updateUserPendingRewards = () => {
    this.contract.methods.pendingReward(this.pool.token.address).call({ from: this.user.account })
      .then((balance) => {
        this.setState({ userPendingRewards: Number(this.web3.utils.fromWei(balance, 'ether'))})
      })
  }

  updatePoolTokenUserBalance = () => {
    this.poolTokenInstance.methods.balanceOf(this.user.account).call()
      .then((balance) => this.setState( { userBalance: Number(this.web3.utils.fromWei(balance, 'ether')) }))
  }

  doStake = async () => {
    if (!this.poolTokenInstance || !this.user.account) {
      return
    }

    this.setState({ isPerforming: true })

    let result
    try {
      result = await this.poolTokenInstance.methods.allowance(this.user.account, this.contract._address).call()
    } catch(error) {
      console.error(error)
      this.setState({isPerforming: false})
      this.setState({isStakeModalShown: false})
      return
    }

    if (new this.web3.utils.BN(result) < new this.web3.utils.BN(this.web3.utils.toWei(this.amountToStake.value, "ether"))) {
      try {
        result = await this.poolTokenInstance.methods.approve(this.contract._address, this.web3.utils.toWei(this.amountToStake.value, "ether")).send({ from: this.user.account })
        if (result.status !== true) {
          this.setState({ isPerforming: false })
          this.setState({ isStakeModalShown: false })
          return
        }
      } catch(error) {
        console.error(error)
        this.setState({isPerforming: false})
        this.setState({isStakeModalShown: false})
        return
      }
    }

    this.contract.methods.stake(this.pool.token.address, this.web3.utils.toWei(this.amountToStake.value, "ether")).send({from: this.user.account})
      .then((result) => {
        this.updateValues()

        this.setState({ isPerforming: false })
        this.setState({ isStakeModalShown: false })
    })
  }

  doUnstake = async () => {
    this.contract.methods.unstake(this.pool.token.address).send({from: this.user.account})
      .then((result) => {
        this.updateValues()
        this.setState({ isPerforming: false })
    })
  }

  render() {
    /*if (!this.pool.token.symbol) {
      return <Spinner as="span" animation="border" size="sm" />
    }*/
    return (
      <>
        <Card className="m-1 d-inline-flex" style={{ width: 'calc((100% - 2rem)/4)' }}>
          <Card.Header className="text-center">
            stake <span className="symbol">{ this.pool.token.symbol }</span>
            <img
              className="token"
              alt={ this.pool.token.name }
              title={ this.pool.token.name }
              src={ this.pool.token.icon } />
            earn <span className="symbol">{ this.rewardToken.symbol }</span>
            <img
              className="token"
              alt={ this.rewardToken.name }
              title={ this.rewardToken.name }
              src={ this.rewardToken.icon } />
            <br />
            APR: { this.pool.yield } %
          </Card.Header>
          <Card.Body>
            <Row>
              <div className="title">{ this.rewardToken.symbol } earned</div>
            </Row>
            <Row>
              <Col>
                { this.state.userPendingRewards.toFixed(6) }
              </Col>
              <Col className="right">
                { (this.state.userPendingRewards * this.state.rewardTokenPrice).toFixed(6) } $
              </Col>
            </Row>
            <Row>
              <div className="title">{ this.pool.token.symbol } stacked</div>
            </Row>
            <Row>
              <Col>
                { this.state.userStakeAmount.toFixed(4) }
              </Col>
              <Col className="right">
                { (this.state.userStakeAmount * this.state.poolTokenPrice).toFixed(6) } $
              </Col>
            </Row>
          </Card.Body>
          <Card.Footer>
            <Row>
              <Button
                variant="primary"
                onClick={this.state.userStakeAmount === 0 ? () => this.setState({ isStakeModalShown: true }) : this.doUnstake }
                >
                { this.state.isPerforming ? <Spinner as="span" animation="border" size="sm" /> : this.state.userStakeAmount === 0 ? "Stake " + this.pool.token.symbol : "Unstake " + this.pool.token.symbol}
              </Button>
            </Row>
          </Card.Footer>
        </Card>

        <Modal show={ this.state.isStakeModalShown } centered backdrop="static" >
          <Modal.Header>
            <Modal.Title>{ this.pool.token.symbol } staking</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group>
                My { this.pool.token.symbol } balance: { this.state.userBalance }
              </Form.Group>
              <Form.Group>
                <Form.Control type="text" id="amountToStake"
                              ref={(input) => {
                                this.amountToStake = input
                              }}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={ this.doStake }>{ this.state.isPerforming ? <Spinner as="span" animation="border" size="sm" /> : "Stake " + this.pool.token.symbol }</Button>
            <Button variant="secondary" onClick={() => this.setState({ isStakeModalShown: false })}>Cancel</Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default Pool