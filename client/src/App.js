import React, { Component } from "react"
import DeFiStakingContract from "./contracts/DeFiStaking.json"
import ERC20Contract from "./contracts/ERC20.json"
import getWeb3 from "./getWeb3"
import 'bootstrap/dist/css/bootstrap.min.css'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Navbar from 'react-bootstrap/Navbar'
import Row from 'react-bootstrap/Row'
import Spinner from "react-bootstrap/Spinner"

import Pool from './components/Pool'

import "./App.css"

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    poolsAddresses: [],
    rewardTokenPrice: null,
    rewardTokenBalance: 0,
    isContractOwner: false,
    isAddingPool: false
  }

  newPool = {
    token: null,
    prideFeed: null,
    yield: null
  }

  networkId = null

  rewardTokenPriceFeedContract = null
  rewardTokenInstance = null
  rewardToken =  {
    address: null,
    name: null,
    symbol: null,
    decimals: null,
    icon: null,
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3()

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts()
      this.setState({ accounts: accounts })

      // Get the contract instance.
      this.networkId = await web3.eth.net.getId()
      const deployedNetwork = DeFiStakingContract.networks[this.networkId]

      const instance = new web3.eth.Contract(
        DeFiStakingContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      this.setState({ web3: web3, accounts: accounts, contract: instance }, this.initialize)
    } catch (error) {
      alert(`Failed to load web3, accounts, or contract. Check console for details.`,)
      console.error(error);
    }
  }

  initialize = async () => {
    const { contract, web3 } = this.state
    const rewardTokenAddress = await contract.methods.rewardToken().call()

    const aggregatorV3InterfaceABI = [{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint80", "name": "_roundId", "type": "uint80" }], "name": "getRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }]
    const rewardTokenPriceFeed = await this.retrievePoolPriceFeed(rewardTokenAddress)
    this.rewardTokenPriceFeedContract = new web3.eth.Contract(aggregatorV3InterfaceABI, rewardTokenPriceFeed)

    this.rewardTokenInstance = new web3.eth.Contract(ERC20Contract.abi, rewardTokenAddress);

    const rewardTokenName = await this.rewardTokenInstance.methods.name().call()
    const rewardTokenSymbol = await this.rewardTokenInstance.methods.symbol().call()
    const rewardTokenDecimals = await this.rewardTokenInstance.methods.decimals().call()

    this.rewardToken = {
      address: rewardTokenAddress,
      name: rewardTokenName,
      symbol: rewardTokenSymbol,
      decimals: rewardTokenDecimals,
      icon: './images/tokens/' + rewardTokenSymbol.toLowerCase() + '.svg'
    }

    this.subscribeEthereumEvents()

    const isContractOwner = await this.retrieveIsContractOwner()
    this.setState({ isContractOwner: isContractOwner })

    this.subscribeContractsEvents()

    this.updateValues()

  }

  subscribeEthereumEvents = () => {
    window.ethereum.on('accountsChanged', accounts => {
      console.log(`Accounts updated: ${accounts}`)
      window.location.reload()
    })

    window.ethereum.on('chainChanged', networkId => {
      console.log(`Network updated: ${networkId}`)
      window.location.reload()
    })
  }

  subscribeContractsEvents = () => {
    const { contract } = this.state;

    contract.events.PoolAdded((error, event) => {
      if (!error) {
        this.updateValues()

        return
      }

      console.error(error)
    })
    contract.events.Staked((error, event) => {
      if (!error) {
        this.updateValues()

        return
      }

      console.error(error)
    })
    contract.events.Unstaked((error, event) => {
      if (!error) {
        this.updateValues()

        return
      }

      console.error(error)
    })
  }

  updateValues = () => {
    this.updateRewardTokenPrice()
    this.updateRewardTokenBalance()
    this.updatePoolsAddresses()
  }

  retrieveIsContractOwner = async () => {
    const { contract, accounts } = this.state

    try {
      const result = await contract.methods.owner().call()

      return result === accounts[0]

    } catch (error) {
      console.error(error)
    }
  }

  retrievePoolPriceFeed = async (poolTokenAddress) => {
    try {
      const pool = await this.state.contract.methods.pools(poolTokenAddress).call()

      return pool.priceFeed

    } catch (error) {
      console.error(error)
    }
  }

  updateRewardTokenPrice = () => {
    if (this.networkId === 1337) {
      this.setState({ rewardTokenPrice : 1 })

      return
    }

    this.rewardTokenPriceFeedContract.methods.latestRoundData().call()
      .then((roundData) => {
        this.setState({ rewardTokenPrice: this.state.web3.utils.fromWei(roundData.answer + "0000000000", 'ether') })
      })
  }


  updateRewardTokenBalance = () => {
    this.rewardTokenInstance.methods.balanceOf(this.state.accounts[0]).call().then((balance) => {
      this.setState({ rewardTokenBalance: Number(this.state.web3.utils.fromWei(balance, 'ether')) })
    })
  }

  updatePoolsAddresses = () => {
    this.state.contract.methods.getPools().call()
      .then((poolsAddresses) => this.setState({ poolsAddresses: poolsAddresses }))
  }

  ellipsis(string) {
    return string.substring(0, 4) + '...' + string.slice(-4);
  }

  addPool = async () => {
    const { contract, accounts } = this.state;
    this.setState({ isAddingPool: true });

    const pool = this.newPool

    try {
      await contract.methods.addPool(pool.token.value, pool.prideFeed.value, pool.yield.value).send({ from: accounts[0] })

    } catch (error) {
      console.error(error)
    }

    this.setState({ isAddingPool: false });
  }

  render() {
    let isReadyToRender = false
    isReadyToRender = this.state.accounts && this.state.web3 && this.state.rewardTokenPrice

    if (!isReadyToRender) {
      return <p>Loading Web3, accounts, and contract... </p>;
    }

    return (
      <>
        <Navbar className="px-3" bg="light">
          <Navbar.Brand className="brand">
            DeFi Staking App
          </Navbar.Brand>
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              <img
                className="token"
                alt={ this.rewardToken.name }
                title={ this.rewardToken.name }
                src={ this.rewardToken.icon } /> price: { this.state.rewardTokenPrice } $
              <Button className="mx-3" variant="outline-primary">{ this.state.accounts ? this.ellipsis(this.state.accounts[0]) : 'Connect' }</Button>
            </Navbar.Text>
          </Navbar.Collapse>
        </Navbar>

        <Container>
          {/*Begin admin*/}
          {this.state.isContractOwner ?
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <Card>
              <Card.Header className="text-center"><strong>Add a new pool</strong></Card.Header>
              <Card.Body className="text-center">
                <Form id="addPool">
                  <Row className="mb-3">
                    <Form.Group as={Col}>
                      <Form.Label>Token address</Form.Label>
                      <Form.Control type="text" id="poolTokenAddress"
                                    ref={(input) => {
                                      this.newPool.token = input
                                    }}
                      />
                    </Form.Group>

                    <Form.Group as={Col}>
                      <Form.Label>Token price feed</Form.Label>
                      <Form.Control type="text" id="poolTokenPriceFeed"
                                    ref={(input) => {
                                      this.newPool.prideFeed = input
                                    }}
                      />
                    </Form.Group>

                    <Form.Group as={Col}>
                      <Form.Label>Yield in %</Form.Label>
                      <Form.Control type="text" id="poolYield"
                                    ref={(input) => {
                                      this.newPool.yield = input
                                    }}
                      />
                    </Form.Group>
                  </Row>

                  <Button variant="primary" onClick={ this.addPool }>
                    { this.state.isAddingPool ?
                      <Spinner as="span" animation="border" size="sm" />
                      : "Add" }
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </div> : <></>}
          {/*End admin*/}
          <div>
            { this.state.poolsAddresses.map((poolToken, index) => (
              <Pool web3={this.state.web3}
                    contract={this.state.contract}
                    account={this.state.accounts[0]}
                    retrieveRewardTokenBalance={this.retrieveRewardTokenBalance}
                    retrievePoolPriceFeed={this.retrievePoolPriceFeed}
                    id={index}
                    key={index}
                    poolToken={poolToken}
                    rewardToken={this.rewardToken}
                    rewardTokenPrice={this.state.rewardTokenPrice}
                    rewardTokenBalance={this.state.rewardTokenBalance}
                    networkId = {this.networkId}
              />
            ))}
          </div>
        </Container>
      </>
    );
  }
}

export default App;