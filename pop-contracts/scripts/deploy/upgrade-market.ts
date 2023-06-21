import { ethers, upgrades } from "hardhat";
import { B_MARKET_PROXY_ADDR } from "../../deployed";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Owner => ", owner.address);
  const factory = await ethers.getContractFactory("PopMarketPlace");
  const PopMarketPlace = await upgrades.upgradeProxy(B_MARKET_PROXY_ADDR, factory);
  await PopMarketPlace.deployed();
  console.log("PokeMarketPlace deployed to:", PopMarketPlace.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// import { run } from "hardhat"

// async function verify(contractAddress: string, args: never[]) {
//     try {
//         await run("verify:verify", {
//             address: contractAddress,
//             constructorArgument: args,
//         })
//     } catch (e) {
//         console.log(e)
//     }
// }

// verify("0x8D4130F21bEc854182BeF4AE70CcF0F906Ee58B9", [])