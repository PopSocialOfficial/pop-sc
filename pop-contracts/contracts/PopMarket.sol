// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

contract PopMarketPlace is
    ReentrancyGuardUpgradeable,
    IERC1155ReceiverUpgradeable,
    IERC721ReceiverUpgradeable,
    OwnableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint256 public orderNonce;
    uint256 public platformFees;

    struct Order {
        uint256 tokenId;
        uint256 pricePerNFT;
        uint16 copies;
        address seller;
        uint256 startTime;
        uint256 endTime;
        address paymentToken;
        address nftContract;
    }

    struct Bid {
        address bidder;
        uint256 pricePerNFT;
        uint16 copies;
        uint256 startTime;
        uint256 endTime;
        BidStatus status;
    }

    mapping(uint256 => Order) public order;
    mapping(uint256 => Bid[]) public bids;
    mapping(address => bool) public nftContracts;
    mapping(address => bool) public tokensSupport;

    enum BidStatus {
        Placed,
        Accepted,
        Rejected,
        Withdraw
    }

    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed tokenId,
        uint256 pricePerNFT,
        address seller,
        uint16 copies,
        uint256 startTime,
        uint256 endTime,
        address paymentToken,
        address nftContract
    );
    event OrderCancelled(uint256 indexed orderId);
    event OrderPurchased(uint256 indexed orderId, address buyer, uint16 copies);
    event BidPlaced(
        uint256 indexed orderId,
        uint256 bidIndex,
        address bidder,
        uint16 copies,
        uint256 pricePerNFT,
        uint256 startTime,
        uint256 endTime
    );
    event BidWithdraw(uint256 indexed orderId, uint256 bidId);
    event BidRejected(uint256 indexed orderId, uint256 bidId);
    event BidAccepted(uint256 indexed orderId, uint256 bidId, uint16 copies);

    function initialize(uint256 _platformFees) external initializer {
        platformFees = _platformFees;
        __Ownable_init();
    }

    function addNftContractSupport(address contractAddress) public onlyOwner {
        nftContracts[contractAddress] = true;
    }

    function addTokenSupport(address tokenAddress) public onlyOwner {
        tokensSupport[tokenAddress] = true;
    }

    function setPlatformFees(uint256 fee) external onlyOwner {
        require(fee <= 50000, "High fee");
        platformFees = fee;
    }

    function placeOrderForSell(
        uint256 tokenId,
        address nftContract,
        uint16 copies, // = 0 means 721 NFT
        uint256 pricePerNFT,
        address paymentToken,
        uint256 endTime
    ) external {
        require(
            nftContract != address(0) && nftContracts[nftContract],
            "Invalid NFT Contract"
        );
        require(
            (paymentToken == address(0) || tokensSupport[paymentToken]),
            "Invalid token Contract"
        );
        require(endTime > block.timestamp, "endTime should be in future");
        require(pricePerNFT > 0, "Invalid price");
        order[orderNonce] = Order(
            tokenId,
            pricePerNFT,
            copies,
            msg.sender,
            block.timestamp,
            endTime,
            paymentToken,
            nftContract
        );
        orderNonce++;
        if (copies == 0) {
            IERC721Upgradeable(nftContract).safeTransferFrom(
                msg.sender,
                address(this),
                tokenId
            );
        } else {
            IERC1155Upgradeable(nftContract).safeTransferFrom(
                msg.sender,
                address(this),
                tokenId,
                copies,
                ""
            );
        }
        emit OrderCreated(
            orderNonce - 1,
            tokenId,
            pricePerNFT,
            msg.sender,
            copies,
            block.timestamp,
            endTime,
            paymentToken,
            nftContract
        );
    }

    function cancelOrder(uint256 orderId) external {
        Order storage _order = order[orderId];
        require(_order.seller == msg.sender, "Invalid request");

        if (_order.copies == 0) {
            IERC721Upgradeable(_order.nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                _order.tokenId
            );
        } else {
            IERC1155Upgradeable(_order.nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                _order.tokenId,
                _order.copies,
                ""
            );
        }

        returnAmountToRemainingBidder(orderId);

        delete order[orderId];
        emit OrderCancelled(orderId);
    }

    function buyNow(
        uint256 orderId,
        uint16 copies // copies = 0 if 721 token
    ) public payable nonReentrant {
        Order storage _order = order[orderId];
        require(_order.seller != address(0), "Invalid order request"); // if order is deleted
        require(_order.endTime > block.timestamp, "Order expired");
        require(copies <= _order.copies, "not enough quantity");

        bool isNative = _order.paymentToken == address(0);

        uint256 totalAmount = _order.pricePerNFT * (copies == 0 ? 1 : copies);
        uint256 feeValue = (platformFees * totalAmount) / 10000;

        if (isNative) {
            require(msg.value >= totalAmount, "Not sufficient funds");
            (bool success, ) = payable(_order.seller).call{
                value: totalAmount - feeValue
            }("");
            require(success, "Transfer Failed");
        } else {
            IERC20Upgradeable ERC20Interface = IERC20Upgradeable(
                _order.paymentToken
            );
            ERC20Interface.safeTransferFrom(
                msg.sender,
                address(this),
                totalAmount
            );

            ERC20Interface.safeTransfer(
                (_order.seller),
                totalAmount - feeValue
            );
        }
        if (_order.copies == 0) {
            IERC721Upgradeable(_order.nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                _order.tokenId
            );
        } else {
            IERC1155Upgradeable(_order.nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                _order.tokenId,
                copies,
                ""
            );
        }

        if (_order.copies == copies) {
            returnAmountToRemainingBidder(orderId);
            delete (order[orderId]);
        } else {
            order[orderId].copies -= copies;
        }
        emit OrderPurchased(orderId, msg.sender, copies);
    }

    function bulkBuy(
        uint[] calldata orderIds,
        uint16[] calldata amounts
    ) external payable nonReentrant {
        require(orderIds.length == amounts.length, "Not same length input");
        for (uint i = 0; i < orderIds.length; ++i) {
            uint orderId = orderIds[i];
            uint16 copies = amounts[i];
            buyNow(orderId, copies);
        }
    }

    function placeOfferForOrder(
        uint256 orderId,
        uint16 copies, // 0 for 721
        uint256 pricePerNFT,
        uint256 endTime
    ) external payable {
        Order storage _order = order[orderId];
        require(_order.seller != address(0), "Invalid order request");
        require(_order.seller != msg.sender, "Invalid request");
        require(endTime > block.timestamp, "endTime should be in future");
        require(_order.endTime > block.timestamp, "Order expired ");
        require(copies <= _order.copies, "not enough quantity");

        uint256 totalBids = bids[orderId].length;

        bool isNative = _order.paymentToken == address(0);

        uint256 totalAmount = pricePerNFT * (copies == 0 ? 1 : copies);
        if (isNative) {
            require(msg.value >= totalAmount, "not enough balance");
        } else {
            IERC20Upgradeable ERC20Interface = IERC20Upgradeable(
                _order.paymentToken
            );
            ERC20Interface.safeTransferFrom(
                msg.sender,
                address(this),
                totalAmount
            );
        }
        bids[orderId].push(
            Bid(
                msg.sender,
                pricePerNFT,
                copies,
                block.timestamp,
                endTime,
                BidStatus.Placed
            )
        );

        emit BidPlaced(
            orderId,
            totalBids,
            msg.sender,
            copies,
            pricePerNFT,
            block.timestamp,
            endTime
        );
    }

    function acceptBid(uint256 orderId, uint256 bidId) external nonReentrant {
        Order storage _order = order[orderId];
        Bid storage _bid = bids[orderId][bidId];
        require(_order.seller == msg.sender, "not invlid request");
        require(_order.copies >= _bid.copies, "Nft not available");
        require(_bid.endTime > block.timestamp, "Bid expired");
        require(_bid.status == BidStatus.Placed, "Bid not valid anymore");

        bool isNative = _order.paymentToken == address(0);

        uint256 totalAmount = _bid.pricePerNFT *
            (_bid.copies == 0 ? 1 : _bid.copies);
        uint256 feeValue = (platformFees * totalAmount) / 10000;

        if (_order.copies == 0) {
            IERC721Upgradeable(_order.nftContract).safeTransferFrom(
                address(this),
                _bid.bidder,
                _order.tokenId
            );
        } else {
            IERC1155Upgradeable(_order.nftContract).safeTransferFrom(
                address(this),
                _bid.bidder,
                _order.tokenId,
                _bid.copies,
                ""
            );
        }
        if (isNative) {
            (bool success, ) = payable(_order.seller).call{
                value: totalAmount - feeValue
            }("");
            require(success, "Transfer Failed");
        } else {
            safeTransferAmount(
                _order.paymentToken,
                msg.sender,
                (totalAmount - feeValue)
            );
        }
        bids[orderId][bidId].status = BidStatus.Accepted;
        _order.copies = _order.copies - _bid.copies;
        if (_order.copies == 0) {
            returnAmountToRemainingBidder(orderId);
            delete order[orderId];
        }
        emit BidAccepted(orderId, bidId, _bid.copies);
    }

    function withdrawRejectBid(
        uint256 orderId,
        uint256 bidId,
        bool isReject
    ) external nonReentrant {
        Order storage _order = order[orderId];
        Bid storage _bid = bids[orderId][bidId];
        require(_bid.status == BidStatus.Placed, "cant process");

        if (isReject) {
            require(_order.seller == msg.sender, "cant process");
        } else {
            require(_bid.bidder == msg.sender, "cant process");
        }

        if (isReject) {
            bids[orderId][bidId].status = BidStatus.Rejected;
            emit BidRejected(orderId, bidId);
        } else {
            bids[orderId][bidId].status = BidStatus.Withdraw;
            emit BidWithdraw(orderId, bidId);
        }

        bool isNative = _order.paymentToken == address(0);

        uint256 totalAmount = _bid.pricePerNFT *
            (_bid.copies == 0 ? 1 : _bid.copies);

        if (isNative) {
            (bool success, ) = payable(_bid.bidder).call{value: totalAmount}(
                ""
            );
            require(success, "Transfer Failed");
        } else {
            safeTransferAmount(_order.paymentToken, msg.sender, totalAmount);
        }
    }

    function safeTransferAmount(
        address token,
        address to,
        uint256 amount
    ) private {
        IERC20Upgradeable ERC20Interface = IERC20Upgradeable(token);
        ERC20Interface.safeTransfer(to, amount);
    }

    function withdrawMoney(
        uint256 amount,
        address tokenAddress
    ) external onlyOwner {
        if (tokenAddress == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            require(tokensSupport[tokenAddress], "unsupported token address");
            IERC20Upgradeable ERC20Interface = IERC20Upgradeable(tokenAddress);
            uint256 balance = ERC20Interface.balanceOf(address(this));
            require(balance >= amount, "balance Insufficient");
            ERC20Interface.safeTransfer(owner(), amount);
        }
    }

    function returnAmountToRemainingBidder(uint256 orderId) private {
        Order storage _order = order[orderId];
        bool isNative = _order.paymentToken == address(0);
        for (uint i = 0; i < bids[orderId].length; ++i) {
            if (bids[orderId][i].status == BidStatus.Placed) {
                uint256 amount = (
                    bids[orderId][i].copies == 0 ? 1 : bids[orderId][i].copies
                ) * bids[orderId][i].pricePerNFT;

                bids[orderId][i].status = BidStatus.Rejected;
                emit BidRejected(orderId, i);
                if (isNative) {
                    (bool success, ) = payable(bids[orderId][i].bidder).call{
                        value: amount
                    }("");
                    require(success, "Transfer Failed");
                } else {
                    safeTransferAmount(
                        _order.paymentToken,
                        bids[orderId][i].bidder,
                        amount
                    );
                }
            }
        }
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return (
            bytes4(
                keccak256(
                    "onERC1155Received(address,address,uint256,uint256,bytes)"
                )
            )
        );
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return (
            bytes4(
                keccak256(
                    "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"
                )
            )
        );
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return (
            bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))
        );
    }

    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {
        return
            interfaceId == type(IERC1155ReceiverUpgradeable).interfaceId ||
            interfaceId == type(IERC721ReceiverUpgradeable).interfaceId;
    }
}
