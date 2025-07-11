const ENS = artifacts.require('./registry/PNSRegistry.sol')
const PublicResolver = artifacts.require('PublicResolver.sol')
const NameWrapper = artifacts.require('DummyNameWrapper.sol')
const { deploy } = require('../test-utils/contracts')
const { labelhash } = require('../test-utils/ens')
const {
  EMPTY_BYTES32: ROOT_NODE,
  EMPTY_ADDRESS,
} = require('../test-utils/constants')

const { expect } = require('chai')
const namehash = require('eth-ens-namehash')
const sha3 = require('web3-utils').sha3

const { exceptions } = require('../test-utils')

contract('PublicResolver', function (accounts) {
  let node
  let ens, resolver, nameWrapper
  let account
  let signers
  let result

  beforeEach(async () => {
    signers = await ethers.getSigners()
    account = await signers[0].getAddress()
    node = namehash.hash('pop')
    ens = await ENS.new()
    nameWrapper = await NameWrapper.new()

    //setup reverse registrar

    const ReverseRegistrar = await deploy('ReverseRegistrar', ens.address)

    await ens.setSubnodeOwner(ROOT_NODE, labelhash('reverse'), account)
    await ens.setSubnodeOwner(
      namehash.hash('reverse'),
      labelhash('addr'),
      ReverseRegistrar.address,
    )

    resolver = await PublicResolver.new(
      ens.address,
      nameWrapper.address,
      accounts[9], // trusted contract
      ReverseRegistrar.address, //ReverseRegistrar.address,
    )

    await ReverseRegistrar.setDefaultResolver(resolver.address)

    await ens.setSubnodeOwner('0x0', sha3('pop'), accounts[0], {
      from: accounts[0],
    })
  })

  describe('fallback function', async () => {
    it('forbids calls to the fallback function with 0 value', async () => {
      await exceptions.expectFailure(
        web3.eth.sendTransaction({
          from: accounts[0],
          to: resolver.address,
          gas: 3000000,
        }),
      )
    })

    it('forbids calls to the fallback function with 1 value', async () => {
      await exceptions.expectFailure(
        web3.eth.sendTransaction({
          from: accounts[0],
          to: resolver.address,
          gas: 3000000,
          value: 1,
        }),
      )
    })
  })

  describe('supportsInterface function', async () => {
    it('supports known interfaces', async () => {
      assert.equal(await resolver.supportsInterface('0x3b3b57de'), true) // IAddrResolver
      assert.equal(await resolver.supportsInterface('0xf1cb7e06'), true) // IAddressResolver
      assert.equal(await resolver.supportsInterface('0x691f3431'), true) // INameResolver
      assert.equal(await resolver.supportsInterface('0x2203ab56'), true) // IABIResolver
      assert.equal(await resolver.supportsInterface('0xc8690233'), true) // IPubkeyResolver
      assert.equal(await resolver.supportsInterface('0x59d1d43c'), true) // ITextResolver
      assert.equal(await resolver.supportsInterface('0xbc1c58d1'), true) // IContentHashResolver
      assert.equal(await resolver.supportsInterface('0x01ffc9a7'), true) // IInterfaceResolver
    })

    it('does not support a random interface', async () => {
      assert.equal(await resolver.supportsInterface('0x3b3b57df'), false)
    })
  })

  describe('recordVersion', async () => {
    it('permits clearing records', async () => {
      var tx = await resolver.clearRecords(node, { from: accounts[0] })
      assert.equal(tx.logs.length, 1)
      assert.equal(tx.logs[0].event, 'VersionChanged')
      assert.equal(tx.logs[0].args.node, node)
      assert.equal(tx.logs[0].args.newVersion, 1)
    })
  })

  describe('addr', async () => {
    it('permits setting address by owner', async () => {
      var tx = await resolver.methods['setAddr(bytes32,address)'](
        node,
        accounts[1],
        { from: accounts[0] },
      )
      assert.equal(tx.logs.length, 2)
      assert.equal(tx.logs[0].event, 'AddressChanged')
      assert.equal(tx.logs[0].args.node, node)
      assert.equal(tx.logs[0].args.newAddress, accounts[1].toLowerCase())
      assert.equal(tx.logs[1].event, 'AddrChanged')
      assert.equal(tx.logs[1].args.node, node)
      assert.equal(tx.logs[1].args.a, accounts[1])
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[1])
    })

    it('can overwrite previously set address', async () => {
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[1])

      await resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
        from: accounts[0],
      })
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[0])
    })

    it('can overwrite to same address', async () => {
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[1])

      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[1])
    })

    it('forbids setting new address by non-owners', async () => {
      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
          from: accounts[1],
        }),
      )
    })

    it('forbids writing same address by non-owners', async () => {
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })

      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
          from: accounts[1],
        }),
      )
    })

    it('forbids overwriting existing address by non-owners', async () => {
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })

      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
          from: accounts[1],
        }),
      )
    })

    it('returns zero when fetching nonexistent addresses', async () => {
      assert.equal(
        await resolver.methods['addr(bytes32)'](node),
        '0x0000000000000000000000000000000000000000',
      )
    })

    it('permits setting and retrieving addresses for other coin types', async () => {
      await resolver.methods['setAddr(bytes32,uint256,bytes)'](
        node,
        123,
        accounts[1],
        { from: accounts[0] },
      )
      assert.equal(
        await resolver.methods['addr(bytes32,uint256)'](node, 123),
        accounts[1].toLowerCase(),
      )
    })

    it('returns ETH address for coin type 60', async () => {
      var tx = await resolver.methods['setAddr(bytes32,address)'](
        node,
        accounts[1],
        { from: accounts[0] },
      )
      assert.equal(tx.logs.length, 2)
      assert.equal(tx.logs[0].event, 'AddressChanged')
      assert.equal(tx.logs[0].args.node, node)
      assert.equal(tx.logs[0].args.newAddress, accounts[1].toLowerCase())
      assert.equal(tx.logs[1].event, 'AddrChanged')
      assert.equal(tx.logs[1].args.node, node)
      assert.equal(tx.logs[1].args.a, accounts[1])
      assert.equal(
        await resolver.methods['addr(bytes32,uint256)'](node, 60),
        accounts[1].toLowerCase(),
      )
    })

    it('setting coin type 60 updates ETH address', async () => {
      var tx = await resolver.methods['setAddr(bytes32,uint256,bytes)'](
        node,
        60,
        accounts[2],
        { from: accounts[0] },
      )
      assert.equal(tx.logs.length, 2)
      assert.equal(tx.logs[0].event, 'AddressChanged')
      assert.equal(tx.logs[0].args.node, node)
      assert.equal(tx.logs[0].args.newAddress, accounts[2].toLowerCase())
      assert.equal(tx.logs[1].event, 'AddrChanged')
      assert.equal(tx.logs[1].args.node, node)
      assert.equal(tx.logs[1].args.a, accounts[2])
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[2])
    })

    it('forbids calls to the fallback function with 1 value', async () => {
      await exceptions.expectFailure(
        web3.eth.sendTransaction({
          from: accounts[0],
          to: resolver.address,
          gas: 3000000,
          value: 1,
        }),
      )
    })
  })

  describe('addr', async () => {
    const basicSetAddr = async () => {
      var tx = await resolver.methods['setAddr(bytes32,address)'](
        node,
        accounts[1],
        { from: accounts[0] },
      )
      assert.equal(tx.logs.length, 2)
      assert.equal(tx.logs[0].event, 'AddressChanged')
      assert.equal(tx.logs[0].args.node, node)
      assert.equal(tx.logs[0].args.newAddress, accounts[1].toLowerCase())
      assert.equal(tx.logs[1].event, 'AddrChanged')
      assert.equal(tx.logs[1].args.node, node)
      assert.equal(tx.logs[1].args.a, accounts[1])
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[1])
    }

    it('permits setting address by owner', basicSetAddr)

    it('can overwrite previously set address', async () => {
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[1])

      await resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
        from: accounts[0],
      })
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[0])
    })

    it('can overwrite to same address', async () => {
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[1])

      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[1])
    })

    it('forbids setting new address by non-owners', async () => {
      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
          from: accounts[1],
        }),
      )
    })

    it('forbids writing same address by non-owners', async () => {
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })

      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
          from: accounts[1],
        }),
      )
    })

    it('forbids overwriting existing address by non-owners', async () => {
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })

      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
          from: accounts[1],
        }),
      )
    })

    it('returns zero when fetching nonexistent addresses', async () => {
      assert.equal(
        await resolver.methods['addr(bytes32)'](node),
        '0x0000000000000000000000000000000000000000',
      )
    })

    it('permits setting and retrieving addresses for other coin types', async () => {
      await resolver.methods['setAddr(bytes32,uint256,bytes)'](
        node,
        123,
        accounts[1],
        { from: accounts[0] },
      )
      assert.equal(
        await resolver.methods['addr(bytes32,uint256)'](node, 123),
        accounts[1].toLowerCase(),
      )
    })

    it('returns ETH address for coin type 60', async () => {
      var tx = await resolver.methods['setAddr(bytes32,address)'](
        node,
        accounts[1],
        { from: accounts[0] },
      )
      assert.equal(tx.logs.length, 2)
      assert.equal(tx.logs[0].event, 'AddressChanged')
      assert.equal(tx.logs[0].args.node, node)
      assert.equal(tx.logs[0].args.newAddress, accounts[1].toLowerCase())
      assert.equal(tx.logs[1].event, 'AddrChanged')
      assert.equal(tx.logs[1].args.node, node)
      assert.equal(tx.logs[1].args.a, accounts[1])
      assert.equal(
        await resolver.methods['addr(bytes32,uint256)'](node, 60),
        accounts[1].toLowerCase(),
      )
    })

    it('setting coin type 60 updates ETH address', async () => {
      var tx = await resolver.methods['setAddr(bytes32,uint256,bytes)'](
        node,
        60,
        accounts[2],
        { from: accounts[0] },
      )
      assert.equal(tx.logs.length, 2)
      assert.equal(tx.logs[0].event, 'AddressChanged')
      assert.equal(tx.logs[0].args.node, node)
      assert.equal(tx.logs[0].args.newAddress, accounts[2].toLowerCase())
      assert.equal(tx.logs[1].event, 'AddrChanged')
      assert.equal(tx.logs[1].args.node, node)
      assert.equal(tx.logs[1].args.a, accounts[2])
      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[2])
    })

    it('resets record on version change', async () => {
      await basicSetAddr()
      await resolver.clearRecords(node)
      assert.equal(await resolver.methods['addr(bytes32)'](node), EMPTY_ADDRESS)
    })
  })

  describe('name', async () => {
    const basicSetName = async () => {
      await resolver.setName(node, 'name1', { from: accounts[0] })
      assert.equal(await resolver.name(node), 'name1')
    }

    it('permits setting name by owner', basicSetName)

    it('can overwrite previously set names', async () => {
      await resolver.setName(node, 'name1', { from: accounts[0] })
      assert.equal(await resolver.name(node), 'name1')

      await resolver.setName(node, 'name2', { from: accounts[0] })
      assert.equal(await resolver.name(node), 'name2')
    })

    it('forbids setting name by non-owners', async () => {
      await exceptions.expectFailure(
        resolver.setName(node, 'name2', { from: accounts[1] }),
      )
    })

    it('returns empty when fetching nonexistent name', async () => {
      assert.equal(await resolver.name(node), '')
    })

    it('resets record on version change', async () => {
      await basicSetName()
      await resolver.clearRecords(node)
      assert.equal(await resolver.name(node), '')
    })
  })

  describe('pubkey', async () => {
    const basicSetPubkey = async () => {
      let x =
        '0x1000000000000000000000000000000000000000000000000000000000000000'
      let y =
        '0x2000000000000000000000000000000000000000000000000000000000000000'

      await resolver.setPubkey(node, x, y, { from: accounts[0] })

      let result = await resolver.pubkey(node)
      assert.equal(result[0], x)
      assert.equal(result[1], y)
    }

    it('returns empty when fetching nonexistent values', async () => {
      let result = await resolver.pubkey(node)
      assert.equal(
        result[0],
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      )
      assert.equal(
        result[1],
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      )
    })

    it('permits setting public key by owner', basicSetPubkey)

    it('can overwrite previously set value', async () => {
      await resolver.setPubkey(
        node,
        '0x1000000000000000000000000000000000000000000000000000000000000000',
        '0x2000000000000000000000000000000000000000000000000000000000000000',
        { from: accounts[0] },
      )

      let x =
        '0x3000000000000000000000000000000000000000000000000000000000000000'
      let y =
        '0x4000000000000000000000000000000000000000000000000000000000000000'
      await resolver.setPubkey(node, x, y, { from: accounts[0] })

      let result = await resolver.pubkey(node)
      assert.equal(result[0], x)
      assert.equal(result[1], y)
    })

    it('can overwrite to same value', async () => {
      let x =
        '0x1000000000000000000000000000000000000000000000000000000000000000'
      let y =
        '0x2000000000000000000000000000000000000000000000000000000000000000'

      await resolver.setPubkey(node, x, y, { from: accounts[0] })
      await resolver.setPubkey(node, x, y, { from: accounts[0] })

      let result = await resolver.pubkey(node)
      assert.equal(result[0], x)
      assert.equal(result[1], y)
    })

    it('forbids setting value by non-owners', async () => {
      await exceptions.expectFailure(
        resolver.setPubkey(
          node,
          '0x1000000000000000000000000000000000000000000000000000000000000000',
          '0x2000000000000000000000000000000000000000000000000000000000000000',
          { from: accounts[1] },
        ),
      )
    })

    it('forbids writing same value by non-owners', async () => {
      let x =
        '0x1000000000000000000000000000000000000000000000000000000000000000'
      let y =
        '0x2000000000000000000000000000000000000000000000000000000000000000'

      await resolver.setPubkey(node, x, y, { from: accounts[0] })

      await exceptions.expectFailure(
        resolver.setPubkey(node, x, y, { from: accounts[1] }),
      )
    })

    it('forbids overwriting existing value by non-owners', async () => {
      await resolver.setPubkey(
        node,
        '0x1000000000000000000000000000000000000000000000000000000000000000',
        '0x2000000000000000000000000000000000000000000000000000000000000000',
        { from: accounts[0] },
      )

      await exceptions.expectFailure(
        resolver.setPubkey(
          node,
          '0x3000000000000000000000000000000000000000000000000000000000000000',
          '0x4000000000000000000000000000000000000000000000000000000000000000',
          { from: accounts[1] },
        ),
      )
    })

    it('resets record on version change', async () => {
      await basicSetPubkey()
      await resolver.clearRecords(node)
      result = await resolver.pubkey(node)
      assert.equal(
        result[0],
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      )
      assert.equal(
        result[1],
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      )
    })
  })

  describe('ABI', async () => {
    const basicSetABI = async () => {
      await resolver.setABI(node, 0x1, '0x666f6f', { from: accounts[0] })
      let result = await resolver.ABI(node, 0xffffffff)
      assert.deepEqual([result[0].toNumber(), result[1]], [1, '0x666f6f'])
    }

    it('returns a contentType of 0 when nothing is available', async () => {
      let result = await resolver.ABI(node, 0xffffffff)
      assert.equal(result[0], 0)
    })

    it('returns an ABI after it has been set', basicSetABI)

    it('returns the first valid ABI', async () => {
      await resolver.setABI(node, 0x2, '0x666f6f', { from: accounts[0] })
      await resolver.setABI(node, 0x4, '0x626172', { from: accounts[0] })

      let result = await resolver.ABI(node, 0x7)
      assert.deepEqual([result[0].toNumber(), result[1]], [2, '0x666f6f'])

      result = await resolver.ABI(node, 0x5)
      assert.deepEqual([result[0].toNumber(), result[1]], [4, '0x626172'])
    })

    it('allows deleting ABIs', async () => {
      await resolver.setABI(node, 0x1, '0x666f6f', { from: accounts[0] })
      let result = await resolver.ABI(node, 0xffffffff)
      assert.deepEqual([result[0].toNumber(), result[1]], [1, '0x666f6f'])

      await resolver.setABI(node, 0x1, '0x', { from: accounts[0] })
      result = await resolver.ABI(node, 0xffffffff)
      assert.deepEqual([result[0].toNumber(), result[1]], [0, null])
    })

    it('rejects invalid content types', async () => {
      await exceptions.expectFailure(
        resolver.setABI(node, 0x3, '0x12', { from: accounts[0] }),
      )
    })

    it('forbids setting value by non-owners', async () => {
      await exceptions.expectFailure(
        resolver.setABI(node, 0x1, '0x666f6f', { from: accounts[1] }),
      )
    })

    it('resets on version change', async () => {
      await basicSetABI()
      await resolver.clearRecords(node)
      result = await resolver.ABI(node, 0xffffffff)
      assert.equal(result[0], 0)
    })
  })

  describe('text', async () => {
    var url = 'https://ethereum.org'
    var url2 = 'https://github.com/ethereum'

    const basicSetText = async () => {
      await resolver.setText(node, 'url', url, { from: accounts[0] })
      assert.equal(await resolver.text(node, 'url'), url)
    }

    it('permits setting text by owner', basicSetText)

    it('can overwrite previously set text', async () => {
      await resolver.setText(node, 'url', url, { from: accounts[0] })
      assert.equal(await resolver.text(node, 'url'), url)

      await resolver.setText(node, 'url', url2, { from: accounts[0] })
      assert.equal(await resolver.text(node, 'url'), url2)
    })

    it('can overwrite to same text', async () => {
      await resolver.setText(node, 'url', url, { from: accounts[0] })
      assert.equal(await resolver.text(node, 'url'), url)

      await resolver.setText(node, 'url', url, { from: accounts[0] })
      assert.equal(await resolver.text(node, 'url'), url)
    })

    it('forbids setting new text by non-owners', async () => {
      await exceptions.expectFailure(
        resolver.setText(node, 'url', url, { from: accounts[1] }),
      )
    })

    it('forbids writing same text by non-owners', async () => {
      await resolver.setText(node, 'url', url, { from: accounts[0] })

      await exceptions.expectFailure(
        resolver.setText(node, 'url', url, { from: accounts[1] }),
      )
    })

    it('resets record on version change', async () => {
      await basicSetText()
      await resolver.clearRecords(node)
      assert.equal(await resolver.text(node, 'url'), '')
    })
  })

  describe('contenthash', async () => {
    const basicSetContenthash = async () => {
      await resolver.setContenthash(
        node,
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        { from: accounts[0] },
      )
      assert.equal(
        await resolver.contenthash(node),
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      )
    }

    it('permits setting contenthash by owner', basicSetContenthash)

    it('can overwrite previously set contenthash', async () => {
      await resolver.setContenthash(
        node,
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        { from: accounts[0] },
      )
      assert.equal(
        await resolver.contenthash(node),
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      )

      await resolver.setContenthash(
        node,
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        { from: accounts[0] },
      )
      assert.equal(
        await resolver.contenthash(node),
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      )
    })

    it('can overwrite to same contenthash', async () => {
      await resolver.setContenthash(
        node,
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        { from: accounts[0] },
      )
      assert.equal(
        await resolver.contenthash(node),
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      )

      await resolver.setContenthash(
        node,
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        { from: accounts[0] },
      )
      assert.equal(
        await resolver.contenthash(node),
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      )
    })

    it('forbids setting contenthash by non-owners', async () => {
      await exceptions.expectFailure(
        resolver.setContenthash(
          node,
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          { from: accounts[1] },
        ),
      )
    })

    it('forbids writing same contenthash by non-owners', async () => {
      await resolver.setContenthash(
        node,
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        { from: accounts[0] },
      )

      await exceptions.expectFailure(
        resolver.setContenthash(
          node,
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          { from: accounts[1] },
        ),
      )
    })

    it('returns empty when fetching nonexistent contenthash', async () => {
      assert.equal(await resolver.contenthash(node), null)
    })

    it('resets record on version change', async () => {
      await basicSetContenthash()
      await resolver.clearRecords(node)
      assert.equal(await resolver.contenthash(node), null)
    })
  })

  describe('implementsInterface', async () => {
    const basicSetInterface = async () => {
      await resolver.setInterface(node, '0x12345678', accounts[0], {
        from: accounts[0],
      })
      assert.equal(
        await resolver.interfaceImplementer(node, '0x12345678'),
        accounts[0],
      )
    }

    it('permits setting interface by owner', basicSetInterface)

    it('can update previously set interface', async () => {
      await resolver.setInterface(node, '0x12345678', resolver.address, {
        from: accounts[0],
      })
      assert.equal(
        await resolver.interfaceImplementer(node, '0x12345678'),
        resolver.address,
      )
    })

    it('forbids setting interface by non-owner', async () => {
      await exceptions.expectFailure(
        resolver.setInterface(node, '0x12345678', accounts[1], {
          from: accounts[1],
        }),
      )
    })

    it('returns 0 when fetching unset interface', async () => {
      assert.equal(
        await resolver.interfaceImplementer(namehash.hash('foo'), '0x12345678'),
        '0x0000000000000000000000000000000000000000',
      )
    })

    it('falls back to calling implementsInterface on addr', async () => {
      // Set addr to the resolver itself, since it has interface implementations.
      await resolver.methods['setAddr(bytes32,address)'](
        node,
        resolver.address,
        {
          from: accounts[0],
        },
      )
      // Check the ID for `addr(bytes32)`
      assert.equal(
        await resolver.interfaceImplementer(node, '0x3b3b57de'),
        resolver.address,
      )
    })

    it('returns 0 on fallback when target contract does not implement interface', async () => {
      // Check an imaginary interface ID we know it doesn't support.
      assert.equal(
        await resolver.interfaceImplementer(node, '0x00000000'),
        '0x0000000000000000000000000000000000000000',
      )
    })

    it('returns 0 on fallback when target contract does not support implementsInterface', async () => {
      // Set addr to the ENS registry, which doesn't implement supportsInterface.
      await resolver.methods['setAddr(bytes32,address)'](node, ens.address, {
        from: accounts[0],
      })
      // Check the ID for `supportsInterface(bytes4)`
      assert.equal(
        await resolver.interfaceImplementer(node, '0x01ffc9a7'),
        '0x0000000000000000000000000000000000000000',
      )
    })

    it('returns 0 on fallback when target is not a contract', async () => {
      // Set addr to an externally owned account.
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
        from: accounts[0],
      })
      // Check the ID for `supportsInterface(bytes4)`
      assert.equal(
        await resolver.interfaceImplementer(node, '0x01ffc9a7'),
        '0x0000000000000000000000000000000000000000',
      )
    })

    it('resets record on version change', async () => {
      await basicSetInterface()
      await resolver.clearRecords(node)
      assert.equal(
        await resolver.interfaceImplementer(node, '0x12345678'),
        '0x0000000000000000000000000000000000000000',
      )
    })
  })

  describe('authorisations', async () => {
    it('permits authorisations to be set', async () => {
      await resolver.setApprovalForAll(accounts[1], true, {
        from: accounts[0],
      })
      assert.equal(
        await resolver.isApprovedForAll(accounts[0], accounts[1]),
        true,
      )
    })

    it('permits authorised users to make changes', async () => {
      await resolver.setApprovalForAll(accounts[1], true, {
        from: accounts[0],
      })
      assert.equal(
        await resolver.isApprovedForAll(await ens.owner(node), accounts[1]),
        true,
      )
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[1],
      })
      assert.equal(await resolver.addr(node), accounts[1])
    })

    it('permits authorisations to be cleared', async () => {
      await resolver.setApprovalForAll(accounts[1], false, {
        from: accounts[0],
      })
      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
          from: accounts[1],
        }),
      )
    })

    it('permits non-owners to set authorisations', async () => {
      await resolver.setApprovalForAll(accounts[2], true, {
        from: accounts[1],
      })

      // The authorisation should have no effect, because accounts[1] is not the owner.
      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
          from: accounts[2],
        }),
      )
    })

    it('checks the authorisation for the current owner', async () => {
      await resolver.setApprovalForAll(accounts[2], true, {
        from: accounts[1],
      })
      await ens.setOwner(node, accounts[1], { from: accounts[0] })

      await resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
        from: accounts[2],
      })
      assert.equal(await resolver.addr(node), accounts[0])
    })

    it('trusted contract can bypass authorisation', async () => {
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[9], {
        from: accounts[9],
      })
      assert.equal(await resolver.addr(node), accounts[9])
    })

    it('emits an ApprovalForAll log', async () => {
      var owner = accounts[0]
      var operator = accounts[1]
      var tx = await resolver.setApprovalForAll(operator, true, {
        from: owner,
      })
      assert.equal(tx.logs.length, 1)
      assert.equal(tx.logs[0].event, 'ApprovalForAll')
      assert.equal(tx.logs[0].args.owner, owner)
      assert.equal(tx.logs[0].args.operator, operator)
      assert.equal(tx.logs[0].args.approved, true)
    })

    it('reverts if attempting to approve self as an operator', async () => {
      await expect(
        resolver.setApprovalForAll(accounts[1], true, { from: accounts[1] }),
      ).to.be.revertedWith('ERC1155: setting approval status for self')
    })

    it('permits name wrapper owner to make changes if owner is set to name wrapper address', async () => {
      var owner = await ens.owner(node)
      var operator = accounts[2]
      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, owner, {
          from: operator,
        }),
      )
      await ens.setOwner(node, nameWrapper.address, { from: owner })
      await expect(
        resolver.methods['setAddr(bytes32,address)'](node, owner, {
          from: operator,
        }),
      )
    })
  })

  describe('token approvals', async () => {
    it('permits delegate to be approved', async () => {
      await resolver.approve(node, accounts[1], true, {
        from: accounts[0],
      })
      assert.equal(
        await resolver.isApprovedFor(accounts[0], node, accounts[1]),
        true,
      )
    })

    it('permits delegated users to make changes', async () => {
      await resolver.approve(node, accounts[1], true, {
        from: accounts[0],
      })
      assert.equal(
        await resolver.isApprovedFor(await ens.owner(node), node, accounts[1]),
        true,
      )
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[1],
      })
      assert.equal(await resolver.addr(node), accounts[1])
    })

    it('permits delegations to be cleared', async () => {
      await resolver.approve(node, accounts[1], false, {
        from: accounts[0],
      })
      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
          from: accounts[1],
        }),
      )
    })

    it('permits non-owners to set delegations', async () => {
      await resolver.approve(node, accounts[2], true, {
        from: accounts[1],
      })

      // The delegation should have no effect, because accounts[1] is not the owner.
      await exceptions.expectFailure(
        resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
          from: accounts[2],
        }),
      )
    })

    it('checks the delegation for the current owner', async () => {
      await resolver.approve(node, accounts[2], true, {
        from: accounts[1],
      })
      await ens.setOwner(node, accounts[1], { from: accounts[0] })

      await resolver.methods['setAddr(bytes32,address)'](node, accounts[0], {
        from: accounts[2],
      })
      assert.equal(await resolver.addr(node), accounts[0])
    })

    it('emits a Approved log', async () => {
      var owner = accounts[0]
      var delegate = accounts[1]
      var tx = await resolver.approve(node, delegate, true, {
        from: owner,
      })
      assert.equal(tx.logs.length, 1)
      assert.equal(tx.logs[0].event, 'Approved')
      assert.equal(tx.logs[0].args.owner, owner)
      assert.equal(tx.logs[0].args.node, node)
      assert.equal(tx.logs[0].args.delegate, delegate)
      assert.equal(tx.logs[0].args.approved, true)
    })

    it('reverts if attempting to delegate self as an delegate', async () => {
      await expect(
        resolver.approve(node, accounts[1], true, { from: accounts[1] }),
      ).to.be.revertedWith('Setting delegate status for self')
    })
  })

  describe('multicall', async () => {
    it('allows setting multiple fields', async () => {
      var addrSet = resolver.contract.methods['setAddr(bytes32,address)'](
        node,
        accounts[1],
      ).encodeABI()
      var textSet = resolver.contract.methods
        .setText(node, 'url', 'https://ethereum.org/')
        .encodeABI()
      var tx = await resolver.multicall([addrSet, textSet], {
        from: accounts[0],
      })

      assert.equal(tx.logs.length, 3)
      assert.equal(tx.logs[0].event, 'AddressChanged')
      assert.equal(tx.logs[0].args.node, node)
      assert.equal(tx.logs[0].args.newAddress, accounts[1].toLowerCase())
      assert.equal(tx.logs[1].event, 'AddrChanged')
      assert.equal(tx.logs[1].args.node, node)
      assert.equal(tx.logs[1].args.a, accounts[1])
      assert.equal(tx.logs[2].event, 'TextChanged')
      assert.equal(tx.logs[2].args.node, node)
      assert.equal(tx.logs[2].args.key, 'url')

      assert.equal(await resolver.methods['addr(bytes32)'](node), accounts[1])
      assert.equal(await resolver.text(node, 'url'), 'https://ethereum.org/')
    })

    it('allows reading multiple fields', async () => {
      await resolver.methods['setAddr(bytes32,address)'](node, accounts[1], {
        from: accounts[0],
      })
      await resolver.setText(node, 'url', 'https://ethereum.org/', {
        from: accounts[0],
      })
      var results = await resolver.multicall.call([
        resolver.contract.methods['addr(bytes32)'](node).encodeABI(),
        resolver.contract.methods.text(node, 'url').encodeABI(),
      ])
      assert.equal(
        web3.eth.abi.decodeParameters(['address'], results[0])[0],
        accounts[1],
      )
      assert.equal(
        web3.eth.abi.decodeParameters(['string'], results[1])[0],
        'https://ethereum.org/',
      )
    })
  })
})

function dnsName(name) {
  // strip leading and trailing .
  const n = name.replace(/^\.|\.$/gm, '')

  var bufLen = n === '' ? 1 : n.length + 2
  var buf = Buffer.allocUnsafe(bufLen)

  offset = 0
  if (n.length) {
    const list = n.split('.')
    for (let i = 0; i < list.length; i++) {
      const len = buf.write(list[i], offset + 1)
      buf[offset] = len
      offset += len + 1
    }
  }
  buf[offset++] = 0
  return (
    '0x' +
    buf.reduce(
      (output, elem) => output + ('0' + elem.toString(16)).slice(-2),
      '',
    )
  )
}
