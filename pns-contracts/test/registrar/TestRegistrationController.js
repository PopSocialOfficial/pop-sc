const {
  evm,
  reverse: { getReverseNode },
  contracts: { deploy },
  ens: { FUSES },
} = require('../test-utils')
const {
  shouldSupportInterfaces,
} = require('../wrapper/SupportsInterface.behaviour')
const { CANNOT_UNWRAP, PARENT_CANNOT_CONTROL, IS_DOT_ETH } = FUSES

const { expect } = require('chai')

const { ethers } = require('hardhat')
const provider = ethers.provider
const { namehash, MAX_EXPIRY } = require('../test-utils/ens')
const sha3 = require('web3-utils').sha3
const {
  EMPTY_BYTES32: EMPTY_BYTES,
  EMPTY_ADDRESS: ZERO_ADDRESS,
  EMPTY_BYTES32,
} = require('../test-utils/constants')

const DAY = 24 * 60 * 60
const REGISTRATION_TIME = 28 * DAY
const BUFFERED_REGISTRATION_COST = REGISTRATION_TIME + 3 * DAY
const GRACE_PERIOD = 90 * DAY
const NULL_ADDRESS = ZERO_ADDRESS
const ONE_WAI = 1

const POP_PRICE = ethers.utils.parseEther('20')
describe('RegistrationHelper', () => {
  let ens
  let resolver
  let baseRegistrar
  let controller
  let controller3
  let priceOracle
  let reverseRegistrar
  let nameWrapper
  let callData
  let registrationHelper
  let registrationHelper2
  let mockNFT
  let mockToken

  let owner
  let relayer
  let user
  let users
  /* Utility funcs */

  async function registerName(name, owner = user.address, data = []) {
    const tx = await registrationHelper2.register(name, owner, data)
    return tx
  }

  async function registerWithPermit(name, owner = user, data = []) {
    const { timestamp } = await ethers.provider.getBlock('latest')
    const deadline = timestamp + 4200

    const nonces = await mockToken.nonces(owner.address)

    const domain = {
      name: await mockToken.name(),
      version: '1',
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: mockToken.address,
    }

    const types = {
      Permit: [
        {
          name: 'owner',
          type: 'address',
        },
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'value',
          type: 'uint256',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'deadline',
          type: 'uint256',
        },
      ],
    }

    const values = {
      owner: owner.address,
      spender: registrationHelper.address,
      value: POP_PRICE,
      nonce: nonces,
      deadline: deadline,
    }

    const signature = await owner._signTypedData(domain, types, values)

    const sig = ethers.utils.splitSignature(signature)

    const recovered = ethers.utils.verifyTypedData(domain, types, values, sig)
    const tx = await registrationHelper2.registerWithPermit(
      name,
      owner.address,
      data,
      deadline,
      sig.v,
      sig.r,
      sig.s,
    )
    return tx
  }
  before(async () => {
    ;[owner, user, relayer, ...users] = await ethers.getSigners()

    ens = await deploy('PNSRegistry')

    baseRegistrar = await deploy(
      'BaseRegistrarImplementation',
      ens.address,
      namehash('pop'),
    )

    reverseRegistrar = await deploy('ReverseRegistrar', ens.address)

    await ens.setSubnodeOwner(EMPTY_BYTES, sha3('reverse'), owner.address)
    await ens.setSubnodeOwner(
      namehash('reverse'),
      sha3('addr'),
      reverseRegistrar.address,
    )

    nameWrapper = await deploy(
      'NameWrapper',
      ens.address,
      baseRegistrar.address,
      owner.address,
    )

    await ens.setSubnodeOwner(EMPTY_BYTES, sha3('pop'), baseRegistrar.address)

    controller = await deploy(
      'RegistrarController',
      baseRegistrar.address,
      reverseRegistrar.address,
      nameWrapper.address,
      ens.address,
      ONE_WAI,
    )

    controller3 = controller.connect(relayer)
    await nameWrapper.setController(controller.address, true)
    await baseRegistrar.addController(nameWrapper.address)
    await reverseRegistrar.setController(controller.address, true)

    resolver = await deploy(
      'PublicResolver',
      ens.address,
      nameWrapper.address,
      controller.address,
      reverseRegistrar.address,
    )

    mockToken = await deploy('MockERC20', 'MockToken', 'MCT', [user.address])

    registrationHelper = await deploy(
      'RegistrationHelper',
      controller.address,
      mockToken.address,
      POP_PRICE,
    )

    registrationHelper2 = registrationHelper.connect(relayer)

    mockNFT = await deploy('MockNFT')

    await controller.setDefaultResolver(resolver.address)

    const RELAYER_ROLE = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes('RELAYER_ROLE'),
    )
    await controller.grantRole(RELAYER_ROLE, relayer.address)
    await controller.grantRole(RELAYER_ROLE, registrationHelper.address)
  })

  beforeEach(async () => {
    result = await ethers.provider.send('evm_snapshot')
  })
  afterEach(async () => {
    await ethers.provider.send('evm_revert', [result])
  })

  describe('Register', () => {
    it('Should able to register', async () => {
      // register subname

      const label = 'newconfigname'

      const callData = [
        resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
          namehash('newconfigname.pop'),
          user.address,
        ]),
        resolver.interface.encodeFunctionData('setText', [
          namehash('newconfigname.pop'),
          'url',
          'ethereum.com',
        ]),
      ]

      const balanceBefore = await ethers.provider.getBalance(
        registrationHelper.address,
      )

      await registerName(label, user.address, callData)

      const nodehash = namehash(`${label}.pop`)
      expect(await ens.resolver(nodehash)).to.equal(resolver.address)
      expect(await ens.owner(nodehash)).to.equal(nameWrapper.address)
      expect(await baseRegistrar.ownerOf(sha3(label))).to.equal(
        nameWrapper.address,
      )
      expect(await resolver['addr(bytes32)'](nodehash)).to.equal(user.address)
      expect(await resolver['text'](nodehash, 'url')).to.equal('ethereum.com')
      expect(await nameWrapper.ownerOf(nodehash)).to.equal(user.address)

      const balanceAfter = await ethers.provider.getBalance(
        registrationHelper.address,
      )

      expect(balanceAfter.sub(balanceBefore)).equal(0)
    })

    it('Should able to register', async () => {
      // register subname

      const label = 'newconfigname'

      const callData = [
        resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
          namehash('newconfigname.pop'),
          user.address,
        ]),
        resolver.interface.encodeFunctionData('setText', [
          namehash('newconfigname.pop'),
          'url',
          'ethereum.com',
        ]),
      ]

      const balanceBefore = await mockToken.balanceOf(
        registrationHelper.address,
      )

      await registerWithPermit(label, user, callData)
      const nodehash = namehash(`${label}.pop`)
      expect(await ens.resolver(nodehash)).to.equal(resolver.address)
      expect(await ens.owner(nodehash)).to.equal(nameWrapper.address)
      expect(await baseRegistrar.ownerOf(sha3(label))).to.equal(
        nameWrapper.address,
      )
      expect(await resolver['addr(bytes32)'](nodehash)).to.equal(user.address)
      expect(await resolver['text'](nodehash, 'url')).to.equal('ethereum.com')
      expect(await nameWrapper.ownerOf(nodehash)).to.equal(user.address)

      const balanceAfter = await mockToken.balanceOf(registrationHelper.address)

      expect(balanceAfter.sub(balanceBefore)).equal(POP_PRICE)
    })
  })
})
