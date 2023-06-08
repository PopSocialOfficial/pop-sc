// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// for local test only
contract PPTToken is ERC20 {
    uint8 decimals_;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) ERC20(_name, _symbol) {
        decimals_ = _decimals;
    }

    function mint(uint _amount) external {
        _mint(msg.sender, _amount);
    }

    function burn(uint _amount) external {
        _burn(msg.sender, _amount);
    }

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function decimals() public view override returns (uint8) {
        return decimals_;
    }
}
