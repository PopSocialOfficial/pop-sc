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
} = require('../test-utils/constants')

const DAY = 24 * 60 * 60
const REGISTRATION_TIME = MAX_EXPIRY
const BUFFERED_REGISTRATION_COST = REGISTRATION_TIME + BigInt(3 * DAY)
const GRACE_PERIOD = 90 * DAY
const NULL_ADDRESS = ZERO_ADDRESS

const ONE_WAI = 1
contract('RegistrarController', function () {
  let ens
  let resolver
  let resolver2 // resolver signed by accounts[1]
  let baseRegistrar
  let controller
  let controller2 // controller signed by accounts[1]
  let controller3 // controller signed by accounts[2] relayer
  let reverseRegistrar
  let nameWrapper
  let callData

  let ownerAccount // Account that owns the registrar
  let registrantAccount // Account that owns test names
  let relayerAccount // Account that owns test names
  let accounts = []

  async function registerName(name, owner = registrantAccount, data = []) {
    const tx = await controller3.registerWithRelayer(name, owner, data)

    return tx
  }

  before(async () => {
    signers = await ethers.getSigners()
    ownerAccount = await signers[0].getAddress()
    registrantAccount = await signers[1].getAddress()
    relayerAccount = await signers[2].getAddress()
    accounts = [ownerAccount, registrantAccount, relayerAccount]

    ens = await deploy('PNSRegistry')

    baseRegistrar = await deploy(
      'BaseRegistrarImplementation',
      ens.address,
      namehash('pop'),
    )

    reverseRegistrar = await deploy('ReverseRegistrar', ens.address)

    await ens.setSubnodeOwner(EMPTY_BYTES, sha3('reverse'), accounts[0])
    await ens.setSubnodeOwner(
      namehash('reverse'),
      sha3('addr'),
      reverseRegistrar.address,
    )

    nameWrapper = await deploy(
      'NameWrapper',
      ens.address,
      baseRegistrar.address,
      ownerAccount,
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
    controller2 = controller.connect(signers[1])
    controller3 = controller.connect(signers[2])
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

    callData = [
      resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
        namehash('newconfigname.pop'),
        registrantAccount,
      ]),
      resolver.interface.encodeFunctionData('setText', [
        namehash('newconfigname.pop'),
        'url',
        'ethereum.com',
      ]),
    ]

    resolver2 = await resolver.connect(signers[1])
  })

  beforeEach(async () => {
    result = await ethers.provider.send('evm_snapshot')
  })
  afterEach(async () => {
    await ethers.provider.send('evm_revert', [result])
  })

  shouldSupportInterfaces(() => controller, ['AccessControl', 'ERC165'])

  const checkLabels = {
    testing: true,
    longname12345678: true,
    sixsix: true,
    five5: true,
    four: true,
    iii: true,
    ii: false,
    i: false,
    '': false,

    // { ni } { hao } { ma } (chinese; simplified)
    你好吗: true,

    // { ta } { ko } (japanese; hiragana)
    たこ: false,

    // { poop } { poop } { poop } (emoji)
    '\ud83d\udca9\ud83d\udca9\ud83d\udca9': true,

    // { poop } { poop } (emoji)
    '\ud83d\udca9\ud83d\udca9': false,
  }

  it('should report label validity', async () => {
    for (const label in checkLabels) {
      expect(await controller.valid(label)).to.equal(checkLabels[label], label)
    }
  })

  it('should report unused names as available', async () => {
    expect(await controller.available(sha3('available'))).to.equal(true)
  })

  it('should set the default resolver', async () => {
    await controller.setDefaultResolver(resolver.address)
    expect(await controller.defaultResolver()).to.equal(resolver.address)
  })

  it('only admin can set default resolver', async () => {
    await expect(controller2.setDefaultResolver(resolver.address)).to.be
      .reverted
  })

  it('revert if defaultResolver is not set', async () => {
    // set relayer
    const RELAYER_ROLE = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes('RELAYER_ROLE'),
    )
    await controller.grantRole(RELAYER_ROLE, relayerAccount)

    const label = 'newconfigname'
    await expect(
      controller3.registerWithRelayer(label, registrantAccount, callData),
    ).to.be.revertedWith('DefaultResolverNotConfigured')
  })

  it('revert if defaultResolver is not set', async () => {
    // set relayer
    const RELAYER_ROLE = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes('RELAYER_ROLE'),
    )
    await controller.grantRole(RELAYER_ROLE, relayerAccount)

    const label = 'newconfigname'
    await expect(
      controller3.registerWithRelayer(label, registrantAccount, callData),
    ).to.be.revertedWith('DefaultResolverNotConfigured')
  })

  describe('register', () => {
    beforeEach(async () => {
      await controller.setDefaultResolver(resolver.address)
      const RELAYER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes('RELAYER_ROLE'),
      )
      await controller.grantRole(RELAYER_ROLE, relayerAccount)
    })
    it('register with relayer', async () => {
      // setDefaultResolver
      await controller.setDefaultResolver(resolver.address)

      const label = 'newconfigname'
      var balanceBefore = await web3.eth.getBalance(controller.address)
      var tx = await controller3.registerWithRelayer(
        label,
        registrantAccount,
        callData,
      )

      const block = await provider.getBlock(tx.blockNumber)

      await expect(tx)
        .to.emit(controller, 'NameRegistered')
        .withArgs(
          label,
          sha3(label),
          registrantAccount,
          0,
          MAX_EXPIRY + BigInt(block.timestamp),
        )

      expect(
        (await web3.eth.getBalance(controller.address)) - balanceBefore,
      ).to.equal(0)

      var nodehash = namehash(`${label}.pop`)
      expect(await ens.resolver(nodehash)).to.equal(resolver.address)
      expect(await ens.owner(nodehash)).to.equal(nameWrapper.address)
      expect(await baseRegistrar.ownerOf(sha3(label))).to.equal(
        nameWrapper.address,
      )
      expect(await resolver['addr(bytes32)'](nodehash)).to.equal(
        registrantAccount,
      )
      expect(await resolver['text'](nodehash, 'url')).to.equal('ethereum.com')
      expect(await nameWrapper.ownerOf(nodehash)).to.equal(registrantAccount)
    })
    it('should report registered names as unavailable', async () => {
      const name = 'newname'
      await registerName(name)
      expect(await controller.available(name)).to.equal(false)
    })

    it('should not permit new registrations with records updating a different name', async () => {
      await expect(
        registerName('awesome', registrantAccount, [
          resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
            namehash('othername.pop'),
            registrantAccount,
          ]),
        ]),
      ).to.be.revertedWith(
        'multicall: All records must have a matching namehash',
      )
    })

    it('should not permit new registrations with any record updating a different name', async () => {
      await expect(
        registerName('awesome', registrantAccount, [
          resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
            namehash('awesome.pop'),
            registrantAccount,
          ]),
          resolver.interface.encodeFunctionData(
            'setText(bytes32,string,string)',
            [namehash('other.pop'), 'url', 'ethereum.com'],
          ),
        ]),
      ).to.be.revertedWith(
        'multicall: All records must have a matching namehash',
      )
    })

    it('should permit a registration with resolver but no records', async () => {
      const balanceBefore = await web3.eth.getBalance(controller.address)
      let tx2 = await registerName('newconfigname2', registrantAccount, [])

      const block = await provider.getBlock(tx2.blockNumber)

      await expect(tx2)
        .to.emit(controller, 'NameRegistered')
        .withArgs(
          'newconfigname2',
          sha3('newconfigname2'),
          registrantAccount,
          0,
          BigInt(block.timestamp) + REGISTRATION_TIME,
        )

      const nodehash = namehash('newconfigname2.pop')
      expect(await ens.resolver(nodehash)).to.equal(resolver.address)
      expect(await resolver['addr(bytes32)'](nodehash)).to.equal(NULL_ADDRESS)
    })

    it('should reject duplicate registrations', async () => {
      const label = 'newname'
      await registerName(label)

      await expect(
        registerName(label, registrantAccount, []),
      ).to.be.revertedWith(`NameNotAvailable("${label}")`)
    })

    it('should allow anyone to withdraw funds and transfer to the registrar owner', async () => {
      await controller.withdraw({ from: ownerAccount })
      expect(parseInt(await web3.eth.getBalance(controller.address))).to.equal(
        0,
      )
    })

    it('should not set the reverse record of the account when set to false', async () => {
      await registerName('noreverse', registrantAccount, [])

      expect(await resolver.name(getReverseNode(ownerAccount))).to.equal('')
    })

    it('should auto wrap the name and set the ERC721 owner to the wrapper', async () => {
      const label = 'wrapper'
      const name = label + '.pop'
      await registerName(label, registrantAccount, [])

      expect(await nameWrapper.ownerOf(namehash(name))).to.equal(
        registrantAccount,
      )

      expect(await ens.owner(namehash(name))).to.equal(nameWrapper.address)
      expect(await baseRegistrar.ownerOf(sha3(label))).to.equal(
        nameWrapper.address,
      )
    })
  })

  describe('#setBasePrice', () => {
    it('should set the base price', async () => {
      await controller.setBasePrice(ZERO_ADDRESS, 100)
      expect(await controller.basePrice(ZERO_ADDRESS)).to.equal(100)
    })

    it('only admin can set base price', async () => {
      await expect(controller2.setBasePrice(ZERO_ADDRESS, 100)).to.be.reverted
    })
  })
})
