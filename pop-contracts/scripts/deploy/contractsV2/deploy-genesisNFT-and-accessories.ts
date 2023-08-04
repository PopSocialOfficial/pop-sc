import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

interface Accessory {
    contractAddr: string;
    accessoryId: number;
}

async function main() {

    let genesisNFT: Contract;

    let hatNFT: Contract, clothesNFT: Contract, glassessNFT: Contract, furNFT : Contract;

    let contractsToWhitelist: string[]; 

    let accessories: Accessory[] = []

    const HatNFT: ContractFactory = await ethers.getContractFactory("Hat");
    const ClothesNFT: ContractFactory = await ethers.getContractFactory("Clothes");
    const GlassesNFT: ContractFactory = await ethers.getContractFactory("Glasses");
    const FurNFT: ContractFactory = await ethers.getContractFactory("Fur");

    const contractsToDeploy = [HatNFT, ClothesNFT, GlassesNFT, FurNFT];
    let deployed: Contract[] = [];

    const hatDeploy = await HatNFT.deploy();
    const hatDeployed = await hatDeploy.deployed();
    console.log(`HAT deployed at ${hatDeployed.address}`);

    const clothesDeploy = await ClothesNFT.deploy();
    const clothesDeployed = await clothesDeploy.deployed();
    console.log(`CLOTHES deployed at ${clothesDeployed.address}`);

    const glassesDeploy = await GlassesNFT.deploy();
    const glassesDeployed = await glassesDeploy.deployed();
    console.log(`GLASSES deployed at ${glassesDeployed.address}`);

    const furDeploy = await FurNFT.deploy();
    const furDeployed = await furDeploy.deployed();
    console.log(`FUR deployed at ${furDeployed.address}`);
    
    hatNFT = hatDeployed[0];
    clothesNFT = clothesDeployed[1];
    glassessNFT = glassesDeployed[2];
    furNFT = furDeployed[3];
    
    contractsToWhitelist = deployed.map((contract) => contract.address);

    const GenesisNFT = await ethers.getContractFactory("Genesis");
    genesisNFT = await upgrades.deployProxy(GenesisNFT, [contractsToWhitelist], {initializer: 'initialize'});
    await genesisNFT.deployed();

    accessories = [
        {contractAddr: hatNFT.address, accessoryId: 0},
        {contractAddr: clothesNFT.address, accessoryId: 0},
        {contractAddr: glassessNFT.address, accessoryId: 0},
        {contractAddr: furNFT.address, accessoryId: 0}
    ]
      
    await genesisNFT.setAccessoryOrder(accessories.map((contract) => contract.contractAddr));

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
