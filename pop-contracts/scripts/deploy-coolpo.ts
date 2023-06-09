import { ethers } from "hardhat";
import { CYBERGIRL_ADDR } from "../deployed";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);

  const factory = await ethers.getContractFactory("Coolpo");
  const Coolpo = await factory.deploy();

  await Coolpo.deployed();

  console.log("Coolpo deployed to:", Coolpo.address);
  
  // tbsc
  // Coolpo deployed to: https://testnet.bscscan.com/address/0x2E344024B6Fa28646BdAce18C259525FB179b29A#writeContract
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
