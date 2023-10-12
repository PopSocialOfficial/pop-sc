//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "@openzeppelin/contracts/utils/Strings.sol";

contract PNSMetadataService {
    string private _baseURI;

    constructor(string memory baseUri) {
        _baseURI = baseUri;
    }

    function uri(uint256 tokenId) public view returns (string memory) {
        return string(abi.encodePacked(_baseURI, tokenId));
    }
}
