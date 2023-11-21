// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Accessory is ERC1155Upgradeable, OwnableUpgradeable {
    string public name;
    string public symbol;
    uint256 public totalSupply;

    mapping(uint => uint) public energyPoints;

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

    function mint(address _to, uint _id, uint _amount, bytes memory _data) external onlyOwner {
        require(_id > 0 && _id < totalSupply, "Accessory: invalid id");
        require(_to != address(0), "Accessory: invalid address");
        _mint(_to, _id, _amount, _data);
    }

    function mintBatch(address _to, uint[] memory _ids, uint[] memory _amounts, bytes memory _data) external onlyOwner {
        for (uint i; i < _ids.length; i++) {
            require(_ids[i] > 0 && _ids[i] < totalSupply, "Accessory: invalid id");
        }
        require(_to != address(0), "Accessory: invalid address");
        _mintBatch(_to, _ids, _amounts, _data);
    }
}
