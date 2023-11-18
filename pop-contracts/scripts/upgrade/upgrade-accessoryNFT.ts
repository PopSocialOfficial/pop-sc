import {ethers, upgrades} from "hardhat";

async function main() {
    
    let AccessoryNFTV2 = await ethers.getContractFactory("Accessory");
    let accessoryNFTv2 = await upgrades.upgradeProxy("0x636D2E561509FE59D5f792879A72D42cC6AbA574", AccessoryNFTV2);
    await accessoryNFTv2.deployed();

    console.log(`AccessoryNFTV2 Proxy deployed at address ${accessoryNFTv2.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(accessoryNFTv2.address), "implementation address");
    console.log(await upgrades.erc1967.getAdminAddress(accessoryNFTv2.address), 'admin address');

    AccessoryNFTV2 = await ethers.getContractFactory("Accessory");
    accessoryNFTv2 = await upgrades.upgradeProxy("0x41aB97066624c8B83Fd8be462DE382F4Ebe29433", AccessoryNFTV2);
    await accessoryNFTv2.deployed();

    console.log(`AccessoryNFTV2 Proxy deployed at address ${accessoryNFTv2.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(accessoryNFTv2.address), "implementation address");
    console.log(await upgrades.erc1967.getAdminAddress(accessoryNFTv2.address), 'admin address');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
