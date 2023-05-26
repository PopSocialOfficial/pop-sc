import { ethers, upgrades } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);

  const factory = await ethers.getContractFactory("PopMarketPlace");

  const PopMarketPlace = await upgrades.deployProxy(factory, [0]); // 0.00% fee

  await PopMarketPlace.deployed();

  console.log("PopMarketPlace deployed to:", PopMarketPlace.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
