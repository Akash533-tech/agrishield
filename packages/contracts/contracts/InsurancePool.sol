// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InsurancePool is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    bytes32 public constant POLICY_ROLE = keccak256("POLICY_ROLE");
    IERC20 public immutable asset;
    uint256 public totalShares;
    uint256 public reservedLiability;
    mapping(address => uint256) public shares;
    mapping(uint256 => uint256) public policyReserve;
    event Deposited(address indexed provider, uint256 assets, uint256 shares);
    event Withdrawn(address indexed provider, uint256 assets, uint256 shares);
    event LiabilityReserved(uint256 indexed policyId, uint256 amount);
    event Payout(uint256 indexed policyId, address indexed beneficiary, uint256 amount);

    constructor(IERC20 asset_, address admin) { asset = asset_; _grantRole(DEFAULT_ADMIN_ROLE, admin); }
    function totalAssets() public view returns (uint256) { return asset.balanceOf(address(this)); }
    function freeLiquidity() public view returns (uint256) { uint256 a=totalAssets(); return a > reservedLiability ? a-reservedLiability : 0; }
    function deposit(uint256 amount) external nonReentrant whenNotPaused returns(uint256 minted) {
        require(amount>0,"ZERO_AMOUNT"); uint256 beforeAssets=totalAssets();
        minted=totalShares==0 ? amount : amount*totalShares/beforeAssets;
        require(minted>0,"ZERO_SHARES"); shares[msg.sender]+=minted; totalShares+=minted;
        asset.safeTransferFrom(msg.sender,address(this),amount); emit Deposited(msg.sender,amount,minted);
    }
    function withdraw(uint256 shareAmount) external nonReentrant whenNotPaused returns(uint256 assets) {
        require(shareAmount>0 && shares[msg.sender]>=shareAmount,"BAD_SHARES");
        assets=shareAmount*totalAssets()/totalShares; require(assets<=freeLiquidity(),"RESERVED_LIABILITY");
        shares[msg.sender]-=shareAmount; totalShares-=shareAmount; asset.safeTransfer(msg.sender,assets); emit Withdrawn(msg.sender,assets,shareAmount);
    }
    function collectPremium(address payer,uint256 amount) external onlyRole(POLICY_ROLE) whenNotPaused { asset.safeTransferFrom(payer,address(this),amount); }
    function reserve(uint256 policyId,uint256 amount) external onlyRole(POLICY_ROLE) whenNotPaused {
        require(policyReserve[policyId]==0,"ALREADY_RESERVED"); require(amount<=freeLiquidity(),"INSOLVENT");
        policyReserve[policyId]=amount; reservedLiability+=amount; emit LiabilityReserved(policyId,amount);
    }
    function release(uint256 policyId) external onlyRole(POLICY_ROLE) { uint256 r=policyReserve[policyId]; require(r>0,"NO_RESERVE"); delete policyReserve[policyId]; reservedLiability-=r; }
    function pay(uint256 policyId,address beneficiary,uint256 amount) external onlyRole(POLICY_ROLE) nonReentrant whenNotPaused {
        uint256 r=policyReserve[policyId]; require(r>0 && amount<=r,"INVALID_PAYOUT");
        delete policyReserve[policyId]; reservedLiability-=r; asset.safeTransfer(beneficiary,amount); emit Payout(policyId,beneficiary,amount);
    }
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE){_pause();}
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE){_unpause();}
}
