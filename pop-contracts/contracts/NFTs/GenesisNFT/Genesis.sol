// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.9;

// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
// import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";

// // Standard OpenZeppelin ERC721 Wizard Code
// // - receive accessoriesERC1155 to mint
// // - mint is public / nft owner controled
// // - user have power to set URI - ( TO be FIXed )
// // - ToDo - check is type coversion for sure know smaller values saves gas ?

// contract Genesis is ERC721, ERC721URIStorage, IERC1155Receiver {
//     using Counters for Counters.Counter;

//     Counters.Counter private _tokenIdCounter;
//     address public accessoriesContract;

//     constructor(address _accessoriesContract) ERC721("Genesis", "Genesis") {
//         accessoriesContract = _accessoriesContract;
//     }

//     // each Max token id will have at 1-6 max components id
//     mapping(uint => uint[]) private _maxTokenIds;

//     modifier isTokenOwner(uint256 tokenId) {
//         require(ownerOf(tokenId) == msg.sender, "not owner");
//         _;
//     }

//     modifier validAccessories(uint[] memory accessories) {
//         require(accessories.length == 4, "Invalid Accessories Length");
//         // any number outside 0-399 range is considered as valid but a empty component.
//         require(
//             (accessories[0] >= 0 && accessories[0] < 100),
//             "Invalid Background"
//         );
//         require(
//             (accessories[1] >= 100 && accessories[1] < 200),
//             "Invalid Cloth"
//         );
//         require((accessories[2] >= 200 && accessories[2] < 300), "Invalid Fur");
//         require(
//             (accessories[3] >= 300 && accessories[3] < 400),
//             "Invalid Glass"
//         );
//         _;
//     }

//     function getTotalSupply() external view returns (uint256) {
//         return _tokenIdCounter.current();
//     }

//     function listOfMaxTokenIds(
//         uint256 tokenId
//     ) external view returns (uint[] memory) {
//         return _maxTokenIds[tokenId];
//     }

//     function safeMint(
//         uint[] memory _accessories,
//         string memory _uri
//     ) public validAccessories(_accessories) {
//         uint256 tokenId = _tokenIdCounter.current();
//         _tokenIdCounter.increment();

//         // take owner ship of max-components to create a MAX NFT
//         uint length = _accessories.length;
//         for (uint i = 0; i < length; ++i) {
//             uint maxId = _accessories[i];
//             if (maxId < 400) {
//                 IERC1155(accessoriesContract).safeTransferFrom(
//                     msg.sender,
//                     address(this),
//                     maxId,
//                     1, // only 1
//                     ""
//                 );
//             }
//         }

//         _safeMint(msg.sender, tokenId);
//         _maxTokenIds[tokenId] = _accessories;
//         _setTokenURI(tokenId, _uri);
//     }

//     function updateComponents(
//         uint tokenId,
//         uint[] memory _accessories,
//         string memory _uri
//     ) public validAccessories(_accessories) isTokenOwner(tokenId) {
//         uint length = _accessories.length;
//         for (uint i = 0; i < length; ++i) {
//             uint paramMaxId = _accessories[i];
//             uint ogMaxId = _maxTokenIds[tokenId][i];
//             if (paramMaxId != ogMaxId) {
//                 if (paramMaxId < 400) {
//                     // receive the new component
//                     IERC1155(accessoriesContract).safeTransferFrom(
//                         msg.sender,
//                         address(this),
//                         uint(paramMaxId),
//                         1,
//                         ""
//                     );
//                 }
//                 if (ogMaxId < 400) {
//                     // return the og component
//                     IERC1155(accessoriesContract).safeTransferFrom(
//                         address(this),
//                         msg.sender,
//                         uint(ogMaxId),
//                         1,
//                         ""
//                     );
//                 }
//             }
//         }
//         _maxTokenIds[tokenId] = _accessories;
//         _setTokenURI(tokenId, _uri);
//     }

//     // The following functions are overrides required by Solidity.
//     function _burn(
//         uint256 tokenId
//     ) internal override(ERC721, ERC721URIStorage) {
//         super._burn(tokenId);
//     }

//     function tokenURI(
//         uint256 tokenId
//     ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
//         return super.tokenURI(tokenId);
//     }

//     function supportsInterface(
//         bytes4 interfaceId
//     ) public view override(ERC721, ERC721URIStorage, IERC165) returns (bool) {
//         return super.supportsInterface(interfaceId);
//     }

//     function onERC1155Received(
//         address,
//         address,
//         uint256,
//         uint256,
//         bytes calldata
//     ) external pure override returns (bytes4) {
//         return (
//             bytes4(
//                 keccak256(
//                     "onERC1155Received(address,address,uint256,uint256,bytes)"
//                 )
//             )
//         );
//     }

//     function onERC1155BatchReceived(
//         address,
//         address,
//         uint256[] calldata,
//         uint256[] calldata,
//         bytes calldata
//     ) external pure override returns (bytes4) {
//         return (
//             bytes4(
//                 keccak256(
//                     "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"
//                 )
//             )
//         );
//     }
// }
