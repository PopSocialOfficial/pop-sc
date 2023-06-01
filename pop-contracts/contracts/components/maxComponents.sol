// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MaxComponents is ERC1155, Ownable {
    string public name;
    string public symbol;

    mapping(uint => string) public tokenURI;
    mapping(uint => uint) public energyPoints;
    mapping(address => uint[]) public tokenIdsOwned;

    constructor() ERC1155("") {
        name = "Max Components";
        symbol = "MAX";
    }

    function mintById(address _to, uint _id, uint _amount) external onlyOwner {
        _mint(_to, _id, _amount, "");
        tokenIdsOwned[_to].push(_id);
    }

    function mintBatch(
        address _to,
        uint[] memory _ids,
        uint[] memory _amounts
    ) external onlyOwner {
        _mintBatch(_to, _ids, _amounts, "");
        for (uint i = 0; i < _ids.length; i++) {
            tokenIdsOwned[_to].push(_ids[i]);
        }
    }

    function burn(uint _id, uint _amount) external onlyOwner {
        _burn(msg.sender, _id, _amount);
    }

    function burnBatch(
        uint[] memory _ids,
        uint[] memory _amounts
    ) external onlyOwner {
        _burnBatch(msg.sender, _ids, _amounts);
    }

    function burnForMint(
        address _from,
        uint[] memory _burnIds,
        uint[] memory _burnAmounts,
        uint[] memory _mintIds,
        uint[] memory _mintAmounts
    ) external onlyOwner {
        _burnBatch(_from, _burnIds, _burnAmounts);
        _mintBatch(_from, _mintIds, _mintAmounts, "");
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
}
