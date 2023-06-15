import { ethers, upgrades } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);

  const factory = await ethers.getContractFactory("PopMarketPlace");

  const PopMarketPlace = await upgrades.deployProxy(factory, [0]); // 0.00% fee

  await PopMarketPlace.deployed();

  console.log("PopMarketPlace deployed to:", PopMarketPlace.address);

  // Mumbai 
  // proxy : 0xB8A8B6aeB881cc050cad45d0391ec089f47d86F6
  // implementation: 0x6423649e8db5cae8ab612b2530a8ecfef98c7059

  // tBSC 
  // proxy : https://testnet.bscscan.com/address/0xF48Fd17433648C7c9021B71E392aBfE46f539113#readProxyContract
  // implementation: https://testnet.bscscan.com/address/0x4ce8eed805a8a5781fa9c8f81dbcc6296e0e5c3c#code

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
