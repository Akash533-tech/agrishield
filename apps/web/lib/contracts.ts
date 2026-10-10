export const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_RPC_URL ?? "https://testnet-rpc.monad.xyz/"] } },
  blockExplorers: { default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" } },
} as const;

export const contracts = {
  token: (process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS ?? "0x30e55dcAb786463BaE3cF6CC0D0b294b0dBd12D7") as `0x${string}`,
  pool: (process.env.NEXT_PUBLIC_POOL_ADDRESS ?? "0x2499e8B7b12D1f261b481c1F449a79a0829d99eB") as `0x${string}`,
  policy: (process.env.NEXT_PUBLIC_POLICY_ADDRESS ?? "0x4C3Bfecb2Ef67D6D7B7F95eb2F3bDc7ffd26591c") as `0x${string}`,
  evidence: (process.env.NEXT_PUBLIC_EVIDENCE_ADDRESS ?? "0xf9e9F834E17a0D35D7178ad965f2546ac1C484Ce") as `0x${string}`,
  staking: (process.env.NEXT_PUBLIC_STAKING_ADDRESS ?? "0x6F9d46E3f58Fe8Caa209076feceb8b6CFd7a8750") as `0x${string}`,
  credit: (process.env.NEXT_PUBLIC_CREDIT_ADDRESS ?? "0x10dc5e9B7555dBF5bce612bA0438568cE2372e3B") as `0x${string}`,
  marketplace: (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS ?? "0x8845F0d15274e873281d1504c4731931a9F48bD2") as `0x${string}`,
} as const;

export const erc20Abi = [
  { type:"function", name:"approve", stateMutability:"nonpayable", inputs:[{name:"spender",type:"address"},{name:"amount",type:"uint256"}], outputs:[{type:"bool"}] },
  { type:"function", name:"balanceOf", stateMutability:"view", inputs:[{name:"account",type:"address"}], outputs:[{type:"uint256"}] },
  { type:"function", name:"faucet", stateMutability:"nonpayable", inputs:[], outputs:[] },
] as const;
export const poolAbi = [
  { type:"function", name:"deposit", stateMutability:"nonpayable", inputs:[{name:"amount",type:"uint256"}], outputs:[{name:"minted",type:"uint256"}] },
  { type:"function", name:"withdraw", stateMutability:"nonpayable", inputs:[{name:"shareAmount",type:"uint256"}], outputs:[{name:"assets",type:"uint256"}] },
  { type:"function", name:"shares", stateMutability:"view", inputs:[{name:"account",type:"address"}], outputs:[{type:"uint256"}] },
  { type:"function", name:"totalAssets", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] },
  { type:"function", name:"reservedLiability", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] },
] as const;
export const policyAbi = [
  { type:"function", name:"create", stateMutability:"nonpayable", inputs:[{name:"coverage",type:"uint96"},{name:"premium",type:"uint96"},{name:"startsAt",type:"uint64"},{name:"endsAt",type:"uint64"},{name:"threshold",type:"int64"},{name:"triggerBelow",type:"bool"}], outputs:[{name:"id",type:"uint256"}] },
] as const;
export const evidenceAbi = [
  { type:"function", name:"register", stateMutability:"nonpayable", inputs:[{name:"contentHash",type:"bytes32"},{name:"category",type:"bytes32"},{name:"metadataCid",type:"string"}], outputs:[{name:"id",type:"uint256"}] },
  { type:"function", name:"evidence", stateMutability:"view", inputs:[{name:"id",type:"uint256"}], outputs:[{type:"address"},{type:"bytes32"},{type:"bytes32"},{type:"uint64"},{type:"string"},{type:"uint8"}] },
] as const;
export const stakingAbi = [
  { type:"function", name:"stake", stateMutability:"nonpayable", inputs:[{name:"amount",type:"uint256"}], outputs:[] },
  { type:"function", name:"attest", stateMutability:"nonpayable", inputs:[{name:"id",type:"uint256"},{name:"approve",type:"bool"},{name:"reasonHash",type:"bytes32"}], outputs:[] },
  { type:"function", name:"approvals", stateMutability:"view", inputs:[{name:"id",type:"uint256"}], outputs:[{type:"uint8"}] },
  { type:"function", name:"rejections", stateMutability:"view", inputs:[{name:"id",type:"uint256"}], outputs:[{type:"uint8"}] },
] as const;
export const creditAbi = [
  { type:"function", name:"issue", stateMutability:"nonpayable", inputs:[{name:"batchId",type:"uint256"},{name:"evidenceId",type:"uint256"},{name:"projectId",type:"bytes32"},{name:"methodology",type:"bytes32"},{name:"quantity",type:"uint256"},{name:"metadataCid",type:"string"},{name:"recipient",type:"address"}], outputs:[] },
  { type:"function", name:"retire", stateMutability:"nonpayable", inputs:[{name:"batchId",type:"uint256"},{name:"quantity",type:"uint256"},{name:"beneficiary",type:"string"},{name:"purpose",type:"string"},{name:"nonce",type:"bytes32"}], outputs:[] },
  { type:"function", name:"setApprovalForAll", stateMutability:"nonpayable", inputs:[{name:"operator",type:"address"},{name:"approved",type:"bool"}], outputs:[] },
  { type:"function", name:"balanceOf", stateMutability:"view", inputs:[{name:"account",type:"address"},{name:"id",type:"uint256"}], outputs:[{type:"uint256"}] },
] as const;
export const marketplaceAbi = [
  { type:"function", name:"list", stateMutability:"nonpayable", inputs:[{name:"batchId",type:"uint256"},{name:"quantity",type:"uint256"},{name:"unitPrice",type:"uint256"}], outputs:[{name:"id",type:"uint256"}] },
  { type:"function", name:"purchase", stateMutability:"nonpayable", inputs:[{name:"id",type:"uint256"},{name:"quantity",type:"uint256"}], outputs:[] },
  { type:"function", name:"listings", stateMutability:"view", inputs:[{name:"id",type:"uint256"}], outputs:[{name:"seller",type:"address"},{name:"batchId",type:"uint256"},{name:"quantity",type:"uint256"},{name:"unitPrice",type:"uint256"},{name:"active",type:"bool"}] },
] as const;
