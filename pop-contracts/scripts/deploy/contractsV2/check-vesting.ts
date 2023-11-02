const { ethers } = require("hardhat");
import { utils, BigNumber, Contract, Wallet } from 'ethers';

const hre = require('hardhat')
const Papa = require('papaparse');
const fs = require('fs');

import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from "ethereum-multicall";

const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');

const multicall = new Multicall({
  ethersProvider: provider,
  tryAggregate: true,
  multicallCustomContractAddress: '0xff6fd90a470aaa0c1b8a54681746b07acdfedc9b',
});
const VestingABI = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"tokenAddress","type":"address"}],"name":"AdminSetToken","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"allocations","outputs":[{"internalType":"bool","name":"isLinear","type":"bool"},{"internalType":"uint256","name":"epoch","type":"uint256"},{"internalType":"uint256","name":"vestingDuration","type":"uint256"},{"internalType":"uint256","name":"cliff","type":"uint256"},{"internalType":"uint256","name":"cliffPercentage","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"claimed","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract TokenSaleDistributorProxy","name":"proxy","type":"address"}],"name":"becomeImplementation","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"}],"name":"getUserAllocations","outputs":[{"components":[{"internalType":"bool","name":"isLinear","type":"bool"},{"internalType":"uint256","name":"epoch","type":"uint256"},{"internalType":"uint256","name":"vestingDuration","type":"uint256"},{"internalType":"uint256","name":"cliff","type":"uint256"},{"internalType":"uint256","name":"cliffPercentage","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"claimed","type":"uint256"}],"internalType":"struct TokenSaleDistributorStorage.Allocation[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"implementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"monthlyVestingInterval","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingImplementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"targetUser","type":"address"}],"name":"resetAllocationsByUser","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"recipients","type":"address[]"},{"internalType":"bool[]","name":"isLinear","type":"bool[]"},{"internalType":"uint256[]","name":"epochs","type":"uint256[]"},{"internalType":"uint256[]","name":"vestingDurations","type":"uint256[]"},{"internalType":"uint256[]","name":"cliffs","type":"uint256[]"},{"internalType":"uint256[]","name":"cliffPercentages","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"name":"setAllocations","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newTokenAddress","type":"address"}],"name":"setTokenAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"tokenAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"}],"name":"totalAllocated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"}],"name":"totalAllocations","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"}],"name":"totalClaimable","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"}],"name":"totalClaimed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"}],"name":"totalVested","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const PPT_ABI = [{"inputs":[{"internalType":"uint256","name":"_maxSupply","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"InvalidShortString","type":"error"},{"inputs":[{"internalType":"string","name":"str","type":"string"}],"name":"StringTooLong","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[],"name":"EIP712DomainChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"eip712Domain","outputs":[{"internalType":"bytes1","name":"fields","type":"bytes1"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"version","type":"string"},{"internalType":"uint256","name":"chainId","type":"uint256"},{"internalType":"address","name":"verifyingContract","type":"address"},{"internalType":"bytes32","name":"salt","type":"bytes32"},{"internalType":"uint256[]","name":"extensions","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"maxSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]
const PPT_ADDR = "0xDf061250302E5cCae091B18CA2B45914D785F214";

async function getVestingInfo(addresses: string[]) {

  const calls = addresses.map((address: string) => {
    return {
     reference: "totalClaimable",
     methodName: "totalClaimable",
     methodParameters: [address],
     } 
   });

   const sale1Context: ContractCallContext[] = [{
    reference: '0xcb4a9E3700603298CB7c2c106360a4ec719284B2',
    contractAddress: '0xcb4a9E3700603298CB7c2c106360a4ec719284B2',
    abi: VestingABI,
    calls: calls
  }];

  const sale2Context: ContractCallContext[] = [{
    reference: '0x2AdE8bC15a4F32E3d4791d80F62342d8E17CD8FE',
    contractAddress: '0x2AdE8bC15a4F32E3d4791d80F62342d8E17CD8FE',
    abi: VestingABI,
    calls: calls
  }];
  
  const multiResultsSale1: ContractCallResults = await multicall.call(
    sale1Context
  );

  const multiResultsSale2: ContractCallResults = await multicall.call(
    sale2Context
  );

  // console.log(multiResultsSale1.results)
  let sumOF = BigNumber.from(0)
  const addrs = [];
  for (const context of multiResultsSale1.results['0xcb4a9E3700603298CB7c2c106360a4ec719284B2'].callsReturnContext) {
    const bn = BigNumber.from(context.returnValues[0])
    if(bn.gt(0)) {
      // console.log(context.methodParameters[0])
      addrs.push({
        address: context.methodParameters[0],
        amount: bn,
        vestingAddr: '0xcb4a9E3700603298CB7c2c106360a4ec719284B2'
      })
    }
    sumOF = sumOF.add(bn)
  }

  for (const context of multiResultsSale2.results['0x2AdE8bC15a4F32E3d4791d80F62342d8E17CD8FE'].callsReturnContext) {
    const bn = BigNumber.from(context.returnValues[0])
    if(bn.gt(0)) {
      // console.log(context.methodParameters[0])
      addrs.push({
        address: context.methodParameters[0],
        amount: bn,
        vestingAddr: '0x2AdE8bC15a4F32E3d4791d80F62342d8E17CD8FE'
      })
    }
    sumOF = sumOF.add(bn)
  }

  console.log('Can Claim', utils.formatEther(sumOF.toString()))
  // console.log('addrs', JSON.stringify(addrs))
  console.log('addrs', addrs.length)

  return addrs;

}

async function getETHBalancesOfAddresses(addresses: string[]) {
  const mCallABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall2.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall2.Call[]","name":"calls","type":"tuple[]"}],"name":"blockAndAggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes32","name":"blockHash","type":"bytes32"},{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall2.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"}],"name":"getBlockHash","outputs":[{"internalType":"bytes32","name":"blockHash","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBlockNumber","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentBlockCoinbase","outputs":[{"internalType":"address","name":"coinbase","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentBlockDifficulty","outputs":[{"internalType":"uint256","name":"difficulty","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentBlockGasLimit","outputs":[{"internalType":"uint256","name":"gaslimit","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentBlockTimestamp","outputs":[{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"getEthBalance","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getLastBlockHash","outputs":[{"internalType":"bytes32","name":"blockHash","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bool","name":"requireSuccess","type":"bool"},{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall2.Call[]","name":"calls","type":"tuple[]"}],"name":"tryAggregate","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall2.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"requireSuccess","type":"bool"},{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall2.Call[]","name":"calls","type":"tuple[]"}],"name":"tryBlockAndAggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes32","name":"blockHash","type":"bytes32"},{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall2.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"nonpayable","type":"function"}]
  const ethcalls = addresses.map((address: string) => {
    return {
     reference: "getEthBalance",
     methodName: "getEthBalance",
     methodParameters: [address],
     } 
   });  

  const ethContext: ContractCallContext[] = [{
    reference: '0xfF6FD90A470Aaa0c1B8A54681746b07AcdFedc9B',
    contractAddress: '0xfF6FD90A470Aaa0c1B8A54681746b07AcdFedc9B',
    abi: mCallABI,
    calls: ethcalls
  }];

  const multiResultsEth: ContractCallResults = await multicall.call(
    ethContext
  );
  const addressesWithEth = []
  let sumOfEths: BigNumber = BigNumber.from(0);
  for (const context of multiResultsEth.results['0xfF6FD90A470Aaa0c1B8A54681746b07AcdFedc9B'].callsReturnContext) {
    const bn = BigNumber.from(context.returnValues[0])
    if(bn.gt(0)) {
      // console.log(context.methodParameters[0], bn.toString())
      addressesWithEth.push(context.methodParameters[0])
      sumOfEths = sumOfEths.add(bn)
    }
  }
  console.log('Total ETH', utils.formatEther(sumOfEths.toString()))
  return addressesWithEth;
}

async function getPPTBalancesOfAddresses(addresses: string[]) {
  const ethcalls = addresses.map((address: string) => {
    return {
     reference: "balanceOf",
     methodName: "balanceOf",
     methodParameters: [address],
     } 
   });  

  const pptContext: ContractCallContext[] = [{
    reference: PPT_ADDR,
    contractAddress: PPT_ADDR,
    abi: PPT_ABI,
    calls: ethcalls
  }];

  const multiResultsPpt: ContractCallResults = await multicall.call(
    pptContext
  );
  const addressesWithBalance = []
  let sumOfPPT: BigNumber = BigNumber.from(0);
  for (const context of multiResultsPpt.results[PPT_ADDR].callsReturnContext) {
    const bn = BigNumber.from(context.returnValues[0])
    if(bn.gt(0)) {
      // console.log(context.methodParameters[0], bn.toString())
      // addressesWithBalance.push(context.methodParameters[0])
      sumOfPPT = sumOfPPT.add(bn)
      addressesWithBalance.push({
        address: context.methodParameters[0],
        amount: bn,
      })
    }
  }
  console.log('Total PPT', utils.formatEther(sumOfPPT.toString()))
  return addressesWithBalance;
}

async function deriveWallets(mnemonic: string, count: number) {
  const addresses = [];
  const addressesWithKeys = [];
  
  for (let i = 0; i < count; i++) {
      const wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);
      addresses.push([wallet.address]);
      addressesWithKeys.push([wallet.address, wallet.privateKey]);
  }

  return { addresses, addressesWithKeys };
}

async function claimPPT(privateKey: string, vestingAddress: string, amount: BigNumber) {
  const vestingContract = new Contract(vestingAddress, VestingABI)
  const wallet = new Wallet(privateKey, provider);
  console.log('Claiming', utils.formatEther(amount) ,'PPT for', wallet.address)
  const estimate = await vestingContract.connect(wallet).estimateGas.claim()
  // console.log('estimate', estimate.toString())
  const tx = await vestingContract.connect(wallet).claim({
    gasLimit: estimate.add(5000),
    gasPrice: utils.parseUnits('3', 'gwei')
  });
  console.log('tx', tx.hash)
  // await tx.wait();
}

async function transferPPT(privateKey: string, to: string, amount: BigNumber) {
  const pptContract = new Contract('0xDf061250302E5cCae091B18CA2B45914D785F214', PPT_ABI)
  const wallet = new Wallet(privateKey, provider);
  console.log('Transfering', utils.formatEther(amount) ,'PPT from', wallet.address, 'to', to)
  const estimate = await pptContract.connect(wallet).estimateGas.transfer(to, amount)
  console.log('estimate', estimate.toString())
  const tx = await pptContract.connect(wallet).transfer(to, amount, {
    gasLimit: estimate.add(5000),
    gasPrice: utils.parseUnits('3', 'gwei')
  });
  console.log('tx', tx.hash)
  // await tx.wait();
}

function mapAddressesWithTargets (addresses: string[]) {

  const targets = {
    "ByBit" : [
      "0xfab8c04bb4e13cd1c25b06d131a8ee6d7b75698c",
      "0x0d9191d42d563d4277ad404a7dd30130b0ff022d",
      "0x9c83c03b102c5cc480325570dc44b5b63db9de32",
      "0xddf56ffef61152fd8f943d50635bfec15e27bd2d",
      "0xe4cbe9b3d8ffc93e41a4f5a6884204102895d43c",
      "0xbb088302484985ae531a075dd87a91fd778c56c7",
      "0x8d89a3f4a1b18348421db6aa79336fc49e9830ab",
      "0x6ec535f28980307d798cab3db4c53858c52c448f",
      "0xb42f761b3def6ebd24e6d21070a1ac4a90269f29",
      "0x232f5264086121fce48f47c88902dd35e7224fb8",
    ],
    "MEXC" : [
      "0x3b3e9b131a563eb2b6fc90aaba349f55dfc73f4c",
      "0x907a008815fbcf9cc3e15625d5c289c74a99681d",
      "0x4990fdb6ce12cce0152b4808e0a833f9cc1bc047",
      "0xe922b98a90ca2646a500e80fb63ac79ad5d8ed59",
      "0x173711c4bdd222dc85ce5c26793f6758e969a56b",
      "0x861fad881954317cecde73ce2fa1f2354c4be86d",
      "0xc448f429b64d803365e3c8b9b6c8e0f20dd168ba",
      "0x0afd29b2f825116b836794067cc54089cd63e68a",
      "0xfdab41d3907a675e4cefe7e5408a6e61c29ba438",
      "0xbe34d88b2f8edfb1eb62228ccdd357c46fe38d1e",
    ],
    "GATEIO" : [
      "0x07218b0b86FaFC7c907eace52D5339aA0d6F44c6",
      "0x60998faFDa836504dDD3d09eD3Eb5dE3E58F88a3",
      "0xEf899d6525A8F32a42b98C15Ebd5625f1dc760EB",
      "0xd536f81196dca095EE8E5f3DC3eDEcBFa445AC7D",
      "0x21E56FDDf0d9cA45E367d914d55e4C1B747Ad046",
      "0x99146e16b40a2DD6DA26507Cc843B485533A4CB5",
      "0xDa2276EE038990c99B04Ce9A13799ce60FD5fd96",
      "0x658E3e9d3A7B7e299aAb5538cdA6f7a738fe327a",
      "0xC3aaD8Be9b15ab5f9a76C3EFAd77C4c9aFA41777",
      "0xA380648E6De2bfa20c588E92F2496B0865B2A2b9",
    ],
    "BITGET" : [
      "0x386c25bfe9070b8f2eaed32ea9955d8197097bc2",
      "0xbc99ab8b45cecd9d8a451005dac46beaf3b5fd65",
      "0x9f9962e06c5f7fe9118f54d8acb6c9464f2fb9d9",
      "0x5647d9f2d50ebc6958f5dae95ae7f6285d512e12",
      "0x69c476eab21aa3890843ee6a2efb3e6dbbbbf9c1",
      "0x92a5b59d239491a1be0ff311bf2654155f8b9c1f",
      "0xf720805a99ac6fca15519b8026e8eac95ec2b692",
      "0x5b582441043ec36c1379b623d576fc16f50115cb",
      "0x6b5e0cea1c6831781509bfeea27e0797b5e33f55",
      "0x89cff96189675dacb502b6ab42fd53f47aa73c84",
    ]
  }

  // Flatten the target addresses into a single array
  const targetAddresses = Object.values(targets).flat();

  // Initialize an empty map to store the mapping from addresses to targets
  const mapping: {[key: string]: string} = {};

  // Iterate over the addresses array
  addresses.forEach((address, index) => {
    // Compute the index for the target address using modulo to achieve round-robin
    const targetIndex = index % targetAddresses.length;
    // Map the current address to the selected target address
    mapping[address] = targetAddresses[targetIndex];
  });

  // Return the mapping
  return mapping;

}
async function main() {

   // Use the BSC RPC
  
  // Read the CSV file
  const csvContent = fs.readFileSync('addresses.csv', 'utf8');
  const results = Papa.parse(csvContent, { header: false });
  const addresses = results.data.flat();
  console.log('Total Addresses', addresses.length)

  // Get ETH balances of addresses
  const addressesWithEth = await getETHBalancesOfAddresses(addresses);
  console.log('addressesWithEth', addressesWithEth.length)

  // // Get vesting info
  // const claimableAddr = await getVestingInfo(addressesWithEth);
  // console.log('claimableAddr', claimableAddr.length)
  const { addresses: wallets, addressesWithKeys } = await deriveWallets(process.env.MNEMONIC_SALE || "", 700);
  console.log('wallets', wallets.length)
  // // console.log('addressesWithKeys', addressesWithKeys)

  // for (const claimAddr of claimableAddr) {
  //   // console.log('claimAddr', claimAddr)
  //   const wallet = addressesWithKeys.find((addr: string[]) => addr[0].toLowerCase() === claimAddr.address.toLowerCase())
  //   if(wallet) {
  //     // console.log('wallet', wallet)
  //     await claimPPT(wallet[1], claimAddr.vestingAddr, claimAddr.amount)
  //   } else {
  //     console.log('Not found')
  //   }
  // }

  const addressToTargets = mapAddressesWithTargets(addressesWithEth);
  const addressesToCheck = Object.entries(addressToTargets).map(([fromAddress, toAddress]) => {
    return fromAddress
  })
  const addressesWithPPT = await getPPTBalancesOfAddresses(addressesToCheck);
  console.log('addressesWithPPT', addressesWithPPT.length)
  // console.log('addressToTargets', addressToTargets)

  for (const addrWithPPT of addressesWithPPT) {
    const wallet = addressesWithKeys.find((addr: string[]) => addr[0].toLowerCase() === addrWithPPT.address.toLowerCase())
    const targetAddr = addressToTargets[addrWithPPT.address]
    if(wallet) {
      await transferPPT(wallet[1], targetAddr, addrWithPPT.amount)
    } else {
      console.log('Not found')
    }
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});