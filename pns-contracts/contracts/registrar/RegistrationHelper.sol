// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";
import "./IRegistrarController.sol";

error InvalidPrice();
error AddressZero();

contract RegistrationHelper is Ownable {
    using Address for address;
    using SafeERC20 for IERC20;
    IRegistrarController controller;
    IERC20 quoteToken;
    uint256 public popPrice;

    constructor(address _controller, address _quoteToken, uint256 _popPrice) {
        _setPrice(_popPrice);
        _setController(_controller);
        _setQuoteToken(_quoteToken);
    }

    function register(
        string calldata name,
        address owner,
        bytes[] calldata data
    ) public {
        controller.registerWithRelayer(name, owner, data);
    }

    function registerWithPermit(
        string calldata name,
        address owner,
        bytes[] calldata data,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        IERC20Permit(address(quoteToken)).permit(
            owner,
            address(this),
            popPrice,
            deadline,
            v,
            r,
            s
        );
        controller.registerWithRelayer(name, owner, data);

        quoteToken.safeTransferFrom(owner, address(this), popPrice);
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

    function setPrice(uint256 _popPrice) external onlyOwner {
        _setPrice(_popPrice);
    }

    function setController(address _controller) external onlyOwner {
        _setController(_controller);
    }

    function setQuoteToken(address _quoteToken) external onlyOwner {
        _setQuoteToken(_quoteToken);
    }

    function _setPrice(uint256 _popPrice) internal {
        if (_popPrice == 0) revert InvalidPrice();
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
