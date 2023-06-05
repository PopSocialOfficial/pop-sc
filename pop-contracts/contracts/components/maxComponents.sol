// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MaxComponents is ERC1155, Ownable {
    string public name;
    string public symbol;

    mapping(uint => string) public tokenURI;
    mapping(uint => uint) public energyPoints;
    mapping(address => uint[]) private tokenIdsOwned;

    constructor() ERC1155("") {
        name = "Max Components";
        symbol = "MAX";
    }

    function mintById(address _to, uint _id, uint _amount) external onlyOwner {
        _mint(_to, _id, _amount, "");
        tokenIdsOwned[_to].push(_id);
    }

    function listOfTokenIdsOwned(
        address owner
    ) external view returns (uint[] memory, uint256[] memory) {
        uint[] memory tokenIds = tokenIdsOwned[owner];
        uint256[] memory batchBalances = new uint256[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; ++i) {
            batchBalances[i] = balanceOf(owner, tokenIds[i]);
        }
        return (tokenIds, batchBalances);
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

    function _safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override(ERC1155) {
        tokenIdsOwned[to].push(id);
        super._safeTransferFrom(from, to, id, amount, data);
    }

    function _safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155) {
        for (uint i = 0; i < ids.length; i++) {
            tokenIdsOwned[to].push(ids[i]);
        }
        super._safeBatchTransferFrom(from, to, ids, amounts, data);
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
