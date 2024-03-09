import {
  Contract,
  ContractFactory,
  Wallet,
  providers,
  utils,
  BigNumber,
  Signature,
  Signer,
} from "ethers";
import { type SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Interface } from "@ethersproject/abi";
import { expect } from "chai";
import { Accessory, ContractDeployStruct } from "../interfaces";
import hre, { ethers, upgrades, network } from "hardhat";
import { generateMerkl } from "./utils";
import keccak256 from "keccak256";

describe("Accessory NFT testing", async function () {
  let hatNFT: Contract, clothesNFT: Contract;

  let owner: SignerWithAddress;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;
  let fundRaiseClaimer: SignerWithAddress;
  let relayer: SignerWithAddress;

  before(async () => {
    [owner, bob, alice, fundRaiseClaimer, relayer] = await ethers.getSigners();

    const HatNFT: ContractFactory = await ethers.getContractFactory(
      "Accessory"
    );
    const ClothesNFT: ContractFactory = await ethers.getContractFactory(
      "Accessory"
    );

    const contractsToDeploy: ContractDeployStruct[] = [
      { factory: HatNFT, name: "Hat", symbol: "HAT" },
      { factory: ClothesNFT, name: "Clothes", symbol: "CLOTHES" },
    ];

    let deployed: Contract[] = [];

    const deploymentPromises = contractsToDeploy.map(
      async (contract: ContractDeployStruct) => {
        const contractDeploy = await upgrades.deployProxy(
          contract.factory,
          [
            contract.name,
            contract.symbol,
            "http://example.com",
            100,
            fundRaiseClaimer.address,
            relayer.address,
          ],
          { initializer: "initialize" }
        );
        const deployedContract = await contractDeploy.deployed();
        return deployedContract;
      }
    );

    deployed = await Promise.all(deploymentPromises);
    hatNFT = deployed[0];
    clothesNFT = deployed[1];
  });

  async function getSignature(
    signer: Signer,
    _to: string,
    _id: Number,
    _amount: Number,
    _order_id: Number,
    accessory: Contract,
    deadline: Number
  ) {
    const message = {
      EIP712Domain: {
        name: await accessory.name(),
        version: "1",
        chainId: Number(await network.provider.send("eth_chainId")),
        verifyingContract: accessory.address,
      },
      types: {
        ServerSign: [
          { name: "_to", type: "address" },
          { name: "_id", type: "uint" },
          { name: "_amount", type: "uint" },
          { name: "_order_id", type: "uint" },
          { name: "_accessory", type: "address" },
          { name: "nonce", type: "uint" },
          { name: "deadline", type: "uint" },
        ],
      },
      values: {
        _to: _to,
        _id: _id,
        _amount: _amount,
        _order_id: BigNumber.from(_order_id),
        _accessory: accessory.address,
        nonce: await accessory.nonces(_to),
        deadline: BigNumber.from(deadline),
      },
    };
    let signer_wallet: Wallet = signer as Wallet;
    const signature = await signer_wallet._signTypedData(
      message.EIP712Domain,
      message.types,
      message.values
    );
    let sig = utils.splitSignature(signature);
    return {
      signature: sig,
      message: message,
    };
  }

  it("mint Accessory", async function () {
    // let signer_key =
    //   "ad00e9fd5f3cbc9ba74d43df85281cbc8bb6adfda591be7e309e13cc98f81e92";
    // const signer = new ethers.Wallet(signer_key);
    let params = {
      signer: fundRaiseClaimer,
      _to: bob.address,
      _id: 1,
      _amount: 1,
      _order_id: 123123,
      accessory: hatNFT,
      deadline: parseInt(String(new Date().getTime() / 1000)),
    };
    let sig = await getSignature(
      params.signer,
      params._to,
      params._id,
      params._amount,
      params._order_id,
      params.accessory,
      params.deadline
    );
    expect(
      utils.verifyTypedData(
        sig.message.EIP712Domain,
        sig.message.types,
        sig.message.values,
        sig.signature
      )
    ).to.equal(fundRaiseClaimer.address);
    expect(
      await hatNFT.mint(
        params._to,
        params._id,
        params._amount,
        params._order_id,
        params.deadline,
        [],
        sig.signature.v,
        sig.signature.r,
        sig.signature.s,
        {
          gasLimit: 111202,
        }
      )
    )
      .to.emit(hatNFT, "ServerReport")
      .withArgs(params._order_id);
    expect(await hatNFT.balanceOf(bob.address, 1)).to.equal(1);
  });

  it("mintBatch Accessory ", async function () {
    await hatNFT
      .connect(relayer)
      .mintBatch(relayer.address, [1, 2], [1, 1], []);
    expect(await hatNFT.balanceOf(relayer.address, 1)).to.equal(1);
    expect(await hatNFT.balanceOf(relayer.address, 2)).to.equal(1);
  });
});
