import { Contract, ContractFactory, utils } from "ethers";
import { type SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Interface } from "@ethersproject/abi";

import {expect} from "chai";
import { upgrades } from "hardhat";
const { ethers } = require("hardhat");

interface Accessory {
    contractAddr: string;
    accessoryId: number;
}

describe("Genesis NFT testing", async function () {
    
    let hatNFT: Contract, clothesNFT: Contract, eyesNFT: Contract, earsNFT : Contract;

    let contractsToWhitelist: string[]; 

    let accessories: Accessory[] = []

    let owner: SignerWithAddress;
    let bob: SignerWithAddress;
    let alice: SignerWithAddress;
    let genesisNFT: Contract;

    before(async () => {

        [owner, bob, alice] = await ethers.getSigners();

        const HatNFT: ContractFactory = await ethers.getContractFactory("Hat");
        const ClothesNFT: ContractFactory = await ethers.getContractFactory("Clothes");
        const GlassesNFT: ContractFactory = await ethers.getContractFactory("Glasses");
        const FurNFT: ContractFactory = await ethers.getContractFactory("Fur");
    
        const contractsToDeploy = [HatNFT, ClothesNFT, GlassesNFT, FurNFT];
        let deployed: Contract[] = [];
        
        const deploymentPromises = contractsToDeploy.map(async (contract: ContractFactory) => {
            const contractDeploy = await contract.deploy();
            const deployedContract = await contractDeploy.deployed();
            return deployedContract;
        });
    
        deployed = await Promise.all(deploymentPromises);
    
        hatNFT = deployed[0];
        clothesNFT = deployed[1];
        eyesNFT = deployed[2];
        earsNFT = deployed[3];
        
        contractsToWhitelist = deployed.map((contract) => contract.address);
    
        const GenesisNFT = await ethers.getContractFactory("Genesis");
        genesisNFT = await upgrades.deployProxy(GenesisNFT, [contractsToWhitelist], {initializer: 'initialize'});
        await genesisNFT.deployed();
    
        accessories = [
            {contractAddr: hatNFT.address, accessoryId: 0},
            {contractAddr: clothesNFT.address, accessoryId: 0},
            {contractAddr: eyesNFT.address, accessoryId: 0},
            {contractAddr: earsNFT.address, accessoryId: 0}
        ]
            
        await genesisNFT.setAccessoryOrder(accessories.map((contract) => contract.contractAddr));
        for (let i = 0; i < accessories.length; i++) {
            const addr = await genesisNFT.accessoryOrder(i);   
            expect(addr).to.equal(accessories[i].contractAddr);
            console.log(addr, i);
        }
    });

    it("Should equip items bob", async function() {
        // prepare bob's wallet
        await hatNFT.mint(bob.address, 1, 1, []);
        await earsNFT.mint(bob.address, 1, 1, []);
        await eyesNFT.mint(bob.address, 1, 1, []);
        await clothesNFT.mint(bob.address, 1, 1, []);

        await hatNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await clothesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await eyesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await earsNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);

        await genesisNFT.safeMint(bob.address, 1);

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1},
            {contractAddr: clothesNFT.address, accessoryId: 1},
            {contractAddr: eyesNFT.address, accessoryId: 1},
            {contractAddr: earsNFT.address, accessoryId: 1}
        ]

        await genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, "");
    });

    it("Should equip items Alice", async function() {
        // prepare bob's wallet
        await hatNFT.mint(alice.address, 2, 1, []);
        await earsNFT.mint(alice.address, 2, 1, []);
        await eyesNFT.mint(alice.address, 2, 1, []);
        await clothesNFT.mint(alice.address, 2, 1, []);

        await hatNFT.connect(alice).setApprovalForAll(genesisNFT.address, true);
        await clothesNFT.connect(alice).setApprovalForAll(genesisNFT.address, true);
        await eyesNFT.connect(alice).setApprovalForAll(genesisNFT.address, true);
        await earsNFT.connect(alice).setApprovalForAll(genesisNFT.address, true);

        await genesisNFT.safeMint(alice.address, 2);

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 2},
            {contractAddr: clothesNFT.address, accessoryId: 2},
            {contractAddr: eyesNFT.address, accessoryId: 2},
            {contractAddr: earsNFT.address, accessoryId: 2}
        ]

        await genesisNFT.connect(alice).equipAccessories(2, accessoriesToEquip, "", {gasLimit: 800000});
    
        const equippedHatAlice = await genesisNFT.equippedAccessories(2, 0);
        const equippedClothesAlice = await genesisNFT.equippedAccessories(2, 1);
        const equippedGlassesAlice = await genesisNFT.equippedAccessories(2, 2);
        const equippedEarAlice = await genesisNFT.equippedAccessories(2, 3);

        console.log(equippedHatAlice, equippedClothesAlice, equippedGlassesAlice, equippedEarAlice);

        const equippedHatBob = await genesisNFT.equippedAccessories(1, 0);
        const equippedClothesBob = await genesisNFT.equippedAccessories(1, 1);
        const equippedGlassesBob = await genesisNFT.equippedAccessories(1, 2);
        const equippedFurBob = await genesisNFT.equippedAccessories(1, 3);

        console.log(equippedHatBob, equippedClothesBob, equippedGlassesBob, equippedFurBob);
        
    });

});
