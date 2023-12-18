import {Contract, ContractFactory, Wallet, providers, utils} from "ethers";
import {type SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {Interface} from "@ethersproject/abi";

import {expect} from "chai";
import {upgrades} from "hardhat";
import {Accessory, ContractDeployStruct} from "../interfaces";

const {ethers} = require("hardhat");
import {generateMerkl} from './utils'
import keccak256 from 'keccak256'

describe("Accessory NFT testing", async function () {
    let hatNFT: Contract, clothesNFT: Contract;

    let owner: SignerWithAddress;
    let bob: SignerWithAddress;
    let alice: SignerWithAddress;
    let fundRaiseClaimer: SignerWithAddress;


    before(async () => {

        [owner, bob, alice, fundRaiseClaimer] = await ethers.getSigners();

        const HatNFT: ContractFactory = await ethers.getContractFactory("Accessory");
        const ClothesNFT: ContractFactory = await ethers.getContractFactory("Accessory");

        const contractsToDeploy: ContractDeployStruct[] = [
            {factory: HatNFT, name: 'Hat', symbol: 'HAT'},
            {factory: ClothesNFT, name: 'Clothes', symbol: 'CLOTHES'},
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
    });

    async function getSignature(signer: Wallet, _to: string, _id: Number, _amount: Number, _accessory: string) {
        const messageHash = ethers.utils.solidityKeccak256(["address", "uint", "uint", "address"], [_to, _id, _amount, _accessory])
        const messageBytes = ethers.utils.arrayify(messageHash)
        const signature = await signer.signMessage(messageBytes)
        return signature
    }

    it("mint Accessory", async function () {
        let signer_key = "ad00e9fd5f3cbc9ba74d43df85281cbc8bb6adfda591be7e309e13cc98f81e92"
        const signer = new ethers.Wallet(signer_key);
        let signature = await getSignature(signer, bob.address, 1, 1, hatNFT.address)
        expect(await hatNFT.mint(bob.address, 1, 1, [], signature, {gasLimit: 70000})).to.emit(hatNFT, "ServerReport")
            .withArgs(11111);
        expect(await hatNFT.balanceOf(bob.address, 1)).to.equal(1);
    });
});
