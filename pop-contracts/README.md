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

#### FAQ
What if Order is expired :
- No-one can a make new offer or buy the NFT/Order.
- Offer Expiry time can be greater than order expiry time. hence seller can accept offer even after order expired.
- Seller have to either accept any active order or cancel order to get NFT back in wallet.
- Seller can Cancel Order Anytime Irrespective of the endtime.
- Seller can accept or reject any already place valid offer (not expired).
- Bidder can also withdraw their bid any time irrespective of endtime on order or offer.

What if Offer is expired : 
- Seller cannot accept the offer after expiry.
- Bidder have to withdraw funds/offer manually by canceling the offer.
- If order is canceled or purchased completely, all bids will be rejected hence funds transferd back automatically.


## Max

Max is a special/modified ERC721 contract. <br/>
- Anyone can mint a MAX NFT by providing/locking 1-6 max components.
- Max contract keep and lock MaxComponents to mint a single MAX NFT.
- Fur max component is necessary, others are optional.  
- Each token will contain 6 max components tokenId, which can also be updated.
- Max component TokenId >= 600 is considered as empty / null 
- Input sequence is `[background   clothes   eyes  fur   hat    mouth ]`

```
this is how ids are structured:
background   -> 0 - 99
clothes      -> 100 - 199
eyes         -> 200 - 299
fur          -> 300 - 399
hat          -> 400 - 499
mouth        -> 500 - 599
```

<img width="200" alt="image" src="https://github.com/Popoodev/market-place/assets/135818937/9383a051-4f28-478d-b029-876db39499de">


### Dynamic NFTs contract calls
before calling write method on contract , tokens need to be approved  : 

(Max Components Calls ) call :  
check if user has approved  
```
 isApprovedForAll (wallet-address,  DynamicNFTContractAddress)
```
returns boolean
if false 

(Max Components Calls )  call :
```
setApprovalForAll ( DynamicNFTContractAddress,  true )
```
Refer:  https://github.com/Popoodev/popoo-app/blob/4e5971dfb872eba078e99b8b5953fd99c84eb5ed/src/stores/nftMarket.ts#L95

After Approval is done :
- If User Dont have any dynamic NFT 
```
 safeMint ( [ array of 6 max components] , ipfs-hash-of-comined-6-images  )
eg:   safeMint( [0, 100, 200, 300, 700, 500] , "https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja");
-keep in mind the order -> [background   clothes   eyes  fur   hat    mouth ]
```

- Existing NFT
```
updateComponents( DynamicNFT-tokenId,  [ array of 6 max components] , ipfs-hash-of-comined-6-images );
eg:   updateComponents( 0   ,   [1, 101, 201, 301, 700, 500] , "https://nftstorage.link/ipfs/bafybeib4nrtcbbzrv6kipfdz6elzlld5o7qxrpp6szfrzqka3cltohrbja");
```
Note: - 
- tokenId >= 600 means empty / no max
- fur cannot be empty , to mint / update needs at least a fur
- if no change , keep the id same 
- input array should contain only tokenId owned by user ( if <600 ), otherwise call fails,
- revalidate above fetch queries after contract call is success , (wait for finality)
