const { ethers } = require('hardhat')
const { use, expect } = require('chai')
const { solidity } = require('ethereum-waffle')
const { labelhash, namehash } = require('../test-utils/ens')
const { deploy } = require('../test-utils/contracts')
const { EMPTY_BYTES32 } = require('../test-utils/constants')

use(solidity)

const ROOT_NODE = EMPTY_BYTES32

describe('ReverseClaimer', () => {
  let PNSRegistry
  let BaseRegistrar
  let NameWrapper
  let MetaDataservice
  let signers
  let account
  let account2
  let result

  before(async () => {
    signers = await ethers.getSigners()
    account = await signers[0].getAddress()
    account2 = await signers[1].getAddress()
    hacker = await signers[2].getAddress()

    PNSRegistry = await deploy('PNSRegistry')
    BaseRegistrar = await deploy(
      'BaseRegistrarImplementation',
      PNSRegistry.address,
      namehash('pop'),
    )

    await BaseRegistrar.addController(account)
    await BaseRegistrar.addController(account2)

    const ReverseRegistrar = await deploy(
      'ReverseRegistrar',
      PNSRegistry.address,
    )

    await PNSRegistry.setSubnodeOwner(ROOT_NODE, labelhash('reverse'), account)
    await PNSRegistry.setSubnodeOwner(
      namehash('reverse'),
      labelhash('addr'),
      ReverseRegistrar.address,
    )

    MetaDataservice = await deploy(
      'StaticMetadataService',
      'https://ens.domains',
    )

    NameWrapper = await deploy(
      'NameWrapper',
      PNSRegistry.address,
      BaseRegistrar.address,
      MetaDataservice.address,
    )
  })

  beforeEach(async () => {
    result = await ethers.provider.send('evm_snapshot')
  })
  afterEach(async () => {
    await ethers.provider.send('evm_revert', [result])
  })

  it('Claims a reverse node to the msg.sender of the deployer', async () => {
    expect(
      await PNSRegistry.owner(
        namehash(`${NameWrapper.address.slice(2)}.addr.reverse`),
      ),
    ).to.equal(account)
  })
  it('Claims a reverse node to an address specified by the deployer', async () => {
    const MockReverseClaimerImplementer = await deploy(
      'MockReverseClaimerImplementer',
      PNSRegistry.address,
      account2,
    )
    expect(
      await PNSRegistry.owner(
        namehash(
          `${MockReverseClaimerImplementer.address.slice(2)}.addr.reverse`,
        ),
      ),
    ).to.equal(account2)
  })
})
