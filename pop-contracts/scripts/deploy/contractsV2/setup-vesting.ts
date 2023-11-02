const { ethers } = require("hardhat");
import { address } from './../../../test/utils';
import tokenSaleProxyAbi from '../../../contracts/abis/tokenSaleProxy.json';
import implementationAbi from '../../../contracts/abis/tokenSale.json';
import { type SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { utils, BigNumber } from 'ethers';

const hre = require('hardhat')
const Papa = require('papaparse');
const fs = require('fs');
interface VestingAllocation {
  // address: string;
  // name: string;
  tokensAllocated: number;
  cliff: number;
  durationMonths: number;
  cliffPerc: string;
  startTime: number;
}

interface VestingMaster {
  address: string;
  name: string;
  allocations: VestingAllocation[];
}

export async function impersonateSigner (address: string): Promise<SignerWithAddress> {
  await hre.network.provider.send('hardhat_setBalance', [
    address,
    '0x8AC7230489E80000'
  ])
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address]
  })
  const signer = await ethers.getSigner(address)
  return signer
}

async function main() {

    const [owner] = await ethers.getSigners();
    const TokenSaleDistributorFactory = await hre.ethers.getContractFactory("TokenSaleDistributor");
    // const signer = await impersonateSigner('0xe981E1060D44debBdB851efc63ee79Db24C2B6a4');
    const currentTime = 1698141600;
    // time.increaseTo(currentTime);
    const vestingMaster : VestingMaster[] = [
      {
        name: "Ecosystem",
        address: '0x088FaFe4368Ad0DA11C8ea4Ceb7f9c3d7361919D',
        allocations: [
          {
            tokensAllocated: 4666667,
            cliff: 0, // 0.05 in WEI,
            durationMonths: 0,
            cliffPerc: '0',
            startTime: currentTime + (2628000 * 1),
          },
          {
            tokensAllocated: 30333333,
            cliff: 0, // 0.05 in WEI,
            durationMonths: 13,
            cliffPerc: '0',
            startTime: currentTime + (2628000 * 1),
          },
          {
            tokensAllocated: 17500000,
            cliff: 0,
            durationMonths: 15,
            cliffPerc: '0',
            startTime: currentTime + (2628000 * 14),
          },
          {
            tokensAllocated: 17500000,
            cliff: 0,
            durationMonths: 30,
            cliffPerc: '0',
            startTime: currentTime + (2628000 * 29),
          },
        ],
      },
      {
        name: "Foundation",
        address: '0x00BB74B493B7e580A866C314847fA8B225e0837D',
        allocations: [
          {
            tokensAllocated: 60000000,
            cliff: 5,
            durationMonths: 24,
            cliffPerc: '50000000000000000', // 0.05 in WEI
            startTime: currentTime,
          },
        ],
      },
      {
        name: "Strategic",
        address: '0x779Cb8b04af7Bc3232CC1e55f67ecDFB249420F6',
        allocations: [
          {
            tokensAllocated: 1000000,
            cliff: 0,
            durationMonths: 0,
            cliffPerc: '45000000000000000', // 5e17
            startTime: currentTime + (2628000 * 2),
          },
          {
            tokensAllocated: 450000,
            cliff: 0,
            durationMonths: 0,
            cliffPerc: '45000000000000000', // 5e17
            startTime: currentTime + (2628000 * 5),
          },
          {
            tokensAllocated: 8550000,
            cliff: 0,
            durationMonths: 24,
            cliffPerc: '0', // 5e17
            startTime: currentTime + (2628000 * 5),
          },
        ],
      },
      {
        name: "Team",
        address: '0x3f6a60B720Da916a016C3F8Fef61AC4B1c5462B6',
        allocations: [
          {
            tokensAllocated: 30000000,
            cliff: 5,
            durationMonths: 30,
            cliffPerc: '50000000000000000', // 5e17
            startTime: currentTime,
          },
        ],
      },
      {
        name: "Advisors",
        address: '0x81F45BAa6d4aF1e6a0Fc0Cbbe7C2d50ff8489Bf0',
        allocations: [
          {
            tokensAllocated: 4000000,
            cliff: 5,
            durationMonths: 24,
            cliffPerc: '50000000000000000', // 5e17
            startTime: currentTime,
          },
        ],
      },
      {
        name: "Treasury",
        address: '0x4e1538d7027329a7733f03D6DF032b18561330a2',
        allocations: [
          {
            tokensAllocated: 5530000,
            cliff: 5,
            durationMonths: 24,
            cliffPerc: '50000000000000000', // 5e17
            startTime: currentTime,
          },
        ],
      },
      {
        name: "Airdrop",
        address: '0x94b1a721764288EFF48fBe935fC14F43893bA1aA',
        allocations: [
          {
            tokensAllocated: 6000000,
            cliff: 2,
            durationMonths: 6,
            cliffPerc: '0',
            startTime: currentTime,
          },
        ],
      },
      {
        name: "MarketMaking",
        address: '0x6Fc93cE1825Bd659c99c5CeF890fE19D7Ce3b705',
        allocations: [
          {
            tokensAllocated: 3000000,
            cliff: 0,
            durationMonths: 0,
            cliffPerc: '0',
            startTime: currentTime + (2628000 * 3),
          },
          {
            tokensAllocated: 3500000,
            cliff: 0,
            durationMonths: 0,
            cliffPerc: '0',
            startTime: currentTime + (2628000 * 6),
          },
        ],
      },
    ]

    const addressMapped = vestingMaster.map((vest) => vest.allocations.map((allocation) => vest.address))
    const linearMapped = vestingMaster.map((vest) => vest.allocations.map((allocation) => false))
    const startTimeMapped = vestingMaster.map((vest) => vest.allocations.map((allocation) => allocation.startTime))
    const tokensAllocatedMapped = vestingMaster.map((vest) => vest.allocations.map((allocation) => ethers.utils.parseEther(allocation.tokensAllocated.toString())))
    const cliffMapped = vestingMaster.map((vest) => vest.allocations.map((allocation) => allocation.cliff * 2628000))
    const durationMonthsMapped = vestingMaster.map((vest) => vest.allocations.map((allocation) => allocation.durationMonths))
    const cliffPercMapped = vestingMaster.map((vest) => vest.allocations.map((allocation) => allocation.cliffPerc))

    // console.log(addressMapped.flat())
    // console.log(linearMapped.flat())
    // console.log(startTimeMapped.flat())
    // console.log(durationMonthsMapped.flat())
    // console.log(cliffMapped.flat())
    // console.log(cliffPercMapped.flat())
    // console.log(tokensAllocatedMapped.flat())
    const tokenSaleDistributor = await TokenSaleDistributorFactory.attach('0xBD3CCBDD468fA11eac9e8240ebBA3daC83c12aa5');
    // await tokenSaleDistributor.setAllocations(
    //   addressMapped.flat(),
    //   linearMapped.flat(),
    //   startTimeMapped.flat(),
    //   durationMonthsMapped.flat(),
    //   cliffMapped.flat(),
    //   cliffPercMapped.flat(),
    //   tokensAllocatedMapped.flat(),
    // );

    console.log('Done');

    // const vestingMaster = [{
    //   name: "Ecosystem",
    //   address: '0x088FaFe4368Ad0DA11C8ea4Ceb7f9c3d7361919D',
    // },
    // {
    //   name: "Foundation",
    //   address: '0x00BB74B493B7e580A866C314847fA8B225e0837D',
    // },
    // {
    //   name: "Strategic",
    //   address: '0x779Cb8b04af7Bc3232CC1e55f67ecDFB249420F6',
    // },
    // {
    //   name: "Team",
    //   address: '0x3f6a60B720Da916a016C3F8Fef61AC4B1c5462B6',
    // },
    // {
    //   name: "Advisors",
    //   address: '0x81F45BAa6d4aF1e6a0Fc0Cbbe7C2d50ff8489Bf0',
    // },
    // {
    //   name: "Treasury",
    //   address: '0x4e1538d7027329a7733f03D6DF032b18561330a2',
    // },
    // {
    //   name: "Airdrop",
    //   address: '0x94b1a721764288EFF48fBe935fC14F43893bA1aA',
    // }]

    function dateFromEpoch(epoch: number) {
      return new Date(epoch * 1000).toLocaleDateString("en-US");
    }
    const monthlyBreakdowns = [];
    const prevClaimable :{ [x: string]: BigNumber } = {};
    for (let i = 1; i < 62; i++) {
      await time.increase(2628000 + 500);
      for(const vesting of vestingMaster) {
        let deduct = BigNumber.from(0);
        if(prevClaimable[vesting.name] !== undefined) {
          deduct = prevClaimable[vesting.name];
        }
        const totalClaimable = await tokenSaleDistributor.totalClaimable(vesting.address);
        const totalClaimableAfterDeduct = totalClaimable.sub(deduct);
        console.log('epoch', await time.latest())
        console.log('dateFromEpoch(await time.latest())', dateFromEpoch(await time.latest()))
        monthlyBreakdowns.push({
          date: dateFromEpoch(await time.latest()),
          vesting: vesting.name,
          claimable: ethers.utils.formatEther(totalClaimableAfterDeduct.toString()),
        })
        prevClaimable[vesting.name] = await tokenSaleDistributor.totalClaimable(vesting.address);
      }

    }
    // console.log(JSON.stringify(monthlyBreakdowns))
    const csv = Papa.unparse(monthlyBreakdowns);
  fs.writeFile('final_alloc.csv', csv, (err) => {
    if (err) throw err;
    console.log('CSV file has been saved!');
  });
    

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});