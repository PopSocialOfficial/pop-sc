import { Contract, ContractFactory, utils } from "ethers";
import { type SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Interface } from "@ethersproject/abi";

import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import { Accessory, ContractDeployStruct } from "../interfaces";

const { BigNumber } = ethers;

describe("Genesis NFT testing", function () {

    let owner: SignerWithAddress;
    let bob: SignerWithAddress;
    let alice: SignerWithAddress;
    let genesisNFT: Contract;

    let hatNFT: Contract, clothesNFT: Contract, glassesNFT: Contract, furNFT : Contract;

    let contractsToWhitelist: string[]; 

    let accessories: Accessory[] = []

    beforeEach(async () => {
        [owner, bob, alice] = await ethers.getSigners();

        const HatNFT: ContractFactory = await ethers.getContractFactory("Accessory");
        const ClothesNFT: ContractFactory = await ethers.getContractFactory("Accessory");
        const GlassesNFT: ContractFactory = await ethers.getContractFactory("Accessory");
        const FurNFT: ContractFactory = await ethers.getContractFactory("Accessory");

        const contractsToDeploy: ContractDeployStruct[] = [
            {factory: HatNFT, name: 'Hat', symbol: 'HAT'}, 
            {factory: ClothesNFT, name: 'Clothes', symbol: 'CLOTHES'}, 
            {factory: GlassesNFT, name: 'Glasses', symbol: 'GLASSES'}, 
            {factory: FurNFT, name: 'Fur', symbol: 'FUR'}
        ];
        let deployed: Contract[] = [];
        
        const deploymentPromises = contractsToDeploy.map(async (contract: ContractDeployStruct) => {
            const contractDeploy = await contract.factory.deploy(contract.name, contract.symbol);
            const deployedContract = await contractDeploy.deployed();
            return deployedContract;
        });

        deployed = await Promise.all(deploymentPromises);

        hatNFT = deployed[0];
        clothesNFT = deployed[1];
        glassesNFT = deployed[2];
        furNFT = deployed[3];
        
        contractsToWhitelist = deployed.map((contract) => contract.address);

        const GenesisNFT = await ethers.getContractFactory("Genesis");
        genesisNFT = await upgrades.deployProxy(GenesisNFT, [contractsToWhitelist], {initializer: "initialize"});
        await genesisNFT.deployed();

        accessories = [
            {contractAddr: hatNFT.address, accessoryId: 0},
            {contractAddr: clothesNFT.address, accessoryId: 0},
            {contractAddr: glassesNFT.address, accessoryId: 0},
            {contractAddr: furNFT.address, accessoryId: 0}
        ]
          
        await genesisNFT.setAccessoryOrder(accessories.map((contract) => contract.contractAddr));
        for (let i = 0; i < accessories.length; i++) {
            const addr = await genesisNFT.accessoryOrder(i);   
            expect(addr).to.equal(accessories[i].contractAddr);
            console.log(addr, i);
        }
    });

    it("Should have whitelisted contracts", async function() {
        for (let i = 0; i < contractsToWhitelist.length; i++) {
            expect(await genesisNFT.whitelistedContracts(contractsToWhitelist[i])).to.equal(true);
        }
    });

    it("Should set the order of accessory types", async function() {
        await genesisNFT.setAccessoryOrder(accessories.map((contract) => contract.contractAddr));
        for (let i = 0; i < accessories.length; i++) {
            const addr = await genesisNFT.accessoryOrder(i);   
            expect(addr).to.equal(accessories[i].contractAddr);
            console.log(addr, i);
        }
    });

    it("Should be able to claim if whitelisted", async function() {
        await genesisNFT.addToWhitelist([bob.address]);
        await expect(genesisNFT.connect(bob).claim(1)).to.not.be.reverted;
    });

    it("Should not be able to claim if not whitelisted", async function() {
        await expect(genesisNFT.connect(bob).claim(1)).to.be.revertedWith('not whitelisted');
    });

    it("Should not revert if equip accessories on Genesis NFT in the right order (hat, clothes, eyes, ears)", async function() {
        // prepare bob's wallet
        await hatNFT.mint(bob.address, 1, 1, []);
        await furNFT.mint(bob.address, 1, 1, []);
        await glassesNFT.mint(bob.address, 1, 1, []);
        await clothesNFT.mint(bob.address, 1, 1, []);

        await hatNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await clothesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await glassesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await furNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);

        await genesisNFT.safeMint(bob.address, 1);

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1},
            {contractAddr: clothesNFT.address, accessoryId: 1},
            {contractAddr: glassesNFT.address, accessoryId: 1},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, "");

        const equippedHat = await genesisNFT.equippedAccessories(1, 0);
        const equippedClothes = await genesisNFT.equippedAccessories(1, 1);
        const equippedGlasses = await genesisNFT.equippedAccessories(1, 2);
        const equippedFur = await genesisNFT.equippedAccessories(1, 3);

        expect(equippedHat.contractAddr).to.equal(hatNFT.address);
        expect(equippedClothes.contractAddr).to.equal(clothesNFT.address);
        expect(equippedGlasses.contractAddr).to.equal(glassesNFT.address);
        expect(equippedFur.contractAddr).to.equal(furNFT.address);
    });

    it("Should revert if not token owner and equip", async function() {
        // prepare bob's wallet
        await hatNFT.mint(bob.address, 1, 1, []);
        await furNFT.mint(bob.address, 1, 1, []);
        await glassesNFT.mint(bob.address, 1, 1, []);
        await clothesNFT.mint(bob.address, 1, 1, []);

        await hatNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await clothesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await glassesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await furNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);

        await genesisNFT.safeMint(owner.address, 1);

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1},
            {contractAddr: clothesNFT.address, accessoryId: 1},
            {contractAddr: glassesNFT.address, accessoryId: 1},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, "", {gasLimit: 800000})).to.be.revertedWith("not owner");
    });

    it("Should revert if accessories are provided in wrong order", async function() {
        // prepare bob's wallet
        await hatNFT.mint(bob.address, 1, 1, []);
        await furNFT.mint(bob.address, 1, 1, []);
        await glassesNFT.mint(bob.address, 1, 1, []);
        await clothesNFT.mint(bob.address, 1, 1, []);

        await hatNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await clothesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await glassesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await furNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);

        await genesisNFT.safeMint(bob.address, 1);

        //equip items

        const accessoriesToEquip = [
            {contractAddr: clothesNFT.address, accessoryId: 1},
            {contractAddr: hatNFT.address, accessoryId: 1},
            {contractAddr: furNFT.address, accessoryId: 1},
            {contractAddr: glassesNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, "", {gasLimit: 800000})).to.be.revertedWith("wrong order");
    });

    it("Should revert if accessory contract address is duplicated", async function() {
        // prepare bob's wallet
        await hatNFT.mint(bob.address, 1, 1, []);
        await furNFT.mint(bob.address, 1, 1, []);
        await glassesNFT.mint(bob.address, 1, 1, []);
        await clothesNFT.mint(bob.address, 1, 1, []);

        await hatNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await clothesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await glassesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await furNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);

        await genesisNFT.safeMint(bob.address, 1);

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1}, 
            {contractAddr: hatNFT.address, accessoryId: 1}, // duplicate hat contract
            {contractAddr: glassesNFT.address, accessoryId: 1},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, "", {gasLimit: 800000})).to.be.revertedWith("wrong order");
    });

    it("Should revert if provide more than 4 accessories to equip", async function() {
        // prepare bob's wallet
        await hatNFT.mint(bob.address, 1, 1, []);
        await hatNFT.mint(bob.address, 1, 1, []);
        await furNFT.mint(bob.address, 1, 1, []);
        await glassesNFT.mint(bob.address, 1, 1, []);
        await clothesNFT.mint(bob.address, 1, 1, []);

        await hatNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await clothesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await glassesNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await furNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);

        await genesisNFT.safeMint(bob.address, 1);

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1},
            {contractAddr: clothesNFT.address, accessoryId: 1},
            {contractAddr: glassesNFT.address, accessoryId: 1},
            {contractAddr: furNFT.address, accessoryId: 1},
            {contractAddr: hatNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, "")).to.be.revertedWith("wrong length");
    });

    it("Should not revert if equip just 2 items", async function() {
        // prepare bob's wallet
        await hatNFT.mint(bob.address, 1, 1, []);
        await furNFT.mint(bob.address, 1, 1, []);

        await hatNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await furNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);

        await genesisNFT.safeMint(bob.address, 1);

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1}, 
            {contractAddr: clothesNFT.address, accessoryId: 0}, 
            {contractAddr: glassesNFT.address, accessoryId: 0},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, "", {gasLimit: 800000})).to.not.be.reverted;
    
        for (let i = 0; i < 4; i++) {
            const item = await genesisNFT.equippedAccessories(1, i);
            console.log(`EQUIPPED ACCESSORY ${i}: `, item);
        }
        
        
    });

    it("Should de-equip 1 item", async function() {
        // prepare bob's wallet
        await hatNFT.mint(bob.address, 1, 1, []);
        await furNFT.mint(bob.address, 1, 1, []);

        await hatNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await furNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);

        await genesisNFT.safeMint(bob.address, 1);

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1}, 
            {contractAddr: clothesNFT.address, accessoryId: 0}, 
            {contractAddr: glassesNFT.address, accessoryId: 0},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, "", {gasLimit: 800000})).to.not.be.reverted;
    
        for (let i = 0; i < 4; i++) {
            const item = await genesisNFT.equippedAccessories(1, i);
            console.log(`BEFORE DE EQUIPPED HAT ${i}: `, item);
        }

        // 0 for hat
        await genesisNFT.connect(bob).deEquipAccessory(1, 0);
        
        for (let i = 0; i < 4; i++) {
            const item = await genesisNFT.equippedAccessories(1, i);
            console.log(`AFTER DE EQUIPPED HAT ${i}: `, item);
        }
        
    });

    it("Should de-equip all items", async function() {
        // prepare bob's wallet
        await hatNFT.mint(bob.address, 1, 1, []);
        await furNFT.mint(bob.address, 1, 1, []);

        await hatNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await furNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);

        await genesisNFT.safeMint(bob.address, 1);

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1}, 
            {contractAddr: clothesNFT.address, accessoryId: 0}, 
            {contractAddr: glassesNFT.address, accessoryId: 0},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, "", {gasLimit: 800000})).to.not.be.reverted;
    
        for (let i = 0; i < 4; i++) {
            const item = await genesisNFT.equippedAccessories(1, i);
            console.log(`BEFORE DE EQUIPPED ${i}: `, item);
        }

        // 0 for hat
        await genesisNFT.connect(bob).deEquipAllAccessories(1);
        
        for (let i = 0; i < 4; i++) {
            const item = await genesisNFT.equippedAccessories(1, i);
            console.log(`AFTER DE EQUIPPED ${i}: `, item);
        }
        
    });

});
