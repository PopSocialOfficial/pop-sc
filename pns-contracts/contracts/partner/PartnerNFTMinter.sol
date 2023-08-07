// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.4;

import "../registry/PNS.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC1155Receiver.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "../root/Ownable.sol";
import "../resolvers/Resolver.sol";
import "../wrapper/INameWrapper.sol";
import "../registrar/IBaseRegistrar.sol";
import {ReverseRegistrar} from "../reverseRegistrar/ReverseRegistrar.sol";

error AlreadyUsedNFT();
error UnAuthorized();
error DomainNotRegistered();
error InvalidParams();
error SubnameAlreadyUsed();

contract PartnerNFTMinter is Ownable, IERC165, IERC1155Receiver {
    PNS public pns;
    INameWrapper nameWrapper;
    IBaseRegistrar public immutable registrar;
    ReverseRegistrar public immutable reverseRegistrar;

    bytes32 private constant ETH_NODE =
        0x31712e8704e38b18f0689bccb4453e6f517d72e263f5dbf3511c6d361dc70468;
    uint64 private constant MAX_EXPIRY = type(uint64).max;

    mapping(address => mapping(uint256 => bool)) tokenUsed;

    struct Domain {
        address owner;
        address nft;
        bool allowDuplication;
    }

    mapping(bytes32 => Domain) public domains;

    constructor(
        PNS _pns,
        IBaseRegistrar _baseRegistrar,
        INameWrapper _nameWrapper,
        ReverseRegistrar _reverseRegistrar
    ) Ownable() {
        pns = _pns;
        registrar = _baseRegistrar;
        nameWrapper = _nameWrapper;
        reverseRegistrar = _reverseRegistrar;
    }

    function register(
        uint256 nftTokenId,
        bytes32 parentNode,
        string memory label,
        address resolver,
        bytes[] calldata data,
        bool reverseRecord,
        uint32 fuses
    ) external returns (bytes32 node) {
        Domain memory domain = domains[parentNode];

        if (domain.nft == address(0) || domain.owner == address(0))
            revert DomainNotRegistered();

        if (IERC721(domain.nft).ownerOf(nftTokenId) != msg.sender)
            revert UnAuthorized();

        if (!domain.allowDuplication && tokenUsed[domain.nft][nftTokenId])
            revert AlreadyUsedNFT();

        if (
            nameWrapper.ownerOf(
                uint256(_makeNode(parentNode, keccak256(bytes(label))))
            ) != address(0)
        ) {
            revert SubnameAlreadyUsed();
        }

        tokenUsed[domain.nft][nftTokenId] = true;

        node = nameWrapper.setSubnodeRecord(
            parentNode,
            label,
            address(this),
            resolver,
            MAX_EXPIRY,
            fuses,
            MAX_EXPIRY
        );

        if (data.length > 0) {
            _setRecords(resolver, node, data);
        }

        nameWrapper.safeTransferFrom(
            address(this),
            msg.sender,
            uint256(node),
            1,
            ""
        );

        if (reverseRecord) {
            _setReverseRecord(parentNode, label, resolver, msg.sender);
        }
    }

    function setAllowDuplication(bytes32 node, bool allow) external {
        if (domains[node].owner != msg.sender) revert UnAuthorized();
        domains[node].allowDuplication = allow;
    }

    function addDomain(
        bytes32 node,
        address owner,
        address nft,
        bool allowDuplication
    ) external onlyOwner {
        if (
            nameWrapper.ownerOf(uint256(node)) != owner ||
            owner == address(0) ||
            nft == address(0) ||
            node == bytes32(0)
        ) revert InvalidParams();
        domains[node] = Domain({
            owner: owner,
            nft: nft,
            allowDuplication: allowDuplication
        });
    }

    function removeDomain(bytes32 node) external onlyOwner {
        domains[node] = Domain({
            owner: address(0),
            nft: address(0),
            allowDuplication: false
        });
    }

    function _setRecords(
        address resolverAddress,
        bytes32 nodehash,
        bytes[] calldata data
    ) internal {
        // use hardcoded .eth namehash
        Resolver resolver = Resolver(resolverAddress);
        resolver.multicallWithNodeCheck(nodehash, data);
    }

    function _setReverseRecord(
        bytes32 parentNode,
        string memory name,
        address resolver,
        address owner
    ) internal {
        string memory parentName = Resolver(resolver).name(parentNode);
        reverseRegistrar.setNameForAddr(
            msg.sender,
            owner,
            resolver,
            string.concat(name, ".", parentName, ".pop")
        );
    }

    function _makeNode(
        bytes32 node,
        bytes32 labelhash
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(node, labelhash));
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
