pragma solidity >=0.8.4;

interface IRegistrarController {
    function rentPrice(
        string memory,
        uint256,
        address
    ) external returns (uint256);

    function available(string memory) external returns (bool);

    function registerWithRelayer(
        string calldata,
        address,
        bytes[] calldata
    ) external;
}
