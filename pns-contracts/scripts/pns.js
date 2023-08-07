const {ethers} = require("ethers")
const crypto = require("crypto")
const dotEnv = require("dotenv");
dotEnv.config()
const registerContractInfo = require("../deployments/bscTestnet/RegistrarController.json");
const url = "https://bsc-testnet.public.blastapi.io"
console.log(url)

const deployResult = require("../deployments/bscTestnet_result.json");
console.log('deployResult=', deployResult)
const PNS_ADDR = deployResult["contracts/registrar/RegistrarController.sol"].address;
const RESOLVER_ADDR = deployResult["contracts/resolvers/PublicResolver.sol"].address;

const rpcProvider = new ethers.providers.JsonRpcProvider(url);
const testAccount = process.env.OWNER_KEY;
console.log(testAccount);
const wallet = new ethers.Wallet(testAccount, rpcProvider);
console.log("=========================================")
console.log(PNS_ADDR, registerContractInfo.abi, wallet);
const registerContract = new ethers.Contract(PNS_ADDR, registerContractInfo.abi, wallet);

const buf = crypto.randomBytes(32).toString('hex');
const salt = "0x" + buf;
console.log({salt});

const name = "0702"
let owner = "0xD98Ab04B56b99C0966742684dB06bF24E326C3db";
const DAYS = 24 * 60 * 60;

//0xb9924a250ea0bfccffdccd837fb8a9f856412690b8a4cf3f25b5105e8a954e30

const main = async () => {
    // owner = await wallet.getAddress();
    let owner = "0xD98Ab04B56b99C0966742684dB06bF24E326C3db";
    console.log("=========================================");
    const available = await registerContract.available(name);
    console.log("=========================================");
    console.log(`available `, available);
    if (!available) return;
    await commit();
    setTimeout(async () => {
        await register();
    }, 2000);
}

async function commit() {
    console.log('committing')
    const commitment = await registerContract.makeCommitment(
        name,
        owner,
        salt,
        RESOLVER_ADDR,
    );
    console.log(`committing, commitment: ${commitment}`);
    const tx = await registerContract.commit(commitment);
    console.log(`committing, tx: ${tx.hash}`);
    await tx.wait();
    console.log(`committed, commitment: ${commitment}, wait 60s`);
}

async function register() {
    const duration = 365 * DAYS;
    const price = await registerContract.rentPrice(name, duration);
    console.log({price});
    console.log(`resgistering, price: ${price / 10 ** 18}`);
    const rtx = await registerContract.register(name, owner, duration, salt, RESOLVER_ADDR, {
        // gasLimit: 800000,
        value: price
    });
    await rtx.wait();
    console.log("registered");
}


main();
