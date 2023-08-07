// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Accessory is ERC1155, Ownable {
    string public name;
    string public symbol;

    mapping(uint => string) public tokenURI;
    mapping(uint => uint) public energyPoints;

    constructor(string memory _name, string memory _symbol) ERC1155("") {
        name = _name;
        symbol = _symbol;
    }

    function setURI(
        uint _id,
        string memory _uri,
        uint _points
    ) external onlyOwner {
        energyPoints[_id] = _points;
        tokenURI[_id] = _uri;
        emit URI(_uri, _id);
    }

    function mint(
        address _to,
        uint _id,
        uint _amount,
        bytes memory _data
    ) external onlyOwner {
        _mint(_to, _id, _amount, _data);
    }

    function mintBatch(
        address _to,
        uint[] memory _ids,
        uint[] memory _amounts,
        bytes memory _data
    ) external onlyOwner {
        _mintBatch(_to, _ids, _amounts, _data);
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return tokenURI[_id];
    }
}
