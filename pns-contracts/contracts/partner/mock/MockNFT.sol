// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockNFT is ERC721 {
    constructor() ERC721("MockNFT", "MNFT") {}

    uint256 _tokenId;

    function mint() public returns (uint256 tokenId) {
        tokenId = _tokenId;
        _safeMint(msg.sender, tokenId);
        _tokenId++;
    }
}
