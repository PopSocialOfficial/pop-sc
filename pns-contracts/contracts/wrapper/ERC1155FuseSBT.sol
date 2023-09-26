//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "./ERC1155Fuse.sol";

abstract contract ERC1155FuseSBT is ERC1155Fuse {
    bool public disableSBT;
    address minter;

    function _beforeTokenTransfer(address from, address to) internal virtual {
        if (!disableSBT) {
            require(
                from == address(0) ||
                    to == address(0) ||
                    from == address(minter) ||
                    to == address(minter),
                "SOULBOUND: Non-transferable"
            );
        }
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override {
        _beforeTokenTransfer(from, to);
        super.safeTransferFrom(from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override {
        _beforeTokenTransfer(from, to);
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }
}
