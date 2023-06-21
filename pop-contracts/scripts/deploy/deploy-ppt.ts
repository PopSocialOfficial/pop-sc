import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);

  const balance = await owner.getBalance();
  console.log(`Account balance: ${balance.toString()}`)

  const PopooTokenFac = await ethers.getContractFactory("PopToken");
  const popooToken = await PopooTokenFac.deploy(200000000);

  await popooToken.deployed();

  console.log('PPT address', popooToken.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});