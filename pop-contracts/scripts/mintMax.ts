import fs from 'fs';
import { ethers } from "hardhat";
import { MAX_COMP_ADDR, B_MAX_COMP_ADDR, B_CYBERGIRL_ADDR } from "../deployed";

async function main() {
  // const Cybergirl = await ethers.getContractFactory("Cybergirl");
  // const contract = Cybergirl.attach(B_CYBERGIRL_ADDR);

  // await contract.safeMint("0x6E6Fd4ac140937786515e8CAfBe0d171E776BAB5", `https://bafybeifzcb6wx22lkgfyswao7qvuaoytbo2avl76lfsj43pjrjfbn7qhaa.ipfs.nftstorage.link/100.json`)
  // for (let i = 1; i < 100; i++) {
  //   await contract.safeMint("0x6E6Fd4ac140937786515e8CAfBe0d171E776BAB5", `https://bafybeifzcb6wx22lkgfyswao7qvuaoytbo2avl76lfsj43pjrjfbn7qhaa.ipfs.nftstorage.link/${i}.json`)
  // }

  const MaxComponents = await ethers.getContractFactory("MaxComponents");
  const contract = MaxComponents.attach(MAX_COMP_ADDR);
  const files = await fs.promises.readdir(`./maxcomp-metadata`);

  const ids: string[] = [];

  for (let i = 0; i < files.length; ++i) {
    ids.push(files[i].split(".")[0])
  }

  await contract.mintBatch("0x6E6Fd4ac140937786515e8CAfBe0d171E776BAB5",
    ids,
    Array(ids.length).fill(1000), "0x"
  )

  // for (let i = 0; i < ids.length; ++i) {
  //   let content = require(`../maxcomp-metadata/${ids[i]}.json`);
  //   const energyPoints = content.energyPoints;
  //   const uri = await contract.tokenURI(ids[i]);
  //   console.log(uri);

  //   if (!uri) {
  //     (await contract.setURI(
  //       ids[i],
  //       `https://nftstorage.link/ipfs/bafybeieopypn3xpqkxh4dbwrqapxlezj5trvfwph3y2oyamm36camxz44e/${ids[i]}.json`,
  //       energyPoints
  //     )).wait(2)
  //     console.log("Done", i, ids[i]);
  //   }
  // }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// const ids = [
//   // background
//   0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
//   // clothes
//   100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111,
//   //eyes
//   200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218,
//   // fur
//   300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315,
//   // hat
//   400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416,
//   // mouth
//   500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520,
// ]
