// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

contract Genesis is Initializable, ERC721Upgradeable, AccessControlUpgradeable, ERC721URIStorageUpgradeable, IERC1155ReceiverUpgradeable {
    using Counters for Counters.Counter;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct Accessory {
        address contractAddr;
        uint256 accessoryId;
    }

    Counters.Counter private _tokenIdCounter;
    mapping(address => bool) public whitelistedContracts;
    mapping(address => bool) public whitelistedEOA;
    // hat --> 0
    // fur --> 1
    // clothes --> 2
    // glasses --> 3
    // mapping(tokenId => mapping(accessoryTypeId => Accessory))
    mapping(uint256 => mapping(uint256 => Accessory)) public equippedAccessories;
    mapping(uint256 => address) public accessoryOrder;
    uint8 public accessorySlots;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address[] memory _whitelistedContracts) initializer public {
        __ERC721_init("Popbit", "PBT");
        __ERC721URIStorage_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        accessorySlots = 4;
        setWhitelisted(_whitelistedContracts, 4);
    }

    modifier isTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        _;
    }

    modifier onlyWhitelisted() {
        require(whitelistedEOA[msg.sender] == true, "not whitelisted");
        _;
    }

    modifier validAccessories(Accessory[] memory _accessories) {
        require(_accessories.length <= accessorySlots, "wrong length");
        for(uint256 i; i < _accessories.length; i++){
            require(whitelistedContracts[_accessories[i].contractAddr] == true, "not whitelisted");
            require(accessoryOrder[i] == _accessories[i].contractAddr, "wrong order");
        }
        _;
    }

    function getTotalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function addToWhitelist(address[] calldata _whitelistAddrs) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint i; i < _whitelistAddrs.length; i++) {
            whitelistedEOA[_whitelistAddrs[i]] = true;
        }
    }

    /**
     * @notice Remove from whitelist
     */
    function removeFromWhitelist(address[] calldata _whitelistAddrs) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint i = 0; i < _whitelistAddrs.length; i++) {
            whitelistedEOA[_whitelistAddrs[i]] = false;
        }
    }

    function deEquipAllAccessories(uint256 _tokenId) external isTokenOwner(_tokenId) {
        for(uint i; i < accessorySlots; i++){
            if(equippedAccessories[_tokenId][i].accessoryId != 0){
                IERC1155Upgradeable(equippedAccessories[_tokenId][i].contractAddr).safeTransferFrom(address(this), msg.sender, _tokenId, 1, "");
                equippedAccessories[_tokenId][i] = Accessory(address(0), 0);
            }
        }
    }

    function deEquipAccessory(uint256 _tokenId, uint256 accessoryType) external isTokenOwner(_tokenId) {
        require(accessoryType <= accessorySlots, 'invalid accessoryType');
        require(equippedAccessories[_tokenId][accessoryType].accessoryId != 0, "accessory already de-equipped");
        IERC1155Upgradeable(equippedAccessories[_tokenId][accessoryType].contractAddr).safeTransferFrom(address(this), msg.sender, _tokenId, 1, "");
        equippedAccessories[_tokenId][accessoryType] = Accessory(address(0), 0);
    }

    function equipAccessories(uint256 _tokenId, Accessory[] calldata _accessories, string memory _uri) external isTokenOwner(_tokenId) validAccessories(_accessories) {
        for(uint i; i < _accessories.length; i++) {
            Accessory memory previous = equippedAccessories[_tokenId][i];
            if(previous.contractAddr != address(0) && previous.accessoryId != 0){
                IERC1155Upgradeable(previous.contractAddr).safeTransferFrom(address(this), msg.sender, previous.accessoryId, 1, "");
            }
            Accessory memory current = _accessories[i];
            if(current.accessoryId != 0){
                IERC1155Upgradeable(current.contractAddr).safeTransferFrom(msg.sender, address(this), current.accessoryId, 1, "");
            }
            equippedAccessories[_tokenId][i] = current;
        }
        _setTokenURI(_tokenId, _uri);
    }

    function setAccessoryOrder(address[] calldata accessoryContracts) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for(uint i; i < accessoryContracts.length; i++){
            accessoryOrder[i] = accessoryContracts[i];
        }
    }

    function setWhitelisted(address[] memory _whitelistedContracts, uint8 _accessorySlots) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_whitelistedContracts.length == _accessorySlots, "wrong length");
        for(uint i; i < _whitelistedContracts.length; i++){
            whitelistedContracts[_whitelistedContracts[i]] = true;
        }
        accessorySlots = _accessorySlots;
    }

    function setAccessorySlots(uint8 _accessorySlots) external onlyRole(DEFAULT_ADMIN_ROLE) {
        accessorySlots = _accessorySlots;
    }

    function addWhitelistedContract(address _contractAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_contractAddr != address(0), 'no address 0');
        whitelistedContracts[_contractAddr] = true;
    }

    function removeWhitelistedContracts(address[] memory _whitelistedContracts) public onlyRole(DEFAULT_ADMIN_ROLE) {
        for(uint i; i < _whitelistedContracts.length; i++){
            if(whitelistedContracts[_whitelistedContracts[i]] == true){
                whitelistedContracts[_whitelistedContracts[i]] = false;
            }
        }
    }

    function claim(uint256 tokenId) external onlyWhitelisted {
        require(balanceOf(msg.sender) == 0, "max 1 per wallet");
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
    }

    function safeMint(address to, uint256 tokenId) external onlyRole(MINTER_ROLE) {
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    // The following functions are overrides required by Solidity.
    function _burn(
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable, IERC165Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
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
}
