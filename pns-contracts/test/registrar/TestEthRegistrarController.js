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
const REGISTRATION_TIME = 28 * DAY
const BUFFERED_REGISTRATION_COST = REGISTRATION_TIME + 3 * DAY
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
  let priceOracle
  let reverseRegistrar
  let nameWrapper
  let mockERC20
  let callData

  let ownerAccount // Account that owns the registrar
  let registrantAccount // Account that owns test names
  let relayerAccount // Account that owns test names
  let accounts = []

  async function registerName(
    name,
    txOptions = { value: BUFFERED_REGISTRATION_COST },
  ) {
    const tx = await controller.register(
      name,
      registrantAccount,
      REGISTRATION_TIME,
      NULL_ADDRESS,
      [],
      false,
      0,
      txOptions,
    )

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

    const mockToken = await deploy(
      'MockERC20',
      'Ethereum Name Service Token',
      'ENS',
      [registrantAccount],
    )

    mockERC20 = mockToken.connect(signers[1])
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

  it('should permit new registrations', async () => {
    const name = 'newname'
    const balanceBefore = await web3.eth.getBalance(controller.address)
    const tx = await registerName(name)
    const block = await provider.getBlock(tx.blockNumber)
    await expect(tx)
      .to.emit(controller, 'NameRegistered')
      .withArgs(
        name,
        sha3(name),
        registrantAccount,
        REGISTRATION_TIME,
        block.timestamp + REGISTRATION_TIME,
      )

    expect(
      (await web3.eth.getBalance(controller.address)) - balanceBefore,
    ).to.equal(REGISTRATION_TIME)
  })

  it('should revert when not enough ether is transferred', async () => {
    await expect(registerName('newname', { value: 0 })).to.be.revertedWith(
      'InsufficientValue()',
    )
  })

  it('should report registered names as unavailable', async () => {
    const name = 'newname'
    await registerName(name)
    expect(await controller.available(name)).to.equal(false)
  })

  it('should permit new registrations with resolver and records', async () => {
    var balanceBefore = await web3.eth.getBalance(controller.address)
    var tx = await controller2.register(
      'newconfigname',
      registrantAccount,
      REGISTRATION_TIME,
      resolver.address,
      callData,
      false,
      0,
      { value: BUFFERED_REGISTRATION_COST },
    )

    const block = await provider.getBlock(tx.blockNumber)

    await expect(tx)
      .to.emit(controller, 'NameRegistered')
      .withArgs(
        'newconfigname',
        sha3('newconfigname'),
        registrantAccount,
        REGISTRATION_TIME,
        block.timestamp + REGISTRATION_TIME,
      )

    expect(
      (await web3.eth.getBalance(controller.address)) - balanceBefore,
    ).to.equal(REGISTRATION_TIME)

    var nodehash = namehash('newconfigname.pop')
    expect(await ens.resolver(nodehash)).to.equal(resolver.address)
    expect(await ens.owner(nodehash)).to.equal(nameWrapper.address)
    expect(await baseRegistrar.ownerOf(sha3('newconfigname'))).to.equal(
      nameWrapper.address,
    )
    expect(await resolver['addr(bytes32)'](nodehash)).to.equal(
      registrantAccount,
    )
    expect(await resolver['text'](nodehash, 'url')).to.equal('ethereum.com')
    expect(await nameWrapper.ownerOf(nodehash)).to.equal(registrantAccount)
  })

  it('should not permit new registrations with 0 resolver', async () => {
    await expect(
      controller.register(
        'newconfigname',
        registrantAccount,
        REGISTRATION_TIME,
        NULL_ADDRESS,
        callData,
        false,
        0,
        { value: BUFFERED_REGISTRATION_COST },
      ),
    ).to.be.revertedWith('ResolverRequiredWhenDataSupplied()')
  })

  it('should not permit new registrations with EoA resolver', async () => {
    await expect(
      controller.register(
        'newconfigname',
        registrantAccount,
        REGISTRATION_TIME,
        registrantAccount,
        callData,
        false,
        0,
        { value: BUFFERED_REGISTRATION_COST },
      ),
    ).to.be.reverted
  })

  it('should not permit new registrations with an incompatible contract', async () => {
    await expect(
      controller.register(
        'newconfigname',
        registrantAccount,
        REGISTRATION_TIME,
        controller.address,
        callData,
        false,
        0,
        { value: BUFFERED_REGISTRATION_COST },
      ),
    ).to.be.revertedWith(
      "Transaction reverted: function selector was not recognized and there's no fallback function",
    )
  })

  it('should not permit new registrations with records updating a different name', async () => {
    await expect(
      controller2.register(
        'awesome',
        registrantAccount,
        REGISTRATION_TIME,
        resolver.address,
        [
          resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
            namehash('othername.pop'),
            registrantAccount,
          ]),
        ],
        false,
        0,
        { value: BUFFERED_REGISTRATION_COST },
      ),
    ).to.be.revertedWith('multicall: All records must have a matching namehash')
  })

  it('should not permit new registrations with any record updating a different name', async () => {
    await expect(
      controller2.register(
        'awesome',
        registrantAccount,
        REGISTRATION_TIME,
        resolver.address,
        [
          resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
            namehash('awesome.pop'),
            registrantAccount,
          ]),
          resolver.interface.encodeFunctionData(
            'setText(bytes32,string,string)',
            [namehash('other.pop'), 'url', 'ethereum.com'],
          ),
        ],
        false,
        0,
        { value: BUFFERED_REGISTRATION_COST },
      ),
    ).to.be.revertedWith('multicall: All records must have a matching namehash')
  })

  it('should permit a registration with resolver but no records', async () => {
    const balanceBefore = await web3.eth.getBalance(controller.address)
    let tx2 = await controller.register(
      'newconfigname2',
      registrantAccount,
      REGISTRATION_TIME,
      resolver.address,
      [],
      false,
      0,
      { value: BUFFERED_REGISTRATION_COST },
    )

    const block = await provider.getBlock(tx2.blockNumber)

    await expect(tx2)
      .to.emit(controller, 'NameRegistered')
      .withArgs(
        'newconfigname2',
        sha3('newconfigname2'),
        registrantAccount,
        REGISTRATION_TIME,
        block.timestamp + REGISTRATION_TIME,
      )

    const nodehash = namehash('newconfigname2.pop')
    expect(await ens.resolver(nodehash)).to.equal(resolver.address)
    expect(await resolver['addr(bytes32)'](nodehash)).to.equal(NULL_ADDRESS)
    expect(
      (await web3.eth.getBalance(controller.address)) - balanceBefore,
    ).to.equal(REGISTRATION_TIME)
  })

  it('should reject duplicate registrations', async () => {
    const label = 'newname'
    await registerName(label)

    await expect(
      controller.register(
        label,
        registrantAccount,
        REGISTRATION_TIME,
        NULL_ADDRESS,
        [],
        false,
        0,
        {
          value: BUFFERED_REGISTRATION_COST,
        },
      ),
    ).to.be.revertedWith(`NameNotAvailable("${label}")`)
  })

  it('should allow anyone to renew a name without changing fuse expiry', async () => {
    await registerName('newname')
    var nodehash = namehash('newname.pop')
    var fuseExpiry = (await nameWrapper.getData(nodehash))[2]
    var expires = await baseRegistrar.nameExpires(sha3('newname'))
    var balanceBefore = await web3.eth.getBalance(controller.address)
    const duration = 86400
    const price = await controller.rentPrice(
      sha3('newname'),
      duration,
      ZERO_ADDRESS,
    )
    await controller.renew('newname', duration, { value: price })
    var newExpires = await baseRegistrar.nameExpires(sha3('newname'))
    var newFuseExpiry = (await nameWrapper.getData(nodehash))[2]
    expect(newExpires.toNumber() - expires.toNumber()).to.equal(duration)
    expect(newFuseExpiry.toNumber() - fuseExpiry.toNumber()).to.equal(86400)

    expect(
      (await web3.eth.getBalance(controller.address)) - balanceBefore,
    ).to.equal(86400)
  })

  it('should allow token owners to renew a name', async () => {
    const CANNOT_UNWRAP = 1
    const PARENT_CANNOT_CONTROL = 64

    await registerName('newname')
    var nodehash = namehash('newname.pop')
    const [, fuses, fuseExpiry] = await nameWrapper.getData(nodehash)

    var expires = await baseRegistrar.nameExpires(sha3('newname'))
    var balanceBefore = await web3.eth.getBalance(controller.address)
    const duration = 86400
    const price = await controller.rentPrice(
      sha3('newname'),
      duration,
      ZERO_ADDRESS,
    )
    await controller2.renew('newname', duration, { value: price })
    var newExpires = await baseRegistrar.nameExpires(sha3('newname'))
    const [, newFuses, newFuseExpiry] = await nameWrapper.getData(nodehash)
    expect(newExpires.toNumber() - expires.toNumber()).to.equal(duration)
    expect(newFuseExpiry.toNumber() - fuseExpiry.toNumber()).to.equal(duration)
    expect(newFuses).to.equal(fuses)
    expect(
      (await web3.eth.getBalance(controller.address)) - balanceBefore,
    ).to.equal(86400)
  })

  it('non wrapped names can renew', async () => {
    const label = 'newname'
    const tokenId = sha3(label)
    const nodehash = namehash(`${label}.pop`)
    // this is to allow user to register without namewrapped
    await baseRegistrar.addController(ownerAccount)
    await baseRegistrar.register(tokenId, ownerAccount, 84600)

    expect(await nameWrapper.ownerOf(nodehash)).to.equal(ZERO_ADDRESS)
    expect(await baseRegistrar.ownerOf(tokenId)).to.equal(ownerAccount)

    var expires = await baseRegistrar.nameExpires(tokenId)
    const duration = 86400
    const price = await controller.rentPrice(tokenId, duration, ZERO_ADDRESS)
    await controller.renew(label, duration, { value: price })

    expect(await baseRegistrar.ownerOf(tokenId)).to.equal(ownerAccount)
    expect(await nameWrapper.ownerOf(nodehash)).to.equal(ZERO_ADDRESS)
    var newExpires = await baseRegistrar.nameExpires(tokenId)
    expect(newExpires.toNumber() - expires.toNumber()).to.equal(duration)
  })

  it('should require sufficient value for a renewal', async () => {
    await expect(controller.renew('name', 86400)).to.be.revertedWith(
      'InsufficientValue()',
    )
  })

  it('should allow anyone to withdraw funds and transfer to the registrar owner', async () => {
    await controller.withdraw({ from: ownerAccount })
    expect(parseInt(await web3.eth.getBalance(controller.address))).to.equal(0)
  })

  it('should set the reverse record of the account', async () => {
    await controller.register(
      'reverse',
      registrantAccount,
      REGISTRATION_TIME,
      resolver.address,
      [],
      true,
      0,
      { value: BUFFERED_REGISTRATION_COST },
    )

    expect(await resolver.name(getReverseNode(ownerAccount))).to.equal(
      'reverse.pop',
    )
  })

  it('should not set the reverse record of the account when set to false', async () => {
    await controller.register(
      'noreverse',
      registrantAccount,
      REGISTRATION_TIME,
      resolver.address,
      [],
      false,
      0,
      { value: BUFFERED_REGISTRATION_COST },
    )

    expect(await resolver.name(getReverseNode(ownerAccount))).to.equal('')
  })

  it('should auto wrap the name and set the ERC721 owner to the wrapper', async () => {
    const label = 'wrapper'
    const name = label + '.pop'
    await controller.register(
      label,
      registrantAccount,
      REGISTRATION_TIME,
      resolver.address,
      [],
      true,
      0,
      { value: BUFFERED_REGISTRATION_COST },
    )

    expect(await nameWrapper.ownerOf(namehash(name))).to.equal(
      registrantAccount,
    )

    expect(await ens.owner(namehash(name))).to.equal(nameWrapper.address)
    expect(await baseRegistrar.ownerOf(sha3(label))).to.equal(
      nameWrapper.address,
    )
  })

  it('should auto wrap the name and allow fuses and expiry to be set', async () => {
    const MAX_INT_64 = 2n ** 64n - 1n
    const label = 'fuses'
    const name = label + '.pop'
    const tx = await controller.register(
      label,
      registrantAccount,
      REGISTRATION_TIME,
      resolver.address,
      [],
      true,
      1,
      { value: BUFFERED_REGISTRATION_COST },
    )

    const block = await provider.getBlock(tx.block)

    const [, fuses, expiry] = await nameWrapper.getData(namehash(name))
    expect(fuses).to.equal(PARENT_CANNOT_CONTROL | CANNOT_UNWRAP | IS_DOT_ETH)
    expect(expiry).to.equal(REGISTRATION_TIME + GRACE_PERIOD + block.timestamp)
  })

  it('approval should reduce gas for registration', async () => {
    const label = 'other'
    const name = label + '.pop'
    const node = namehash(name)

    const gasA = await controller2.estimateGas.register(
      label,
      registrantAccount,
      REGISTRATION_TIME,
      resolver.address,
      [
        resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
          node,
          registrantAccount,
        ]),
      ],
      true,
      1,
      { value: BUFFERED_REGISTRATION_COST },
    )

    await resolver2.setApprovalForAll(controller.address, true)

    const gasB = await controller2.estimateGas.register(
      label,
      registrantAccount,
      REGISTRATION_TIME,
      resolver2.address,
      [
        resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
          node,
          registrantAccount,
        ]),
      ],
      true,
      1,
      { value: BUFFERED_REGISTRATION_COST },
    )

    const tx = await controller2.register(
      label,
      registrantAccount,
      REGISTRATION_TIME,
      resolver2.address,
      [
        resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
          node,
          registrantAccount,
        ]),
      ],
      true,
      1,
      { value: BUFFERED_REGISTRATION_COST },
    )

    console.log((await tx.wait()).gasUsed.toString())

    console.log(gasA.toString(), gasB.toString())

    expect(await nameWrapper.ownerOf(node)).to.equal(registrantAccount)
    expect(await ens.owner(namehash(name))).to.equal(nameWrapper.address)
    expect(await baseRegistrar.ownerOf(sha3(label))).to.equal(
      nameWrapper.address,
    )
    expect(await resolver2['addr(bytes32)'](node)).to.equal(registrantAccount)
  })

  it('should not permit new registrations with non resolver function calls', async () => {
    const label = 'newconfigname'
    const name = `${label}.pop`
    const node = namehash(name)
    const secondTokenDuration = 788400000 // keep bogus NFT for 25 years;
    const callData = [
      baseRegistrar.interface.encodeFunctionData(
        'register(uint256,address,uint)',
        [node, registrantAccount, secondTokenDuration],
      ),
    ]
    await expect(
      controller.register(
        label,
        registrantAccount,
        REGISTRATION_TIME,
        baseRegistrar.address,
        callData,
        false,
        0,
        { value: BUFFERED_REGISTRATION_COST },
      ),
    ).to.be.revertedWith(
      "Transaction reverted: function selector was not recognized and there's no fallback function",
    )
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

  describe('#setDefaultResolver', () => {
    it('should set the default resolver', async () => {
      await controller.setDefaultResolver(resolver.address)
      expect(await controller.defaultResolver()).to.equal(resolver.address)
    })

    it('only admin can set default resolver', async () => {
      await expect(controller2.setDefaultResolver(resolver.address)).to.be
        .reverted
    })
  })

  describe('#registerWithRelayer', () => {
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
    it('register with relayer', async () => {
      // set relayer
      const RELAYER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes('RELAYER_ROLE'),
      )
      await controller.grantRole(RELAYER_ROLE, relayerAccount)

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
  })

  describe('#registerWithERC20', () => {
    it('register with erc20', async () => {
      // set base price for erc20
      await controller.setBasePrice(mockERC20.address, ONE_WAI)

      const label = 'newconfigname'
      await mockERC20.approve(controller.address, BUFFERED_REGISTRATION_COST)
      var tx = await controller2.registerWithERC20(
        'newconfigname',
        registrantAccount,
        REGISTRATION_TIME,
        resolver.address,
        callData,
        0,
        mockERC20.address,
      )

      const block = await provider.getBlock(tx.blockNumber)

      await expect(tx)
        .to.emit(controller, 'NameRegistered')
        .withArgs(
          label,
          sha3(label),
          registrantAccount,
          REGISTRATION_TIME,
          REGISTRATION_TIME + block.timestamp,
        )

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

    it('revert if paytoken is not set', async () => {
      // set base price for erc20
      await controller.setBasePrice(mockERC20.address, 0)

      await mockERC20.approve(controller.address, BUFFERED_REGISTRATION_COST)
      await expect(
        controller2.registerWithERC20(
          'newconfigname',
          registrantAccount,
          REGISTRATION_TIME,
          resolver.address,
          callData,
          0,
          mockERC20.address,
        ),
      ).to.be.revertedWith('TokenNotSupported')
    })
  })
})
