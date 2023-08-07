const {ethers, errors} = require("ethers")
const crypto = require("crypto")
const fs = require('fs')
const path = require('path')
const {approve, quote, swap, allowance} = require("./request_factory");
// const url = "https://rpc-mainnet.matic.quiknode.pro"
const url = "https://polygon-mainnet.g.alchemy.com/v2/EDXmM7HBs9Hzov-PtrHG3fNGyahMJmUJ"
const rpcProvider = new ethers.providers.JsonRpcProvider(url)

const usdt_addr = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f"
const usdc_addr = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
const okx_addr = "0x3B86917369B83a6892f553609F3c2F439C184e31"


async function get_qoute() {
    return quote({
        "chainId": 137,
        "amount": 1000000,
        "fromTokenAddress": usdt_addr,
        "toTokenAddress": usdc_addr,
    })
}

async function get_approve() {
    return approve({
        "chainId": 137,
        "approveAmount": 1000000,
        "tokenContractAddress": usdt_addr,
    })
}

async function get_swap(address) {
    return swap({
        "chainId": 137,
        "amount": 1000000,
        "fromTokenAddress": usdt_addr,
        "toTokenAddress": usdc_addr,
        "slippage": 1,
        "userWalletAddress": address
    })
}

async function get_allowance(address) {
    return allowance({
        "chainId": 137,
        "tokenContractAddress": usdt_addr,
        "userWalletAddress": address
    })
}

function get_allowance_abi(wallet) {
    let token_abi = [{
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }]
    const usdtContract = new ethers.Contract(usdt_addr, token_abi, wallet)
    return usdtContract.allowance(wallet.address, okx_addr)
}

function set_approve(wallet) {
    let token_abi = [{
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }]
    const usdtContract = new ethers.Contract(usdt_addr, token_abi, wallet)
    return usdtContract.approve(okx_addr, 2000000, {
        "gasPrice": ethers.utils.parseUnits("200", "gwei"),
        "gasLimit": ethers.utils.parseUnits("100000", "wei")
    })
}

function get_balance_abi(wallet) {
    let token_abi = [{
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },]
    const usdtContract = new ethers.Contract(usdt_addr, token_abi, wallet)
    return usdtContract.balanceOf(wallet.address)
}

async function start(privatekey) {
    const wallet = new ethers.Wallet(privatekey, rpcProvider)
    let balance = await get_balance_abi(wallet)
    if (balance.toNumber() <= 0) {
        console.log("balance not enough", wallet.address, balance.toNumber())
        return
    }
    console.log(wallet.address)
    let swap = await get_swap(wallet.address)
    let swap_tx = swap.data[0].tx
    swap_tx.gasLimit = swap_tx.gas
    delete swap_tx.minReceiveAmount
    delete swap_tx.gas
    console.log(swap_tx)
    let allowance = await get_allowance_abi(wallet)
    console.log(allowance.toNumber())
    if (allowance.toNumber() < 1000000) {
        let tx_recept = await set_approve(wallet)
        console.log("approve:tx_recept", tx_recept)
        let tx_approve = await tx_recept.wait(2)
        console.log("approve:tx_approve", tx_approve.transactionHash)
    }
    let swap_recept = await commit(wallet, swap_tx)
    let tx_swap = await swap_recept.wait(2)
    console.log("swap:tx_swap", tx_swap.transactionHash)
}

async function commit(wallet, tx) {
    let nonce = await rpcProvider.getTransactionCount(wallet.address)
    tx.chainId = 137
    tx.value = 0
    tx.nonce = nonce
    tx.gasPrice = ethers.utils.parseUnits(tx.gasPrice, "wei")
    tx.gasLimit = Number(tx.gasLimit)
    let tx_signed = await wallet.signTransaction(tx)
    let tx_recept = await rpcProvider.sendTransaction(tx_signed)
    return tx_recept
}

function save_error(privatekey) {
    let json_path = path.join(__dirname, 'error.json')
    try {
        let data = fs.readFileSync(json_path, {
            encoding: 'utf8',
            flag: 'r'
        });
        if (!data) data = "[]"
        let arr = JSON.parse(data)
        arr.push(privatekey)
        arr = Array.from(new Set(arr));
        fs.writeFileSync(json_path, JSON.stringify(arr), {flag: 'w'});
    } catch (e) {
        fs.writeFileSync(json_path, JSON.stringify([privatekey]), {flag: 'w'});
    }
}


const accounts = require('./accounts.json')
accounts.forEach((account) => {
    start(account).catch((err) => {
        console.log("start err :", account, err)
        save_error(account)
    })
})