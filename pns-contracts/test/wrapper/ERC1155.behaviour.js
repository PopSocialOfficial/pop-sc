// Based on https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.1.0/test/token/ERC1155/ERC1155.behaviour.js
// Copyright (c) 2016-2020 zOS Global Limited
// Portions Copyright (c) 2021 Nick Johnson

const namehash = require('eth-ens-namehash').hash
const { BN, constants, expectEvent } = require('@openzeppelin/test-helpers')
const { ZERO_ADDRESS } = constants
const { ethers } = require('hardhat')

const { expect } = require('chai')

const { shouldSupportInterfaces } = require('./SupportsInterface.behaviour')

function shouldBehaveLikeERC1155(
  signers,
  [firstTokenId, secondTokenId, unknownTokenId],
  mint,
) {
  let token,
    minter,
    firstTokenHolder,
    secondTokenHolder,
    multiTokenHolder,
    recipient,
    proxy
  let firstTokenHolderAddress,
    secondTokenHolderAddress,
    multiTokenHolderAddress,
    proxyAddress
  const firstAmount = 1
  const secondAmount = 1
  let ERC1155ReceiverMock

  const RECEIVER_SINGLE_MAGIC_VALUE = '0xf23a6e61'
  const RECEIVER_BATCH_MAGIC_VALUE = '0xbc197c81'

  before(async () => {
    ERC1155ReceiverMock = await ethers.getContractFactory('ERC1155ReceiverMock')
    ;[
      token,
      [
        minter,
        firstTokenHolder,
        secondTokenHolder,
        multiTokenHolder,
        recipient,
        proxy,
      ],
    ] = signers()
    ;[
      firstTokenHolderAddress,
      secondTokenHolderAddress,
      multiTokenHolderAddress,
      recipientAddress,
      proxyAddress,
    ] = await Promise.all(
      [
        firstTokenHolder,
        secondTokenHolder,
        multiTokenHolder,
        recipient,
        proxy,
      ].map((s) => s.getAddress()),
    )
  })

  describe('like an ERC1155', function () {
    describe('balanceOf', function () {
      it('reverts when queried about the zero address', async function () {
        await expect(
          token.balanceOf(ZERO_ADDRESS, firstTokenId),
        ).to.be.revertedWith('ERC1155: balance query for the zero address')
      })

      context("when accounts don't own tokens", function () {
        it('returns zero for given addresses', async function () {
          expect(
            await token.balanceOf(firstTokenHolderAddress, firstTokenId),
          ).to.be.equal('0')

          expect(
            await token.balanceOf(secondTokenHolderAddress, secondTokenId),
          ).to.be.equal('0')

          expect(
            await token.balanceOf(firstTokenHolderAddress, unknownTokenId),
          ).to.be.equal('0')
        })
      })

      context('when accounts own some tokens', function () {
        beforeEach(async function () {
          await mint(firstTokenHolderAddress, secondTokenHolderAddress)
        })

        it('returns the amount of tokens owned by the given addresses', async function () {
          expect(
            await token.balanceOf(firstTokenHolderAddress, firstTokenId),
          ).to.be.equal(firstAmount)

          expect(
            await token.balanceOf(secondTokenHolderAddress, secondTokenId),
          ).to.be.equal(secondAmount)

          expect(
            await token.balanceOf(firstTokenHolderAddress, unknownTokenId),
          ).to.be.equal('0')
        })
      })
    })

    describe('balanceOfBatch', function () {
      it("reverts when input arrays don't match up", async function () {
        await expect(
          token.balanceOfBatch(
            [
              firstTokenHolderAddress,
              secondTokenHolderAddress,
              firstTokenHolderAddress,
              secondTokenHolderAddress,
            ],
            [firstTokenId, secondTokenId, unknownTokenId],
          ),
        ).to.be.revertedWith('ERC1155: accounts and ids length mismatch')

        await expect(
          token.balanceOfBatch(
            [firstTokenHolderAddress, secondTokenHolderAddress],
            [firstTokenId, secondTokenId, unknownTokenId],
          ),
        ).to.be.revertedWith('ERC1155: accounts and ids length mismatch')
      })

      it('reverts when one of the addresses is the zero address', async function () {
        await expect(
          token.balanceOfBatch(
            [firstTokenHolderAddress, secondTokenHolderAddress, ZERO_ADDRESS],
            [firstTokenId, secondTokenId, unknownTokenId],
          ),
        ).to.be.revertedWith('ERC1155: balance query for the zero address')
      })

      context("when accounts don't own tokens", function () {
        it('returns zeros for each account', async function () {
          const result = await token.balanceOfBatch(
            [
              firstTokenHolderAddress,
              secondTokenHolderAddress,
              firstTokenHolderAddress,
            ],
            [firstTokenId, secondTokenId, unknownTokenId],
          )
          expect(result).to.be.an('array')
          expect(result[0]).to.be.equal('0')
          expect(result[1]).to.be.equal('0')
          expect(result[2]).to.be.equal('0')
        })
      })

      context('when accounts own some tokens', function () {
        beforeEach(async function () {
          await mint(firstTokenHolderAddress, secondTokenHolderAddress)
        })

        it('returns amounts owned by each account in order passed', async function () {
          const result = await token.balanceOfBatch(
            [
              secondTokenHolderAddress,
              firstTokenHolderAddress,
              firstTokenHolderAddress,
            ],
            [secondTokenId, firstTokenId, unknownTokenId],
          )
          expect(result).to.be.an('array')
          expect(result[0]).to.be.equal(secondAmount)
          expect(result[1]).to.be.equal(firstAmount)
          expect(result[2]).to.be.equal('0')
        })

        it('returns multiple times the balance of the same address when asked', async function () {
          const result = await token.balanceOfBatch(
            [
              firstTokenHolderAddress,
              secondTokenHolderAddress,
              firstTokenHolderAddress,
            ],
            [firstTokenId, secondTokenId, firstTokenId],
          )
          expect(result).to.be.an('array')
          expect(result[0]).to.be.equal(result[2])
          expect(result[0]).to.be.equal(firstAmount)
          expect(result[1]).to.be.equal(secondAmount)
          expect(result[2]).to.be.equal(firstAmount)
        })
      })
    })

    describe('setApprovalForAll', function () {
      let tx
      beforeEach(async function () {
        tx = await token
          .connect(multiTokenHolder)
          .setApprovalForAll(proxyAddress, true)
      })

      it('sets approval status which can be queried via isApprovedForAll', async function () {
        expect(
          await token.isApprovedForAll(multiTokenHolderAddress, proxyAddress),
        ).to.be.equal(true)
      })

      it('emits an ApprovalForAll log', function () {
        expect(tx)
          .to.emit(token, 'ApprovalForAll')
          .withArgs(multiTokenHolderAddress, proxyAddress, true)
      })

      it('can unset approval for an operator', async function () {
        await token
          .connect(multiTokenHolder)
          .setApprovalForAll(proxyAddress, false)
        expect(
          await token.isApprovedForAll(multiTokenHolderAddress, proxyAddress),
        ).to.be.equal(false)
      })

      it('reverts if attempting to approve self as an operator', async function () {
        await expect(
          token
            .connect(multiTokenHolder)
            .setApprovalForAll(multiTokenHolderAddress, true),
        ).to.be.revertedWith('ERC1155: setting approval status for self')
      })
    })

    describe('safeTransferFrom', function () {
      beforeEach(async function () {
        await mint(multiTokenHolderAddress, multiTokenHolderAddress)
      })

      it('reverts when transferring', async function () {
        await expect(
          token
            .connect(multiTokenHolder)
            .safeTransferFrom(
              multiTokenHolderAddress,
              recipientAddress,
              firstTokenId,
              firstAmount + 1,
              '0x',
            ),
        ).to.be.revertedWith('SOULBOUND: Non-transferable')
      })
    })

    describe('safeBatchTransferFrom', function () {
      beforeEach(async function () {
        await mint(multiTokenHolderAddress, multiTokenHolderAddress)
      })

      it('reverts when transferring', async function () {
        await expect(
          token
            .connect(multiTokenHolder)
            .safeBatchTransferFrom(
              multiTokenHolderAddress,
              recipientAddress,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount + 1],
              '0x',
            ),
        ).to.be.revertedWith('SOULBOUND: Non-transferable')
      })
    })

    shouldSupportInterfaces(() => token, ['ERC165', 'ERC1155'])
  })
}

module.exports = {
  shouldBehaveLikeERC1155,
}
