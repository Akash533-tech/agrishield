import {
  createPublicClient,
  defineChain,
  http,
  parseAbi,
  type Address,
} from "viem";

export const CHAIN_ID = 10143;
export const monadTestnet = defineChain({
  id: CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz/"],
    },
  },
});

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(undefined, { retryCount: 3, timeout: 20_000 }),
});

const accessEvents = [
  "event RoleAdminChanged(bytes32 indexed role,bytes32 indexed previousAdminRole,bytes32 indexed newAdminRole)",
  "event RoleGranted(bytes32 indexed role,address indexed account,address indexed sender)",
  "event RoleRevoked(bytes32 indexed role,address indexed account,address indexed sender)",
] as const;
const pauseEvents = [
  "event Paused(address account)",
  "event Unpaused(address account)",
] as const;

export const contractAbis = {
  InsurancePool: parseAbi([
    ...accessEvents,
    ...pauseEvents,
    "event Deposited(address indexed provider,uint256 assets,uint256 shares)",
    "event Withdrawn(address indexed provider,uint256 assets,uint256 shares)",
    "event LiabilityReserved(uint256 indexed policyId,uint256 amount)",
    "event Payout(uint256 indexed policyId,address indexed beneficiary,uint256 amount)",
  ]),
  InsurancePolicy: parseAbi([
    ...accessEvents,
    ...pauseEvents,
    "event PolicyCreated(uint256 indexed policyId,address indexed holder,uint256 coverage,uint256 premium)",
    "event PolicySettled(uint256 indexed policyId,bytes32 indexed reportId,int256 observation,uint256 payout)",
    "event PolicyExpired(uint256 indexed policyId)",
  ]),
  EvidenceRegistry: parseAbi([
    ...accessEvents,
    ...pauseEvents,
    "event EvidenceRegistered(uint256 indexed id,address indexed submitter,bytes32 indexed contentHash,string metadataCid)",
    "event ReviewStateChanged(uint256 indexed id,uint8 state)",
  ]),
  VerifierStaking: parseAbi([
    ...accessEvents,
    "event Attested(uint256 indexed evidenceId,address indexed verifier,bool approve,bytes32 reasonHash)",
    "event QuorumReached(uint256 indexed evidenceId,bool approved)",
    "event DisputeOpened(uint256 indexed evidenceId,uint64 executableAt)",
    "event Slashed(uint256 indexed evidenceId,address indexed verifier,uint256 amount)",
  ]),
  GreenCredit: parseAbi([
    ...accessEvents,
    ...pauseEvents,
    "event TransferSingle(address indexed operator,address indexed from,address indexed to,uint256 id,uint256 value)",
    "event TransferBatch(address indexed operator,address indexed from,address indexed to,uint256[] ids,uint256[] values)",
    "event ApprovalForAll(address indexed account,address indexed operator,bool approved)",
    "event URI(string value,uint256 indexed id)",
    "event BatchIssued(uint256 indexed batchId,uint256 indexed evidenceId,address indexed recipient,uint256 quantity)",
    "event Retired(address indexed owner,uint256 indexed batchId,uint256 quantity,bytes32 indexed retirementId,string beneficiary,string purpose)",
  ]),
  CreditMarketplace: parseAbi([
    ...accessEvents,
    ...pauseEvents,
    "event Listed(uint256 indexed listingId,address indexed seller,uint256 indexed batchId,uint256 quantity,uint256 unitPrice)",
    "event Purchased(uint256 indexed listingId,address indexed buyer,uint256 quantity,uint256 total)",
    "event Cancelled(uint256 indexed listingId)",
  ]),
} as const;

const defaults: Record<keyof typeof contractAbis, Address> = {
  InsurancePool: "0x2499e8B7b12D1f261b481c1F449a79a0829d99eB",
  InsurancePolicy: "0x4C3Bfecb2Ef67D6D7B7F95eb2F3bDc7ffd26591c",
  EvidenceRegistry: "0xf9e9F834E17a0D35D7178ad965f2546ac1C484Ce",
  VerifierStaking: "0x6F9d46E3f58Fe8Caa209076feceb8b6CFd7a8750",
  GreenCredit: "0x10dc5e9B7555dBF5bce612bA0438568cE2372e3B",
  CreditMarketplace: "0x8845F0d15274e873281d1504c4731931a9F48bD2",
};

const envKeys: Record<keyof typeof contractAbis, string> = {
  InsurancePool: "INSURANCE_POOL_ADDRESS",
  InsurancePolicy: "INSURANCE_POLICY_ADDRESS",
  EvidenceRegistry: "EVIDENCE_REGISTRY_ADDRESS",
  VerifierStaking: "VERIFIER_STAKING_ADDRESS",
  GreenCredit: "GREEN_CREDIT_ADDRESS",
  CreditMarketplace: "CREDIT_MARKETPLACE_ADDRESS",
};

export const contracts = Object.entries(contractAbis).map(([name, abi]) => ({
  name: name as keyof typeof contractAbis,
  abi,
  address: (process.env[envKeys[name as keyof typeof contractAbis]] ??
    defaults[name as keyof typeof contractAbis]) as Address,
}));

export const contractByAddress = new Map(
  contracts.map((contract) => [contract.address.toLowerCase(), contract])
);

export function jsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, jsonSafe(nested)])
    );
  return value;
}
