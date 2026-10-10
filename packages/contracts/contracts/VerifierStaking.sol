// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EvidenceRegistry} from "./EvidenceRegistry.sol";

contract VerifierStaking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");
    uint256 public constant MIN_STAKE = 100 ether;
    uint256 public constant APPEAL_DELAY = 2 days;
    uint8 public constant QUORUM = 3;
    IERC20 public immutable token;
    EvidenceRegistry public immutable registry;
    mapping(address => uint256) public stakeOf;
    mapping(uint256 => mapping(address => bool)) public voted;
    mapping(uint256 => uint8) public approvals;
    mapping(uint256 => uint8) public rejections;
    mapping(uint256 => uint64) public disputedAt;
    mapping(address => int256) public reputation;
    event Attested(uint256 indexed evidenceId, address indexed verifier, bool approve, bytes32 reasonHash);
    event QuorumReached(uint256 indexed evidenceId, bool approved);
    event DisputeOpened(uint256 indexed evidenceId, uint64 executableAt);
    event Slashed(uint256 indexed evidenceId, address indexed verifier, uint256 amount);

    constructor(IERC20 token_, EvidenceRegistry registry_, address admin, address arbiter) {
        token = token_; registry = registry_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin); _grantRole(ARBITER_ROLE, arbiter);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "ZERO"); stakeOf[msg.sender] += amount; token.safeTransferFrom(msg.sender, address(this), amount);
    }

    function attest(uint256 id, bool approve, bytes32 reasonHash) external {
        require(stakeOf[msg.sender] >= MIN_STAKE, "INSUFFICIENT_STAKE"); require(!voted[id][msg.sender], "DUPLICATE_VOTE");
        (, , , , , EvidenceRegistry.State state) = registry.evidence(id); require(state == EvidenceRegistry.State.Submitted, "NOT_REVIEWABLE");
        voted[id][msg.sender] = true;
        if (approve) { approvals[id]++; reputation[msg.sender] += 1; } else { rejections[id]++; }
        emit Attested(id, msg.sender, approve, reasonHash);
        if (approvals[id] == QUORUM) { registry.setReviewState(id, EvidenceRegistry.State.Verified); emit QuorumReached(id, true); }
        else if (rejections[id] == QUORUM) { registry.setReviewState(id, EvidenceRegistry.State.Rejected); emit QuorumReached(id, false); }
    }

    function openDispute(uint256 id) external {
        require(approvals[id] + rejections[id] >= QUORUM, "NO_QUORUM"); require(disputedAt[id] == 0, "ALREADY_DISPUTED");
        disputedAt[id] = uint64(block.timestamp); registry.setReviewState(id, EvidenceRegistry.State.Disputed); emit DisputeOpened(id, uint64(block.timestamp + APPEAL_DELAY));
    }

    function slashAfterAppeal(uint256 id, address verifier, uint256 amount, bytes32 evidenceOfFault) external onlyRole(ARBITER_ROLE) {
        require(disputedAt[id] > 0 && block.timestamp >= disputedAt[id] + APPEAL_DELAY, "APPEAL_ACTIVE"); require(evidenceOfFault != 0, "NO_FAULT_EVIDENCE"); require(voted[id][verifier] && amount <= stakeOf[verifier], "INVALID_SLASH");
        stakeOf[verifier] -= amount; reputation[verifier] -= int256(amount / 1 ether); token.safeTransfer(address(0xdead), amount); emit Slashed(id, verifier, amount);
    }
}
