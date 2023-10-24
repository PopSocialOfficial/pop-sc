import { log } from "console";
import { BigNumber, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
const { ethers } = require("hardhat");
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const tokenSaleProxyAbi = require('../contracts/abis/tokenSale.json');
const tokenSaleAbi = require('../contracts/abis/tokenSaleAbi.json');

async function main() {

  const [owner] = await ethers.getSigners();
  try {

    let recipients: string[] = [];
    let amounts: BigNumber[] = [];
    const csvFilePath = path.join(__dirname, '../FinalTokenSale2-Addresses.csv');

    fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      const recipient = row.recipient; // Assuming "to" is the header for the recipient column in your CSV
      const amount = row.amountPPT; // Assuming "amount" is the header for the amount column in your CSV
  
      // Check if recipient and amount are valid before processing
      if (recipient && amount) {
        recipients.push(recipient);
        amounts.push(parseEther(amount.replace(/,/g, "")))
      }
      console.log(recipients.length, 'RECIPIENTS');
      
    })
    .on('end', async () => {
        const vestingContract = new ethers.Contract("0x2AdE8bC15a4F32E3d4791d80F62342d8E17CD8FE", tokenSaleProxyAbi, owner)
            for(let i = 0; i < recipients.length; i++){
                const total = await vestingContract.totalAllocations(recipients[i])
                console.log(recipients[i], 'ADDRESS');
                console.log(total, 'TOTAL ALLOCATIONS');
                if(total > 1){
                    console.log('ISSUE!');
                    return 
                }
            }
        
        }
    );

    
}
  catch (e) {
   console.log(e);
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});