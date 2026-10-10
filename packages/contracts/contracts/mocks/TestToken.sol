// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Testnet-only asset. It has no monetary value.
contract TestToken is ERC20, AccessControl {
    uint256 public constant FAUCET_AMOUNT = 1_000_000 ether;
    mapping(address => bool) public faucetClaimed;
    event FaucetClaimed(address indexed account, uint256 amount);

    constructor() ERC20("AgroShield Test USD", "aUSD") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _mint(msg.sender, 10_000_000 ether);
    }

    function faucet() external {
        require(!faucetClaimed[msg.sender], "FAUCET_ALREADY_CLAIMED");
        faucetClaimed[msg.sender] = true;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    function mint(address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) { _mint(to, amount); }
}
