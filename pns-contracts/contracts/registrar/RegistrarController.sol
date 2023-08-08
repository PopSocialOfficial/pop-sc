//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import {BaseRegistrarImplementation} from "./BaseRegistrarImplementation.sol";
import {StringUtils} from "./StringUtils.sol";
import {Resolver} from "../resolvers/Resolver.sol";
import {PNS} from "../registry/PNS.sol";
import {ReverseRegistrar} from "../reverseRegistrar/ReverseRegistrar.sol";
import {ReverseClaimer} from "../reverseRegistrar/ReverseClaimer.sol";
import {IRegistrarController} from "./IRegistrarController.sol";

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {INameWrapper} from "../wrapper/INameWrapper.sol";
import {ERC20Recoverable} from "../utils/ERC20Recoverable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
error NameNotAvailable(string name);
error DurationTooShort(uint256 duration);
error ResolverRequiredWhenDataSupplied();
error InsufficientValue();
error Unauthorised(bytes32 node);
error TokenNotSupported();
error DefaultResolverNotConfigured();

/**
 * @dev A registrar controller for registering and renewing names at fixed cost.
 */
contract RegistrarController is
    IRegistrarController,
    IERC165,
    ERC20Recoverable,
    ReverseClaimer,
    AccessControl
{
    using StringUtils for *;
    using Address for address;
    using SafeERC20 for IERC20;

    uint256 public constant MIN_REGISTRATION_DURATION = 28 days;
    bytes32 private constant ETH_NODE =
        0x31712e8704e38b18f0689bccb4453e6f517d72e263f5dbf3511c6d361dc70468;
    uint64 private constant MAX_EXPIRY = type(uint64).max;
    BaseRegistrarImplementation immutable base;
    ReverseRegistrar public immutable reverseRegistrar;
    INameWrapper public immutable nameWrapper;
    address public defaultResolver;

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    mapping(address => uint256) public basePrice;

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

    constructor(
        BaseRegistrarImplementation _base,
        ReverseRegistrar _reverseRegistrar,
        INameWrapper _nameWrapper,
        PNS _ens,
        uint256 _basePrice
    ) ReverseClaimer(_ens, msg.sender) {
        base = _base;
        reverseRegistrar = _reverseRegistrar;
        nameWrapper = _nameWrapper;
        basePrice[address(0)] = _basePrice;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(RELAYER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function rentPrice(
        string memory name,
        uint256 duration,
        address token
    ) public view override returns (uint256 price) {
        // no need to check basePrice
        // require(basePrice > 0, "configuration incorrect");
        price = basePrice[token] * duration;
    }

    function valid(string memory name) public pure returns (bool) {
        return name.strlen() >= 3;
    }

    function available(string memory name) public view override returns (bool) {
        bytes32 label = keccak256(bytes(name));
        return valid(name) && base.available(uint256(label));
    }

    function registerWithRelayer(
        string calldata name,
        address owner,
        bytes[] calldata data
    ) public override onlyRole(RELAYER_ROLE) {
        if (defaultResolver == address(0))
            revert DefaultResolverNotConfigured();
        _register(name, owner, MAX_EXPIRY, defaultResolver, data, true, 0, 0);
    }

    function register(
        string calldata name,
        address owner,
        uint256 duration,
        address resolver,
        bytes[] calldata data,
        bool reverseRecord,
        uint16 ownerControlledFuses
    ) public payable override {
        uint256 price = rentPrice(name, duration, address(0));
        if (msg.value < price) {
            revert InsufficientValue();
        }
        _register(
            name,
            owner,
            duration,
            resolver,
            data,
            reverseRecord,
            ownerControlledFuses,
            price
        );

        if (msg.value > (price)) {
            payable(msg.sender).transfer(msg.value - (price));
        }
    }

    function registerWithERC20(
        string calldata name,
        address owner,
        uint256 duration,
        address resolver,
        bytes[] calldata data,
        uint16 ownerControlledFuses,
        address token
    ) public override {
        if (basePrice[token] == 0) revert TokenNotSupported();
        uint256 price = rentPrice(name, duration, token);
        _register(
            name,
            owner,
            duration,
            resolver,
            data,
            true,
            ownerControlledFuses,
            price
        );

        IERC20(token).safeTransferFrom(msg.sender, address(this), price);
    }

    function _register(
        string calldata name,
        address owner,
        uint256 duration,
        address resolver,
        bytes[] calldata data,
        bool reverseRecord,
        uint16 ownerControlledFuses,
        uint256 price
    ) internal {
        if (!available(name)) {
            revert NameNotAvailable(name);
        }

        if (duration < MIN_REGISTRATION_DURATION) {
            revert DurationTooShort(duration);
        }

        if (data.length > 0 && resolver == address(0)) {
            revert ResolverRequiredWhenDataSupplied();
        }

        uint256 expires = nameWrapper.registerAndWrapETH2LD(
            name,
            owner,
            duration,
            resolver,
            ownerControlledFuses
        );

        if (data.length > 0) {
            _setRecords(resolver, keccak256(bytes(name)), data);
        }

        if (reverseRecord) {
            _setReverseRecord(name, resolver, msg.sender);
        }

        emit NameRegistered(
            name,
            keccak256(bytes(name)),
            owner,
            price,
            expires
        );
    }

    function renew(
        string calldata name,
        uint256 duration
    ) external payable override {
        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        uint256 price = rentPrice(name, duration, address(0));
        if (msg.value < price) {
            revert InsufficientValue();
        }
        uint256 expires = nameWrapper.renew(tokenId, duration);

        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit NameRenewed(name, labelhash, msg.value, expires);
    }

    function withdraw() public {
        payable(owner()).transfer(address(this).balance);
    }

    function setBasePrice(
        address token,
        uint price
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        basePrice[token] = price;
    }

    function setDefaultResolver(
        address resolver
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        defaultResolver = resolver;
    }

    function supportsInterface(
        bytes4 interfaceID
    ) public view override(IERC165, AccessControl) returns (bool) {
        return
            interfaceID == type(IRegistrarController).interfaceId ||
            super.supportsInterface(interfaceID);
    }

    /* Internal functions */

    function _setRecords(
        address resolverAddress,
        bytes32 label,
        bytes[] calldata data
    ) internal {
        // use hardcoded .eth namehash
        bytes32 nodehash = keccak256(abi.encodePacked(ETH_NODE, label));
        Resolver resolver = Resolver(resolverAddress);
        resolver.multicallWithNodeCheck(nodehash, data);
    }

    function _setReverseRecord(
        string memory name,
        address resolver,
        address owner
    ) internal {
        reverseRegistrar.setNameForAddr(
            msg.sender,
            owner,
            resolver,
            string.concat(name, ".pop")
        );
    }
}
