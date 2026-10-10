// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {InsurancePool} from "./InsurancePool.sol";

contract InsurancePolicy is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE=keccak256("ORACLE_ROLE");
    uint256 public constant MAX_ORACLE_AGE=6 hours;
    enum Status{None,Active,Paid,Expired}
    struct Policy { address holder; uint96 coverage; uint96 premium; uint64 startsAt; uint64 endsAt; int64 threshold; bool triggerBelow; Status status; }
    InsurancePool public immutable pool; uint256 public nextPolicyId=1; mapping(uint256=>Policy) public policies; mapping(bytes32=>bool) public usedReports;
    event PolicyCreated(uint256 indexed policyId,address indexed holder,uint256 coverage,uint256 premium);
    event PolicySettled(uint256 indexed policyId,bytes32 indexed reportId,int256 observation,uint256 payout);
    event PolicyExpired(uint256 indexed policyId);
    constructor(InsurancePool pool_,address admin,address oracle){pool=pool_;_grantRole(DEFAULT_ADMIN_ROLE,admin);_grantRole(ORACLE_ROLE,oracle);}
    function create(uint96 coverage,uint96 premium,uint64 startsAt,uint64 endsAt,int64 threshold,bool triggerBelow) external nonReentrant whenNotPaused returns(uint256 id){
        require(coverage>0 && premium>0,"ZERO_VALUE"); require(startsAt>block.timestamp && endsAt>startsAt,"BAD_WINDOW");
        id=nextPolicyId++; policies[id]=Policy(msg.sender,coverage,premium,startsAt,endsAt,threshold,triggerBelow,Status.Active);
        pool.collectPremium(msg.sender,premium); pool.reserve(id,coverage); emit PolicyCreated(id,msg.sender,coverage,premium);
    }
    function settle(uint256 id,int256 observation,uint64 observedAt,bytes32 reportId,uint8 agreeingSources) external onlyRole(ORACLE_ROLE) nonReentrant whenNotPaused {
        Policy storage p=policies[id]; require(p.status==Status.Active,"NOT_ACTIVE"); require(!usedReports[reportId],"REPORT_REPLAY");
        require(observedAt>=p.startsAt && observedAt<=p.endsAt,"OUTSIDE_WINDOW"); require(observedAt<=block.timestamp && block.timestamp-observedAt<=MAX_ORACLE_AGE,"STALE_REPORT");
        require(agreeingSources>=2,"SOURCE_DISAGREEMENT"); bool hit=p.triggerBelow ? observation<int256(p.threshold) : observation>int256(p.threshold); require(hit,"NOT_TRIGGERED");
        usedReports[reportId]=true; p.status=Status.Paid; pool.pay(id,p.holder,p.coverage); emit PolicySettled(id,reportId,observation,p.coverage);
    }
    function expire(uint256 id) external { Policy storage p=policies[id];require(p.status==Status.Active && block.timestamp>p.endsAt,"NOT_EXPIRABLE");p.status=Status.Expired;pool.release(id);emit PolicyExpired(id); }
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE){_pause();} function unpause() external onlyRole(DEFAULT_ADMIN_ROLE){_unpause();}
}
