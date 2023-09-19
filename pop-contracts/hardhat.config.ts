import * as dotenv from "dotenv";

import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import chai from "chai";
// import { solidity } from "ethereum-waffle";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import "solidity-coverage";
import "@nomicfoundation/hardhat-chai-matchers"
// chai.use(solidity);

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
      url: "http://127.0.0.1:1337/",
    },
    // mumbai: {
    //   url: "https://mumbai.rpc.thirdweb.com",
    //   accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    // },
    tbsc: {
      url: "https://distinguished-red-tent.bsc-testnet.discover.quiknode.pro/d1eac418ed5fda22caed6ee2403a8551a0cdefc2/",
      accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    },
    bscx: {
      chainId: 56,
      url: "https://bsc-mainnet.nodereal.io/v1/99050ec5347d4ca1ae0bf66e892285ca",
      // accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    },
    // sepolia: {
    //   url: "https://rpc.ankr.com/eth_sepolia",
    //   accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    // },
    // forkedBsc: {
    //   url: "https://bsc.popoo.dev/",
    //   accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    // }
    bsc: {
      chainId: 56,
      url: "https://bsc-dataseed1.binance.org",
      accounts: [process.env.OWNER_PRIVATE_KEY ?? ""]
    },
  },
  // etherscan: {
  //   apiKey: process.env.POLYGONSCAN_API_KEY,
  //   // apiKey: process.env.BSC_API_KEY,
  // },
  etherscan: {
    apiKey: "X82E3J433VJVX911TMY7WZ5FK29GHAUDGM", // bsc
  }
};

export default config;

