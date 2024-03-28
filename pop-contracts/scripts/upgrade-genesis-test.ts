import hre from "hardhat";
import { ethers, upgrades } from "hardhat";

async function main() {
  const GenesisNFTV1 = await ethers.getContractFactory("GenesisV1");
  const genesisNFT = GenesisNFTV1.attach(
    "0xC1Dd2B220559d44Dab31f753bEcD4B030fAa5ef8"
  );

  console.log("name", await genesisNFT.name());
  console.log("symbol", await genesisNFT.symbol());
  console.log("totalSupply", await genesisNFT.totalSupply());
  console.log("salePrice", await genesisNFT.salePrice());
  console.log("saleStartAt", await genesisNFT.saleStartAt());
  console.log("baseURI", await genesisNFT.baseURI());
  console.log("whitelistMerkleRoot", await genesisNFT.whitelistMerkleRoot());
  console.log("accessorySlots", await genesisNFT.accessorySlots());
  console.log(
    "balanceOf",
    await genesisNFT.balanceOf("0x5b156a9a6BE46ff94D6b06086FF5243Ae0E0A704")
  );
  // await genesisNFT.deployed();

  // impersonate wallet
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x6ff20d3006d2AE0D996f28B25A96c66EF62Dc045"],
  });
  const signerX = await ethers.getSigner(
    "0x6ff20d3006d2AE0D996f28B25A96c66EF62Dc045"
  );
  await network.provider.send("hardhat_setBalance", [
    signerX.address,
    "0x8AC7230489E80000",
  ]);
  const GenesisNFTV2 = await ethers.getContractFactory("Genesis", signerX);
  const genesisNFT2 = await upgrades.upgradeProxy(
    "0xC1Dd2B220559d44Dab31f753bEcD4B030fAa5ef8",
    GenesisNFTV2
  );
  console.log("\n\n");
  console.log("name", await genesisNFT.name());
  console.log("symbol", await genesisNFT.symbol());
  console.log("totalSupply", await genesisNFT.totalSupply());
  console.log("salePrice", await genesisNFT.salePrice());
  console.log("saleStartAt", await genesisNFT.saleStartAt());
  console.log("baseURI", await genesisNFT.baseURI());
  console.log("whitelistMerkleRoot", await genesisNFT.whitelistMerkleRoot());
  console.log("accessorySlots", await genesisNFT.accessorySlots());
  console.log(
    "balanceOf",
    await genesisNFT.balanceOf("0x5b156a9a6BE46ff94D6b06086FF5243Ae0E0A704")
  );
}

async function upgrade_james() {
  const james = await ethers.getContractFactory("James");
  const genesisNFT2 = await upgrades.upgradeProxy(
    "0x4064290176Fb022C476e4409675d3ABDeE516197",
    james
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
upgrade_james().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
