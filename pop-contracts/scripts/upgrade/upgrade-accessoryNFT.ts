import { ethers, upgrades } from "hardhat";

async function main() {

    const AccessoryNFTV1 = await ethers.getContractFactory("Accessory");
    const accessoryNFTv1 = await upgrades.deployProxy(AccessoryNFTV1, ['Hat', 'HAT'], {initializer: 'initialize'});
    await accessoryNFTv1.deployed();

    console.log(`AccessoryNFTV1 Proxy deployed at address ${accessoryNFTv1.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(accessoryNFTv1.address), "implementation address");
    console.log(await upgrades.erc1967.getAdminAddress(accessoryNFTv1.address), 'admin address');

    const AccessoryNFTV2 = await ethers.getContractFactory("Accessory");
    const accessoryNFTv2 = await upgrades.upgradeProxy(accessoryNFTv1.address, AccessoryNFTV2);
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
