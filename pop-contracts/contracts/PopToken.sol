// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract PopToken is ERC20Permit {
    constructor(
        uint256 iSupply
    ) ERC20("Pop Token", "PPT") ERC20Permit("PPT") {
        _mint(msg.sender, iSupply * (uint256(10) ** 18));
    }
}
