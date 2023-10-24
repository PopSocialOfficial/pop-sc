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
      // const tokenSale = new ethers.Contract("0x3D94bB8bEF2dD11CBE08953607521B7da180363d", tokenSaleAbi, owner)
      // const totalPPTOwedInContract = await tokenSale.SALE_STATUS();
      // console.log(BigInt(totalPPTOwedInContract[2]), 'TOTAL PPT OWED IN CONTRACT');
      
      // let totalPPTOwedInCSV: BigNumber = BigNumber.from(0);
      // console.log(amounts[0]);
      
      // for (let i = 0; i < amounts.length; i++) {
      //   totalPPTOwedInCSV = totalPPTOwedInCSV.add(amounts[i]);
      // }

      // console.log(totalPPTOwedInCSV, 'TOTAL PPT OWED IN CSV');

      // console.log(BigNumber.from(totalPPTOwedInContract[2].toString()));
      // console.log(totalPPTOwedInCSV);

      // if(BigNumber.from(totalPPTOwedInContract[2].toString()) == totalPPTOwedInCSV){
        // console.log(`VERIFICATION SUCCESS FOR TOKEN PPT OWED. ${totalPPTOwedInContract[2]} = ${totalPPTOwedInCSV}`,);

        const vestingContract = new ethers.Contract("0x2AdE8bC15a4F32E3d4791d80F62342d8E17CD8FE", tokenSaleProxyAbi, owner)

        const firstBatch = {recipients: recipients.slice(0, 50), amounts: amounts.slice(0, 50)};
        const secondBatch = {recipients: recipients.slice(50, 100), amounts: amounts.slice(50, 100)};
        const thirdBatch = {recipients: recipients.slice(100, 150), amounts: amounts.slice(100, 150)};
        const fourthBatch = {recipients: recipients.slice(150, 200), amounts: amounts.slice(150, 200)};
        const fifthBatch = {recipients: recipients.slice(200, 250), amounts: amounts.slice(200, 250)};
        const sixthBatch = {recipients: recipients.slice(250, 300), amounts: amounts.slice(250, 300)};
        const seventhBatch = {recipients: recipients.slice(300, 350), amounts: amounts.slice(300, 350)};
        const eighthBatch = {recipients: recipients.slice(350, 400), amounts: amounts.slice(350, 400)};
        const ninthBatch = {recipients: recipients.slice(400, 450), amounts: amounts.slice(400, 450)};
        const tenthBatch = {recipients: recipients.slice(450, 500), amounts: amounts.slice(450, 500)};
        const eleventhBatch = {recipients: recipients.slice(500, 514), amounts: amounts.slice(500, 514)};
        // const twelfthBatch = {recipients: recipients.slice(550, recipients.length), amounts: amounts.slice(550, recipients.length)};

        // console.log(twelfthBatch.recipients.length, 'RECIPIENTS');
        
        
        let isLinear = new Array(eleventhBatch.recipients.length).fill(false);
        let epochs = new Array(eleventhBatch.recipients.length).fill("1698141600") // to be modified
        let vestingDurations = new Array(eleventhBatch.recipients.length).fill("9");
        let cliffs = new Array(eleventhBatch.recipients.length).fill("0");
        let cliffPercentages = new Array(eleventhBatch.recipients.length).fill("150000000000000000");

        // console.log(isLinear.length, 'IS LINEAR');
        // console.log(firstBatch.recipients.length, 'RECIPIENTS');

        // console.log(eighthBatch);
        
        // console.log(recipients.length);
        // console.log(amounts.length);
        
        // console.log(recipients.length, 'RECIPIENTS');
        // console.log(isLinear.length, 'IS LINEAR');
        // console.log(epochs.length, 'epochs');
        // console.log(vestingDurations.length, 'vestingDurations');
        // console.log(cliffs.length, 'cliffs');
        // console.log(cliffPercentages.length, 'cliffPercentages');
        // console.log(amounts.length, 'AMOUNTS');

        // console.log(firstBatch)
        
        // await vestingContract.setAllocations(firstBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,firstBatch.amounts, {gasLimit: 8000000})
        // await vestingContract.setAllocations(secondBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,secondBatch.amounts, {gasLimit: 8000000})
        // await vestingContract.setAllocations(thirdBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,thirdBatch.amounts, {gasLimit: 8000000})
        // await vestingContract.setAllocations(fourthBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,fourthBatch.amounts, {gasLimit: 8000000})
        // await vestingContract.setAllocations(fifthBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,fifthBatch.amounts, {gasLimit: 8000000})
        // await vestingContract.setAllocations(sixthBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,sixthBatch.amounts, {gasLimit: 8000000})
        // await vestingContract.setAllocations(seventhBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,seventhBatch.amounts, {gasLimit: 8000000})
        // await vestingContract.setAllocations(eighthBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,eighthBatch.amounts, {gasLimit: 8000000})
        // await vestingContract.setAllocations(ninthBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,ninthBatch.amounts, {gasLimit: 8000000})
        // await vestingContract.setAllocations(tenthBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,tenthBatch.amounts, {gasLimit: 8000000})
        await vestingContract.setAllocations(eleventhBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,eleventhBatch.amounts, {gasLimit: 8000000})
        // await vestingContract.setAllocations(twelfthBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,twelfthBatch.amounts, {gasLimit: 8000000})
        // cliff percentage example = 100000000000000000 = 0.1 ==> 0.1% of the total amount will be released at the cliff
        // const tx = await vestingContract.setAllocations(firstBatch.recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,firstBatch.amounts, {gasLimit: 8000000})
        // console.log(tx);                                                                                                                       
        
        }
    );

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