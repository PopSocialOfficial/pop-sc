import { ethers } from "ethers";
import tokenSaleProxyAbi from '../contracts/abis/tokenSaleProxy.json';
import implementationAbi from '../contracts/abis/tokenSale.json';

const { ethers } = require("hardhat");
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');



import vestingAbi from '../abi/vestingAbi.json';

async function main() {
    const [owner] = await ethers.getSigners();

    let tokenSaleDistributor = new ethers.Contract("0xcb4a9E3700603298CB7c2c106360a4ec719284B2", tokenSaleProxyAbi, owner);

    await tokenSaleDistributor.setTokenAddress("0xDf061250302E5cCae091B18CA2B45914D785F214");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});