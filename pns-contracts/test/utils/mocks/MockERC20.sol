//SPDX-License-Identifier: MIT
pragma solidity >=0.8.17 <0.9.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract MockERC20 is ERC20, ERC20Permit {
    constructor(
        string memory name,
        string memory symbol,
        address[] memory addresses
    ) ERC20(name, symbol) ERC20Permit(name) {
        _mint(msg.sender, 100 * 10 ** uint256(decimals()));

        for (uint256 i = 0; i < addresses.length; i++) {
            _mint(addresses[i], 100 * 10 ** uint256(decimals()));
        }
    }
}
