
const fs = require('fs');
const { ethers } = require("hardhat");
const {readJsonSync, DeployUtil} = require('../utils/misc')

let cacheJson = {}
let deployResult = {}
let deployUtilInstance = null;

const PNSRegistry_SourceName = 'contracts/registry/PNSRegistry.sol'
const DefaultReverseResolver_SourceName = 'contracts/resolvers/DefaultReverseResolver.sol'
const ReverseRegistrar_SourceName = 'contracts/registry/ReverseRegistrar.sol'
const PublicResolver_SourceName = 'contracts/resolvers/PublicResolver.sol'

let pnsRegistryResult = {}
let defaultReverseResolverResult = {}
let reverseRegistrarResult = {}
let publicResolverResult = {}


const initialize = (network) => {
    deployUtilInstance = new DeployUtil(cacheJson, deployResult, network,process.env.FORCE === 'true' )
    cacheJson = readJsonSync('cache/solidity-files-cache.json')
    deployResult = readJsonSync(`deployments/${network.name}_result.json`)
    pnsRegistryResult = deployResult[PNSRegistry_SourceName] || {}
    defaultReverseResolverResult = deployResult[DefaultReverseResolver_SourceName] || {}
    reverseRegistrarResult = deployResult[ReverseRegistrar_SourceName] || {}
    publicResolverResult = deployResult[PublicResolver_SourceName] || {}

}


module.exports = async ({ getNamedAccounts, deployments, network }) => {
    try {
        console.log('deployer network=', network.name);
        initialize(network);

        const {deploy} = deployments;
        const {deployer, owner} = await getNamedAccounts();

        console.log(`deployer=${deployer}, owner=${owner}`)
        console.log('\n CORE STEP [1] -> [Deploy the core registry contract] ---> pnsAddress = deploy PNSRegistry()')

        if (!deployUtilInstance.check(PNSRegistry_SourceName).address) {
            pnsRegistryResult = await deploy('PNSRegistry', {
                from: deployer,
                args: [],
                log: true,
            });
            console.log('pnsRegistryResult.address=', pnsRegistryResult.address)

            deployResult[PNSRegistry_SourceName] = {
                contentHash: deployUtilInstance.check(PNSRegistry_SourceName).contentHash,
                address: pnsRegistryResult.address,
                args: []
            }
        }

        console.log('\n CORE STEP [2] -> [Deploy the default reverse parser] ---> defaultReverseResolverAddress = deploy DefaultReverseResolver(defaultReverseResolverResult.address)')

        if (!deployUtilInstance.check(DefaultReverseResolver_SourceName).address) {
            const defaultReverseResolverArgs = [pnsRegistryResult.address]
            defaultReverseResolverResult = await deploy('DefaultReverseResolver', {
                from: deployer,
                args: defaultReverseResolverArgs,
                log: true,
            });
            console.log('defaultReverseResolverResult.address=', defaultReverseResolverResult.address)

            deployResult[DefaultReverseResolver_SourceName] = {
                contentHash: deployUtilInstance.check(DefaultReverseResolver_SourceName).contentHash,
                address: defaultReverseResolverResult.address,
                args: defaultReverseResolverArgs
            }
        }


        console.log('\n CORE STEP [3] -> [Deploy Reverse Registrar & Set Default Reverse Resolver] ---> everseRegisterAddress = deploy ReverseRegistrar(pnsRegistryResult.address, defaultReverseResolverResult.address)')
        if (!deployUtilInstance.check(ReverseRegistrar_SourceName).address) {
            const reverseRegistrarArgs = [pnsRegistryResult.address, defaultReverseResolverResult.address];
            reverseRegistrarResult = await deploy('ReverseRegistrar', {
                from: deployer,
                args: reverseRegistrarArgs,
                log: true,
            });
            console.log('reverseRegistrarResult.address=', reverseRegistrarResult.address)

            deployResult[ReverseRegistrar_SourceName] = {
                contentHash: deployUtilInstance.check(ReverseRegistrar_SourceName).contentHash,
                address: reverseRegistrarResult.address,
                args: reverseRegistrarArgs
            }
        }
        console.log('\n CORE STEP [4] -> [Deploy the default forward public resolver] ---> publicResolverAddress = deploy PublicResolver(publicResolverResult.address)')

        if (!deployUtilInstance.check(PublicResolver_SourceName).address) {
            const publicResolverArgs = [pnsRegistryResult.address];
            publicResolverResult = await deploy('PublicResolver', {
                from: deployer,
                args: [pnsRegistryResult.address],
                log: true,
            });
            console.log('publicResolverResult.address=', publicResolverResult.address)

            deployResult[PublicResolver_SourceName] = {
                contentHash: deployUtilInstance.check(PublicResolver_SourceName).contentHash,
                address: publicResolverResult.address,
                args: publicResolverArgs
            }
        }

        console.log('deployResult = ', JSON.stringify(deployResult, null, 2))
        fs.writeFileSync(`deployments/${network.name}_result.json`, JSON.stringify(deployResult, null, 2));
    } catch (e) {
        console.log('deploy fail, error=', e)
    }
    return true;
};

module.exports.tags = ['core'];
module.exports.id = "core";