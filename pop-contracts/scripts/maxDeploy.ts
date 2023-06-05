import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);

  const factory = await ethers.getContractFactory("MaxComponents");
  const MaxComponents = await factory.deploy();

  await MaxComponents.deployed();

  console.log("MaxComponents deployed to:", MaxComponents.address);
  // MaxComponents deployed to: 0x7153B6Be2448fC4b76B9e2bF68Bf17D16Db522b9
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
