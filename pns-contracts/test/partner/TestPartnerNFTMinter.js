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
describe('PartnerNFTMinter', () => {
  let ens
  let resolver
  let baseRegistrar
  let controller
  let priceOracle
  let reverseRegistrar
  let nameWrapper
  let callData
  let partnerNftMinter
  let mockNFT

  let owner
  let partner
  let user
  let users
  /* Utility funcs */

  async function registerName(
    name,
    txOptions = { value: BUFFERED_REGISTRATION_COST },
  ) {
    var tx = await controller.register(
      name,
      partner.address,
      REGISTRATION_TIME,
      NULL_ADDRESS,
      [],
      false,
      0,
      txOptions,
    )

    return tx
  }

  const partnerName = 'partner'
  const nodehash = namehash(partnerName + '.pop')

  before(async () => {
    ;[owner, partner, user, ...users] = await ethers.getSigners()

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

    partnerNftMinter = await deploy(
      'PartnerNFTMinter',
      ens.address,
      baseRegistrar.address,
      nameWrapper.address,
      reverseRegistrar.address,
    )

    await reverseRegistrar.setController(partnerNftMinter.address, true)

    mockNFT = await deploy('MockNFT')

    await nameWrapper.setMinter(partnerNftMinter.address)
  })

  beforeEach(async () => {
    result = await ethers.provider.send('evm_snapshot')
  })
  afterEach(async () => {
    await ethers.provider.send('evm_revert', [result])
  })

  shouldSupportInterfaces(() => partnerNftMinter, ['ERC1155Receiver'])

  describe('Register', () => {
    beforeEach(
      'Partner register 2nd domain for nft and add domain to minter contract',
      async () => {
        // register 2nd
        await registerName(partnerName)
        // register domain
        await partnerNftMinter.addDomain(
          nodehash,
          partner.address,
          mockNFT.address,
          false,
        )

        // mint partner nft
        await mockNFT.connect(user).mint()
      },
    )
    it('Should able to register', async () => {
      // register subname

      const subLabel = 'sub'
      const subnodehash = namehash(`${subLabel}.${partnerName}.pop`)

      const callData = [
        resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
          subnodehash,
          user.address,
        ]),
        resolver.interface.encodeFunctionData('setText', [
          subnodehash,
          'url',
          'ethereum.com',
        ]),
      ]

      await partnerNftMinter
        .connect(user)
        .register(0, nodehash, subLabel, resolver.address, callData, true, 0)

      expect(await nameWrapper.balanceOf(user.address, subnodehash)).to.eq(1)

      expect(await ens.resolver(subnodehash)).to.equal(resolver.address)
      expect(await ens.owner(subnodehash)).to.equal(nameWrapper.address)

      expect(await resolver['addr(bytes32)'](subnodehash)).to.equal(
        user.address,
      )
      expect(await resolver['text'](subnodehash, 'url')).to.equal(
        'ethereum.com',
      )
    })

    it("Cannot register if user don't have nft", async () => {
      const subLabel = 'sub1'
      await expect(
        partnerNftMinter
          .connect(users[0])
          .register(0, nodehash, subLabel, resolver.address, [], true, 0),
      ).to.be.revertedWith('UnAuthorized')
    })

    it('Cannot register if nft is already used', async () => {
      const subLabel = 'sub1'
      await partnerNftMinter
        .connect(user)
        .register(0, nodehash, subLabel, resolver.address, [], false, 0)
      await expect(
        partnerNftMinter
          .connect(user)
          .register(0, nodehash, subLabel, resolver.address, [], false, 0),
      ).to.be.revertedWith('AlreadyUsedNFT')
    })

    it('Cannot register if domain is not registered', async () => {
      await expect(
        partnerNftMinter
          .connect(user)
          .register(
            0,
            namehash('otherdomain' + '.pop'),
            'sub',
            resolver.address,
            [],
            true,
            0,
          ),
      ).to.be.revertedWith('DomainNotRegistered')
    })

    it('Cannot register if name is already used', async () => {
      const subLabel = 'sub'
      await partnerNftMinter
        .connect(user)
        .register(0, nodehash, subLabel, resolver.address, [], true, 0)

      await mockNFT.connect(users[0]).mint()

      await expect(
        partnerNftMinter
          .connect(users[0])
          .register(1, nodehash, subLabel, resolver.address, [], true, 0),
      ).to.be.revertedWith('SubnameAlreadyUsed')
    })

    it('can register with already used nft', async () => {
      const subLabel = 'sub1'
      const subnodehash = namehash(`${subLabel}.${partnerName}.pop`)
      await partnerNftMinter
        .connect(partner)
        .setAllowDuplication(nodehash, true)
      await partnerNftMinter
        .connect(user)
        .register(0, nodehash, subLabel, resolver.address, [], true, 0)
      expect(await nameWrapper.balanceOf(user.address, subnodehash)).to.eq(1)
    })
  })

  describe('#addDomain', () => {
    beforeEach(async () => {
      await registerName(partnerName)
    })
    it('owner can add domain', async () => {
      await partnerNftMinter.addDomain(
        nodehash,
        partner.address,
        mockNFT.address,
        false,
      )
      const {
        owner: ownerAddr,
        nft,
        allowDuplication,
      } = await partnerNftMinter.domains(nodehash)
      expect(ownerAddr).to.be.eq(partner.address)
      expect(nft).to.eq(mockNFT.address)
      expect(allowDuplication).to.be.false
    })

    it('only owner can add domain', async () => {
      await expect(
        partnerNftMinter
          .connect(user)
          .addDomain(nodehash, partner.address, mockNFT.address, false),
      ).to.be.reverted
    })

    it('revert if nft owner is invalid', async () => {
      await expect(
        partnerNftMinter.addDomain(
          nodehash,
          user.address,
          mockNFT.address,
          false,
        ),
      ).to.be.revertedWith('UnAuthorized')
    })

    it('revert if params are invalid', async () => {
      await expect(
        partnerNftMinter.addDomain(
          nodehash,
          ZERO_ADDRESS,
          mockNFT.address,
          false,
        ),
      ).to.be.revertedWith('InvalidParams')

      await expect(
        partnerNftMinter.addDomain(
          nodehash,
          partner.address,
          ZERO_ADDRESS,
          false,
        ),
      ).to.be.revertedWith('InvalidParams')

      await expect(
        partnerNftMinter.addDomain(
          nodehash,
          partner.address,
          ZERO_ADDRESS,
          false,
        ),
      ).to.be.revertedWith('InvalidParams')

      await expect(
        partnerNftMinter.addDomain(
          EMPTY_BYTES32,
          partner.address,
          mockNFT.address,
          false,
        ),
      ).to.be.revertedWith('InvalidParams')
    })
  })

  describe('#removeDomain', () => {
    it('owner can remove domain', async () => {
      await partnerNftMinter.removeDomain(nodehash)
    })

    it('only owner can add domain', async () => {
      await expect(partnerNftMinter.connect(user).removeDomain(nodehash)).to.be
        .reverted
    })
  })

  describe('#setAllowDuplication', () => {
    beforeEach(async () => {
      await registerName(partnerName)
      await partnerNftMinter.addDomain(
        nodehash,
        partner.address,
        mockNFT.address,
        false,
      )
    })
    it('can update allowDuplication', async () => {
      await partnerNftMinter
        .connect(partner)
        .setAllowDuplication(nodehash, true)
      const { allowDuplication } = await partnerNftMinter.domains(nodehash)
      expect(allowDuplication).to.be.true
    })

    it('only domain owner can update allowDuplication', async () => {
      await expect(
        partnerNftMinter.connect(user).setAllowDuplication(nodehash, true),
      ).to.be.revertedWith('UnAuthorized')
    })
  })
})
