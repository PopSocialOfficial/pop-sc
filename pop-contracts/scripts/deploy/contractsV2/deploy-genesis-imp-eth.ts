import {Contract} from "ethers";
import hre, {ethers, upgrades} from "hardhat";
import {BigNumber} from 'ethers';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);
    // let genesisNFT: Contract;

    const GenesisNFT = await ethers.getContractFactory("Genesis");
    // const genesisNFT = GenesisNFT.attach('0xC1Dd2B220559d44Dab31f753bEcD4B030fAa5ef8')

    // console.log('\n\n')
    // console.log('name', await genesisNFT.name())
    // console.log('symbol', await genesisNFT.symbol())
    // console.log('totalSupply', await genesisNFT.totalSupply())
    // console.log('salePrice', await genesisNFT.salePrice())
    // console.log('saleStartAt', await genesisNFT.saleStartAt())
    // console.log('baseURI', await genesisNFT.baseURI())
    // console.log('whitelistMerkleRoot', await genesisNFT.whitelistMerkleRoot())
    // console.log('accessorySlots', await genesisNFT.accessorySlots())
    // console.log('balanceOf', await genesisNFT.balanceOf('0x5b156a9a6BE46ff94D6b06086FF5243Ae0E0A704'))
    // console.log('adminMintedCount', await genesisNFT.adminMintedCount())
    // console.log('MAX_ADMIN_MINT', await genesisNFT.MAX_ADMIN_MINT())

    const imp = await upgrades.prepareUpgrade('0xC1Dd2B220559d44Dab31f753bEcD4B030fAa5ef8', GenesisNFT, {getTxResponse: true});
    const tx = await imp.wait()
    console.log(tx)

    // const ProxyAdmin = new ethers.Contract('0x8f1b386f7fa56f762a6695581467ca66172da736', ['function upgrade(address, address)'])
    // const proxyAdmin = ProxyAdmin.attach('0x8f1b386f7fa56f762a6695581467ca66172da736')

    // await hre.network.provider.request({
    //     method: "hardhat_impersonateAccount",
    //     params: ["0x6ff20d3006d2AE0D996f28B25A96c66EF62Dc045"],
    //   });
    // const signerX = await ethers.getSigner('0x6ff20d3006d2AE0D996f28B25A96c66EF62Dc045');
    // await proxyAdmin.connect(signerX).upgrade('0xC1Dd2B220559d44Dab31f753bEcD4B030fAa5ef8', '0x4458AcB1185aD869F982D51b5b0b87e23767A3A9')

    // console.log('\n\n')
    // console.log('name', await genesisNFT.name())
    // console.log('symbol', await genesisNFT.symbol())
    // console.log('totalSupply', await genesisNFT.totalSupply())
    // console.log('salePrice', await genesisNFT.salePrice())
    // console.log('saleStartAt', await genesisNFT.saleStartAt())
    // console.log('baseURI', await genesisNFT.baseURI())
    // console.log('whitelistMerkleRoot', await genesisNFT.whitelistMerkleRoot())
    // console.log('accessorySlots', await genesisNFT.accessorySlots())
    // console.log('balanceOf', await genesisNFT.balanceOf('0x5b156a9a6BE46ff94D6b06086FF5243Ae0E0A704'))
    // console.log('adminMintedCount', await genesisNFT.adminMintedCount())
    // console.log('MAX_ADMIN_MINT', await genesisNFT.MAX_ADMIN_MINT())

    
    // console.log(await upgrades.erc1967.getImplementationAddress(genesisNFT.address), "implementation");
    // console.log(await upgrades.erc1967.getAdminAddress(genesisNFT.address), 'admin address');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then()
// init().then()
// verify().then()

// set_white_list_merkleroot().then()