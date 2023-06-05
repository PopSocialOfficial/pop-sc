// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DynamicPop is ERC721, ERC721URIStorage, IERC1155Receiver {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    address public maxContract;

    constructor(address _maxContract) ERC721("Dynamic Pop", "DPOP") {
        maxContract = _maxContract;
    }

    mapping(uint => uint16[]) private maxTokenIds;
    mapping(address => uint[]) private tokenIdsOwned;

    modifier isTokenOwner(uint256 tokenId) {
        require(this.ownerOf(tokenId) == msg.sender, "not owner");
        _;
    }

    modifier validMax(uint16[] memory maxComponents) {
        require(maxComponents.length == 6, "Invalid Max Length");
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
            "atleast have fur"
        );
        require(
            (maxComponents[4] >= 400 && maxComponents[4] < 500) ||
                maxComponents[4] >= 600,
            "Invalid Hat"
        );
        require(maxComponents[5] >= 500, "Invalid Mouth");
        _;
    }

    function listOfMaxTokenIds(
        uint256 tokenId
    ) external view returns (uint16[] memory) {
        uint16[] memory maxIds = maxTokenIds[tokenId];
        return maxIds;
    }

    function listOfTokenIdsOwned(
        address owner
    ) external view returns (uint[] memory) {
        uint[] memory tokenIds = tokenIdsOwned[owner];
        return tokenIds;
    }

    function safeMint(
        uint16[] memory _maxComponents,
        string memory _uri
    ) public validMax(_maxComponents) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        for (uint8 i = 0; i < _maxComponents.length; ++i) {
            uint16 maxId = _maxComponents[i];
            if (maxId < 600) {
                IERC1155(maxContract).safeTransferFrom(
                    msg.sender,
                    address(this),
                    uint(maxId),
                    1,
                    ""
                );
            }
        }
        _safeMint(msg.sender, tokenId);
        tokenIdsOwned[msg.sender].push(tokenId);
        maxTokenIds[tokenId] = _maxComponents;
        _setTokenURI(tokenId, _uri);
    }

    function updateComponents(
        uint256 tokenId,
        uint16[] memory _maxComponents,
        string memory _uri
    ) public validMax(_maxComponents) isTokenOwner(tokenId) {
        for (uint8 i = 0; i < _maxComponents.length; ++i) {
            uint16 paramMaxId = _maxComponents[i];
            uint16 ogMaxId = maxTokenIds[tokenId][i];
            if (paramMaxId < 600 && paramMaxId != ogMaxId) {
                // receive the new component
                IERC1155(maxContract).safeTransferFrom(
                    msg.sender,
                    address(this),
                    uint(paramMaxId),
                    1,
                    ""
                );
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
        maxTokenIds[tokenId] = _maxComponents;
        _setTokenURI(tokenId, _uri);
    }

    // The following functions are overrides required by Solidity.
    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) isTokenOwner(tokenId) {
        uint16[] memory maxIds = maxTokenIds[tokenId];
        for (uint8 i = 0; i < maxIds.length; ++i) {
            uint16 maxId = maxIds[i];
            if (maxId < 600) {
                IERC1155(maxContract).safeTransferFrom(
                    address(this),
                    msg.sender,
                    uint(maxId),
                    1,
                    ""
                );
            }
        }
        uint[] storage list = tokenIdsOwned[msg.sender];
        for (uint256 i = 0; i < list.length; ++i) {
            if (list[i] == tokenId) {
                list[i] = list[list.length - 1];
                list.pop();
            }
        }
        super._burn(tokenId);
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        uint[] storage list = tokenIdsOwned[from];
        for (uint256 i = 0; i < list.length; ++i) {
            if (list[i] == tokenId) {
                list[i] = list[list.length - 1];
                list.pop();
            }
        }
        tokenIdsOwned[to].push(tokenId);
        super._transfer(from, to, tokenId);
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
