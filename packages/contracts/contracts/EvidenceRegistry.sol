// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
contract EvidenceRegistry is AccessControl,Pausable {
    bytes32 public constant REVIEWER_ROLE=keccak256("REVIEWER_ROLE"); enum State{None,Submitted,Verified,Rejected,Disputed}
    struct Evidence{address submitter;bytes32 contentHash;bytes32 category;uint64 submittedAt;string metadataCid;State state;}
    uint256 public nextId=1;mapping(uint256=>Evidence) public evidence;mapping(bytes32=>bool) public registeredHash;
    event EvidenceRegistered(uint256 indexed id,address indexed submitter,bytes32 indexed contentHash,string metadataCid);event ReviewStateChanged(uint256 indexed id,State state);
    constructor(address admin,address reviewer){_grantRole(DEFAULT_ADMIN_ROLE,admin);_grantRole(REVIEWER_ROLE,reviewer);}
    function register(bytes32 contentHash,bytes32 category,string calldata metadataCid) external whenNotPaused returns(uint256 id){require(contentHash!=0 && !registeredHash[contentHash],"DUPLICATE_HASH");require(bytes(metadataCid).length>0,"EMPTY_CID");id=nextId++;registeredHash[contentHash]=true;evidence[id]=Evidence(msg.sender,contentHash,category,uint64(block.timestamp),metadataCid,State.Submitted);emit EvidenceRegistered(id,msg.sender,contentHash,metadataCid);}
    function setReviewState(uint256 id,State state) external onlyRole(REVIEWER_ROLE){require(evidence[id].state!=State.None,"UNKNOWN");require(state>=State.Verified,"BAD_STATE");evidence[id].state=state;emit ReviewStateChanged(id,state);}
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE){_pause();}function unpause()external onlyRole(DEFAULT_ADMIN_ROLE){_unpause();}
}
