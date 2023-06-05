import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { MAX_ADDR } from "../deployed";

async function main() {
  const MaxComponents = await ethers.getContractFactory("MaxComponents");
  const contract = MaxComponents.attach(MAX_ADDR);
  const ids = [
    // background
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    // clothes
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111,
    //eyes
    200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218,
    // fur
    300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315,
    // hat
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416,
    // mouth
    500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520,
  ]
  await contract.mintBatch("0x6E6Fd4ac140937786515e8CAfBe0d171E776BAB5",
    ids,
    Array(ids.length).fill(1000)
  )

  // for (let i = 0; i <= 12; ++i) {
  //   await contract.setURI(
  //     i,
  //     `https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja/background/${i}.json`,
  //     Math.floor((Math.random() * 50) + 30)
  //   )
  //   console.log("Done background", i);
  // }
  // for (let i = 0; i <= 12; ++i) {
  //   await contract.setURI(
  //     100 + i,
  //     `https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja/clothes/${i}.json`,
  //     Math.floor((Math.random() * 50) + 30)
  //   )
  //   console.log("Done clothes", i);
  // }
  // for (let i = 0; i <= 18; ++i) {
  //   await contract.setURI(
  //     200 + i,
  //     `https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja/eyes/${i}.json`,
  //     Math.floor((Math.random() * 50) + 30)
  //   )
  //   console.log("Done eyes", i);
  // }
  // for (let i = 0; i <= 15; ++i) {
  //   await contract.setURI(
  //     300 + i,
  //     `https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja/fur/${i}.json`,
  //     Math.floor((Math.random() * 50) + 30)
  //   )
  //   console.log("Done fur", i);
  // }
  // for (let i = 0; i <= 16; ++i) {
  //   await contract.setURI(
  //     400 + i,
  //     `https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja/hat/${i}.json`,
  //     Math.floor((Math.random() * 50) + 30)
  //   )
  //   console.log("Done hat", i);
  // }
  // for (let i = 0; i <= 20; ++i) {
  //   await contract.setURI(
  //     500 + i,
  //     `https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja/mouth/${i}.json`,
  //     Math.floor((Math.random() * 50) + 30)
  //   )
  //   console.log("Done mouth", i);
  // }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
