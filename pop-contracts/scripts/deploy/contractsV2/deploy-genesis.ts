import {Contract} from "ethers";
import hre, {ethers, upgrades} from "hardhat";
import {MerkleTree} from 'merkletreejs';
import keccak256 from 'keccak256';


interface Accessory {
    contractAddr: string;
    accessoryId: number;
}

async function main() {

    let genesisNFT: Contract;

    // Accessory contract addresses
    const contractsToWhitelist: string[] = [
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
    ];

    const GenesisNFT = await ethers.getContractFactory("Genesis");
    genesisNFT = await upgrades.deployProxy(GenesisNFT, [contractsToWhitelist], {initializer: 'initialize'});
    await genesisNFT.deployed();

    // accessories = [
    //     {contractAddr: contractsToWhitelist[0], accessoryId: 0},
    //     {contractAddr: contractsToWhitelist[1], accessoryId: 0},
    //     {contractAddr: contractsToWhitelist[2], accessoryId: 0},
    //     {contractAddr: contractsToWhitelist[3], accessoryId: 0}
    // ]
      
    // await genesisNFT.setAccessoryOrder(accessories.map((contract) => contract.contractAddr));

    console.log(`GenesisNFT Proxy deployed at address ${genesisNFT.address}`);
    console.log(await upgrades.erc1967.getImplementationAddress(genesisNFT.address), "implementation");
    console.log(await upgrades.erc1967.getAdminAddress(genesisNFT.address), 'admin address');
}

async function verify() {
    let address = "0x726D6BAcD620152E2E40bd6C75062Bee30F45729"
    await hre.run("verify:verify", {
        address: address
    });
}


export function checkWhiteList(allowList: string[], currentAddress: string) {
    const leaves = allowList.map((address) => keccak256(address));
    const merkleTree = new MerkleTree(leaves, keccak256, {sortPairs: true});
    const merkleRoot = merkleTree.getRoot().toString('hex');
    const proof = merkleTree.getHexProof(keccak256(currentAddress ?? ''));
    const checkAllowlisted = merkleTree.getLeafIndex(Buffer.from(keccak256(currentAddress ?? ''))) >= 0;
    return {
        isWL: checkAllowlisted,
        proof,

    };
}


async function get_tree() {
    let url = "https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/popbit/whitelist.json"
    let res = await axios({
        method: 'get',
        maxBodyLength: Infinity,
        url: url
    })
    return res.data
    // return [
    //     '0xff8834d3eD45773a8f51908e021Fe36a374bb030',
    //     '0x42c4e30b6af9C1b730F016C0B29dCc3Ab41bb745',
    //     '0xDf37b75345536F73976311FF86e97b51d299D21F',
    //     '0x2917115014beea46CA2d6aD3935c26C21439Fbc2'
    // ]

}

let merkleTree: MerkleTree;

async function get_allow_list() {
    let res = await get_tree()
    console.log(res)
    return res
}

async function getMerkleTree() {
    let allowlist = await get_allow_list()
    const leaves = allowlist.map((address: any) => keccak256(address));
    merkleTree = new MerkleTree(leaves, keccak256, {sortPairs: true});
    return merkleTree;
}

async function getMerkleRoot() {
    let tree = await getMerkleTree()
    return tree.getRoot().toString('hex');
}

async function getProof(address: string | undefined) {
    let tree = await getMerkleTree()
    return tree.getHexProof(keccak256(address ?? ''));
}

async function checkAllowlisted(address: string | undefined) {
    let tree = await getMerkleTree()
    return tree.getLeafIndex(Buffer.from(keccak256(address ?? ''))) >= 0
}


