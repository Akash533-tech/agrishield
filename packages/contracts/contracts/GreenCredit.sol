// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {EvidenceRegistry} from "./EvidenceRegistry.sol";

contract GreenCredit is ERC1155, AccessControl, Pausable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    EvidenceRegistry public immutable registry;
    struct Batch { bytes32 projectId; bytes32 methodology; uint256 evidenceId; uint256 issued; string metadataCid; }
    mapping(uint256 => Batch) public batches;
    mapping(uint256 => bool) public evidenceIssued;
    mapping(bytes32 => bool) public projectBatchUsed;
    mapping(bytes32 => uint256) public retiredQuantity;
    event BatchIssued(uint256 indexed batchId, uint256 indexed evidenceId, address indexed recipient, uint256 quantity);
    event Retired(address indexed owner, uint256 indexed batchId, uint256 quantity, bytes32 indexed retirementId, string beneficiary, string purpose);

    constructor(address admin, address issuer, EvidenceRegistry registry_) ERC1155("") {
        registry = registry_; _grantRole(DEFAULT_ADMIN_ROLE, admin); _grantRole(ISSUER_ROLE, issuer);
    }

    function issue(uint256 batchId, uint256 evidenceId, bytes32 projectId, bytes32 methodology, uint256 quantity, string calldata metadataCid, address recipient) external onlyRole(ISSUER_ROLE) whenNotPaused {
        require(quantity > 0 && recipient != address(0), "BAD_ISSUANCE");
        (, , , , , EvidenceRegistry.State state) = registry.evidence(evidenceId); require(state == EvidenceRegistry.State.Verified, "EVIDENCE_NOT_VERIFIED");
        require(!evidenceIssued[evidenceId], "EVIDENCE_ALREADY_ISSUED");
        bytes32 unique = keccak256(abi.encode(projectId, batchId)); require(!projectBatchUsed[unique] && batches[batchId].issued == 0, "DUPLICATE_BATCH");
        evidenceIssued[evidenceId] = true; projectBatchUsed[unique] = true;
        batches[batchId] = Batch(projectId, methodology, evidenceId, quantity, metadataCid);
        _mint(recipient, batchId, quantity, ""); emit BatchIssued(batchId, evidenceId, recipient, quantity);
    }

    function retire(uint256 batchId, uint256 quantity, string calldata beneficiary, string calldata purpose, bytes32 nonce) external whenNotPaused {
        require(quantity > 0, "ZERO"); bytes32 rid = keccak256(abi.encode(block.chainid, msg.sender, batchId, quantity, beneficiary, purpose, nonce)); require(retiredQuantity[rid] == 0, "RETIREMENT_REPLAY");
        _burn(msg.sender, batchId, quantity); retiredQuantity[rid] = quantity; emit Retired(msg.sender, batchId, quantity, rid, beneficiary, purpose);
    }

    function uri(uint256 id) public view override returns(string memory) { return batches[id].metadataCid; }
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns(bool) { return super.supportsInterface(interfaceId); }
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
