import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

interface Accessory {
    contractAddr: string;
    accessoryId: number;
}

async function main() {

    const HatNFT: ContractFactory = await ethers.getContractFactory("Accessory");
    const ClothesNFT: ContractFactory = await ethers.getContractFactory("Accessory");
    const GlassesNFT: ContractFactory = await ethers.getContractFactory("Accessory");
    const FurNFT: ContractFactory = await ethers.getContractFactory("Accessory");

    const hatDeploy = await upgrades.deployProxy(HatNFT, ['Hat', 'HAT'], {initializer: 'initialize'});
    const hatDeployed = await hatDeploy.deployed();
    console.log(`Hat Accessory Proxy deployed at address ${hatDeploy.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(hatDeploy.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(hatDeploy.address), 'admin address');

    const clothesDeploy = await upgrades.deployProxy(ClothesNFT,['Clothes', 'CLOTHES'], {initializer: 'initialize'});
    const clothesDeployed = await clothesDeploy.deployed();
    console.log(`Clothes Accessory Proxy deployed at address ${clothesDeploy.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(clothesDeploy.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(clothesDeploy.address), 'admin address');

    const glassesDeploy = await upgrades.deployProxy(GlassesNFT,['Glasses', 'GLASSES'],{initializer: 'initialize'});
    const glassesDeployed = await glassesDeploy.deployed();
    console.log(`Glasses Accessory Proxy deployed at address ${glassesDeploy.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(glassesDeploy.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(glassesDeploy.address), 'admin address');

    const furDeploy = await upgrades.deployProxy(FurNFT, ['Fur', 'FUR'], {initializer: 'initialize'});
    const furDeployed = await furDeploy.deployed();
    console.log(`Fur Accessory Proxy deployed at address ${furDeploy.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(furDeploy.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(furDeploy.address), 'admin address');
    
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
