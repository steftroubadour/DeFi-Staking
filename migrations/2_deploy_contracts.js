// 2_deploy_contracts.js

// DAI avec ganache

const Dai = artifacts.require("Dai");
const DeFiStaking = artifacts.require("DeFiStaking");
const { BN } = require('@openzeppelin/test-helpers');
const Web3 = require('web3');

module.exports = async function(deployer, _network, accounts) {
  switch (_network) {
    case 'development':
      // Using a new Dai

      /*await deployer.deploy(Dai);
      const dai = await Dai.deployed();
      await deployer.deploy(DeFiStaking, dai.address);
      const deFiStaking = await DeFiStaking.deployed();
      await dai.faucet(deFiStaking.address, Web3.utils.toWei('2000', 'ether'))
      await deFiStaking.foo(accounts[1], Web3.utils.toWei('100', 'ether'))*/


      // Using an already deployed Dai
      const daiAddress = "0xDb2F46130F38296943e80b1aE797225397266d52"
      await deployer.deploy(DeFiStaking, daiAddress, "0x777A68032a88E5A84678A77Af2CD65A7b3c0775a", "100");
      await DeFiStaking.deployed();

      break;
    case 'kovan':
      const daiKovanAddress = "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa"
      await deployer.deploy(DeFiStaking, daiKovanAddress, "0x777A68032a88E5A84678A77Af2CD65A7b3c0775a", 100);
      await DeFiStaking.deployed();

      break;
    default:
      alert(`Can't deploy contract on this network : ${_network}.`);
  }
}