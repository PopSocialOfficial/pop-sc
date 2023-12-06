import { Contract, ContractFactory, utils } from "ethers";
import { type SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Interface } from "@ethersproject/abi";

import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import { Accessory, ContractDeployStruct } from "../interfaces";
import { generateMerkl } from './utils'
const { BigNumber } = ethers;
import keccak256 from 'keccak256'
  
describe("Genesis NFT testing", function () {

    let owner: SignerWithAddress;
    let bob: SignerWithAddress;
    let alice: SignerWithAddress;
    let fundRaiseClaimer: SignerWithAddress;
    let genesisNFT: Contract;

    let hatNFT: Contract, clothesNFT: Contract, glassesNFT: Contract, furNFT : Contract;

    let contractsToWhitelist: string[]; 

    let accessories: Accessory[] = []

    beforeEach(async () => {
        [owner, bob, alice, fundRaiseClaimer] = await ethers.getSigners();

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
            const contractDeploy = await upgrades.deployProxy(contract.factory, [contract.name, contract.symbol, "http://example.com", 100], {initializer: "initialize"});
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
        genesisNFT = await upgrades.deployProxy(GenesisNFT, [
            100, // totalSupply
            0, // startTime
            0, // startPrice
            fundRaiseClaimer.address, // fundRaiseClaimer
        ], {initializer: "initialize"});
        await genesisNFT.deployed();

        accessories = [
            {contractAddr: hatNFT.address, accessoryId: 0},
            {contractAddr: clothesNFT.address, accessoryId: 0},
            {contractAddr: glassesNFT.address, accessoryId: 0},
            {contractAddr: furNFT.address, accessoryId: 0}
        ]
        await genesisNFT.setWhitelisted(accessories.map((contract) => contract.contractAddr), accessories.length);
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

    it("Should remove whitelisted contract", async function() {
        for (let i = 0; i < contractsToWhitelist.length; i++) {
            expect(await genesisNFT.whitelistedContracts(contractsToWhitelist[i])).to.equal(true);
        }
        await genesisNFT.removeWhitelistedContracts([hatNFT.address]);
        expect(await genesisNFT.whitelistedContracts(hatNFT.address)).to.equal(false);
    });

    it("Should remove and add back whitelisted contract", async function() {
        for (let i = 0; i < contractsToWhitelist.length; i++) {
            expect(await genesisNFT.whitelistedContracts(contractsToWhitelist[i])).to.equal(true);
        }
        await genesisNFT.removeWhitelistedContracts([hatNFT.address]);
        expect(await genesisNFT.whitelistedContracts(hatNFT.address)).to.equal(false);

        await genesisNFT.addWhitelistedContract(hatNFT.address);

        expect(await genesisNFT.whitelistedContracts(hatNFT.address)).to.equal(true);
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
        const merklTreeRoot = generateMerkl([bob.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());
        await expect(genesisNFT.connect(bob).safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)))).to.not.be.reverted;
    });

    it("Should not be able to claim if not whitelisted", async function() {
        const merklTreeRoot = generateMerkl([owner.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());
        await expect(genesisNFT.safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)))).to.be.revertedWith('Genesis: invalid merkle proof');
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

        const merklTreeRoot = generateMerkl([bob.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());

        await genesisNFT.connect(bob).safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)));

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1},
            {contractAddr: clothesNFT.address, accessoryId: 1},
            {contractAddr: glassesNFT.address, accessoryId: 1},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip);

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

        const merklTreeRoot = generateMerkl([owner.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());
        await genesisNFT.safeMint(owner.address, merklTreeRoot.getHexProof(keccak256(owner.address)));

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1},
            {contractAddr: clothesNFT.address, accessoryId: 1},
            {contractAddr: glassesNFT.address, accessoryId: 1},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, {gasLimit: 800000})).to.be.revertedWith("Genesis: not owner");
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

        const merklTreeRoot = generateMerkl([bob.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());

        await genesisNFT.connect(bob).safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)));

        //equip items

        const accessoriesToEquip = [
            {contractAddr: clothesNFT.address, accessoryId: 1},
            {contractAddr: hatNFT.address, accessoryId: 1},
            {contractAddr: furNFT.address, accessoryId: 1},
            {contractAddr: glassesNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, {gasLimit: 800000})).to.be.revertedWith("Genesis: wrong order");
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

        const merklTreeRoot = generateMerkl([bob.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());

        await genesisNFT.connect(bob).safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)));

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1}, 
            {contractAddr: hatNFT.address, accessoryId: 1}, // duplicate hat contract
            {contractAddr: glassesNFT.address, accessoryId: 1},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, {gasLimit: 800000})).to.be.revertedWith("Genesis: wrong order");
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

        const merklTreeRoot = generateMerkl([bob.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());

        await genesisNFT.connect(bob).safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)));

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1},
            {contractAddr: clothesNFT.address, accessoryId: 1},
            {contractAddr: glassesNFT.address, accessoryId: 1},
            {contractAddr: furNFT.address, accessoryId: 1},
            {contractAddr: hatNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip)).to.be.revertedWith("Genesis: wrong length");
    });

    it("Should not revert if equip just 2 items", async function() {
        // prepare bob's wallet
        await hatNFT.mint(bob.address, 1, 1, []);
        await furNFT.mint(bob.address, 1, 1, []);

        await hatNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);
        await furNFT.connect(bob).setApprovalForAll(genesisNFT.address, true);

        const merklTreeRoot = generateMerkl([bob.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());

        await genesisNFT.connect(bob).safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)));

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1}, 
            {contractAddr: clothesNFT.address, accessoryId: 0}, 
            {contractAddr: glassesNFT.address, accessoryId: 0},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, {gasLimit: 800000})).to.not.be.reverted;
    
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

        const merklTreeRoot = generateMerkl([bob.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());

        await genesisNFT.connect(bob).safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)));

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1}, 
            {contractAddr: clothesNFT.address, accessoryId: 0}, 
            {contractAddr: glassesNFT.address, accessoryId: 0},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, {gasLimit: 800000})).to.not.be.reverted;
    
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

        const merklTreeRoot = generateMerkl([bob.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());

        await genesisNFT.connect(bob).safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)));

        //equip items

        const accessoriesToEquip = [
            {contractAddr: hatNFT.address, accessoryId: 1}, 
            {contractAddr: clothesNFT.address, accessoryId: 0}, 
            {contractAddr: glassesNFT.address, accessoryId: 0},
            {contractAddr: furNFT.address, accessoryId: 1}
        ]

        await expect(genesisNFT.connect(bob).equipAccessories(1, accessoriesToEquip, {gasLimit: 800000})).to.not.be.reverted;
    
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

    it("Should support latest changes", async function() {
        await genesisNFT.setSalePrice(ethers.utils.parseEther('1'))
        const merklTreeRoot = generateMerkl([bob.address, alice.address]);
        await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());

        // Should respect mint price.
        await expect(genesisNFT.connect(bob).safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)), {
            value: ethers.utils.parseEther('0.5')
        })).to.be.revertedWith('Genesis: not enough ether sent');
        
        await expect(genesisNFT.connect(bob).safeMint(bob.address, merklTreeRoot.getHexProof(keccak256(bob.address)), {
            value: ethers.utils.parseEther('1')
        })).to.not.be.reverted;

        // Should not let mint more than supply.
        await genesisNFT.setTotalSupply(1);
        expect(await genesisNFT.totalSupply()).to.eq(1);
        expect(await genesisNFT.getCurrentSupply()).to.eq(1);
        await expect(genesisNFT.connect(alice).safeMint(alice.address, merklTreeRoot.getHexProof(keccak256(alice.address)), {
            value: ethers.utils.parseEther('1')
        })).to.be.revertedWith('Genesis: max supply reached');

        // should let withdraw funds.
        const balBefore = await ethers.provider.getBalance(fundRaiseClaimer.address)
        await genesisNFT.connect(fundRaiseClaimer).withdraw()
        const balAfter = await ethers.provider.getBalance(fundRaiseClaimer.address)
        expect(balAfter.sub(balBefore)).to.be.gt(ethers.utils.parseEther('0.99'))
    });

});
