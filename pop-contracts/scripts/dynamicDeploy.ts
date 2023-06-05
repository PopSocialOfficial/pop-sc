import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);

  const factory = await ethers.getContractFactory("DynamicPop");
  const DynamicPop = await factory.deploy("0x7153B6Be2448fC4b76B9e2bF68Bf17D16Db522b9");

  await DynamicPop.deployed();

  console.log("DynamicPop deployed to:", DynamicPop.address);
  // DynamicPop deployed to: 0x348AA5a2031d0fB0e190c0014a0E47DB2d4678ed
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
