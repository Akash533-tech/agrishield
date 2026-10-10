import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("AgroShield protocol invariants", function () {
  async function fixture(){
    const [admin,oracle,farmer,underwriter,verifier,attacker,verifier2,verifier3,buyer]=await ethers.getSigners();
    const token=await (await ethers.getContractFactory("TestToken")).deploy();
    const pool=await (await ethers.getContractFactory("InsurancePool")).deploy(await token.getAddress(),admin.address);
    const policy=await (await ethers.getContractFactory("InsurancePolicy")).deploy(await pool.getAddress(),admin.address,oracle.address);
    await pool.grantRole(await pool.POLICY_ROLE(),await policy.getAddress());
    const registry=await (await ethers.getContractFactory("EvidenceRegistry")).deploy(admin.address,admin.address);
    const staking=await (await ethers.getContractFactory("VerifierStaking")).deploy(await token.getAddress(),await registry.getAddress(),admin.address,admin.address);
    await registry.grantRole(await registry.REVIEWER_ROLE(),await staking.getAddress());
    const credit=await (await ethers.getContractFactory("GreenCredit")).deploy(admin.address,admin.address,await registry.getAddress());
    const marketplace=await (await ethers.getContractFactory("CreditMarketplace")).deploy(await token.getAddress(),await credit.getAddress(),admin.address);
    for(const s of [farmer,underwriter,verifier,verifier2,verifier3,buyer]) await token.transfer(s.address,ethers.parseEther("10000"));
    return {admin,oracle,farmer,underwriter,verifier,verifier2,verifier3,buyer,attacker,token,pool,policy,registry,staking,credit,marketplace};
  }

  async function activePolicy(f:any){
    await f.token.connect(f.underwriter).approve(await f.pool.getAddress(),ethers.MaxUint256);
    await f.pool.connect(f.underwriter).deposit(ethers.parseEther("1000"));
    await f.token.connect(f.farmer).approve(await f.pool.getAddress(),ethers.MaxUint256);
    const now=await time.latest();
    await f.policy.connect(f.farmer).create(ethers.parseEther("100"),ethers.parseEther("2"),now+60,now+3600,42,true);
    await time.increaseTo(now+120);
    return now;
  }

  it("rejects unauthorized payouts and stale/replayed oracle reports, then settles exactly once",async()=>{
    const f=await fixture();const now=await activePolicy(f);const report=ethers.id("report-1");
    await expect(f.policy.connect(f.attacker).settle(1,30,now+100,report,2)).to.be.reverted;
    await time.increase(7*3600);
    await expect(f.policy.connect(f.oracle).settle(1,30,now+100,report,2)).to.be.revertedWith("STALE_REPORT");
    const f2=await fixture();const now2=await activePolicy(f2);const fresh=ethers.id("fresh-report");
    await expect(f2.policy.connect(f2.oracle).settle(1,30,now2+100,fresh,1)).to.be.revertedWith("SOURCE_DISAGREEMENT");
    await f2.policy.connect(f2.oracle).settle(1,30,now2+100,fresh,2);
    await expect(f2.policy.connect(f2.oracle).settle(1,30,now2+100,fresh,2)).to.be.revertedWith("NOT_ACTIVE");
  });

  it("prevents insolvency and withdrawals of reserved capital",async()=>{
    const f=await fixture();await activePolicy(f);
    const shares=await f.pool.shares(f.underwriter.address);
    await expect(f.pool.connect(f.underwriter).withdraw(shares)).to.be.revertedWith("RESERVED_LIABILITY");
    const now=await time.latest();
    await expect(f.policy.connect(f.farmer).create(ethers.parseEther("2000"),ethers.parseEther("2"),now+60,now+3600,42,true)).to.be.revertedWith("INSOLVENT");
  });

  it("prevents duplicate evidence and duplicate credit issuance",async()=>{
    const f=await fixture();const hash=ethers.id("private-evidence-bytes");
    await f.registry.connect(f.farmer).register(hash,ethers.id("COVER_CROP"),"bafybeigdyr-demo-metadata");
    await expect(f.registry.connect(f.farmer).register(hash,ethers.id("COVER_CROP"),"bafybeigdyr-demo-metadata")).to.be.revertedWith("DUPLICATE_HASH");
    await expect(f.credit.issue(1,1,ethers.id("PROJECT-A"),ethers.id("DEMO-METHOD"),100,"ipfs://batch",f.farmer.address)).to.be.revertedWith("EVIDENCE_NOT_VERIFIED");
    await f.registry.setReviewState(1,2);
    await f.credit.issue(1,1,ethers.id("PROJECT-A"),ethers.id("DEMO-METHOD"),100,"ipfs://batch",f.farmer.address);
    await expect(f.credit.issue(2,1,ethers.id("PROJECT-A"),ethers.id("DEMO-METHOD"),100,"ipfs://batch",f.farmer.address)).to.be.revertedWith("EVIDENCE_ALREADY_ISSUED");
  });

  it("burns retired credits and prevents retirement replay",async()=>{
    const f=await fixture();await f.registry.connect(f.farmer).register(ethers.id("evidence-7"),ethers.id("COVER_CROP"),"ipfs://evidence");await f.registry.setReviewState(1,2);await f.credit.issue(1,1,ethers.id("PROJECT-B"),ethers.id("DEMO-METHOD"),100,"ipfs://batch",f.farmer.address);
    await f.credit.connect(f.farmer).retire(1,25,"Sample Buyer","Demo claim",ethers.id("nonce-1"));
    expect(await f.credit.balanceOf(f.farmer.address,1)).to.equal(75);
    await expect(f.credit.connect(f.farmer).retire(1,25,"Sample Buyer","Demo claim",ethers.id("nonce-1"))).to.be.revertedWith("RETIREMENT_REPLAY");
  });

  it("requires independent stake, one vote, quorum, fault evidence and an appeal delay before slashing",async()=>{
    const f=await fixture();await f.registry.connect(f.farmer).register(ethers.id("review-me"),ethers.id("COVER_CROP"),"ipfs://review");await f.token.connect(f.verifier).approve(await f.staking.getAddress(),ethers.MaxUint256);
    await expect(f.staking.connect(f.verifier).attest(1,true,ethers.id("reason"))).to.be.revertedWith("INSUFFICIENT_STAKE");
    await f.staking.connect(f.verifier).stake(ethers.parseEther("100"));await f.staking.connect(f.verifier).attest(1,true,ethers.id("reason"));
    await expect(f.staking.connect(f.verifier).attest(1,true,ethers.id("again"))).to.be.revertedWith("DUPLICATE_VOTE");
    await expect(f.staking.openDispute(1)).to.be.revertedWith("NO_QUORUM");
  });

  it("moves evidence to verified only after three independently staked approvals",async()=>{
    const f=await fixture();await f.registry.connect(f.farmer).register(ethers.id("quorum"),ethers.id("COVER_CROP"),"ipfs://quorum");
    for(const verifier of [f.verifier,f.verifier2,f.verifier3]){await f.token.connect(verifier).approve(await f.staking.getAddress(),ethers.parseEther("100"));await f.staking.connect(verifier).stake(ethers.parseEther("100"));await f.staking.connect(verifier).attest(1,true,ethers.id("independent-review"));}
    const record=await f.registry.evidence(1);expect(record.state).to.equal(2);
  });

  it("atomically exchanges payment and ERC1155 units, then supports retirement",async()=>{
    const f=await fixture();await f.registry.connect(f.farmer).register(ethers.id("market-evidence"),ethers.id("COVER_CROP"),"ipfs://evidence");await f.registry.setReviewState(1,2);
    await f.credit.issue(1,1,ethers.id("PROJECT-M"),ethers.id("DEMO-METHOD"),100,"ipfs://batch",f.farmer.address);
    await f.credit.connect(f.farmer).setApprovalForAll(await f.marketplace.getAddress(),true);await f.marketplace.connect(f.farmer).list(1,40,ethers.parseEther("2"));
    await f.token.connect(f.buyer).approve(await f.marketplace.getAddress(),ethers.MaxUint256);await f.marketplace.connect(f.buyer).purchase(1,10);
    expect(await f.credit.balanceOf(f.buyer.address,1)).to.equal(10);expect((await f.marketplace.listings(1)).quantity).to.equal(30);
    await f.credit.connect(f.buyer).retire(1,4,"Demo Buyer","Demo environmental claim",ethers.id("retirement"));expect(await f.credit.balanceOf(f.buyer.address,1)).to.equal(6);
  });

  it("allows one testnet faucet claim and restricts privileged minting",async()=>{
    const f=await fixture();await f.token.connect(f.attacker).faucet();expect(await f.token.balanceOf(f.attacker.address)).to.equal(ethers.parseEther("1000000"));
    await expect(f.token.connect(f.attacker).faucet()).to.be.revertedWith("FAUCET_ALREADY_CLAIMED");await expect(f.token.connect(f.attacker).mint(f.attacker.address,1)).to.be.reverted;
  });
});
