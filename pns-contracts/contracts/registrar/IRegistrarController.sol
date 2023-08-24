pragma solidity >=0.8.4;

interface IRegistrarController {
    function rentPrice(
        string memory,
        uint256,
        address
    ) external returns (uint256);

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

    function registerWithRelayer(
        string calldata,
        address,
        bytes[] calldata
    ) external;

    function registerWithERC20(
        string calldata,
        address,
        uint256,
        address,
        bytes[] calldata,
        uint16,
        address
    ) external;

    function renew(string calldata, uint256) external payable;
}
