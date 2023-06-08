// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Standard OpenZeppelin ERC721 Wizard Code
// - receive maxComponentsERC1155 to mint
// - mint is public / nft owner controled
// - user have power to set URI - ( TO be FIXed )
// - ToDo - check is type coversion for sure know smaller values saves gas ?

contract Max is ERC721, ERC721URIStorage, IERC1155Receiver {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    address public maxContract;

    constructor(address _maxContract) ERC721("Max", "Max") {
        maxContract = _maxContract;
    }

    // each Max token id will have at 1-6 max components id
    mapping(uint => uint[]) private _maxTokenIds;

    // tokenIdsOwned util to fetch user nfts
    mapping(address => uint[]) private _tokenIdsOwned;

    modifier isTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        _;
    }

    modifier validMax(uint[] memory maxComponents) {
        require(maxComponents.length == 6, "Invalid Max Length");
        // any number outside 0-599 range is considered as valid but a empty component.
        require(
            (maxComponents[0] >= 0 && maxComponents[0] < 100) ||
                maxComponents[0] >= 600,
            "Invalid Background"
        );
        require(
            (maxComponents[1] >= 100 && maxComponents[1] < 200) ||
                maxComponents[1] >= 600,
            "Invalid Clothes"
        );
        require(
            (maxComponents[2] >= 200 && maxComponents[2] < 300) ||
                maxComponents[2] >= 600,
            "Invalid Eyes"
        );
        require(
            (maxComponents[3] >= 300 && maxComponents[3] < 400),
            "Fur is Mandatory"
        );
        require(
            (maxComponents[4] >= 400 && maxComponents[4] < 500) ||
                maxComponents[4] >= 600,
            "Invalid Hat"
        );
        require(maxComponents[5] >= 500, "Invalid Mouth");
        _;
    }

    function getTotalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function listOfMaxTokenIds(
        uint256 tokenId
    ) external view returns (uint[] memory) {
        return _maxTokenIds[tokenId];
    }

    function listOfTokenIdsOwned(
        address owner
    ) external view returns (uint[] memory) {
        return _tokenIdsOwned[owner];
    }

    function safeMint(
        uint[] memory _maxComponents,
        string memory _uri
    ) public validMax(_maxComponents) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // take owner ship of max-components to create a MAX NFT
        uint length = _maxComponents.length;
        for (uint i = 0; i < length; ++i) {
            uint maxId = _maxComponents[i];
            if (maxId < 600) {
                IERC1155(maxContract).safeTransferFrom(
                    msg.sender,
                    address(this),
                    maxId,
                    1, // only 1
                    ""
                );
            }
        }

        _safeMint(msg.sender, tokenId);
        _tokenIdsOwned[msg.sender].push(tokenId);
        _maxTokenIds[tokenId] = _maxComponents;
        _setTokenURI(tokenId, _uri);
    }

    function updateComponents(
        uint tokenId,
        uint[] memory _maxComponents,
        string memory _uri
    ) public validMax(_maxComponents) isTokenOwner(tokenId) {
        uint length = _maxComponents.length;
        for (uint i = 0; i < length; ++i) {
            uint paramMaxId = _maxComponents[i];
            uint ogMaxId = _maxTokenIds[tokenId][i];
            if (paramMaxId != ogMaxId) {
                if (paramMaxId < 600) {
                    // receive the new component
                    IERC1155(maxContract).safeTransferFrom(
                        msg.sender,
                        address(this),
                        uint(paramMaxId),
                        1,
                        ""
                    );
                }
                if (ogMaxId < 600) {
                    // return the og component
                    IERC1155(maxContract).safeTransferFrom(
                        address(this),
                        msg.sender,
                        uint(ogMaxId),
                        1,
                        ""
                    );
                }
            }
        }
        _maxTokenIds[tokenId] = _maxComponents;
        _setTokenURI(tokenId, _uri);
    }

    // override just to manage _tokenIdsOwned
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        uint[] storage list = _tokenIdsOwned[from];
        uint length = list.length;
        for (uint i = 0; i < length; ++i) {
            if (list[i] == tokenId) {
                list[i] = list[length - 1];
                list.pop();
            }
        }
        _tokenIdsOwned[to].push(tokenId);
        super._transfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.
    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return (
            bytes4(
                keccak256(
                    "onERC1155Received(address,address,uint256,uint256,bytes)"
                )
            )
        );
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return (
            bytes4(
                keccak256(
                    "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"
                )
            )
        );
    }
}
