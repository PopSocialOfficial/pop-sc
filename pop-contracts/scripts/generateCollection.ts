import fs from 'fs';

// ipfs://bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja
// https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja

// generates metadata.json with images folder provided

async function main() {
  try {
    const categories = ["background", "clothes", "eyes", "fur", "hat", "mouth"]

    for (let c = 0; c < categories.length; c++) {
      const files = await fs.promises.readdir(`./max-assets/${categories[c]}`);

      for (let i = 0; i < files.length; ++i) {
        let file = files[i];
        // @ts-ignore
        const name = (file.split(".")[0]).replaceAll("-", " ");
        const image = `https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/${categories[c]}/${file.toLowerCase()}`

        await fs.promises.writeFile(`./maxcomp-metadata/${c * 100 + i}.json`,
          `{
  "name" : "${name}",
  "image" : "${image}",
  "energyPoints" : "${Math.floor((Math.random() * 50) + 30)}"
}`)
      }
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