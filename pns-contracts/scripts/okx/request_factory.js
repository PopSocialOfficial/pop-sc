const {serviceAxios} = require("./service_axios");
const querystring = require("querystring");
const axios = require('axios');

const base_uri = "https://www.okx.com/api/v5/dex/aggregator/"
const nft_base_uri = "https://www.okx.com/api/v1/nft/markets/"

const approve = (param) => {
    return serviceAxios({
        baseURL: base_uri,
        url: "approve-transaction?" + querystring.stringify(param),
        method: "get",
    });
};


const quote = (param) => {
    return serviceAxios({
        baseURL: base_uri,
        url: "quote?" + querystring.stringify(param),
        method: "get",
    });
};

const swap = (param) => {
    return serviceAxios({
        baseURL: base_uri,
        url: "swap?" + querystring.stringify(param),
        method: "get",
    });
};

const allowance = (param) => {
    return serviceAxios({
        baseURL: base_uri,
        url: "get-allowance?" + querystring.stringify(param),
        method: "get",
    });
};


const nft_listing = (param) => {
    return serviceAxios({
        baseURL: "https://www.okx.com/",
        url: "priapi/v1/nft/openapi/order/polygon/listings?" + querystring.stringify(param),
        method: "get",
    });
};

module.exports = {
    swap,
    quote,
    approve,
    allowance,
    nft_listing
}