async function init() {

    let Genesis_address = "0xBC3935F2E72675842fD0781989f9a8BDEA4ae060"
    const [admin] = await ethers.getSigners();
    console.log(admin.address)
    let accessory = await ethers.getContractFactory("Genesis")
    let admin_proxy = accessory.attach(Genesis_address)
    console.log(await admin_proxy.name())

    // url need to deploy
    let base_uri = "https://popoo-web2.s3.ap-northeast-1.amazonaws.com/data/metadata/test/json/"
    console.log(await admin_proxy.setBaseURI(base_uri, {gasLimit: 10000000}))
    console.log(await admin_proxy.setSalePrice(ethers.utils.parseEther("0.005")))
    console.log(await admin_proxy.setTotalSupply(1000))


    // Need to be set as start time
    let start_at = Math.floor(new Date().getTime() / 1000)
    console.log(await admin_proxy.setSaleStartAt(1700165094), {gasLimit: 10000000})

    console.log(await admin_proxy.baseURI())
    console.log(await admin_proxy.tokenURI(1))
    console.log(await admin_proxy.saleStartAt())
    console.log(await admin_proxy.salePrice())
    console.log(await admin_proxy.whitelistMerkleRoot())


    // use white list
    // white list need to deploy
    console.log(await admin_proxy.setWhitelistMerkleRoot("0x" + await getMerkleRoot()))

    let wallet = ethers.Wallet.createRandom();
    console.log(wallet.address, wallet.privateKey)
    let proof_3 = await getProof(admin.address)
    console.log(proof_3)
    console.log(await admin_proxy.safeMint(admin.address, proof_3, {
        value: ethers.utils.parseEther("0.005"),
        gasLimit: 10000000
    }))

    //
    // // no white list
    // console.log(await admin_proxy.setWhitelistMerkleRoot("0x0000000000000000000000000000000000000000000000000000000000000000"))
    // let wallet = ethers.Wallet.createRandom();
    // console.log(wallet.address, wallet.privateKey)
    // console.log(await admin_proxy.safeMint(wallet.address, [], {value: ethers.utils.parseEther("0.005"), gasLimit: 10000000}))


    // withdraw
    // await admin_proxy.withdraw({gasLimit: 10000000})
}


async function test_accessory() {
    let Genesis_address = "0xBC3935F2E72675842fD0781989f9a8BDEA4ae060"
    const [admin] = await ethers.getSigners();
    console.log(admin.address)
    let Genesis = await ethers.getContractFactory("Genesis")
    let admin_proxy = Genesis.attach(Genesis_address)

    let accessory_hat_address = "0xD8e84dED4920302a7dF7410Fa2c342ea2886C1A3"
    let accessory_clothe_address = "0x6D7BB734005Eb873a1C541f5113Abd25c73d91fC"
    let Accessory = await ethers.getContractFactory("Accessory")
    let accessory_hat = Accessory.attach(accessory_hat_address)
    let accessory_clothe = Accessory.attach(accessory_clothe_address)


    console.log(await admin_proxy.getEquippedAccessories(10))
    console.log(await admin_proxy.accessoryOrder(0))
    console.log(await admin_proxy.accessoryOrder(1))
    console.log(await admin_proxy.accessorySlots())

    // setAccessoryOrder
    // const contractsToWhitelist: string[] = [
    //     "0xD8e84dED4920302a7dF7410Fa2c342ea2886C1A3",
    //     "0x6D7BB734005Eb873a1C541f5113Abd25c73d91fC",
    // ];
    // console.log(await admin_proxy.setAccessoryOrder(contractsToWhitelist))

    // approve
    // console.log(await admin_proxy.accessorySlots())
    // await accessory_hat.setApprovalForAll(Genesis_address, true)
    // await accessory_clothe.setApprovalForAll(Genesis_address, true)

    const accessoriesToEquip = [
        {contractAddr: accessory_hat_address, accessoryId: 1},
        {contractAddr: accessory_clothe_address, accessoryId: 1},
    ]
    // let tx = await admin_proxy.equipAccessories(10, accessoriesToEquip);
    // let tx = await admin_proxy.deEquipAllAccessories(10, {gasLimit: 10000000});
    let tx = await admin_proxy.deEquipAccessory(10, 1);
    await tx.wait()
    console.log(tx.hash)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then()
// init().then()
// verify().then()