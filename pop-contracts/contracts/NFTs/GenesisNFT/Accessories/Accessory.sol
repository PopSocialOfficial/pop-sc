// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Accessory is ERC1155Upgradeable, OwnableUpgradeable, EIP712Upgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    string public name;
    string public symbol;
    uint256 public totalSupply;
    mapping(uint => uint) public energyPoints;
    mapping(address => CountersUpgradeable.Counter) private _nonces;
    bytes32 private constant _EIP712_TYPEHASH = keccak256("ServerSign(address _to,uint _id,uint _amount,uint _order_id,address _accessory,uint nonce,uint deadline)");

    address public trustedSender = 0x42c4e30b6af9C1b730F016C0B29dCc3Ab41bb745;

    event ServerReport(uint);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _name, string memory _symbol, string memory _uri, uint256 _totalSupply) initializer public {
        __ERC1155_init(_uri);
        __Ownable_init();
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;

        EIP712Upgradeable.__EIP712_init(_name, "1");
    }

    function setPoint(uint _id, uint _points) external onlyOwner {
        energyPoints[_id] = _points;
    }

    function setUri(string memory _uri) external onlyOwner {
        _setURI(_uri);
    }

    function setTotalSupply(uint _totalSupply) external onlyOwner {
        totalSupply = _totalSupply;
    }

    function setTrustedSender(address _newTrustedSender) external onlyOwner {
        trustedSender = _newTrustedSender;
    }

    function verify(
        address _to,
        uint _id,
        uint _amount,
        uint _order_id,
        address _accessory,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public returns (bool) {
        require(block.timestamp <= deadline + 60, "Accessory: expired deadline");
        bytes32 structHash = keccak256(abi.encode(
            _EIP712_TYPEHASH,
            _to,
            _id,
            _amount,
            _order_id,
            _accessory,
            _useNonce(msg.sender),
            deadline)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSAUpgradeable.recover(hash, v, r, s);
        return signer == trustedSender;
    }

    function mint(address _to, uint _id, uint _amount, uint order_id, uint deadline, bytes memory _data, uint8 v, bytes32 r, bytes32 s) external {
        require(_id > 0 && _id <= totalSupply, "Accessory: invalid id");
        require(_to != address(0), "Accessory: invalid address");
        require(verify(_to, _id, _amount, order_id, address(this), deadline, v, r, s), "Accessory: unavailable signature");
        _mint(_to, _id, _amount, _data);
        emit ServerReport(order_id);
    }

    function mintBatch(address _to, uint[] memory _ids, uint[] memory _amounts, bytes memory _data) external onlyOwner {
        for (uint i; i < _ids.length; i++) {
            require(_ids[i] > 0 && _ids[i] <= totalSupply, "Accessory: invalid id");
        }
        require(_to != address(0), "Accessory: invalid address");
        _mintBatch(_to, _ids, _amounts, _data);
    }

    function nonces(address owner) public view virtual returns (uint256) {
        return _nonces[owner].current();
    }

    function _useNonce(address owner) internal virtual returns (uint256 current) {
        CountersUpgradeable.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }
}
