"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPublicClient, createWalletClient, custom, formatEther, http, keccak256, parseEther, stringToHex, type Address, type Hash } from "viem";
import { contracts, creditAbi, erc20Abi, evidenceAbi, marketplaceAbi, monadTestnet, policyAbi, poolAbi, stakingAbi } from "@/lib/contracts";

export type TxResult = { hash: Hash; url: string; cid?: string };
export type EvidenceInput = { name: string; description: string; category: string; activityDate: string; measurements?:string; gps?:{lat:number;lon:number;precision:"field-level"}; photo?:{name:string;mimeType:"image/jpeg"|"image/png"|"image/webp";base64:string} };
export type ProtocolStats = { aUsd: string; poolShares: string; poolAssets: string; reserved: string };
type Web3State = {
  account?: Address; balance: string; connecting: boolean; pending?: string; lastTx?: TxResult; error?: string; stats: ProtocolStats;
  connect: () => Promise<void>; refresh: () => Promise<void>; faucet: () => Promise<TxResult>; deposit: () => Promise<TxResult>; withdraw: () => Promise<TxResult>;
  createPolicy: (coverage:number,premium:number) => Promise<TxResult>; registerEvidence: (input?:EvidenceInput) => Promise<TxResult>;
  stake: () => Promise<TxResult>; attest: (evidenceId:number,approve:boolean,reason:string) => Promise<TxResult>;
  issue: (batchId:number,evidenceId:number,quantity:number,recipient:Address) => Promise<TxResult>; list: (batchId:number,quantity:number,unitPrice:number) => Promise<TxResult>;
  purchase: (listingId:number,quantity:number) => Promise<TxResult>; retire: (batchId:number,quantity:number,beneficiary:string,purpose:string) => Promise<TxResult>;
};
const Context = createContext<Web3State | null>(null);
const chain = { ...monadTestnet };
const publicClient = createPublicClient({ chain, transport:http(chain.rpcUrls.default.http[0]) });
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

declare global { interface Window { ethereum?: { request:(args:{method:string;params?:unknown[]|object})=>Promise<unknown>; on?:(event:string,cb:(...args:any[])=>void)=>void; removeListener?:(event:string,cb:(...args:any[])=>void)=>void } } }

