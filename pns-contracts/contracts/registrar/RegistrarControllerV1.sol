pragma solidity >=0.8.12;

import "./BaseRegistrarImplementation.sol";
import "./StringUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import {Resolver} from "../resolvers/Resolver.sol";

/**
 * @dev A registrar controller for registering and renewing names at fixed cost.
 */
contract RegistrarControllerV1 is Ownable {
    using StringUtils for *;
    uint256 public constant MIN_REGISTRATION_DURATION = 365 days;
    BaseRegistrarImplementation base;

    constructor(BaseRegistrarImplementation _base, uint _basePrice) {
        base = _base;
        basePrice = _basePrice;
    }

    uint public basePrice;

    event NameRegistered(
        string name,
        bytes32 indexed label,
        address indexed owner,
        uint256 cost,
        uint256 expires
    );
    event NameRenewed(
        string name,
        bytes32 indexed label,
        uint256 cost,
        uint256 expires
    );

    bytes32 public root;

    function register(
        string memory name,
        address owner,
        uint256 duration,
        address resolver
    ) public payable onlyOwner {
        bytes32 label = keccak256(bytes(name));
        uint256 tokenId = uint256(label);
        uint256 cost = rentPrice(name, duration);
        _registerSingleDomain(
            name,
            owner,
            duration,
            resolver,
            tokenId,
            label,
            cost,
            base
        );
        // Refund any extra payment
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
    }

    function _registerSingleDomain(
        string memory name,
        address owner,
        uint256 duration,
        address resolver,
        uint tokenId,
        bytes32 label,
        uint cost,
        BaseRegistrarImplementation registrar
    ) internal {
        // The nodehash of this label
        bytes32 nodehash = keccak256(
            abi.encodePacked(registrar.baseNode(), label)
        );
        // Set this contract as the (temporary) owner, giving it
        uint256 expires;
        // permission to set up the resolver.
        expires = registrar.register(tokenId, address(this), duration);
        // Set the resolver
        registrar.pns().setResolver(nodehash, resolver);
        // Configure the resolver
        Resolver(resolver).setAddr(nodehash, owner);
        Resolver(resolver).setName(nodehash, name);
        // Now transfer full ownership to the expeceted owner
        registrar.reclaim(tokenId, owner);
        registrar.transferFrom(address(this), owner, tokenId);
        emit NameRegistered(name, label, owner, cost, expires);
    }

    function renew(string calldata name, uint256 duration) external payable {
        uint256 cost = rentPrice(name, duration);
        require(msg.value >= cost);

        bytes32 label = keccak256(bytes(name));
        uint256 expires = base.renew(uint256(label), duration);
        emit NameRenewed(name, label, cost, expires);

        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function setBasePrice(uint _price) public onlyOwner {
        basePrice = _price;
    }

    function rentPrice(
        string memory name,
        uint256 duration
    ) public view returns (uint256) {
        // no need to check basePrice
        // require(basePrice > 0, "configuration incorrect");
        uint price = basePrice * duration;
        return price;
    }

    function valid(string memory name) public view returns (bool) {
        if (name.strlen() < 1) {
            return false;
        }
        bytes memory nb = bytes(name);
        // zero width for /u200b /u200c /u200d and U+FEFF

        for (uint256 i; i < nb.length; i++) {
            bytes1 char = nb[i];
            if (char >= 0x41 && char <= 0x5A) {
                return false; //A-Z
            }
        }
        // zero width
        if (nb.length >= 2) {
            for (uint256 i; i < nb.length - 2; i++) {
                if (bytes1(nb[i]) == 0xe2 && bytes1(nb[i + 1]) == 0x80) {
                    if (
                        bytes1(nb[i + 2]) == 0x8b ||
                        bytes1(nb[i + 2]) == 0x8c ||
                        bytes1(nb[i + 2]) == 0x8d
                    ) {
                        return false;
                    }
                } else if (bytes1(nb[i]) == 0xef) {
                    if (bytes1(nb[i + 1]) == 0xbb && bytes1(nb[i + 2]) == 0xbf)
                        return false;
                }
            }
        }
        return true;
    }

    function available(string memory name) public view returns (bool) {
        bytes32 label = keccak256(bytes(name));
        bool _available = true;
        if (!base.available(uint256(label))) {
            _available = false;
        }
        return valid(name) && _available;
    }

    function withdraw(address receiver) public onlyOwner {
        payable(receiver).transfer(address(this).balance);
    }
}
