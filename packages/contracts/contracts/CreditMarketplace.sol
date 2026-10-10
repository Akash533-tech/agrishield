// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract CreditMarketplace is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;
    struct Listing { address seller; uint256 batchId; uint256 quantity; uint256 unitPrice; bool active; }
    IERC20 public immutable paymentToken;
    IERC1155 public immutable credit;
    uint256 public nextListingId = 1;
    mapping(uint256 => Listing) public listings;
    event Listed(uint256 indexed listingId, address indexed seller, uint256 indexed batchId, uint256 quantity, uint256 unitPrice);
    event Purchased(uint256 indexed listingId, address indexed buyer, uint256 quantity, uint256 total);
    event Cancelled(uint256 indexed listingId);

    constructor(IERC20 paymentToken_, IERC1155 credit_, address admin) {
        paymentToken = paymentToken_; credit = credit_; _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function list(uint256 batchId, uint256 quantity, uint256 unitPrice) external whenNotPaused returns (uint256 id) {
        require(quantity > 0 && unitPrice > 0, "BAD_LISTING"); require(credit.balanceOf(msg.sender, batchId) >= quantity, "INSUFFICIENT_UNITS"); require(credit.isApprovedForAll(msg.sender, address(this)), "MARKET_NOT_APPROVED");
        id = nextListingId++; listings[id] = Listing(msg.sender, batchId, quantity, unitPrice, true); emit Listed(id, msg.sender, batchId, quantity, unitPrice);
    }

    function purchase(uint256 id, uint256 quantity) external nonReentrant whenNotPaused {
        Listing storage item = listings[id]; require(item.active && quantity > 0 && quantity <= item.quantity, "UNAVAILABLE"); uint256 total = quantity * item.unitPrice;
        item.quantity -= quantity; if (item.quantity == 0) item.active = false;
        paymentToken.safeTransferFrom(msg.sender, item.seller, total); credit.safeTransferFrom(item.seller, msg.sender, item.batchId, quantity, ""); emit Purchased(id, msg.sender, quantity, total);
    }

    function cancel(uint256 id) external {
        Listing storage item = listings[id]; require(item.active && item.seller == msg.sender, "NOT_SELLER"); item.active = false; emit Cancelled(id);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
