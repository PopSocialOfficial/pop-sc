import { ethers, upgrades } from "hardhat";

async function main() {

    const genesisNFTAddr = "";

    const GenesisNFTV2 = await ethers.getContractFactory("Genesis");
    const genesisNFT = await upgrades.upgradeProxy(genesisNFTAddr, GenesisNFTV2);
    await genesisNFT.deployed();

    console.log(`GenesisNFT Proxy deployed at address ${genesisNFT.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(genesisNFT.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(genesisNFT.address), 'admin address');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
