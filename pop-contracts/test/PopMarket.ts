import { ethers } from "hardhat";
import { Contract, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { PopCardERC721, PopMarketPlace } from "../typechain-types";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const NativeAddress = "0x0000000000000000000000000000000000000000";

describe("marketPlace", function () {
  let PopCardERC721: PopCardERC721, PopMarketPlace: PopMarketPlace, erc20TestToken: Contract;
  let [owner, seller1, seller2, buyer1, buyer2, bidder1, bidder2]: SignerWithAddress[] = []
  let tokenId = 0;
  const ONE_DAY_IN_SECS = 24 * 60 * 60;
  const ONE_HOUR_IN_SECS = 60 * 60;
  // runs once before the first test in this block
  before(async function () {
    [owner, seller1, seller2, buyer1, buyer2, bidder1, bidder2] = await ethers.getSigners();
    // ERC20
    const factory_ERC20 = await ethers.getContractFactory("PopToken");
    erc20TestToken = await factory_ERC20.deploy("Test Token for test", "TTT", 18);
    await erc20TestToken.deployed();
    // ERC721
    const factory_ERC721 = await ethers.getContractFactory("PopCardERC721");
    PopCardERC721 = await factory_ERC721.deploy();
    await PopCardERC721.deployed();
    // MP
    const factory_MP = await ethers.getContractFactory("PopMarketPlace");
    PopMarketPlace = await factory_MP.deploy();
    await PopMarketPlace.deployed();
    const iniTx = await PopMarketPlace.initialize(0);
    await iniTx.wait();
    //  Add Support 
    await PopCardERC721.setApprovalForAll(PopMarketPlace.address, true);

    await PopMarketPlace.addNftContractSupport(PopCardERC721.address);
    await PopMarketPlace.addTokenSupport(erc20TestToken.address);

    expect(await PopMarketPlace.nftContracts(PopCardERC721.address)).to.equal(true);
    expect(await PopMarketPlace.tokensSupport(erc20TestToken.address)).to.equal(true);

    await erc20TestToken.connect(buyer1).mint(ethers.utils.parseEther("100"));
    await erc20TestToken.connect(buyer1).approve(PopMarketPlace.address, ethers.utils.parseEther("100"))
    await erc20TestToken.connect(buyer2).mint(ethers.utils.parseEther("100"));
    await erc20TestToken.connect(buyer2).approve(PopMarketPlace.address, ethers.utils.parseEther("100"))
    await erc20TestToken.connect(bidder1).mint(ethers.utils.parseEther("100"));
    await erc20TestToken.connect(bidder1).approve(PopMarketPlace.address, ethers.utils.parseEther("100"))
    await erc20TestToken.connect(bidder2).mint(ethers.utils.parseEther("100"));
    await erc20TestToken.connect(bidder2).approve(PopMarketPlace.address, ethers.utils.parseEther("100"))
  });

  afterEach(function () {
    tokenId++
  })

  describe('ERC721', function () {
    describe('ERC20 Token', function () {
      it("Create order and place bids", async function () {
        await PopCardERC721.safeMint(seller1.address, tokenId);
        (await PopCardERC721.connect(seller1).setApprovalForAll(PopMarketPlace.address, true)).wait()
        const unlockTime = (await time.latest()) + ONE_DAY_IN_SECS
        const bid1Time = (await time.latest()) + ONE_HOUR_IN_SECS
        const bid2Time = (await time.latest()) + (2 * ONE_DAY_IN_SECS)
        const tx = await PopMarketPlace.connect(seller1).placeOrderForSell(
          tokenId,
          PopCardERC721.address,
          0,
          ethers.utils.parseEther("5"),
          erc20TestToken.address,
          unlockTime,
        );
        const receipt = await tx.wait();
        const interfaceTx = new ethers.utils.Interface(["event OrderCreated(uint256 indexed orderId, uint256 indexed tokenId, uint256 pricePerNFT, address seller, uint16 copies, uint256 startTime, uint256 endTime, address paymentToken, address nftContract);"]);
        const data = receipt.logs[1].data;
        const topics = receipt.logs[1].topics;
        const event = interfaceTx.decodeEventLog("OrderCreated", data, topics);

        expect(event.seller).to.equal(seller1.address);
        expect(event.paymentToken).to.equal(erc20TestToken.address);
        expect(event.pricePerNFT).to.equal(ethers.utils.parseEther("5"));
        expect(event.endTime).to.equal(unlockTime);
        expect(await PopCardERC721.balanceOf(seller1.address)).to.equal(0)
        // OrderCreated ^
        const bid1_tx = await PopMarketPlace.connect(bidder1).placeOfferForOrder(event.orderId, 0,
          ethers.utils.parseEther("6"),
          bid1Time
        );
        const bid2_tx = await PopMarketPlace.connect(bidder2).placeOfferForOrder(event.orderId, 0,
          ethers.utils.parseEther("3"),
          bid2Time
        );
        // two bids palced 
        const bid_receipt = await bid1_tx.wait();
        const bid_interfaceTx = new ethers.utils.Interface(["event BidPlaced(uint256 indexed orderId, uint256 bidIndex, address bidder, uint16 copies, uint256 pricePerNft, uint256 startTime, uint256 endTime);"]);
        const bid_data = bid_receipt.logs[2].data;
        const bid_topics = bid_receipt.logs[2].topics;
        const bid_event = bid_interfaceTx.decodeEventLog("BidPlaced", bid_data, bid_topics);

        expect(bid_event.orderId).to.equal(event.orderId);
        expect(bid_event.bidder).to.equal(bidder1.address);
        expect(bid_event.endTime).to.equal(bid1Time);
        expect(bid_event.pricePerNft).to.equal(ethers.utils.parseEther("6"));

        expect(await erc20TestToken.balanceOf(PopMarketPlace.address)).to.equal(ethers.utils.parseEther("9"))

        // ABOVE SET UP DONE 
        // ----------------------------
        // Declare Individual Independent Tests
        const DIRECT_BUY = async () => {
          console.log("Direct buy tested")
          // someone direct buy 
          const buy_tx = await PopMarketPlace.connect(buyer1).buyNow(event.orderId, 0);
          const buy_receipt = await buy_tx.wait();
          // console.log(buy_receipt);
          const buy_interfaceTx = new ethers.utils.Interface(["event OrderPurchased(uint256 indexed orderId, address buyer, uint16 copies);"]);
          const buy_data = buy_receipt.logs[8].data;
          const buy_topics = buy_receipt.logs[8].topics;
          const buy_event = buy_interfaceTx.decodeEventLog("OrderPurchased", buy_data, buy_topics);
          expect(buy_event.orderId).to.equal(event.orderId);
          expect(buy_event.buyer).to.equal(buyer1.address);

          const afterbuy_orderInfo = await PopMarketPlace.order(event.orderId);
          // console.log(afterbuy_orderInfo)
          expect(afterbuy_orderInfo.nftContract).to.equal("0x0000000000000000000000000000000000000000")
          expect(await PopCardERC721.balanceOf(PopMarketPlace.address)).to.equal(0)
          expect(await PopCardERC721.balanceOf(buyer1.address)).to.equal(1)

          expect(await erc20TestToken.balanceOf(PopMarketPlace.address)).to.equal(0)
          expect(await erc20TestToken.balanceOf(buyer1.address)).to.equal(ethers.utils.parseEther("95"))
          expect(await erc20TestToken.balanceOf(seller1.address)).to.equal(ethers.utils.parseEther("5"))
          expect(await erc20TestToken.balanceOf(bidder1.address)).to.equal(ethers.utils.parseEther("100"))
          expect(await erc20TestToken.balanceOf(bidder2.address)).to.equal(ethers.utils.parseEther("100"))
        }
        const CANCEL_ORDER = async () => {
          console.log("CANCEL_ORDER tested")
          // direct buy after expiry
          await time.increaseTo(unlockTime);
          await expect(PopMarketPlace.buyNow(event.orderId, 0)).to.be.revertedWith("Order expired");

          // cacel order after expiry
          const cancel_tx = await PopMarketPlace.connect(seller1).cancelOrder(event.orderId);
          const cancel_receipt = await cancel_tx.wait();
          console.log("cancel_receipt: ", cancel_receipt);

          const aftercancel_orderInfo = await PopMarketPlace.order(event.orderId);
          // console.log(aftercancel_orderInfo)
          expect(aftercancel_orderInfo.nftContract).to.equal("0x0000000000000000000000000000000000000000")
          expect(aftercancel_orderInfo.seller).to.equal("0x0000000000000000000000000000000000000000")
          expect(await PopCardERC721.balanceOf(PopMarketPlace.address)).to.equal(0)
          expect(await PopCardERC721.balanceOf(seller1.address)).to.equal(1)

          expect(await erc20TestToken.balanceOf(PopMarketPlace.address)).to.equal(0)
          expect(await erc20TestToken.balanceOf(bidder1.address)).to.equal(ethers.utils.parseEther("100"))
          expect(await erc20TestToken.balanceOf(bidder2.address)).to.equal(ethers.utils.parseEther("100"))
        }
        const ACCEPT_BID = async () => {
          console.log("ACCEPT_BID tested")
          await time.increaseTo(bid1Time);
          await expect(PopMarketPlace.connect(seller1).acceptBid(event.orderId, bid_event.bidIndex)).to.be.revertedWith("Bid expired");

          // accept bid2 after order expiry
          const bidAccept_tx = await PopMarketPlace.connect(seller1).acceptBid(event.orderId, 1);
          const bidAccept_receipt = await bidAccept_tx.wait();
          console.log("bidAccept_receipt: ", bidAccept_receipt);
          const bidAccept_interfaceTx = new ethers.utils.Interface(["event BidAccepted(uint256 indexed orderId, uint256 bidId, uint16 copies);"]);
          const bidAccept_data = bidAccept_receipt.logs[4].data;
          const bidAccept_topics = bidAccept_receipt.logs[4].topics;
          const bidAccept_event = bidAccept_interfaceTx.decodeEventLog("BidAccepted", bidAccept_data, bidAccept_topics);
          console.log("bidAccept_event", bidAccept_event);

          const afterbidAccept_orderInfo = await PopMarketPlace.order(event.orderId);
          // console.log(afterbidAccept_orderInfo)
          expect(afterbidAccept_orderInfo.nftContract).to.equal("0x0000000000000000000000000000000000000000")
          expect(afterbidAccept_orderInfo.seller).to.equal("0x0000000000000000000000000000000000000000")
          expect(await PopCardERC721.balanceOf(PopMarketPlace.address)).to.equal(0)
          expect(await PopCardERC721.balanceOf(bidder2.address)).to.equal(1)

          expect(await erc20TestToken.balanceOf(PopMarketPlace.address)).to.equal(0)
          expect(await erc20TestToken.balanceOf(bidder2.address)).to.equal(ethers.utils.parseEther("97"))
          expect(await erc20TestToken.balanceOf(bidder1.address)).to.equal(ethers.utils.parseEther("100"))
        }



        // Call only one of below
        // await DIRECT_BUY()
        // await CANCEL_ORDER()
        await ACCEPT_BID()
      });
      it("Bulk Buy", async function () {

      })
    });
  });
});
