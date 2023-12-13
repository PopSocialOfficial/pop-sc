import {Contract} from "ethers";
import hre, {ethers, upgrades} from "hardhat";
import {BigNumber} from 'ethers';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);
    let genesisNFT: Contract;

    const GenesisNFT = await ethers.getContractFactory("CoolCappy");
    genesisNFT = await upgrades.deployProxy(GenesisNFT, [
        3000, // totalSupply
        1702576800, // startTime
        '10000000000000000', // startPrice 0.01 ETH
        '0x6ff20d3006d2AE0D996f28B25A96c66EF62Dc045', // fundRaiseClaimer ETH Msig
    ], {initializer: 'initialize'});

    await genesisNFT.deployed();
   
    console.log(`Cool Cappy Proxy deployed at address ${genesisNFT.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(genesisNFT.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(genesisNFT.address), 'proxy admin address');

    // const receipt = await genesisNFT.deployTransaction.wait();
    // const transactionReceipt = await ethers.provider.getTransactionReceipt(receipt.transactionHash);
    // const gasUsed = transactionReceipt.gasUsed;
    // const gasPricePaid = BigNumber.from('63')
    // const transactionFee = gasUsed.mul(gasPricePaid);
    // console.log('gasUsed', gasUsed);
    // console.log('gasPricePaid', gasPricePaid);
    // console.log('transactionFee', transactionFee);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then()
// init().then()
// verify().then()

// set_white_list_merkleroot().then()