export function Web3Provider({ children }:{ children:React.ReactNode }) {
  const [account,setAccount] = useState<Address>(); const [balance,setBalance] = useState("0"); const [connecting,setConnecting] = useState(false);
  const [pending,setPending] = useState<string>(); const [lastTx,setLastTx] = useState<TxResult>(); const [error,setError] = useState<string>();
  const [stats,setStats] = useState<ProtocolStats>({ aUsd:"0",poolShares:"0",poolAssets:"0",reserved:"0" });

  const refreshAccount = useCallback(async (a:Address) => {
    const [native,aUsd,poolShares,poolAssets,reserved] = await Promise.all([
      publicClient.getBalance({ address:a }),
      publicClient.readContract({ address:contracts.token,abi:erc20Abi,functionName:"balanceOf",args:[a] }),
      publicClient.readContract({ address:contracts.pool,abi:poolAbi,functionName:"shares",args:[a] }),
      publicClient.readContract({ address:contracts.pool,abi:poolAbi,functionName:"totalAssets" }),
      publicClient.readContract({ address:contracts.pool,abi:poolAbi,functionName:"reservedLiability" }),
    ]);
    setBalance(Number(formatEther(native)).toFixed(3));
    setStats({ aUsd:Number(formatEther(aUsd)).toLocaleString(undefined,{maximumFractionDigits:2}), poolShares:Number(formatEther(poolShares)).toLocaleString(undefined,{maximumFractionDigits:2}), poolAssets:Number(formatEther(poolAssets)).toLocaleString(undefined,{maximumFractionDigits:2}), reserved:Number(formatEther(reserved)).toLocaleString(undefined,{maximumFractionDigits:2}) });
  },[]);
  const refresh = useCallback(async()=>{ if(account) await refreshAccount(account); },[account,refreshAccount]);

  useEffect(()=>{ if(!window.ethereum)return; window.ethereum.request({method:"eth_accounts"}).then((v:any)=>{if(v?.[0]){setAccount(v[0]);refreshAccount(v[0]).catch(()=>{})}}).catch(()=>{}); const changed=(v:any)=>{const a=v?.[0] as Address|undefined;setAccount(a);if(a)refreshAccount(a).catch(()=>{})};window.ethereum.on?.("accountsChanged",changed);return()=>window.ethereum?.removeListener?.("accountsChanged",changed)},[refreshAccount]);
  const wallet = () => { if(!window.ethereum)throw new Error("MetaMask is not installed"); return createWalletClient({ account,chain,transport:custom(window.ethereum as any) }); };
  const ensureChain = async () => { if(!window.ethereum)throw new Error("MetaMask is not installed"); try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x279f"}]})}catch(e:any){if(e.code!==4902)throw e;await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:"0x279f",chainName:chain.name,nativeCurrency:chain.nativeCurrency,rpcUrls:[chain.rpcUrls.default.http[0]],blockExplorerUrls:[chain.blockExplorers.default.url]}]})} };
  const connect = async () => { setConnecting(true);setError(undefined);try{await ensureChain();const a=await window.ethereum!.request({method:"eth_requestAccounts"}) as Address[];setAccount(a[0]);await refreshAccount(a[0])}catch(e:any){setError(e.shortMessage??e.message)}finally{setConnecting(false)} };
  const send = async (label:string,fn:(a:Address)=>Promise<Hash>,cid?:string):Promise<TxResult> => { if(!account)throw new Error("Connect MetaMask first"); setPending(label);setError(undefined);try{await ensureChain();const hash=await fn(account);const receipt=await publicClient.waitForTransactionReceipt({hash});if(receipt.status!=="success")throw new Error("Transaction reverted");const result={hash,url:`${chain.blockExplorers.default.url}/tx/${hash}`,cid};setLastTx(result);await refreshAccount(account);return result}catch(e:any){const message=e.shortMessage??e.message??"Transaction failed";setError(message);throw new Error(message)}finally{setPending(undefined)} };
  const approve = async (spender:Address,amount:bigint) => { const hash=await wallet().writeContract({address:contracts.token,abi:erc20Abi,functionName:"approve",args:[spender,amount],account:account!});const receipt=await publicClient.waitForTransactionReceipt({hash});if(receipt.status!=="success")throw new Error("Token approval failed") };
  const pinMetadata = async (input:EvidenceInput,contentHash:Hash,photoCid?:string) => { const {photo:_,...metadata}=input;const response=await fetch(`${apiUrl}/v1/storage/evidence`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...metadata,photoCid,contentHash})});const body=await response.json();if(!response.ok)throw new Error(body.message??body.error??"IPFS upload failed");if(!body.cid)throw new Error("Pinata did not return a CID");return body.cid as string };
  const pinPhoto = async (photo:NonNullable<EvidenceInput["photo"]>) => {const response=await fetch(`${apiUrl}/v1/storage/file`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(photo)});const body=await response.json();if(!response.ok)throw new Error(body.message??body.error??"Evidence image upload failed");if(!body.cid)throw new Error("Pinata did not return an image CID");return body.cid as string};

  const faucet = () => send("Claiming demo aUSD",a=>wallet().writeContract({address:contracts.token,abi:erc20Abi,functionName:"faucet",account:a}));
  const deposit = () => send("Depositing test liquidity",async a=>{const amount=parseEther("100000");await approve(contracts.pool,amount);return wallet().writeContract({address:contracts.pool,abi:poolAbi,functionName:"deposit",args:[amount],account:a})});
  const withdraw = () => send("Withdrawing free pool shares",async a=>{const shares=await publicClient.readContract({address:contracts.pool,abi:poolAbi,functionName:"shares",args:[a]});if(shares===0n)throw new Error("No pool shares to withdraw");return wallet().writeContract({address:contracts.pool,abi:poolAbi,functionName:"withdraw",args:[shares],account:a})});
  const createPolicy = (coverage:number,premium:number) => send("Creating policy",async a=>{const p=parseEther(String(premium));await approve(contracts.pool,p);const now=BigInt(Math.floor(Date.now()/1000));return wallet().writeContract({address:contracts.policy,abi:policyAbi,functionName:"create",args:[parseEther(String(coverage)),p,now+120n,now+2_592_000n,42n,true],account:a})});
  const registerEvidence = async (input:EvidenceInput={name:"AgroShield evidence",description:"Public demo evidence metadata submitted through the AgroShield application.",category:"COVER_CROP",activityDate:new Date().toISOString().slice(0,10)}) => { if(!account)throw new Error("Connect MetaMask first");setPending(input.photo?"Uploading evidence image to IPFS":"Uploading evidence metadata to IPFS");try{const photoCid=input.photo?await pinPhoto(input.photo):undefined;const {photo:_,...publicInput}=input;const contentHash=keccak256(stringToHex(JSON.stringify({...publicInput,photoCid,submitter:account})));const cid=await pinMetadata(input,contentHash,photoCid);return await send("Registering IPFS evidence onchain",a=>wallet().writeContract({address:contracts.evidence,abi:evidenceAbi,functionName:"register",args:[contentHash,keccak256(stringToHex(input.category)),`ipfs://${cid}`],account:a}),cid)}finally{setPending(undefined)} };
  const stake = () => send("Staking verifier tokens",async a=>{const amount=parseEther("100");await approve(contracts.staking,amount);return wallet().writeContract({address:contracts.staking,abi:stakingAbi,functionName:"stake",args:[amount],account:a})});
  const attest = (evidenceId:number,approveVote:boolean,reason:string) => send(approveVote?"Approving evidence":"Rejecting evidence",a=>wallet().writeContract({address:contracts.staking,abi:stakingAbi,functionName:"attest",args:[BigInt(evidenceId),approveVote,keccak256(stringToHex(reason))],account:a}));
  const issue = async (batchId:number,evidenceId:number,quantity:number,recipient:Address) => { const input={name:`AgroShield demo batch ${batchId}`,description:`Demo environmental units issued from independently verified evidence ${evidenceId}. Not a certified carbon offset.`,category:"DEMO_ENVIRONMENTAL_UNIT",activityDate:new Date().toISOString().slice(0,10)};const hash=keccak256(stringToHex(JSON.stringify(input)));setPending("Pinning batch metadata");try{const cid=await pinMetadata(input,hash);return await send("Issuing verified demo units",a=>wallet().writeContract({address:contracts.credit,abi:creditAbi,functionName:"issue",args:[BigInt(batchId),BigInt(evidenceId),keccak256(stringToHex(`PROJECT-${batchId}`)),keccak256(stringToHex("AGROSHIELD-DEMO-V1")),BigInt(quantity),`ipfs://${cid}`,recipient],account:a}),cid)}finally{setPending(undefined)} };
  const list = (batchId:number,quantity:number,unitPrice:number) => send("Listing demo units",async a=>{const approval=await wallet().writeContract({address:contracts.credit,abi:creditAbi,functionName:"setApprovalForAll",args:[contracts.marketplace,true],account:a});await publicClient.waitForTransactionReceipt({hash:approval});return wallet().writeContract({address:contracts.marketplace,abi:marketplaceAbi,functionName:"list",args:[BigInt(batchId),BigInt(quantity),parseEther(String(unitPrice))],account:a})});
  const purchase = (listingId:number,quantity:number) => send("Purchasing demo units",async a=>{const item=await publicClient.readContract({address:contracts.marketplace,abi:marketplaceAbi,functionName:"listings",args:[BigInt(listingId)]});await approve(contracts.marketplace,item[3]*BigInt(quantity));return wallet().writeContract({address:contracts.marketplace,abi:marketplaceAbi,functionName:"purchase",args:[BigInt(listingId),BigInt(quantity)],account:a})});
  const retire = (batchId:number,quantity:number,beneficiary:string,purpose:string) => send("Permanently retiring units",a=>wallet().writeContract({address:contracts.credit,abi:creditAbi,functionName:"retire",args:[BigInt(batchId),BigInt(quantity),beneficiary,purpose,keccak256(stringToHex(`${a}-${batchId}-${Date.now()}`))],account:a}));

  const value=useMemo(()=>({account,balance,connecting,pending,lastTx,error,stats,connect,refresh,faucet,deposit,withdraw,createPolicy,registerEvidence,stake,attest,issue,list,purchase,retire}),[account,balance,connecting,pending,lastTx,error,stats,refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWeb3(){const value=useContext(Context);if(!value)throw new Error("Web3Provider missing");return value}
