import { ethers } from "hardhat";
import { MAX_ADDR } from "../deployed";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);

  const factory = await ethers.getContractFactory("DynamicPop");
  const DynamicPop = await factory.deploy(MAX_ADDR);

  await DynamicPop.deployed();

  console.log("DynamicPop deployed to:", DynamicPop.address);
  // DynamicPop deployed to: 0x4887165F0409FDeE4466fA6B396C44339a573937
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
