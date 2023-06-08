import fs from 'fs';
import path from 'path';
const dir = path.join(__dirname, '../maxcomp-metadata');

// ipfs://bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja
// https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja

async function main() {
  try {
    const files = await fs.promises.readdir(dir);
    const data: any = {}
    for (let i = 0; i < files.length; ++i) {
      let file = files[i];
      const id = file.split(".")[0]

      let filePath = path.join(dir, file);
      let content = require(filePath);
      data[id] = content;
      await fs.promises.writeFile(`./combined.json`, JSON.stringify(data))
    }
  }
  catch (e) {
    // Catch anything bad that happens
    console.error("We've thrown! Whoops!", e);
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});