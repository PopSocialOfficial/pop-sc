import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

interface Accessory {
    contractAddr: string;
    accessoryId: number;
}

async function main() {

    let genesisNFT: Contract;

    // let accessories: Accessory[] = []
    
    const contractsToWhitelist: string[] = ["0xF6C6789430E51a9B5977b969a88cd8a8905d9E04", "0xA975e69917A4c856b17Fc8Cc4C352f326Ef21C6B", "0x64587c60A3D19B0D73EFfd7660ee07cb76Ca465C", "0x56B7080ef4221FdBE210160efFd33F81B19926E0"];

    const GenesisNFT = await ethers.getContractFactory("Genesis");
    genesisNFT = await upgrades.deployProxy(GenesisNFT, [contractsToWhitelist], {initializer: 'initialize'});
    await genesisNFT.deployed();

    // accessories = [
    //     {contractAddr: contractsToWhitelist[0], accessoryId: 0},
    //     {contractAddr: contractsToWhitelist[1], accessoryId: 0},
    //     {contractAddr: contractsToWhitelist[2], accessoryId: 0},
    //     {contractAddr: contractsToWhitelist[3], accessoryId: 0}
    // ]
      
    // await genesisNFT.setAccessoryOrder(accessories.map((contract) => contract.contractAddr));

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
