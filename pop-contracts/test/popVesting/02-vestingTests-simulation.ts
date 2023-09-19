import { address } from './../utils';
// const hre = require('hardhat')
import {ethers} from 'hardhat';
import { utils, BigNumber } from 'ethers';
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  increaseTime,
  resetHardhatNetwork,
  mineBlockWithTimestamp,
  setNextBlockTimestamp,
} from "../utils";
import { time } from '@nomicfoundation/hardhat-network-helpers'
// const {
//   BigNumber,
//   utils: {
//     parseEther,
//   },
// } = ethers;

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

describe("TokenSaleDistributor", function () {
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let tokenSaleDistributor: any;
  let token: any;
  let vestingAllocations: VestingAllocation[] = [];
  let vestingMaster: VestingMaster[] = [];

  /**
   * Deploys the TokenSaleDistributorProxy contract with the underlying implementation contract.
   * A "Vested Token" ("VT") faucet token is set as the vested token and 7.2B VT is minted
   * to the deployer. 1M of this is transferred from the deployer to the proxy.
   */
  const deployTokenSaleDistributor = async function () {
    [deployer, user] = await ethers.getSigners();

    const TokenSaleDistributorProxyFactory = await ethers.getContractFactory("TokenSaleDistributorProxy");
    const TokenSaleDistributorFactory = await ethers.getContractFactory("TokenSaleDistributor");

    const proxy = await TokenSaleDistributorProxyFactory.deploy();
    const implementation = await TokenSaleDistributorFactory.deploy();

    await proxy.setPendingImplementation(implementation.address);
    await (await implementation.becomeImplementation(proxy.address)).wait();

    tokenSaleDistributor = TokenSaleDistributorFactory.attach(proxy.address);
    await tokenSaleDistributor.setTokenAddress('0xdf061250302e5ccae091b18ca2b45914d785f214');
    const currentTime = await time.latest();
    console.log(currentTime);
    console.log(currentTime + (2628000 * 15));
    console.log(currentTime + (2628000 * 30));
    vestingMaster.push({
      name: "Ecosystem",
      address: '0x088FaFe4368Ad0DA11C8ea4Ceb7f9c3d7361919D',
      allocations: [
        {
          tokensAllocated: 35000000,
          cliff: 0,
          durationMonths: 15,
          cliffPerc: '0',
          startTime: currentTime,
        },
        {
          tokensAllocated: 17500000,
          cliff: 0,
          durationMonths: 15,
          cliffPerc: '0',
          startTime: currentTime + (2628000 * 15),
        },
        {
          tokensAllocated: 17500000,
          cliff: 0,
          durationMonths: 30,
          cliffPerc: '0',
          startTime: currentTime + (2628000 * 30),
        },
      ],
    },
    {
      name: "Foundation",
      address: '0x00BB74B493B7e580A866C314847fA8B225e0837D',
      allocations: [
        {
          tokensAllocated: 60000000,
          cliff: 6,
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
          tokensAllocated: 9000000,
          cliff: 6,
          durationMonths: 24,
          cliffPerc: '50000000000000000', // 5e17
          startTime: currentTime,
        },
      ],
    },
    {
      name: "Team",
      address: '0x3f6a60B720Da916a016C3F8Fef61AC4B1c5462B6',
      allocations: [
        {
          tokensAllocated: 30000000,
          cliff: 6,
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
          cliff: 6,
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
          tokensAllocated: 4000000,
          cliff: 6,
          durationMonths: 24,
          cliffPerc: '20000000000000000', // 5e17
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
    })
  }

  describe("Monthly Vesting", function () {
    
    let startTime : number;

    async function prepare () {
      await resetHardhatNetwork();
      await deployTokenSaleDistributor();
      // 
      for(const vesting of vestingMaster) {
        console.log('vesting', vesting.address)
        for(const allocation of vesting.allocations) {
          const amount = ethers.utils.parseEther(allocation.tokensAllocated.toString());
          await tokenSaleDistributor.setAllocations(
            [vesting.address],
            [false],
            [allocation.startTime],
            [allocation.durationMonths],
            [allocation.cliff * 2628000], // in seconds i.e 6 months x 2628000 seconds in a month
            [allocation.cliffPerc],
            [amount],
          );
        }
      }
    }

    describe("General", function () {
      before(prepare);

      it("zero claimable before cliff", async function () {
        // const mapping : {[x: string] : string} = {};
        const prevClaimable :{ [x: string]: BigNumber } = {};

        const monthlyBreakdowns = [];
        for (let i = 1; i < 62; i++) {
          console.log(`========== MONTH ${i} ===========`)
          await time.increase(2628000);
          for(const vesting of vestingMaster) {
            // let claimable = BigNumber.from(0);
            // for(const allocation of vesting.allocations) {
            //   // if (allocation.cliff+1 > i) {
            //   //   expect(await tokenSaleDistributor.totalClaimable(vesting.address)).to.equal(0);
                
            //   // } else {
            //   //   const tokensPm = BigNumber.from(allocation.tokensAllocated).div(BigNumber.from(allocation.durationMonths)).sub(1)
            //   //   expect(totalClaimable).to.be.greaterThanOrEqual(parseEther(tokensPm.toString()));
            //   //   const totalClaimable = await tokenSaleDistributor.totalClaimable(vesting.address);
            //   //   claimable = ethers.utils.formatEther(totalClaimable.toString());
            //   // }
            //   // claimable += ;
            // }
            // claimable = claimable.add(totalClaimable);
            let deduct = BigNumber.from(0);
            if(prevClaimable[vesting.name] !== undefined) {
              deduct = prevClaimable[vesting.name];
            }
            const totalClaimable = await tokenSaleDistributor.totalClaimable(vesting.address);
            const totalClaimableAfterDeduct = totalClaimable.sub(deduct);
            // mapping[vesting.name] = ethers.utils.formatEther(totalClaimable.toString())
            monthlyBreakdowns.push({
              month: i,
              vesting: vesting.name,
              claimable: ethers.utils.formatEther(totalClaimableAfterDeduct.toString()),
            })
            prevClaimable[vesting.name] = await tokenSaleDistributor.totalClaimable(vesting.address);
            // if(totalClaimable.eq(BigNumber.from(0))) {
            //   console.log(vesting.name, '❌')
            // } else {
            //   console.log(vesting.name, '✅', ethers.utils.formatEther(totalClaimable.toString()))
            // }
          }

        }
        console.log(JSON.stringify(monthlyBreakdowns))
      });
    });
  });
});