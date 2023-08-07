const hre = require("hardhat");
const result = require("../deployments/bscTestnet_result.json");

let verify = async () => {
    for (const contract in result) {
        console.log("\n verify " + contract + "---------------------");
        console.log(contract);
        let contract_name = contract.split('/')[contract.split('/').length - 1];
        console.log(contract + ":" + contract_name.split('.')[0]);
        console.log(result[contract]["address"]);
        console.log(result[contract]["args"]);
        let verify_param = {
            address: result[contract]["address"],
            contract: contract + ":" + contract_name.split('.')[0],
            constructorArguments: result[contract]["args"]
        };

        console.log(verify_param);
        await hre.run("verify:verify", verify_param);
        console.log("\n verify " + contract + "---------------------");
    }
}


verify()