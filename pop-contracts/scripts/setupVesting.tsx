import { ethers } from "ethers";
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
    let amounts: string[] = [];
    const csvFilePath = path.join(__dirname, '../tokensOwed.csv');

    fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      const recipient = row.recipient; // Assuming "to" is the header for the recipient column in your CSV
      const amount = row.amount; // Assuming "amount" is the header for the amount column in your CSV
  
      // Check if recipient and amount are valid before processing
      if (recipient && amount) {
        recipients.push(recipient);
        amounts.push(amount)
      }
    })
    .on('end', async () => {
      const tokenSale = new ethers.Contract("0x3D94bB8bEF2dD11CBE08953607521B7da180363d", tokenSaleAbi, owner)
      const totalPPTOwedInContract = await tokenSale.SALE_STATUS();
      console.log(BigInt(totalPPTOwedInContract[2]), 'TOTAL PPT OWED IN CONTRACT');
      
      let totalPPTOwedInCSV = BigInt(0);
      for (let i = 0; i < amounts.length; i++) {
        totalPPTOwedInCSV += BigInt(amounts[i]);
      }

      console.log(totalPPTOwedInCSV, 'TOTAL PPT OWED IN CSV');

      if(totalPPTOwedInContract[2] == totalPPTOwedInCSV){
        console.log(`VERIFICATION SUCCESS FOR TOKEN PPT OWED. ${totalPPTOwedInContract[2]} = ${totalPPTOwedInCSV}`,);

        const vestingContract = new ethers.Contract("", tokenSaleProxyAbi, owner)
        
        let isLinear = new Array(recipients.length).fill(false);
        let epochs = new Array(recipients.length).fill("1694169845") // to be modified
        let vestingDurations = new Array(recipients.length).fill("9");
        let cliffs = new Array(recipients.length).fill("0");
        let cliffPercentages = new Array(recipients.length).fill("0");

        // console.log(recipients, 'RECIPIENTS');
        // console.log(isLinear, 'IS LINEAR');
        // console.log(epochs, 'epochs');
        // console.log(vestingDurations, 'vestingDurations');
        // console.log(cliffs, 'cliffs');
        // console.log(cliffPercentages, 'cliffPercentages');
        // console.log(amounts, 'AMOUNTS');
        
        await vestingContract.setAllocations(recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,amounts)
      }
    });

    // for (let index = 0; index < recipients.length; index++) {
    //     const user = recipients[index];
    //     console.log(user, 'USER');
    //     await vestingContract.resetAllocationsByUser(user);
    // }
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