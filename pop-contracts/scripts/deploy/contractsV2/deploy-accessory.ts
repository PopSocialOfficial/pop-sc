import {ContractFactory, Wallet} from "ethers";
import hre, {ethers, upgrades} from "hardhat";


interface Accessory {
    contractAddr: string;
    accessoryId: number;
}

async function main() {

    const HatNFT: ContractFactory = await ethers.getContractFactory("Accessory");
    const ClothesNFT: ContractFactory = await ethers.getContractFactory("Accessory");

    // test
    let hat_url = "https://ipfs.popsocial.io/popbit/json/hat/{id}"
    // prod
    // let hat_url = "https://ipfs.popsocial.io/popbit/json/hat/{id}"
    const hatDeploy = await upgrades.deployProxy(HatNFT, ['Popbit Hat', 'HAT', hat_url, 1000], {initializer: 'initialize'});
    const hatDeployed = await hatDeploy.deployed();
    console.log(`Hat Accessory Proxy deployed at address ${hatDeploy.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(hatDeploy.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(hatDeploy.address), 'admin address');

    // test
    let cloth_url = "https://ipfs.popsocial.io/popbit/json/cloth/{id}"
    // prod
    // let hat_url = "https://ipfs.popsocial.io/popbit/json/cloth/{id}"
    const clothesDeploy = await upgrades.deployProxy(ClothesNFT, ['Popbit Clothes', 'CLOTHES', cloth_url, 1000], {initializer: 'initialize'});
    const clothesDeployed = await clothesDeploy.deployed();
    console.log(`Clothes Accessory Proxy deployed at address ${clothesDeploy.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(clothesDeploy.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(clothesDeploy.address), 'admin address');
}

async function verify() {
    let address = "0x321b301A9f43d3E4E00836CF8776404d3a3755c0"
    await hre.run("verify:verify", {
        address: address
    });
}

async function getSignature(signer: Wallet, _to: string, _id: Number, _amount: Number, _accessory: string) {
    const messageHash = ethers.utils.solidityKeccak256(["address", "uint", "uint", "address"], [_to, _id, _amount, _accessory])
    const messageBytes = ethers.utils.arrayify(messageHash)
    const signature = await signer.signMessage(messageBytes)
    return signature
}

async function test() {
    let accessory_address = "0x4259E91448900A1974600B7A76BF7d9ccDA22315"
    // let accessory_address = "0x6D7BB734005Eb873a1C541f5113Abd25c73d91fC"
    const [admin] = await ethers.getSigners();
    console.log(admin.address)
    let accessory = await ethers.getContractFactory("Accessory")
    let hat_admin_proxy = accessory.attach(accessory_address)
    // let hat_admin_proxy = new ethers.Contract(hat_accessory_address, Accessory, admin)
    // console.log(await hat_admin_proxy.uri(1))
    // console.log(await hat_admin_proxy.name())
    // console.log(await hat_admin_proxy.setTotalSupply(20))
    let signer_key = "ad00e9fd5f3cbc9ba74d43df85281cbc8bb6adfda591be7e309e13cc98f81e92"
    const signer = new ethers.Wallet(signer_key);
    let signature = await getSignature(signer, "0x2917115014beea46CA2d6aD3935c26C21439Fbc2", 1, 1, accessory_address)
    await hat_admin_proxy.mint("0x2917115014beea46CA2d6aD3935c26C21439Fbc2", 1, 1, [], signature, {gasLimit: 70000})
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
test().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// Hat Accessory Proxy deployed at address 0x4259E91448900A1974600B7A76BF7d9ccDA22315
// 0x321b301A9f43d3E4E00836CF8776404d3a3755c0 implementation
// 0x81187F98e3d7b23e26Dc4A6c62d85Da174419700 admin address
// Clothes Accessory Proxy deployed at address 0xF395B3D2932c76684b08ee71434728C96EbeBBe5
// 0x321b301A9f43d3E4E00836CF8776404d3a3755c0 implementation
// 0x81187F98e3d7b23e26Dc4A6c62d85Da174419700 admin address