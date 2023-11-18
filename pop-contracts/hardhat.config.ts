import * as dotenv from "dotenv";

import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import chai from "chai";
import {solidity} from "ethereum-waffle";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import {HardhatUserConfig} from "hardhat/config";
import "solidity-coverage";

chai.use(solidity);

dotenv.config();

const config: HardhatUserConfig & {
  contractSizer: {
    alphaSort: boolean,
    disambiguatePaths: boolean,
    runOnCompile: boolean,
    strict: boolean,
    only: string[]
  }
} = {
  defaultNetwork: "localhost",
  solidity: {
    compilers: [
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.9",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            }
          }
      },
      {
        version: "0.8.1",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            }
          }
      }
    ]
    
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [':Max', ":Pop", ":Cyber", ":Coolpo", ":Genesis"],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    // mumbai: {
    //   url: "https://mumbai.rpc.thirdweb.com",
    //   accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    // },
    tbsc: {
      url: "https://bsc-testnet.blockpi.network/v1/rpc/public",
      accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    },
    goerli: {
      // url: "https://goerli.infura.io/v3/dd365a18158e4879b2c02cde2c2519a7",
      url: "https://eth-goerli.g.alchemy.com/v2/MC8Dohq0AJdQsi_6inCTXAMTnPlLSMBl",
      accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    },
    forkedBsc: {
      url: "https://bsc.popoo.dev/",
      accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    },
    bsc: {
      url: "https://rpc.ankr.com/bsc",
      accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    }
  },
  etherscan: {
    // apiKey: process.env.POLYGONSCAN_API_KEY,
    apiKey: process.env.BSC_API_KEY,
  },
};

export default config;

