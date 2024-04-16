import { Contract, ContractFactory, utils } from "ethers";
import { type SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Interface } from "@ethersproject/abi";

import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Accessory, ContractDeployStruct } from "../interfaces";
import { generateMerkl } from "./utils";

const { BigNumber } = ethers;
import keccak256 from "keccak256";

describe("james NFT testing", function () {
  let owner: SignerWithAddress;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;
  let fundRaiseClaimer: SignerWithAddress;
  let relayer: SignerWithAddress;
  let genesisNFT: Contract;

  let contractsToWhitelist: string[];

  let accessories: Accessory[] = [];

  beforeEach(async () => {
    [owner, bob, alice, fundRaiseClaimer, relayer] = await ethers.getSigners();

    const GenesisNFT = await ethers.getContractFactory("James");
    genesisNFT = await upgrades.deployProxy(
      GenesisNFT,
      [
        100, // totalSupply
        0, // startTime
        0, // startPrice
        relayer.address,
        3,
      ],
      { initializer: "initialize" }
    );
    await genesisNFT.deployed();
  });

  it("Should be able to claim if whitelisted", async function () {
    const merklTreeRoot = generateMerkl([bob.address, alice.address]);
    await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());
    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address))
        )
    ).to.not.be.reverted;
  });

  it("Should only allow 3 mints per whitelisted", async function () {
    const merklTreeRoot = generateMerkl([bob.address, alice.address]);
    await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());
    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address))
        )
    ).to.not.be.reverted;
    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address))
        )
    ).to.not.be.reverted;
    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address))
        )
    ).to.not.be.reverted;
    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address))
        )
    ).to.not.be.reverted;
    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address))
        )
    ).to.be.revertedWith("James: mint limit exceeded");
  });

  it("Should not be able to claim if not whitelisted", async function () {
    const merklTreeRoot = generateMerkl([owner.address, alice.address]);
    await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());
    await expect(
      genesisNFT.safeMint(
        bob.address,
        merklTreeRoot.getHexProof(keccak256(bob.address))
      )
    ).to.be.revertedWith("James: invalid merkle proof");
  });

  it("test max mint", async function () {
    const merklTreeRoot = generateMerkl([bob.address, alice.address]);
    await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());
    await genesisNFT.setMaxMint(2);
    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address))
        )
    ).to.not.be.reverted;

    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address))
        )
    ).to.not.be.reverted;

    expect(await genesisNFT.balanceOf(bob.address)).to.be.eq(2);
    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address))
        )
    ).to.not.be.revertedWith("James: mint limit exceeded");
  });

  // it("batchMint", async function () {
  //   await expect(genesisNFT.connect(relayer).batchMint(10)).to.not.be.reverted;
  //   expect(
  //     await genesisNFT.connect(relayer).balanceOf(relayer.address)
  //   ).to.be.equal(10);
  // });

  it("Should support latest changes", async function () {
    await genesisNFT.setSalePrice(ethers.utils.parseEther("1"));
    const merklTreeRoot = generateMerkl([bob.address, alice.address]);
    await genesisNFT.setWhitelistMerkleRoot(merklTreeRoot.getHexRoot());

    // Should respect mint price.
    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address)),
          {
            value: ethers.utils.parseEther("0.5"),
          }
        )
    ).to.be.revertedWith("James: not enough bnb sent");

    await expect(
      genesisNFT
        .connect(bob)
        .safeMint(
          bob.address,
          merklTreeRoot.getHexProof(keccak256(bob.address)),
          {
            value: ethers.utils.parseEther("1"),
          }
        )
    ).to.not.be.reverted;

    // Should not let mint more than supply.
    await genesisNFT.setTotalSupply(1);
    expect(await genesisNFT.totalSupply()).to.eq(1);
    expect(await genesisNFT.getCurrentSupply()).to.eq(1);
    await expect(
      genesisNFT
        .connect(alice)
        .safeMint(
          alice.address,
          merklTreeRoot.getHexProof(keccak256(alice.address)),
          {
            value: ethers.utils.parseEther("1"),
          }
        )
    ).to.be.revertedWith("James: max supply reached");

    // should let withdraw funds.
    const balBefore = await ethers.provider.getBalance(relayer.address);
    await genesisNFT.connect(relayer).withdraw();
    const balAfter = await ethers.provider.getBalance(relayer.address);
    expect(balAfter.sub(balBefore)).to.be.gt(ethers.utils.parseEther("0.99"));
  });
});
