const hre = require("hardhat");
const {ethers, network} = require("hardhat");
const {domainConfig} = require("../constants");
const {readJsonSync} = require("../utils/misc");

async function main() {

    const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        await deployer.getAddress()
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const BaseRegistrarImplementation_SourceName = 'contracts/registrar/BaseRegistrarImplementation.sol'
    const RegistrarControllerV1_SourceName = 'contracts/registrar/RegistrarControllerV1.sol'

    deployResult = readJsonSync(`deployments/${network.name}_result.json`)

    console.log(deployResult)

    const RegistrarControllerResultArgs = [deployResult[BaseRegistrarImplementation_SourceName].address, domainConfig.basePrice];
    console.log(RegistrarControllerResultArgs)


    let RegistrarControllerResultFactory = await ethers.getContractFactory(RegistrarControllerV1_SourceName + ":RegistrarControllerV1");
    let RegistrarControllerResult = await RegistrarControllerResultFactory.deploy(...RegistrarControllerResultArgs);

    await RegistrarControllerResult.deployed();

    deployResult[RegistrarControllerV1_SourceName] = {
        contentHash: "",
        address: RegistrarControllerResult.address,
        args: RegistrarControllerResultArgs
    }
    let contorllerAddress = RegistrarControllerResult.address

    // let contorllerAddress = "0x61B22Bd5Ddf2dfA72AF52eAD617F6F3C78B35775"

    await hre.run("verify:verify", {
        address: contorllerAddress,
        contract: RegistrarControllerV1_SourceName + ":RegistrarControllerV1",
        constructorArguments: RegistrarControllerResultArgs,
    })

    const registrarAddress = deployResult[BaseRegistrarImplementation_SourceName].address;

    console.log(registrarAddress)

    const baseRegistrarImplementationContract = await ethers.getContractAt('BaseRegistrarImplementation', registrarAddress, deployer);

    const addControllerTx1 = await baseRegistrarImplementationContract.addController(contorllerAddress)
    console.log(
        ` Domain: ${domainConfig.baseNodeDomain} - Adding  controller as controller on registrar (tx: ${addControllerTx1.hash})...`,
    )
    await addControllerTx1.wait()

    // test
    const ControllerAdded = await baseRegistrarImplementationContract.controllers(contorllerAddress)
    console.log('ControllerAdded=', ControllerAdded)

    console.log(deployResult)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });