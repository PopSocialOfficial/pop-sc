import { ethers } from "hardhat";
import { MAX_COMP_ADDR, B_MAX_COMP_ADDR } from "../../deployed";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);

  const factory = await ethers.getContractFactory("Max");
  const Max = await factory.deploy(MAX_COMP_ADDR);

  await Max.deployed();

  console.log("Max deployed to:", Max.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
