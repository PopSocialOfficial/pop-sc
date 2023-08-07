const { ethers } = require("hardhat");
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('js-sha3');
const fs = require('fs');
const { domainConfig } = require('../constants/index');
const {readJsonSync, DeployUtil} = require('../utils/misc')

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

////////////////////////////////////////////////////////////////////////////

let cacheJson = {}
let deployResult = {}
let deployUtilInstance = {};

const PNSRegistry_SourceName = 'contracts/registry/PNSRegistry.sol'
const ReverseRegistrar_SourceName = 'contracts/registry/ReverseRegistrar.sol'
const PublicResolver_SourceName = 'contracts/resolvers/PublicResolver.sol'
const BaseRegistrarImplementation_SourceName = 'contracts/registrar/BaseRegistrarImplementation.sol'
const Root_SourceName = 'contracts/root/Root.sol'
let pnsRegistryResult = {}
let reverseRegistrarResult = {}
let publicResolverResult = {}
let rootResult = {}

const initialize = (network) => {
    deployUtilInstance = new DeployUtil(cacheJson, deployResult, network,process.env.FORCE === 'true' )

    cacheJson = readJsonSync('cache/solidity-files-cache.json')
    deployResult = readJsonSync(`deployments/${network.name}_result.json`)
    pnsRegistryResult = deployResult[PNSRegistry_SourceName] || {}
    reverseRegistrarResult = deployResult[ReverseRegistrar_SourceName] || {}
    publicResolverResult = deployResult[PublicResolver_SourceName] || {}
    rootResult = deployResult[Root_SourceName] || {}
}

module.exports = async ({ getNamedAccounts, deployments, network }) => {
    try {
        console.log('deployer network=', network.name);
        initialize(network);

        const { deploy } = deployments;
        const { deployer, owner } = await getNamedAccounts();

        // console.log(`deployer=${deployer}, owner=${owner}`)
        const pnsRegistryContract = await ethers.getContractAt('PNSRegistry', deployResult[PNSRegistry_SourceName].address);

        console.log('\n ROOT STEP [1] -> [Deploy the root contract] ---> rootAddress = deploy Root(pnsAddress) & pnsAddress.setOwner(ZERO_HASH, rootAddress) && rootAddress.setSubOwner(reserve.add, reverseRegisterAddress) & rootAddress.setSubOwner(pop, baseRegisterAddress)')
        if (!deployUtilInstance.check(Root_SourceName).address) {
            const rootArgs = [pnsRegistryResult.address];
            rootResult = await deploy('Root', {
                from: deployer,
                args: rootArgs,
                log: true,
            });
            console.log('rootResult.address=', rootResult.address)

            deployResult[Root_SourceName] = {
                contentHash: deployUtilInstance.check(Root_SourceName).contentHash,
                address: rootResult.address,
                args: rootArgs
            }
            console.log(` Setting final owner of root node on registry`);

            const setOwnerTx = await pnsRegistryContract.setOwner(ZERO_HASH, rootResult.address, { from: deployer });
            console.log(` [Set the root domain name owner to the root contract] Setting final owner of root node on registry (tx:${setOwnerTx.hash})...`);

            await setOwnerTx.wait();

            const rootContract = await ethers.getContractAt('Root', deployResult[Root_SourceName].address);
            let temp = await rootContract.controllers(owner)
            console.log('controller=', temp)
            if (!await rootContract.controllers(owner)) {
                setControllerTx = await rootContract.connect(await ethers.getSigner(owner)).setController(owner, true);
                console.log(` Setting final owner as controller on root contract (tx: ${setControllerTx.hash})...`);
                await setControllerTx.wait();
            }

            console.log('\n ROOT STEP [2] -> [Set the owner of the .pop first-level domain name to the forward registrar] ---> root.setSubnodeOwner(baseNodeDomain) & registrar.setResolver(publicResolver)')
            const registrarAddress = deployResult[BaseRegistrarImplementation_SourceName].address;
            const baseRegistrarImplementationContract =
                await ethers.getContractAt('BaseRegistrarImplementation', registrarAddress);
            const setSubnodeOwnerTx = await rootContract
                .connect(await ethers.getSigner(owner))
                .setSubnodeOwner('0x' + keccak256(domainConfig.baseNodeDomain), baseRegistrarImplementationContract.address)
            console.log(
                ` Domain: ${domainConfig.baseNodeDomain} - Setting owner of eth node to registrar on root (tx: ${setSubnodeOwnerTx.hash})...`,
            )
            await setSubnodeOwnerTx.wait()

            const tx2 = await baseRegistrarImplementationContract.setResolver(publicResolverResult.address, { from: deployer })
            console.log(` Domain: ${domainConfig.baseNodeDomain} - Set publicResolver to registrar (tx: ${tx2.hash})...`)
            await tx2.wait()

            console.log(` Domain: ${domainConfig.baseNodeDomain} - baseRegistrarImplementationContract.setResolver done`)

            console.log('\n ROOT STEP [3] ---> setup reverse resolver')

            const setSubnodeOwnerTx2 = await rootContract.connect(await ethers.getSigner(owner)).setSubnodeOwner('0x' + keccak256('reverse'), owner)
            console.log(` [Set the owner of the .reverse first-level domain name to the root contract] Setting owner of .reverse to owner on root (tx: ${setSubnodeOwnerTx2.hash})...`)
            await setSubnodeOwnerTx2.wait()
        }
        //@todo
        const setSubnodeOwnerTx3 = await pnsRegistryContract.connect(await ethers.getSigner(owner)).setSubnodeOwner(namehash.hash('reverse'), '0x' + keccak256('addr'), reverseRegistrarResult.address)
        console.log(
            ` [Set the owner of the .addr.reverse secondary domain name to the reverse registrar contract] Setting owner of .addr.reverse to ReverseRegistrar on pnsRegistryContract (tx: ${setSubnodeOwnerTx3.hash})...`,
        )
        await setSubnodeOwnerTx3.wait()
        // deployResult
        console.log('deployResult = ', JSON.stringify(deployResult, null, 2))
        fs.writeFileSync(`deployments/${network.name}_result.json`, JSON.stringify(deployResult, null, 2));
    } catch (e) {
        console.log('deploy fail, error=', e)
    }
    return true;

};

module.exports.tags = ['root'];
module.exports.id = "root";
module.exports.dependencies = ['core', 'base'];
