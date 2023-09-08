const { ethers } = require("hardhat");
import { address } from './../../../test/utils';
import tokenSaleProxyAbi from '../../../contracts/abis/tokenSaleProxy.json';
import implementationAbi from '../../../contracts/abis/tokenSale.json';

const hre = require('hardhat')

async function main() {

    const [owner] = await ethers.getSigners();

    const TokenSaleDistributorProxyFactory = await hre.ethers.getContractFactory("TokenSaleDistributorProxy");
    const TokenSaleDistributorFactory = await hre.ethers.getContractFactory("TokenSaleDistributor");

    const proxy = await TokenSaleDistributorProxyFactory.deploy(); // 1
    console.log('Proxy deployed...');

    const implementation = await TokenSaleDistributorFactory.deploy(); // 1
    console.log('Implementation deployed...');

    
    await proxy.setPendingImplementation(implementation.address).then(async() => {
      setTimeout(async function() {
        await implementation.becomeImplementation(proxy.address).then(() => {
          const tokenSaleDistributor = TokenSaleDistributorFactory.attach(proxy.address);
  
          console.log('PROXY ADDR', tokenSaleDistributor.address);
          console.log('IMPLEMENTATION ADDR', implementation.address);

          // need to set reward token address and send reward token to vesting contract in order for claim
          // to work
        })
      }, 10000);
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
