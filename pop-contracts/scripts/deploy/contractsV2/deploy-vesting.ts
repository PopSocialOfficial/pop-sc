const { ethers } = require("hardhat");
import { address } from './../../../test/utils';
import tokenSaleProxyAbi from '../../../contracts/abis/tokenSaleProxy.json';
import implementationAbi from '../../../contracts/abis/tokenSale.json';

const hre = require('hardhat')

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {

    const [owner] = await ethers.getSigners();

    const TokenSaleDistributorProxyFactory = await hre.ethers.getContractFactory("TokenSaleDistributorProxy");
    const TokenSaleDistributorFactory = await hre.ethers.getContractFactory("TokenSaleDistributor");

    const proxy = await TokenSaleDistributorProxyFactory.deploy(); // 1
    console.log('Proxy deployed...', proxy.address);
    await sleep(10000);

    const implementation = await TokenSaleDistributorFactory.deploy(); // 1
    console.log('Implementation deployed...', implementation.address);
    await sleep(10000);

    await proxy.setPendingImplementation(implementation.address)
    await sleep(10000);
    await implementation.becomeImplementation(proxy.address)
    const tokenSaleDistributor = TokenSaleDistributorFactory.attach(proxy.address);

    console.log('PROXY ADDR', tokenSaleDistributor.address);
    console.log('IMPLEMENTATION ADDR', implementation.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});