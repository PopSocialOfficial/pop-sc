import { Contract } from "ethers";
import hre, { ethers, upgrades } from "hardhat";
import { utils } from "ethers";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import axios from "axios";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(deployer.address);
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  let genesisNFT: Contract;

  const GenesisNFT = await ethers.getContractFactory("James");
  genesisNFT = await upgrades.deployProxy(
    GenesisNFT,
    [
      700, // totalSupply
      1713434400, // startTime
      utils.parseEther("0.1"), // startPrice 0.01 ETH
      "0x4ec5aebdfbabd8269007248f06cc9d3688515704", // fundRaiseClaimer ETH Msig
      2,
    ],
    { initializer: "initialize" }
  );

  await genesisNFT.deployed();

  console.log(`James Proxy deployed at address ${genesisNFT.address}`);
  console.log(
    await upgrades.erc1967.getImplementationAddress(genesisNFT.address),
    "implementation"
  );
  console.log(
    await upgrades.erc1967.getAdminAddress(genesisNFT.address),
    "proxy admin address"
  );

  //baseURI : https://ipfs.popsocial.io/james/json/

  // const receipt = await genesisNFT.deployTransaction.wait();
  // const transactionReceipt = await ethers.provider.getTransactionReceipt(receipt.transactionHash);
  // const gasUsed = transactionReceipt.gasUsed;
  // const gasPricePaid = BigNumber.from('63')
  // const transactionFee = gasUsed.mul(gasPricePaid);
  // console.log('gasUsed', gasUsed);
  // console.log('gasPricePaid', gasPricePaid);
  // console.log('transactionFee', transactionFee);
}

async function init(nft_address: string) {
  const [admin] = await ethers.getSigners();
  console.log(admin.address);
  let accessory = await ethers.getContractFactory("James");
  let admin_proxy = accessory.attach(nft_address);
  console.log(await admin_proxy.name());

  console.log(await admin_proxy.setSaleStartAt(1713434400), {
    gasLimit: 10000000,
  });
  await admin_proxy.setBaseURI("https://ipfs.popsocial.io/james/json/");
  console.log(await admin_proxy.baseURI());
  // console.log(await admin_proxy.tokenURI(1));
  console.log(await admin_proxy.saleStartAt());
  console.log(await admin_proxy.salePrice());
  console.log(await admin_proxy.whitelistMerkleRoot());
  console.log(await admin_proxy.totalSupply());
  console.log(await admin_proxy.getCurrentSupply());
}

async function get_tree() {
  // let url = "https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/popbit/whitelist.json"
  let url =
    "https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/james/whitelist.json";
  let res = await axios({
    method: "get",
    maxBodyLength: Infinity,
    url: url,
  });
  return res.data;
}

async function get_allow_list() {
  let res = await get_tree();
  console.log(res);
  return res;
}

async function getMerkleTree() {
  let merkleTree: MerkleTree;
  let allowlist = await get_allow_list();
  const leaves = allowlist.map((address: any) => keccak256(address));
  merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  return merkleTree;
}

async function getMerkleRoot() {
  let tree = await getMerkleTree();
  return tree.getRoot().toString("hex");
}

async function getProof(address: string | undefined) {
  let tree = await getMerkleTree();
  return tree.getHexProof(keccak256(address ?? ""));
}

async function checkAllowlisted(address: string | undefined) {
  let tree = await getMerkleTree();
  return tree.getLeafIndex(Buffer.from(keccak256(address ?? ""))) >= 0;
}

async function set_white_list_merkleroot(nft_address: string) {
  const [admin] = await ethers.getSigners();
  console.log(admin.address);
  let accessory = await ethers.getContractFactory("James");
  let admin_proxy = accessory.attach(nft_address);
  console.log(await admin_proxy.name());
  console.log("===================");
  console.log(await getMerkleRoot());
  console.log("===================");
  console.log(
    await admin_proxy.setWhitelistMerkleRoot("0x" + (await getMerkleRoot()))
  );
  //
  // let wallet = ethers.Wallet.createRandom();
  // console.log(wallet.address, wallet.privateKey)
  // let proof_3 = await getProof(admin.address)
  // console.log(proof_3)
  // console.log(await admin_proxy.safeMint(admin.address, proof_3, {
  //     value: ethers.utils.parseEther("0.005"),
  //     gasLimit: 10000000
  // }))
}

async function verify(address: string) {
  await hre.run("verify:verify", {
    address: address,
  });
}

let nft_address = "0x5169e0981af3Ee166F1FDDc2a10067cF93a42902";
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// main().then();
init(nft_address).then();
set_white_list_merkleroot(nft_address).then();
// verify(nft_address).then();
// set_white_list_merkleroot().then()