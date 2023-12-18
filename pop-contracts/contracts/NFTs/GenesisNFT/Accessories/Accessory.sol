// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Accessory is ERC1155Upgradeable, OwnableUpgradeable {
    string public name;
    string public symbol;
    uint256 public totalSupply;

    mapping(uint => uint) public energyPoints;

    event ServerReport(uint);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _name, string memory _symbol, string memory uri_, uint256 _totalSupply) initializer public {
        __ERC1155_init(uri_);
        __Ownable_init();
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
    }

    function setPoint(uint _id, uint _points) external onlyOwner {
        energyPoints[_id] = _points;
    }

    function setUri(string memory uri_) external onlyOwner {
        _setURI(uri_);
    }

    function setTotalSupply(uint _totalSupply) external onlyOwner {
        totalSupply = _totalSupply;
    }


    function verify(
        address _to,
        uint _id,
        uint _amount,
        address _accessory,
        bytes memory signature
    ) public view returns (bool) {
        address signer = recoverSigner(_to, _id, _amount, _accessory, signature);
        return signer == address(0x42c4e30b6af9C1b730F016C0B29dCc3Ab41bb745);
    }

    function recoverSigner(
        address _to,
        uint _id,
        uint _amount,
        address _accessory,
        bytes memory signature
    ) private pure returns (address) {
        bytes32 msgHash = keccak256(abi.encodePacked(_to, _id, _amount, _accessory));
        bytes32 msgEthHash = ECDSA.toEthSignedMessageHash(msgHash);
        address signer = ECDSA.recover(msgEthHash, signature);
        return signer;
    }

    function mint(address _to, uint _id, uint _amount, bytes memory _data, bytes calldata signature) external {
        require(_id > 0 && _id < totalSupply, "Accessory: invalid id");
        require(_to != address(0), "Accessory: invalid address");
        require(verify(_to, _id, _amount, address(this), signature), "Accessory: unavailable signature");
        _mint(_to, _id, _amount, _data);
        emit ServerReport(11111);
    }

    function mintBatch(address _to, uint[] memory _ids, uint[] memory _amounts, bytes memory _data) external onlyOwner {
        for (uint i; i < _ids.length; i++) {
            require(_ids[i] > 0 && _ids[i] < totalSupply, "Accessory: invalid id");
        }
        require(_to != address(0), "Accessory: invalid address");
        _mintBatch(_to, _ids, _amounts, _data);
    }
}
