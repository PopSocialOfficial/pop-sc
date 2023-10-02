const { ethers } = require("hardhat");
const tokenSaleProxyAbi = require('../contracts/abis/tokenSale.json');
const tokenSaleAbi = require('../contracts/abis/tokenSaleAbi.json');

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const csvWriter = require('csv-write-stream');

async function main() {
    const [owner] = await ethers.getSigners();
    const tokenSale = new ethers.Contract("0x3D94bB8bEF2dD11CBE08953607521B7da180363d", tokenSaleAbi, owner)
    try {

      let recipients: string[] = [];
      const csvFilePath = path.join(__dirname, 'token_sale_event_deposited.csv');

      fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const recipient = row.to; // Assuming "to" is the header for the recipient column in your CSV
        const amount = row.amount; // Assuming "amount" is the header for the amount column in your CSV
    
        // Check if recipient and amount are valid before processing
        if (recipient && amount) {
          // Check if the recipient already exists in the recipients array
          const recipientIndex = recipients.indexOf(recipient);
    
          if (recipientIndex === -1) {
            recipients.push(recipient);
          } 
        }
      })
      .on('end', async () => {
        // Create an array of objects with recipients and amounts
        // replace with the right address
        let csvData = [];

        for (let index = 0; index < recipients.length; index++) {
          const user = recipients[index];
          const userInfo = await tokenSale.userInfo(user);
          const amount = userInfo.tokensOwed.toString();

          // Push recipient and amount as an object to the csvData array
          csvData.push({ recipient: user, amount: amount });
          console.log(`PUSHED DATA FOR USER ${user} with owed amount ${amount}`);
        }

        // Create a writable stream for the CSV file
        const writableStream = fs.createWriteStream('tokensOwed.csv');
        const writer = csvWriter();

        // Pipe the data to the CSV file
        writer.pipe(writableStream);

        // Write each record in csvData
        csvData.forEach((record) => {
          writer.write(record);
        });

        // End the writing process
        writer.end();

        console.log('CSV file has been written successfully.');
      });
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