const {nft_listing} = require("./request_factory");
const querystring = require("querystring");

async function get_nft_listing() {
    return nft_listing({
        "collectionAddress": "0x39c0c04a4474f7cd2c7e66a2cfe41c6bbdb54b4d",
        "maker": "0xdf37b75345536f73976311ff86e97b51d299d21f",
    })
}


async function main() {
    let res = await get_nft_listing()
    console.log(res.data)
}

main()