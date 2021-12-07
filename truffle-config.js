const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: { // ganache
      host: "127.0.0.1",
      port: 8545,
      network_id: 1337
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(
          process.env.MNENOMIC,
          `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
          1
        );
      },
      network_id: 42,
      gas: 5500000,
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
  },
  compilers: {
    solc: {
      version: "0.8.0", // Récupérer la version exacte de solc-bin (par défaut : la  version de truffle)
      settings: {  // Voir les documents de solidity pour des conseils sur l'optimisation et l'evmVersion
        optimizer: {
          enabled: false,
          runs: 200
        },
      }
    }
  },
};
