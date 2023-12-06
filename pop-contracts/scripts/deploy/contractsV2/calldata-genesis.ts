import {Contract} from "ethers";
import hre, {ethers, upgrades} from "hardhat";
import {BigNumber} from 'ethers';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);
    let genesisNFT: Contract;

    const GenesisNFT = await ethers.getContractFactory("Genesis");
    const genesis = await GenesisNFT.attach('0xC1Dd2B220559d44Dab31f753bEcD4B030fAa5ef8');
   
    const numberOfMints = 1
    for(let i = 0; i < numberOfMints; i++) {
        await genesis.safeMint('0xe981E1060D44debBdB851efc63ee79Db24C2B6a4', [], {
            value: ethers.utils.parseEther('0.005')
        });
    }
    // const safeMintData = genesis.interface.encodeFunctionData('safeMint', ['0xe981E1060D44debBdB851efc63ee79Db24C2B6a4', []]);
    // const numberOfMints = 1
    // let calls = [];
    // for(let i = 0; i < numberOfMints; i++) {
    //     calls.push({
    //         target: genesis.address,
    //         callData: safeMintData
    //     });
    // }

    // const totalValue = ethers.utils.parseEther('0.005').mul(numberOfMints);
    // console.log('totalValue', totalValue.toString());
    // console.log(calls);

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