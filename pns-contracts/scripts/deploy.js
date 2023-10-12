const { deploy } = require('../test/test-utils/contracts')
const { ethers } = require('hardhat')
const { namehash, MAX_EXPIRY } = require('../test/test-utils/ens')
const sha3 = require('web3-utils').sha3
const {
  EMPTY_BYTES32: EMPTY_BYTES,
  EMPTY_ADDRESS: ZERO_ADDRESS,
  EMPTY_BYTES32,
} = require('../test/test-utils/constants')

async function main() {
  const basePrice = 1 // One wei
  const [owner] = await ethers.getSigners()
  const ens = await deploy('PNSRegistry')

  console.log(`PNS registry deployed at ${ens.address}`)

  const baseRegistrar = await deploy(
    'BaseRegistrarImplementation',
    ens.address,
    namehash('pop'),
  )

  console.log(
    `BaseRegistrarImplementation deployed at ${baseRegistrar.address}`,
  )

  const metaDataService = await deploy(
    'PNSMetadataService',
    'https://meta.popsocial.io/metadata/',
  )

  console.log(`PNSMetadataService deployed at ${metaDataService.address}`)

  const reverseRegistrar = await deploy('ReverseRegistrar', ens.address)

  console.log(`ReverseRegistrar deployed at ${reverseRegistrar.address}`)

  await ens.setSubnodeOwner(EMPTY_BYTES, sha3('reverse'), owner.address)
  await ens.setSubnodeOwner(
    namehash('reverse'),
    sha3('addr'),
    reverseRegistrar.address,
  )

  const nameWrapper = await deploy(
    'NameWrapper',
    ens.address,
    baseRegistrar.address,
    metaDataService.address,
  )

  console.log(`NameWrapper deployed at ${nameWrapper.address}`)

  await ens.setSubnodeOwner(EMPTY_BYTES, sha3('pop'), baseRegistrar.address)

  const controller = await deploy(
    'RegistrarController',
    baseRegistrar.address,
    reverseRegistrar.address,
    nameWrapper.address,
    ens.address,
    basePrice,
  )

  console.log(`RegistrarController deployed at ${controller.address}`)

  await nameWrapper.setController(controller.address, true)
  await baseRegistrar.addController(nameWrapper.address)
  await reverseRegistrar.setController(controller.address, true)

  const resolver = await deploy(
    'PublicResolver',
    ens.address,
    nameWrapper.address,
    controller.address,
    reverseRegistrar.address,
  )

  console.log(`PublicResolver deployed at ${resolver.address}`)

  await reverseRegistrar.setDefaultResolver(resolver.address)

  const partnerNftMinter = await deploy(
    'PartnerNFTMinter',
    ens.address,
    baseRegistrar.address,
    nameWrapper.address,
    reverseRegistrar.address,
    resolver.address,
  )

  console.log(`PartnerNFTMinter deployed at ${partnerNftMinter.address}`)

  await reverseRegistrar.setController(partnerNftMinter.address, true)

  await nameWrapper.setMinter(partnerNftMinter.address)

  await controller.setDefaultResolver(resolver.address)
}

main()
