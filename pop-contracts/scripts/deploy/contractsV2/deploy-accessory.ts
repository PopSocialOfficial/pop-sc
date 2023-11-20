import {ContractFactory} from "ethers";
import hre, {ethers, upgrades} from "hardhat";


interface Accessory {
    contractAddr: string;
    accessoryId: number;
}

async function main() {

    const HatNFT: ContractFactory = await ethers.getContractFactory("Accessory");
    const ClothesNFT: ContractFactory = await ethers.getContractFactory("Accessory");

    // test
    let hat_url = "https://popbit-ipfs.adev.popoo.foundation/popbit-test/json/hat/{id}"
    // prod
    // let hat_url = "https://ipfs.popsocial.io/popbit/json/hat/{id}"
    const hatDeploy = await upgrades.deployProxy(HatNFT, ['Popbit Hat', 'HAT', hat_url], {initializer: 'initialize'});
    const hatDeployed = await hatDeploy.deployed();
    console.log(`Hat Accessory Proxy deployed at address ${hatDeploy.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(hatDeploy.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(hatDeploy.address), 'admin address');

    // test
    let cloth_url = "https://popbit-ipfs.adev.popoo.foundation/popbit-test/json/cloth/{id}"
    // prod
    // let hat_url = "https://ipfs.popsocial.io/popbit/json/cloth/{id}"
    const clothesDeploy = await upgrades.deployProxy(ClothesNFT, ['Popbit Clothes', 'CLOTHES', cloth_url], {initializer: 'initialize'});
    const clothesDeployed = await clothesDeploy.deployed();
    console.log(`Clothes Accessory Proxy deployed at address ${clothesDeploy.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(clothesDeploy.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(clothesDeploy.address), 'admin address');
}

async function verify() {
    let address = "0x53D16DEe770194aB48049B59a5d4c794eC692342"
    await hre.run("verify:verify", {
        address: address
    });
}

async function test() {
    let accessory_address = "0xD8e84dED4920302a7dF7410Fa2c342ea2886C1A3"
    // let accessory_address = "0x6D7BB734005Eb873a1C541f5113Abd25c73d91fC"
    const [admin] = await ethers.getSigners();
    console.log(admin.address)
    let accessory = await ethers.getContractFactory("Accessory")
    let hat_admin_proxy = accessory.attach(accessory_address)
    // let hat_admin_proxy = new ethers.Contract(hat_accessory_address, Accessory, admin)
    // console.log(await hat_admin_proxy.uri(1))
    console.log(await hat_admin_proxy.name())
    console.log(await hat_admin_proxy.setTotalSupply(20))
    console.log(await hat_admin_proxy.mint(admin.address, 1, 1, [], {gasLimit: 10000000}))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
