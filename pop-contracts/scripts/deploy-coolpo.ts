import { ethers } from "hardhat";
import { CYBERGIRL_ADDR } from "../deployed";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);

  const factory = await ethers.getContractFactory("Coolpo");
  const Coolpo = await factory.deploy("0x6c7230237235f97498bd497edc823bc23ad344a9");

  await Coolpo.deployed();

  console.log("Coolpo deployed to:", Coolpo.address);
  // Coolpo deployed to: 0xc69fe4cEe0a65255fbFFD0956bEb2AD86a3D4508
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
