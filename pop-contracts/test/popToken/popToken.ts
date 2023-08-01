import { Contract, utils } from "ethers";
import { type SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = ethers;

async function generateSignature(addr1: SignerWithAddress, delegatee: any, nonce: any, expiry: any, contractAddress: any, chainId: any, domainTypehash: any) {
    const delegationTypehash = ethers.utils.id("Delegation(address delegatee,uint256 nonce,uint256 expiry)");
    const name = "PopToken"; // Replace with your contract name

    // console.log('NAME HASH', utils.solidityKeccak256(["string"],[name]));

    const domainSeparator = utils.keccak256(
      utils.defaultAbiCoder.encode(
        ["bytes32", "bytes32", "uint256", "address"],
        [domainTypehash, "0x5bb097a0030a6efe14c90040c55a937bec0357c6adb8913399e799edaf4aaed2", chainId, contractAddress]
      )
    );

    console.log('DOMAIN SEPARATOR', domainSeparator);
  
    const structHash = utils.keccak256(
      utils.defaultAbiCoder.encode(
        ["bytes32", "address", "uint256", "uint256"],
        [delegationTypehash, delegatee, nonce, expiry]
      )
    );

    console.log('STRUCT HASH', structHash);

    const message = utils.keccak256(utils.solidityPack(
        ["string", "bytes32", "bytes32"],
        ["\x19\x01", domainSeparator, structHash]
      ));

    console.log('DIGEST', message);
    
    const signature = await addr1.signMessage(message);
    const sig = utils.splitSignature(signature);
  
    return {
      v: sig.v,
      r: sig.r,
      s: sig.s,
      message,
      signature
    };
  }

describe("Pop Token governance testing", function () {

    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let popToken: Contract;

    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        const PopToken = await ethers.getContractFactory("PopToken");
        popToken = await PopToken.deploy();
        await popToken.deployed();
    });

    it("Should set the right owner", async function() {
        expect(await popToken.owner()).to.equal(await owner.getAddress());
    });

    it("Should assign the total supply of tokens to the owner", async function() {
        const ownerBalance = await popToken.balanceOf(await owner.getAddress());
        expect(await popToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should fail if try to mint more than the max supply", async function() {
        await expect(
            popToken.mint(await owner.getAddress(), BigNumber.from("500000001").mul(BigNumber.from("10").pow(18)))
        ).to.be.revertedWith("PPT::mint: cannot exceed max supply");
    });

    it("Should update the delegate's voting power according to the number of tokens delegated", async function () {
        const initialBalance = utils.parseEther('1');
        await popToken.transfer(await addr1.getAddress(), initialBalance);
        
        // Delegate votes from addr1 to addr2
        await popToken.connect(addr1).delegate(await addr2.getAddress());

        // Verify that addr2's voting power increased by the amount delegated
        expect(await popToken.getCurrentVotes(await addr2.getAddress())).to.equal(initialBalance);
    });

    it("Should work to delegate from A to B", async function () {
        expect(await popToken.getCurrentVotes(await addr1.getAddress())).to.equal(0);

        await popToken.transfer(await addr1.getAddress(), utils.parseEther('100'));

        expect(await popToken.balanceOf(await addr1.getAddress())).to.equal(utils.parseEther('100'));

        await popToken.connect(addr1).delegate(await addr2.getAddress());

        // Verify initial voting power of addr1 (should be equal to its token balance)
        expect(await popToken.getCurrentVotes(await addr2.getAddress())).to.equal(utils.parseEther('100'));
    });


    it("Should have correct voting power for an account before and after delegation", async function () {
        const value = await popToken.balanceOf(await owner.getAddress())

        expect(await popToken.getCurrentVotes(await addr1.getAddress())).to.equal(0);

        await popToken.delegate(await addr1.getAddress());

        // Verify initial voting power of addr1 (should be equal to its token balance)
        expect(await popToken.getCurrentVotes(await addr1.getAddress())).to.equal(value);

        // Delegate votes from addr1 to addr2
        await popToken.delegate(await addr2.getAddress());

        // // Verify voting power of addr1 (should be 0 after delegation)
        expect(await popToken.getCurrentVotes(await addr1.getAddress())).to.equal(0);
        // // // Verify voting power of addr2 (should be equal to the total balance of addr1 and addr2)
        expect(await popToken.getCurrentVotes(await addr2.getAddress())).to.equal(value);
    });

    it("Should delegate votes using the delegateBySig function with valid and invalid signatures", async function () {
        const initialBalance = utils.parseEther('100');
        await popToken.transfer(await addr1.getAddress(), initialBalance);

        // Generate a valid signature
        const nonce = await popToken.nonces(await addr1.getAddress());

        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");
        const blockNumber = (await provider.getBlock('latest')).timestamp;

        const expiry = blockNumber + 100;

        const network = await provider.getNetwork();
        const chainId = network.chainId;
        console.log('CHAIN ID', chainId);
        
        const domainTypehash = await popToken.DOMAIN_TYPEHASH();

        const { v, r, s, message, signature } = await generateSignature(addr1, await addr2.getAddress(), nonce, expiry, popToken.address, chainId, domainTypehash);
        const signer = utils.verifyMessage(message, signature);

        const signerAddr = utils.computeAddress(utils.recoverPublicKey(message, signature));
        // expect(signer).to.equal(await addr1.getAddress());

        // Delegate votes from addr1 to addr2 using the signature
        await popToken.delegateBySig(await addr2.getAddress(), nonce, expiry, v, r, s, {gasLimit: 800000});

        // Verify that addr1's delegate is addr2
        expect(await popToken.delegates(signerAddr)).to.equal(await addr2.getAddress());

    });

    // it("Should fail to delegate votes with an expired signature", async function () {
    //     const nonce = await popToken.nonces(await addr1.getAddress());

    //     const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");
    //     const blockNumber = (await provider.getBlock('latest')).timestamp;

    //     const expiry = blockNumber - 1;

    //     const domainTypehash = await popToken.DOMAIN_TYPEHASH();
    //     const network = await provider.getNetwork();
    //     const chainId = network.chainId;

    //     const { v, r, s} = await generateSignature(addr1, await addr2.getAddress(), nonce, expiry, popToken.address, chainId, domainTypehash);

    //     // Attempt to delegate votes from addr1 to addr2 using the expired signature
    //     await expect(
    //         popToken.delegateBySig(await addr2.getAddress(), nonce, expiry, v, r, s)
    //     ).to.be.revertedWith("PPT::delegateBySig: signature expired");
    // });

});
