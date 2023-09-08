const { ethers } = require("hardhat");
const tokenSaleProxyAbi = require('../contracts/abis/tokenSale.json');

// ipfs://bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja
// https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja

// generates metadata.json with images folder provided

async function main() {
    const [owner] = await ethers.getSigners();
  try {
    const vestingContract = new ethers.Contract("", tokenSaleProxyAbi, owner)
    
    let recipients = [
      "0x9749AA9F78E15385695069EC85689AD07f7e011E",
      "0x3C2AE5E3A47905610df265F0E4fEA15B3A965B61",
      "0x23741E07282331B99bdc2141F1518F73D05f986e",
      "0xE92a5dDbA3AEF6aAB6D9F9571987aD44554C1f85",
      "0xb0F10F86eFFFE0F8cEB8099993Da5e86D52ae2A1",
      "0xbdcde468f92cdd123DEbee89E775D492d2201825",
      "0x4B9A29857065eDB892c3eE4843CD830b73DdC5d3",
      "0xd3eFdE4117cfD39DF0d19E9879aE2bE1DCd900b7",
      "0x5f2102740fCB8afAb3E13Be909544CF6f2A5B7c1",
      "0xd4EcEc3e56EE7E0e566821A1868aD2177C711bD7",
      "0xDaE2774F0Dac3245d5562e27CB30157773C4ab32",
      "0xA274178a566D0fE6C30e5120Cdae9eb53f768d0e",
      "0x37Ad368dC50c5f2EB8dAE5339C196c7D8164e19a",
      "0x4bb6f9c7dCC616f855E3356487ED6208A3814655",
      "0xF552f5d3590626D37a05AA4497C2418731247312",
      "0x31ec3751bB2535A961B5A407260BD40dD16382Ab",
      "0x830F769d1ACFA66E4C72Ee07E1C9Ad72aD9b4977",
      "0xC9118140DbB6A661Cc4E1eF4364Ff7CC22F347c2",
      "0x1E410751B07498D1BC67433b8f7079186b600631",
      "0x2dEB691968425cCEd9e64e964a787F9ea05B1C7b",
      "0x2dE37c20d67BBe35524caE85cA5dF4070D9794F9",
      "0xCABc8618409f540fB9D941Fa85D0D87dcd5ddb88",
      "0x6Bad2e21F5D212A99E9A97D6a4A4A1d24C614192",
      "0x111ec4682D403463C175D8709Db0149388DbBd49",
      "0x10929bA19E3663B7f203b94A009bb7839E664179",
      "0xB34ea26C9f3501fB3e5799Fe95046CA7448E6C49",
      "0x6D3af3093095Cd7c7dac7F80B1d5e34Fe0495445",
      "0x95C3498A0Be4cF6cff0344cb3D78d45cc9c79bbF",
      "0x5806f9637458EE005905F4A45143E2B13dE2A41D",
      "0xBb57F12973320465591Ff5956627Ba897a7D93ac"
    ];
    let isLinear = new Array(30).fill(false);
    let epochs = new Array(30).fill("1694169845") // to be modified
    let vestingDurations = new Array(30).fill("9");
    let cliffs = new Array(30).fill("0");
    let cliffPercentages = new Array(30).fill("0");
    let amounts = [
      '2178115501519756736000', '7978723404255319500000',
      '1414893617021276658000', '7978723404255319500000',
      '7978723404255319500000', '7978723404255319500000',
      '7978723404255319500000', '7978723404255319500000',
      '7978723404255319500000', '3186170212765957587000',
      '7978723404255319500000', '7978723404255319500000',
      '7978723404255319500000', '585106382978723430000',
      '5851063829787234300000', '4787234042553191700000',
      '531914893617021300000',  '7978723404255319500000',
      '1595744680851063900000', '7978723404255319500000',
      '7978723404255319500000', '7978723404255319500000',
      '7978723404255319500000', '7978723404255319500000',
      '531914893617021300000',  '531914893617021300000',
      '7978723404255319500000', '7978723404255319500000',
      '7978723404255319500000', '7978723404255319500000'
    ]
    // for (let index = 0; index < recipients.length; index++) {
    //     const user = recipients[index];
    //     console.log(user, 'USER');
    //     await vestingContract.resetAllocationsByUser(user);
    // }

    await vestingContract.setAllocations(recipients,isLinear,epochs,vestingDurations,cliffs,cliffPercentages,amounts)
}
  catch (e) {
   console.log(e);
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});