import fs from 'fs';
import { ethers } from "hardhat";

// ipfs://bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja
// https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja

async function main() {
  const ids = [
    // background
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    // clothes
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111,
    //eyes
    200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218,
    // fur
    300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315,
    // hat
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416,
    // mouth
    500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520,
  ]

  try {
    const MaxComponents = await ethers.getContractFactory("MaxComponents");
    const contract = MaxComponents.attach(
      "0xeED45c315489b47D2f63aF43E60cF1B5c5eaF383"
    );

    const content: any = {
      '0': {
        energyPoints: '66',
        name: 'Antique White',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/antique-white.png'
      },
      '1': {
        energyPoints: '46',
        name: 'Aquamarine',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/aquamarine.png'
      },
      '2': {
        energyPoints: '60',
        name: 'Bit of blue',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/bit-of-blue.png'
      },
      '3': {
        energyPoints: '30',
        name: 'Blue',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/blue.png'
      },
      '4': {
        energyPoints: '72',
        name: 'Gray',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/gray.png'
      },
      '5': {
        energyPoints: '79',
        name: 'Marshmallow',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/marshmallow.png'
      },
      '6': {
        energyPoints: '37',
        name: 'Merino',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/merino.png'
      },
      '7': {
        energyPoints: '67',
        name: 'Phantom Green',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/phantom-green.png'
      },
      '8': {
        energyPoints: '57',
        name: 'Pink',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/pink.png'
      },
      '9': {
        energyPoints: '31',
        name: 'Purple',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/purple.png'
      },
      '10': {
        energyPoints: '51',
        name: 'Snow White',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/snow-white.png'
      },
      '11': {
        energyPoints: '53',
        name: 'Yellow',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/background/yellow.png'
      },
      '100': {
        energyPoints: '59',
        name: 'Baseball Uniform',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/baseball-uniform.png'
      },
      '101': {
        energyPoints: '60',
        name: 'Basketball',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/basketball.png'
      },
      '102': {
        energyPoints: '37',
        name: "Black Hoodieh's",
        image: "https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/black-hoodieh's.png"
      },
      '103': {
        energyPoints: '39',
        name: 'Black Suit',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/black-suit.png'
      },
      '104': {
        energyPoints: '40',
        name: 'Cool',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/cool.png'
      },
      '105': {
        energyPoints: '72',
        name: 'Gold Chain',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/gold-chain.png'
      },
      '106': {
        energyPoints: '58',
        name: 'Match',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/match.png'
      },
      '107': {
        energyPoints: '59',
        name: 'Pink Cothes',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/pink-cothes.png'
      },
      '108': {
        energyPoints: '57',
        name: 'Red Sweater',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/red-sweater.png'
      },
      '109': {
        energyPoints: '79',
        name: 'Scarf',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/scarf.png'
      },
      '110': {
        energyPoints: '72',
        name: 'Tie',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/tie.png'
      },
      '111': {
        energyPoints: '48',
        name: 'White T shirt',
        image: 'https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/nft/max/clothes/white-t-shirt.png'
      }
    }
    // Loop them all with the new for...of
    for (let i = 24; i < ids.length; ++i) {
      const id = ids[i]

      const energyPoints = (await contract.energyPoints(id)).toString()
      const tokenURI = await contract.tokenURI(id)
      const resp = await (await fetch(tokenURI)).json()
      content[id] = {
        energyPoints,
        ...resp
      }

      console.log(content);
    }
    await fs.promises.writeFile(`./max-metadata/combined.json`, JSON.stringify(content))
  }
  catch (e) {
    // Catch anything bad that happens
    console.error("We've thrown! Whoops!", e);
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});