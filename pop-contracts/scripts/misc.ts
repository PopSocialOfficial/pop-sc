import { ethers } from "hardhat";
import { MAX_ADDR, MAX_COMP_ADDR } from "../deployed";

// ipfs://bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja
// https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja

async function main() {
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

  try {
    const [_, pop] = await ethers.getSigners();
    // const Max = await ethers.getContractFactory("Max");
    // const contract = Max.attach(MAX_ADDR);

    // const resp = await contract.connect(pop).safeMint([0, 600, 600, 300, 600, 600], "test uri check");
    // console.log(resp);

    const MaxComp = await ethers.getContractFactory("MaxComponents");
    const contract = MaxComp.attach(MAX_COMP_ADDR);

    const resp = await contract.connect(pop).safeBatchTransferFrom(
      pop.address,
      "0x1E410751B07498D1BC67433b8f7079186b600631",
      [1, 107, 205, 313, 406, 511, 9, 104, 208, 311, 402, 512],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      "0x"
    );
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
