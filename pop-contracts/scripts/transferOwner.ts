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

    let tokenSaleDistributor = new ethers.Contract("0x2AdE8bC15a4F32E3d4791d80F62342d8E17CD8FE", tokenSaleProxyAbi, owner);

    const tx = await tokenSaleDistributor.setPendingAdmin("0xDA99fC4B52998A2c09a7Ad7b9B133c1bc812E3D4");
    console.log(tx);
    
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});