import { Contract, Signer, utils } from "ethers";

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = ethers;

describe("Pop Token governance testing", function () {

    let owner: Signer;
    let addr1: Signer;
    let addr2: Signer;
    let popToken: Contract;

    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        const PopToken = await ethers.getContractFactory("PopToken");
        popToken = await PopToken.deploy();
        await popToken.deployed();
    });

    // it("Should set the right owner", async function() {
    //     expect(await popToken.owner()).to.equal(await owner.getAddress());
    // });

    // it("Should assign the total supply of tokens to the owner", async function() {
    //     const ownerBalance = await popToken.balanceOf(await owner.getAddress());
    //     expect(await popToken.totalSupply()).to.equal(ownerBalance);
    // });

    // it("Should fail if try to mint more than the max supply", async function() {
    //     await expect(
    //         popToken.mint(await owner.getAddress(), BigNumber.from("500000001").mul(BigNumber.from("10").pow(18)))
    //     ).to.be.revertedWith("PPT::mint: cannot exceed max supply");
    // });

    // it("Should delegate votes from one account to another", async function () {
    //     const initialBalance = BigNumber.from("1000").mul(BigNumber.from("10").pow(18));
    //     await popToken.transfer(await addr1.getAddress(), initialBalance);
        
    //     // Delegate votes from addr1 to addr2
    //     await popToken.delegate(await addr2.getAddress());

    //     // Verify that addr1's delegate is addr2
    //     expect(await popToken.delegates(await addr1.getAddress())).to.equal(await addr2.getAddress());
    // });

    // it("Should update the delegate's voting power according to the number of tokens delegated", async function () {
    //     const initialBalance = utils.parseEther('1');
    //     await popToken.transfer(await addr2.getAddress(), initialBalance);
        
    //     // Delegate votes from addr1 to addr2
    //     await popToken.connect(addr1).delegate(await addr2.getAddress());

    //     // Verify that addr2's voting power increased by the amount delegated
    //     expect(await popToken.getCurrentVotes(await addr2.getAddress())).to.equal(initialBalance);
    // });

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

    // it("Should delegate votes using the delegateBySig function with valid and invalid signatures", async function () {
    //     const initialBalance = BigNumber.from("1000").mul(BigNumber.from("10").pow(18));
    //     await popToken.transfer(await addr1.getAddress(), initialBalance);

    //     // Generate a valid signature
    //     const nonce = await popToken.nonces(await addr1.getAddress());
    //     const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    //     const message = ethers.utils.solidityKeccak256(
    //         ["address", "uint256", "uint256", "uint256", "address"],
    //         [await addr1.getAddress(), nonce, expiry, 1, await addr2.getAddress()]
    //     );
    //     const signature = await owner.signMessage(ethers.utils.arrayify(message));
    //     const { v, r, s } = ethers.utils.splitSignature(signature);

    //     // Delegate votes from addr1 to addr2 using the signature
    //     await popToken.delegateBySig(await addr1.getAddress(), nonce, expiry, v, r, s);

    //     // Verify that addr1's delegate is addr2
    //     expect(await popToken.delegates(await addr1.getAddress())).to.equal(await addr2.getAddress());

    //     // Generate an invalid signature (using addr1's key to sign for addr2)
    //     const invalidSignature = await addr1.signMessage(ethers.utils.arrayify(message));
    //     const { v: invalidV, r: invalidR, s: invalidS } = ethers.utils.splitSignature(invalidSignature);

    //     // Attempt to delegate votes from addr1 to addr2 using the invalid signature
    //     await expect(
    //         popToken.delegateBySig(await addr1.getAddress(), nonce, expiry, invalidV, invalidR, invalidS)
    //     ).to.be.revertedWith("PPT::delegateBySig: invalid signature");
    // });

    // it("Should fail to delegate votes with an expired signature", async function () {
    //     const initialBalance = BigNumber.from("1000").mul(BigNumber.from("10").pow(18));
    //     await popToken.transfer(await addr1.getAddress(), initialBalance);

    //     // Generate an expired signature (expiry time set to the past)
    //     const nonce = await popToken.nonces(await addr1.getAddress());
    //     const expiry = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    //     const message = ethers.utils.solidityKeccak256(
    //         ["address", "uint256", "uint256", "uint256", "address"],
    //         [await addr1.getAddress(), nonce, expiry, 1, await addr2.getAddress()]
    //     );
    //     const signature = await owner.signMessage(ethers.utils.arrayify(message));
    //     const { v, r, s } = ethers.utils.splitSignature(signature);

    //     // Attempt to delegate votes from addr1 to addr2 using the expired signature
    //     await expect(
    //         popToken.delegateBySig(await addr1.getAddress(), nonce, expiry, v, r, s)
    //     ).to.be.revertedWith("PPT::delegateBySig: signature expired");
    // });

});
