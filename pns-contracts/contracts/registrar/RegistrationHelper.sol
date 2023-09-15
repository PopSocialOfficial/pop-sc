// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IRegistrarController.sol";

error InvalidPrice();
error AddressZero();

contract RegistrationHelper is Ownable {
    using Address for address;
    using SafeERC20 for IERC20;
    IRegistrarController controller;
    IERC20 quoteToken;
    uint256 public bnbPrice;
    uint256 public popPrice;

    constructor(
        address _controller,
        address _quoteToken,
        uint256 _bnbPrice,
        uint256 _popPrice
    ) {
        _setPrice(_bnbPrice, _popPrice);
        _setController(_controller);
        _setQuoteToken(_quoteToken);
    }

    function register(
        string calldata name,
        address owner,
        bytes[] calldata data
    ) public payable {
        if (msg.value != bnbPrice) revert InvalidPrice();
        controller.registerWithRelayer(name, owner, data);
    }

    function registerWithERC20(
        string calldata name,
        address owner,
        bytes[] calldata data
    ) public {
        controller.registerWithRelayer(name, owner, data);

        quoteToken.safeTransferFrom(msg.sender, address(this), popPrice);
    }

    function sweepFunds(address payable to) external onlyOwner {
        if (to == address(0)) revert AddressZero();
        quoteToken.safeTransfer(to, quoteToken.balanceOf(address(this)));
        Address.sendValue(to, address(this).balance);
    }

    function inCaseTokensGetStuck(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        if (_to == address(0)) revert AddressZero();
        IERC20(_token).safeTransfer(_to, _amount);
    }

    function setPrice(uint256 _bnbPrice, uint256 _popPrice) external onlyOwner {
        _setPrice(_bnbPrice, _popPrice);
    }

    function setController(address _controller) external onlyOwner {
        _setController(_controller);
    }

    function setQuoteToken(address _quoteToken) external onlyOwner {
        _setQuoteToken(_quoteToken);
    }

    function _setPrice(uint256 _bnbPrice, uint256 _popPrice) internal {
        if (_bnbPrice == 0 || _popPrice == 0) revert InvalidPrice();
        bnbPrice = _bnbPrice;
        popPrice = _popPrice;
    }

    function _setController(address _controller) internal {
        if (_controller == address(0)) revert AddressZero();
        controller = IRegistrarController(_controller);
    }

    function _setQuoteToken(address _quoteToken) internal {
        if (_quoteToken == address(0)) revert AddressZero();
        quoteToken = IERC20(_quoteToken);
    }
}
