// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Standard OpenZeppelin ERC1155 Wizard Code
// - with name, symbol & tokenURI like ERC721
// - each tokenId will have a specific energyPoints

contract MaxComponents is ERC1155, Ownable {
    string public name;
    string public symbol;

    // using IERC1155MetadataURI extension, for different uri for each id
    mapping(uint => string) public tokenURI;
    mapping(uint => uint) public energyPoints;

    // _tokenIdsOwned util to fetch user nfts
    mapping(address => uint[]) private _tokenIdsOwned;

    constructor() ERC1155("") {
        name = "Max Components";
        symbol = "MAXC";
    }

    function listOfTokenIdsOwned(
        address _owner
    ) external view returns (uint[] memory, uint256[] memory) {
        uint[] memory tokenIds = _tokenIdsOwned[_owner];
        uint256[] memory batchBalances = new uint256[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; ++i) {
            batchBalances[i] = balanceOf(_owner, tokenIds[i]);
        }
        return (tokenIds, batchBalances);
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
        _tokenIdsOwned[_to].push(_id);
    }

    function mintBatch(
        address _to,
        uint[] memory _ids,
        uint[] memory _amounts,
        bytes memory _data
    ) external onlyOwner {
        _mintBatch(_to, _ids, _amounts, _data);
        for (uint i = 0; i < _ids.length; i++) {
            _tokenIdsOwned[_to].push(_ids[i]);
        }
    }

    function uri(
        uint256 _id
    ) public override view returns (string memory) {
        return tokenURI[_id];
    }

    // override just to manage _tokenIdsOwned
    function _safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override(ERC1155) {
        _tokenIdsOwned[to].push(id);
        super._safeTransferFrom(from, to, id, amount, data);
    }

    // override just to manage _tokenIdsOwned
    function _safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155) {
        for (uint i = 0; i < ids.length; i++) {
            _tokenIdsOwned[to].push(ids[i]);
        }
        super._safeBatchTransferFrom(from, to, ids, amounts, data);
    }
}
