// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC4906Upgradeable.sol";

contract James is Initializable, ERC721Upgradeable, AccessControlUpgradeable, IERC4906Upgradeable, IERC1155ReceiverUpgradeable {
	using Counters for Counters.Counter;
	Counters.Counter private _tokenIdCounter;
	uint256 public totalSupply;
	uint256 public salePrice;
	uint256 public saleStartAt;
	uint256 public macMint;
	string public baseURI;
	bytes32 public whitelistMerkleRoot;
	bytes32 public constant MINT_ROLE = keccak256("MINT_ROLE");
	/// @custom:oz-upgrades-unsafe-allow constructor
	constructor() {
		_disableInitializers();
	}
	
	function initialize(
		uint256 _totalSupply,
		uint256 _startTime,
		uint256 _salePrice,
		address _relayer,
		uint256 _maxMint
	) initializer public {
		__ERC721_init("James", "J");
		__AccessControl_init();
		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_grantRole(MINT_ROLE, _relayer);
		require(_totalSupply > 0, "totalSupply must be greater than 0");
		totalSupply = _totalSupply;
		salePrice = _salePrice;
		saleStartAt = _startTime;
		maxMint = _maxMint;
	}
	
	modifier isTokenOwner(uint256 tokenId) {
		require(ownerOf(tokenId) == msg.sender, "James: not owner");
		_;
	}
	
	function setTotalSupply(uint256 _totalSupply) external onlyRole(DEFAULT_ADMIN_ROLE) {
		totalSupply = _totalSupply;
	}
	
	function getCurrentSupply() external view returns (uint256) {
		return _tokenIdCounter.current();
	}
	
	function setSalePrice(uint256 _salePrice) external onlyRole(DEFAULT_ADMIN_ROLE) {
		salePrice = _salePrice;
	}
	
	function setSaleStartAt(uint256 _saleStartAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
		saleStartAt = _saleStartAt;
	}
	
	function setWhitelistMerkleRoot(bytes32 _whitelistMerkleRoot) external onlyRole(DEFAULT_ADMIN_ROLE) {
		whitelistMerkleRoot = _whitelistMerkleRoot;
	}
	
	function safeMint(address to, bytes32[] calldata merkleProof) external payable {
		require(msg.value >= salePrice, "James: not enough bnb sent");
		require(block.timestamp >= saleStartAt, "James: sale has not started");
		require(_tokenIdCounter.current() < totalSupply, "James: max supply reached");
		require(balanceOf(to) <= maxMint, "James: mint limit exceeded");
		if (whitelistMerkleRoot != bytes32(0)) {
			require(
				MerkleProof.verify(merkleProof, whitelistMerkleRoot, keccak256(abi.encodePacked(_msgSender()))),
				"James: invalid merkle proof"
			);
		}
		_tokenIdCounter.increment();
		_safeMint(to, _tokenIdCounter.current());
	}
	
	// The following functions are overrides required by Solidity.
	function _burn(
		uint256 tokenId
	) internal override(ERC721Upgradeable) {
		super._burn(tokenId);
	}
	
	function setBaseURI(string calldata _baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
		baseURI = _baseURI;
		emit BatchMetadataUpdate(1, _tokenIdCounter.current());
	}
	
	function _baseURI() internal override view virtual returns (string memory) {
		return baseURI;
	}
	
	function withdraw() external onlyRole(MINT_ROLE) {
		uint256 balance = address(this).balance;
		(bool success,) = _msgSender().call{value: balance}("");
		require(success, "James: failed to send to owner");
	}
	
	function supportsInterface(
		bytes4 interfaceId
	) public view override(ERC721Upgradeable, IERC165Upgradeable, AccessControlUpgradeable) returns (bool) {
		return interfaceId == bytes4(0x49064906) || super.supportsInterface(interfaceId);
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
