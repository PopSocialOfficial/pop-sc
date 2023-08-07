const {ethers, network} = require("hardhat");
const fs = require('fs');
const {readJsonSync, DeployUtil} = require('../utils/misc')
const {domainConfig} = require('../constants/index');

const dotEnv = require("dotenv");
dotEnv.config()

let cacheJson = {}
let deployResult = {}
let deployUtilInstance = {};

const BaseRegistrarImplementation_SourceName = 'contracts/registrar/BaseRegistrarImplementation.sol'
// const RegistrarController_SourceName = 'contracts/registrar/RegistrarController.sol'
const RegistrarControllerV1_SourceName = 'contracts/registrar/RegistrarControllerV1.sol'

let RegistrarControllerResult = {}

const initialize = (network) => {
    deployUtilInstance = new DeployUtil(cacheJson, deployResult, network, process.env.FORCE === 'true')
    cacheJson = readJsonSync('cache/solidity-files-cache.json')
    deployResult = readJsonSync(`deployments/${network.name}_result.json`)
    RegistrarControllerResult = deployResult[RegistrarControllerV1_SourceName] || {}
}

async function deploy_register() {
    console.log('deployer network=', network.name);
    initialize(network);
    const {deploy} = deployments;
    const {deployer, owner} = await getNamedAccounts();
    // console.log(`deployer=${deployer}, owner=${owner}`)
    console.log('\n REGISTER STEP [1] -> [Deployment registration controller entry contract] ---> RegisterControllerAddress = deploy RegistrarController(baseRegisterAddress,StableLogicControlAddress, reverseRegistrarAddress, minCommitmentAge, maxCommitmentAge) && baseRegisterAddress.addController(controllerAddress,true), reverseRegisterAddress.setController(controllerAddress)')
    if (!deployUtilInstance.check(RegistrarController_SourceName).address) {
        const RegistrarControllerResultArgs = [deployResult[BaseRegistrarImplementation_SourceName].address, domainConfig.basePrice, 3, 86400];
        RegistrarControllerResult = await deploy('RegistrarController', {
            from: deployer,
            args: RegistrarControllerResultArgs,
            log: true,
        });
        deployResult[RegistrarController_SourceName] = {
            contentHash: deployUtilInstance.check(RegistrarController_SourceName).contentHash,
            address: RegistrarControllerResult.address,
            args: RegistrarControllerResultArgs
        }
    }

    const registrarAddress = deployResult[BaseRegistrarImplementation_SourceName].address;
    const baseRegistrarImplementationContract =
        await ethers.getContractAt('BaseRegistrarImplementation', registrarAddress);
    const addControllerTx1 = await baseRegistrarImplementationContract.addController(RegistrarControllerResult.address, {
        from: deployer,
        // gasPrice: 13631902525
    })
    console.log(
        ` Domain: ${domainConfig.baseNodeDomain} - Adding  controller as controller on registrar (tx: ${addControllerTx1.hash})...`,
    )
    await addControllerTx1.wait()

    // test
    const ControllerAdded = await baseRegistrarImplementationContract.controllers(RegistrarControllerResult.address)
    console.log('ControllerAdded=', ControllerAdded)

    // deployResult
    // console.log('deployResult = ', JSON.stringify(deployResult, null, 2))
    fs.writeFileSync(`deployments/${network.name}_result.json`, JSON.stringify(deployResult, null, 2));
}


async function deploy_register_v1() {
    console.log('deployer network=', network.name);
    initialize(network);
    const {deploy} = deployments;
    const {deployer, owner} = await getNamedAccounts();
    // console.log(`deployer=${deployer}, owner=${owner}`)
    console.log('\n REGISTER STEP [1] -> [Deployment registration controller entry contract] ---> RegisterControllerAddress = deploy RegistrarController(baseRegisterAddress,StableLogicControlAddress, reverseRegistrarAddress, minCommitmentAge, maxCommitmentAge) && baseRegisterAddress.addController(controllerAddress,true), reverseRegisterAddress.setController(controllerAddress)')
    if (!deployUtilInstance.check(RegistrarControllerV1_SourceName).address) {
        const RegistrarControllerResultArgs = [deployResult[BaseRegistrarImplementation_SourceName].address, domainConfig.basePrice];
        RegistrarControllerResult = await deploy('RegistrarControllerV1', {
            from: deployer,
            args: RegistrarControllerResultArgs,
            log: true,
        });
        deployResult[RegistrarControllerV1_SourceName] = {
            contentHash: deployUtilInstance.check(RegistrarControllerV1_SourceName).contentHash,
            address: RegistrarControllerResult.address,
            args: RegistrarControllerResultArgs
        }
    }

    const registrarAddress = deployResult[BaseRegistrarImplementation_SourceName].address;
    const baseRegistrarImplementationContract =
        await ethers.getContractAt('BaseRegistrarImplementation', registrarAddress);
    const addControllerTx1 = await baseRegistrarImplementationContract.addController(RegistrarControllerResult.address, {
        from: deployer,
        // gasPrice: 13631902525
    })
    console.log(
        ` Domain: ${domainConfig.baseNodeDomain} - Adding  controller as controller on registrar (tx: ${addControllerTx1.hash})...`,
    )
    await addControllerTx1.wait()

    // test
    const ControllerAdded = await baseRegistrarImplementationContract.controllers(RegistrarControllerResult.address)
    console.log('ControllerAdded=', ControllerAdded)

    // deployResult
    // console.log('deployResult = ', JSON.stringify(deployResult, null, 2))
    fs.writeFileSync(`deployments/${network.name}_result.json`, JSON.stringify(deployResult, null, 2));
}

module.exports = async ({getNamedAccounts, deployments, network}) => {
    try {
        await deploy_register_v1()
    } catch (e) {
        console.log('deploy fail, error=', e)
    }
    return true;
};

module.exports.tags = ['register'];
module.exports.id = "register";
module.exports.dependencies = ['core', 'root', 'base'];
//