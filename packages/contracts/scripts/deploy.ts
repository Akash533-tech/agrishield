import { ethers } from "hardhat";
async function main(){
  const [deployer]=await ethers.getSigners(); const oracle=process.env.ORACLE_ADDRESS;
  if(!oracle) throw new Error("ORACLE_ADDRESS is required; refusing to deploy with an implicit or unauthenticated oracle");
  const Token=await ethers.getContractFactory("TestToken");const token=await Token.deploy();await token.waitForDeployment();
  const Pool=await ethers.getContractFactory("InsurancePool");const pool=await Pool.deploy(await token.getAddress(),deployer.address);await pool.waitForDeployment();
  const Policy=await ethers.getContractFactory("InsurancePolicy");const policy=await Policy.deploy(await pool.getAddress(),deployer.address,oracle);await policy.waitForDeployment();
  await (await pool.grantRole(await pool.POLICY_ROLE(),await policy.getAddress())).wait();
  const Registry=await ethers.getContractFactory("EvidenceRegistry");const registry=await Registry.deploy(deployer.address,deployer.address);await registry.waitForDeployment();
  const Staking=await ethers.getContractFactory("VerifierStaking");const staking=await Staking.deploy(await token.getAddress(),await registry.getAddress(),deployer.address,deployer.address);await staking.waitForDeployment();
  await (await registry.grantRole(await registry.REVIEWER_ROLE(),await staking.getAddress())).wait();
  const Credit=await ethers.getContractFactory("GreenCredit");const credit=await Credit.deploy(deployer.address,deployer.address,await registry.getAddress());await credit.waitForDeployment();
  const Marketplace=await ethers.getContractFactory("CreditMarketplace");const marketplace=await Marketplace.deploy(await token.getAddress(),await credit.getAddress(),deployer.address);await marketplace.waitForDeployment();
  console.log(JSON.stringify({chainId:(await ethers.provider.getNetwork()).chainId.toString(),deployer:deployer.address,TestToken:await token.getAddress(),InsurancePool:await pool.getAddress(),InsurancePolicy:await policy.getAddress(),EvidenceRegistry:await registry.getAddress(),VerifierStaking:await staking.getAddress(),GreenCredit:await credit.getAddress(),CreditMarketplace:await marketplace.getAddress()},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
