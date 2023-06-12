# Pop Contracts - Hardhat Project

## Pop MarketPlace

Notable design decisions:

- To know which order is for ERC721 nft or ERC1155 (i.e nftContract), is reflected by copies param/arg.<br />
  copies == 0 , signifies ERC721 nft<br />
  and copies > 0 , is ERC1155 (therefore also can't place or buy 0 size order)<br />
  if no. of copies for ERC1155 goes down to zero, by that time order is alredy deleted.<br />
  and all bids are also rejected.<br />
  -> therefore this argument has to passed at correctly from caller side.<br />
  (Todo: planning to do it with interfaceId, if any issue/bug occurs )

- pricePerNFT can be 0 (maybe useful as nft drop and claim or something).
- bid can be even high or low than the stated price.
- (Todo improv.) withdrawMoney needs to be used carefully,<br />
  calls will fail if no enough balance in contract for escrow operations

## Max

Max is a special/modified ERC721 contract. <br/>
- Anyone can mint a MAX NFT by providing/lockind 1-6 max components.
- Each token will contain 6 max components tokenId, which can also be updated
