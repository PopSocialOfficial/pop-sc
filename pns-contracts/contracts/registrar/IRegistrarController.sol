pragma solidity >=0.8.4;

interface IRegistrarController {
    function rentPrice(string memory, uint256) external returns (uint256);

    function available(string memory) external returns (bool);

    function register(
        string calldata,
        address,
        uint256,
        address,
        bytes[] calldata,
        bool,
        uint16
    ) external payable;

    function renew(string calldata, uint256) external payable;
}
