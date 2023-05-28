import { ipfs, json, JSONValueKind } from "@graphprotocol/graph-ts";
import {
  BidAccepted as BidAcceptedEvent,
  BidPlaced as BidPlacedEvent,
  BidRejected as BidRejectedEvent,
  BidWithdraw as BidWithdrawEvent,
  OrderCancelled as OrderCancelledEvent,
  OrderCreated as OrderCreatedEvent,
  OrderPurchased as OrderPurchasedEvent,
} from "../generated/PopMarketPlace/PopMarketPlace";
import {
  NFT as NFTContract
} from "../generated/PopMarketPlace/NFT";

import { Bid, NftMeta, Order, Purchase } from "../generated/schema";


class BidStatus {
  static Placed: string = "placed";
  static Accepted: string = "accepted";
  static Rejected: string = "rejected";
  static Withdraw: string = "withdraw";
}
class NftType {
  static ERC1155: string = "ERC1155";
  static ERC721: string = "ERC721";
}


const getIpfsHash = (contract: string): string => {
  if (contract == "0x75362d43640cfe536520448ba2407ada56cd64dc")
    return "bafybeifzcb6wx22lkgfyswao7qvuaoytbo2avl76lfsj43pjrjfbn7qhaa"
  else
    return ""
}

export function handleOrderCreate(event: OrderCreatedEvent): void {
  const orderId = event.params.orderId.toString();
  const nftAddress = event.params.nftContract.toHex();
  const tokenId = event.params.tokenId;

  let OrderInfo = Order.load(orderId);
  let NftMetaInfo = NftMeta.load(`${nftAddress}-${tokenId}`);
  if (!NftMetaInfo) {
    const nftContract = NFTContract.bind(event.params.nftContract);
    const tokenUri = nftContract.try_tokenURI(tokenId);
    if (!tokenUri.reverted && tokenUri.value) {
      NftMetaInfo = new NftMeta(`${nftAddress}-${tokenId}`);

      NftMetaInfo.tokenId = tokenId;
      NftMetaInfo.nftContract = nftAddress;
      NftMetaInfo.tokenUri = tokenUri.value;

      const baseHash = getIpfsHash(nftAddress)

      let data = ipfs.cat(`${baseHash}/${tokenId.toU32() + 1}.json`)
      if (data) {
        let jsonData = json.fromBytes(data)
        if (!jsonData.isNull() && jsonData.kind == JSONValueKind.OBJECT) {
          let value = jsonData.toObject()
          if (value) {
            const name = value.get("name")
            if (name) {
              NftMetaInfo.name = name.toString();
            }
            const image = value.get("image")
            if (image) {
              NftMetaInfo.image = image.toString();
            }
          }
        }
      }
      NftMetaInfo.save()
    }
  }

  if (!OrderInfo) {
    OrderInfo = new Order(orderId);
    OrderInfo.price = event.params.pricePerNFT;
    OrderInfo.seller = event.params.seller.toHex();
    OrderInfo.startTime = event.params.startTime;
    OrderInfo.endTime = event.params.endTime;
    OrderInfo.tokenId = tokenId;
    OrderInfo.copies = event.params.copies;
    OrderInfo.paymentToken = event.params.paymentToken.toHex();
    OrderInfo.nftContract = nftAddress
    OrderInfo.status = true;
    OrderInfo.nftType = event.params.copies === 0 ? NftType.ERC721 : NftType.ERC1155
    OrderInfo.transactionHash = event.transaction.hash.toHex();
    if (NftMetaInfo) {
      OrderInfo.nftMetadata = NftMetaInfo.id
    }
  }
  OrderInfo.save();
}

export function handleOrderCancel(event: OrderCancelledEvent): void {
  const orderId = event.params.orderId.toString();

  const order = Order.load(orderId);

  if (order) {
    order.status = false;
    order.save();
  }
}

export function handleOrderPurchase(event: OrderPurchasedEvent): void {
  const orderId = event.params.orderId.toString();

  const order = Order.load(orderId);

  if (order) {
    const purchase = new Purchase(orderId + "-" + order.copies.toString() + "-" + event.params.copies.toString());
    order.status = !!(order.copies - event.params.copies);
    order.copies -= event.params.copies;
    order.buyer = event.params.buyer.toHex();
    order.save();
    purchase.copies = event.params.copies;
    purchase.buyer = event.params.buyer.toHex();
    purchase.order = orderId;
    purchase.timeStamp = event.block.timestamp;
    purchase.save();
  }
}

export function handleBidPlace(event: BidPlacedEvent): void {
  const orderId = event.params.orderId.toString();
  const bidId = event.params.bidIndex.toString();

  const bid = Bid.load(orderId + "-" + bidId);
  if (!bid) {
    let newBid = new Bid(orderId + "-" + bidId);
    newBid.bidder = event.params.bidder.toHex();
    newBid.copies = event.params.copies;
    newBid.price = event.params.pricePerNFT;
    newBid.startTime = event.params.startTime;
    newBid.endTime = event.params.endTime;
    newBid.status = BidStatus.Placed;
    newBid.order = orderId;
    newBid.transactionHash = event.transaction.hash.toHex();
    newBid.save();
  }
}

export function handleBidAccepted(event: BidAcceptedEvent): void {
  const orderId = event.params.orderId.toString();
  const order = Order.load(orderId);

  const bidId = event.params.bidId.toString();
  const bid = Bid.load(orderId + "-" + bidId);

  if (order && bid) {
    const purchase = new Purchase(orderId + "-" + order.copies.toString() + "-" + event.params.copies.toString());
    order.status = !!(order.copies - event.params.copies);
    order.copies -= event.params.copies;
    order.buyer = bid.bidder;
    order.save();
    purchase.copies = event.params.copies;
    purchase.buyer = bid.bidder;
    purchase.order = orderId;
    purchase.timeStamp = event.block.timestamp;
    purchase.save();

    bid.status = BidStatus.Accepted;
    bid.save();
  }
}
export function handleBidReject(event: BidRejectedEvent): void {
  const orderId = event.params.orderId.toString();
  const bidId = event.params.bidId.toString();
  const bid = Bid.load(orderId + "-" + bidId);

  if (bid) {
    bid.status = BidStatus.Rejected;
    bid.save();
  }
}

export function handleBidWithdraw(event: BidWithdrawEvent): void {
  const orderId = event.params.orderId.toString();
  const bidId = event.params.bidId.toString();
  const bid = Bid.load(orderId + "-" + bidId);

  if (bid) {
    bid.status = BidStatus.Withdraw;
    bid.save();
  }
}