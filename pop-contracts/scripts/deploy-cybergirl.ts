import { ethers } from "hardhat";
import { CYBERGIRL_ADDR } from "../deployed";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);

  const factory = await ethers.getContractFactory("Cybergirl");
  const Cybergirl = await factory.deploy();

  await Cybergirl.deployed();

  console.log("Cybergirl deployed to:", Cybergirl.address);
  // Cybergirl deployed to: 0x75362d43640cfE536520448Ba2407aDA56CD64dc
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
