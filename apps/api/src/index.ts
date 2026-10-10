import "dotenv/config";
import express from "express";
import cors from "cors";
import { ChainState, PrismaClient } from "@prisma/client";
import {
  evidenceSubmissionSchema,
  policyQuoteSchema,
} from "@agroshield/shared";
import { z } from "zod";
import {
  createPublicClient,
  createWalletClient,
  encodePacked,
  http,
  keccak256,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN_ID, contracts, jsonSafe, publicClient } from "./chain.js";

const app = express();
const db = new PrismaClient();
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json({ limit: "12mb" }));

app.get("/health", async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      database: "connected",
      mode: process.env.DEMO_MODE === "true" ? "demo" : "configured",
    });
  } catch {
    res.status(503).json({ ok: false, database: "unavailable" });
  }
});

app.post("/v1/policies/quote", (req, res) => {
  const parsed = policyQuoteSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(422)
      .json({ error: "invalid_request", issues: parsed.error.flatten() });
  const coverage = parsed.data.coverageMinor;
  const premium = (coverage * 150n) / 10_000n;
  res.json({
    premiumMinor: premium.toString(),
    coverageMinor: coverage.toString(),
    assumptions: [
      "1.5% deterministic demo base rate",
      "No actuarial guarantee",
      "Activation requires onchain pool solvency",
    ],
  });
});

app.post("/v1/evidence", async (req, res) => {
  const parsed = evidenceSubmissionSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(422)
      .json({ error: "invalid_request", issues: parsed.error.flatten() });
  res.status(202).json({
    status: "prepared",
    contentHash: parsed.data.contentHash,
    metadataCid: parsed.data.metadataCid,
    next: "Wallet signature required for registry submission",
  });
});

const confirmed = { chainId: CHAIN_ID, state: ChainState.CONFIRMED } as const;
const payload = (row: { payload: unknown }) =>
  row.payload as Record<string, unknown>;
const bigintField = (row: { payload: unknown }, field: string) => {
  const value = payload(row)[field];
  try {
    return BigInt(typeof value === "string" ? value : String(value ?? 0));
  } catch {
    return 0n;
  }
};
const stringField = (row: { payload: unknown }, field: string) =>
  String(payload(row)[field] ?? "");

app.get("/v1/indexer/status", async (_req, res) => {
  const [cursor, events, reorged, head] = await Promise.all([
    db.indexerCursor.findUnique({ where: { chainId: CHAIN_ID } }),
    db.transactionLog.count({ where: confirmed }),
    db.transactionLog.count({
      where: { chainId: CHAIN_ID, state: ChainState.REORGED },
    }),
    publicClient.getBlockNumber().catch(() => undefined),
  ]);
  const lag =
    cursor && head != null ? head - cursor.lastProcessedBlock : undefined;
  res.status(cursor ? 200 : 503).json(
    jsonSafe({
      ok: Boolean(cursor),
      chainId: CHAIN_ID,
      head,
      lastProcessedBlock: cursor?.lastProcessedBlock,
      lastFinalizedBlock: cursor?.lastFinalizedBlock,
      lag,
      events,
      reorged,
      updatedAt: cursor?.updatedAt,
      contracts: contracts.map(({ name, address }) => ({ name, address })),
    })
  );
});

const eventQuerySchema = z.object({
  contract: z.string().optional(),
  event: z.string().optional(),
  wallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
app.get("/v1/events", async (req, res) => {
  const parsed = eventQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return res
      .status(422)
      .json({ error: "invalid_query", issues: parsed.error.flatten() });
  const rows = await db.transactionLog.findMany({
    where: {
      ...confirmed,
      contractName: parsed.data.contract,
      eventName: parsed.data.event,
    },
    orderBy: [{ blockNumber: "desc" }, { logIndex: "desc" }],
    take: parsed.data.wallet ? 500 : parsed.data.limit,
  });
  const wallet = parsed.data.wallet?.toLowerCase();
  const events = (
    wallet
      ? rows.filter((row) =>
          Object.values(payload(row)).some(
            (value) => String(value).toLowerCase() === wallet
          )
        )
      : rows
  ).slice(0, parsed.data.limit);
  res.json(jsonSafe({ events, source: "confirmed-monad-events" }));
});

app.get("/v1/public/impact", async (_req, res) => {
  const rows = await db.transactionLog.findMany({ where: confirmed });
  const byName = (name: string) => rows.filter((row) => row.eventName === name);
  const policies = byName("PolicyCreated");
  const registered = byName("EvidenceRegistered");
  const verified = byName("QuorumReached").filter(
    (row) => payload(row).approved === true
  );
  const issued = byName("BatchIssued");
  const retired = byName("Retired");
  const payouts = byName("Payout");
  const actors = new Set(
    [
      ...policies.map((row) => stringField(row, "holder").toLowerCase()),
      ...registered.map((row) => stringField(row, "submitter").toLowerCase()),
    ].filter(Boolean)
  );
  const pool = contracts.find((contract) => contract.name === "InsurancePool")!;
  const poolReadAbi = [
    {
      type: "function",
      name: "totalAssets",
      stateMutability: "view",
      inputs: [],
      outputs: [{ type: "uint256" }],
    },
    {
      type: "function",
      name: "reservedLiability",
      stateMutability: "view",
      inputs: [],
      outputs: [{ type: "uint256" }],
    },
  ] as const;
  const [poolCapital, reservedLiability] = await Promise.all([
    publicClient
      .readContract({
        address: pool.address,
        abi: poolReadAbi,
        functionName: "totalAssets",
      })
      .catch(() => undefined),
    publicClient
      .readContract({
        address: pool.address,
        abi: poolReadAbi,
        functionName: "reservedLiability",
      })
      .catch(() => undefined),
  ]);
  const cursor = await db.indexerCursor.findUnique({
    where: { chainId: CHAIN_ID },
  });
  res.json(
    jsonSafe({
      farmers: actors.size,
      farms: actors.size,
      policies: policies.length,
      insuredValueMinor: policies.reduce(
        (sum, row) => sum + bigintField(row, "coverage"),
        0n
      ),
      payoutsMinor: payouts.reduce(
        (sum, row) => sum + bigintField(row, "amount"),
        0n
      ),
      evidence: registered.length,
      verifiedEvidence: verified.length,
      issuedUnits: issued.reduce(
        (sum, row) => sum + bigintField(row, "quantity"),
        0n
      ),
      retirements: retired.length,
      retiredUnits: retired.reduce(
        (sum, row) => sum + bigintField(row, "quantity"),
        0n
      ),
      transactions: new Set(rows.map((row) => row.txHash)).size,
      poolCapitalMinor: poolCapital,
      reservedLiabilityMinor: reservedLiability,
      lastIndexedBlock: cursor?.lastProcessedBlock,
      indexedAt: cursor?.updatedAt,
      generatedAt: new Date().toISOString(),
      source: "confirmed-monad-events",
    })
  );
});

app.get("/v1/dashboard/:wallet", async (req, res) => {
  const wallet = z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .safeParse(req.params.wallet);
  if (!wallet.success) return res.status(422).json({ error: "invalid_wallet" });
  const lower = wallet.data.toLowerCase();
  const rows = await db.transactionLog.findMany({
    where: confirmed,
    orderBy: [{ blockNumber: "desc" }, { logIndex: "desc" }],
    take: 1000,
  });
  const owned = rows.filter((row) =>
    Object.values(payload(row)).some(
      (value) => String(value).toLowerCase() === lower
    )
  );
  const count = (name: string) =>
    owned.filter((row) => row.eventName === name).length;
  const ownedBy = (name: string, field: string) =>
    owned.filter(
      (row) =>
        row.eventName === name &&
        stringField(row, field).toLowerCase() === lower
    );
  res.json(
    jsonSafe({
      wallet: wallet.data,
      summary: {
        policiesCreated: count("PolicyCreated"),
        payoutsReceived: count("Payout"),
        evidenceSubmitted: count("EvidenceRegistered"),
        attestations: count("Attested"),
        batchesReceived: count("BatchIssued"),
        purchases: count("Purchased"),
        retirements: count("Retired"),
        poolDeposits: count("Deposited"),
        coverageCreatedMinor: ownedBy("PolicyCreated", "holder").reduce(
          (sum, row) => sum + bigintField(row, "coverage"),
          0n
        ),
        payoutsReceivedMinor: ownedBy("Payout", "beneficiary").reduce(
          (sum, row) => sum + bigintField(row, "amount"),
          0n
        ),
        issuedUnits: ownedBy("BatchIssued", "recipient").reduce(
          (sum, row) => sum + bigintField(row, "quantity"),
          0n
        ),
        purchasedUnits: ownedBy("Purchased", "buyer").reduce(
          (sum, row) => sum + bigintField(row, "quantity"),
          0n
        ),
        retiredUnits: ownedBy("Retired", "owner").reduce(
          (sum, row) => sum + bigintField(row, "quantity"),
          0n
        ),
        poolDepositedMinor: ownedBy("Deposited", "provider").reduce(
          (sum, row) => sum + bigintField(row, "assets"),
          0n
        ),
      },
      activity: owned.slice(0, 30),
      source: "confirmed-monad-events",
    })
  );
});

const coordinatesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});
app.get("/v1/weather", async (req, res) => {
  const parsed = coordinatesSchema.safeParse(req.query);
  if (!parsed.success)
    return res.status(422).json({ error: "invalid_coordinates" });
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(parsed.data.lat));
  url.searchParams.set("longitude", String(parsed.data.lon));
  url.searchParams.set("daily", "temperature_2m_max,precipitation_sum");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");
  const response = await fetch(url);
  if (!response.ok)
    return res.status(502).json({ error: "weather_provider_unavailable" });
  res.json({
    usage: "INFORMATIONAL_FORECAST_ONLY",
    settlementAuthorized: false,
    provider: "Open-Meteo",
    data: await response.json(),
  });
});

app.post("/v1/storage/evidence", async (req, res) => {
  const ipfsToken = process.env.IPFS_API_TOKEN?.trim();
  if (!ipfsToken)
    return res.status(503).json({
      error: "ipfs_not_configured",
      message: "Set IPFS_API_TOKEN to a Pinata JWT; no upload was attempted",
    });
  if (!ipfsToken.startsWith("eyJ") || ipfsToken.split(".").length !== 3) {
    return res.status(503).json({
      error: "invalid_ipfs_credential",
      message:
        "IPFS_API_TOKEN must contain the long Pinata JWT, not the short API key; no upload was attempted",
    });
  }
  const metadata = z
    .object({
      name: z.string().min(3),
      description: z.string().min(20),
      category: z.string(),
      activityDate: z.string(),
      contentHash: z.string(),
      photoCid: z.string().min(20).optional(),
      gps: z
        .object({
          lat: z.number().min(-90).max(90),
          lon: z.number().min(-180).max(180),
          precision: z.literal("field-level"),
        })
        .optional(),
      measurements: z.string().max(1000).optional(),
    })
    .safeParse(req.body);
  if (!metadata.success)
    return res
      .status(422)
      .json({ error: "invalid_metadata", issues: metadata.error.flatten() });
  const response = await fetch(
    process.env.IPFS_API_URL ??
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ipfsToken}`,
      },
      body: JSON.stringify({
        pinataContent: metadata.data,
        pinataMetadata: {
          name: `agroshield-${metadata.data.contentHash.slice(2, 10)}`,
        },
      }),
    }
  );
  if (!response.ok)
    return res
      .status(502)
      .json({ error: "pinning_failed", providerStatus: response.status });
  const body = (await response.json()) as { IpfsHash?: string };
  res.status(201).json({
    cid: body.IpfsHash,
    gateway: body.IpfsHash
      ? `${
          process.env.IPFS_GATEWAY_URL ?? "https://gateway.pinata.cloud/ipfs"
        }/${body.IpfsHash}`
      : undefined,
    registeredOnchain: false,
  });
});

app.post("/v1/storage/file", async (req, res) => {
  const ipfsToken = process.env.IPFS_API_TOKEN?.trim();
  if (!ipfsToken?.startsWith("eyJ"))
    return res.status(503).json({ error: "ipfs_not_configured" });
  const parsed = z
    .object({
      name: z.string().min(1).max(120),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      base64: z.string().min(10).max(10_000_000),
    })
    .safeParse(req.body);
  if (!parsed.success)
    return res
      .status(422)
      .json({ error: "invalid_file", issues: parsed.error.flatten() });
  const bytes = Buffer.from(
    parsed.data.base64.replace(/^data:[^;]+;base64,/, ""),
    "base64"
  );
  if (bytes.length === 0 || bytes.length > 7_500_000)
    return res.status(413).json({
      error: "file_too_large",
      message: "Evidence images are limited to 7.5 MB",
    });
  const form = new FormData();
  form.append(
    "file",
    new Blob([bytes], { type: parsed.data.mimeType }),
    parsed.data.name
  );
  form.append(
    "pinataMetadata",
    JSON.stringify({ name: `agroshield-evidence-${Date.now()}` })
  );
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: { authorization: `Bearer ${ipfsToken}` },
      body: form,
    }
  );
  if (!response.ok)
    return res
      .status(502)
      .json({ error: "file_pinning_failed", providerStatus: response.status });
  const body = (await response.json()) as { IpfsHash?: string };
  res.status(201).json({
    cid: body.IpfsHash,
    gateway: body.IpfsHash
      ? `${
          process.env.IPFS_GATEWAY_URL ?? "https://gateway.pinata.cloud/ipfs"
        }/${body.IpfsHash}`
      : undefined,
    public: true,
  });
});

const oracleSchema = z.object({
  policyId: z.coerce.bigint().positive(),
  observedAt: z.coerce.number().int().positive(),
  sources: z
    .array(
      z.object({
        name: z.string().min(2),
        observation: z.coerce.number().int(),
      })
    )
    .min(2),
});
const policyAbi = [
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "observation", type: "int256" },
      { name: "observedAt", type: "uint64" },
      { name: "reportId", type: "bytes32" },
      { name: "agreeingSources", type: "uint8" },
    ],
    outputs: [],
  },
] as const;
app.post("/v1/oracle/settle", async (req, res) => {
  if (
    !process.env.ORACLE_API_KEY ||
    req.header("x-oracle-api-key") !== process.env.ORACLE_API_KEY
  )
    return res.status(401).json({ error: "unauthorized_oracle" });
  if (!process.env.ORACLE_PRIVATE_KEY)
    return res.status(503).json({ error: "oracle_signer_not_configured" });
  const parsed = oracleSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(422)
      .json({ error: "invalid_report", issues: parsed.error.flatten() });
  const now = Math.floor(Date.now() / 1000);
  if (parsed.data.observedAt > now || now - parsed.data.observedAt > 21600)
    return res.status(422).json({ error: "stale_observation" });
  const values = parsed.data.sources.map((s) => s.observation),
    min = Math.min(...values),
    max = Math.max(...values),
    mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  if (max - min > Math.max(1, Math.abs(mean) * 0.05))
    return res.status(422).json({ error: "source_disagreement" });
  const account = privateKeyToAccount(process.env.ORACLE_PRIVATE_KEY as Hex);
  const chain = {
    id: 10143,
    name: "Monad Testnet",
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: {
      default: {
        http: [process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz/"],
      },
    },
  } as const;
  const wallet = createWalletClient({ account, chain, transport: http() });
  const publicClient = createPublicClient({ chain, transport: http() });
  const reportId = keccak256(
    encodePacked(
      ["uint256", "uint64", "int256", "string"],
      [
        parsed.data.policyId,
        BigInt(parsed.data.observedAt),
        BigInt(mean),
        parsed.data.sources
          .map((s) => s.name)
          .sort()
          .join(","),
      ]
    )
  );
  const hash = await wallet.writeContract({
    address: (process.env.INSURANCE_POLICY_ADDRESS ??
      "0x65033a3F06944DD3Ace2A9A2A1fB262604Ca1Da3") as Address,
    abi: policyAbi,
    functionName: "settle",
    args: [
      parsed.data.policyId,
      BigInt(mean),
      BigInt(parsed.data.observedAt),
      reportId,
      parsed.data.sources.length,
    ],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  res.json({
    status: receipt.status,
    hash,
    reportId,
    observation: mean,
    sourceCount: parsed.data.sources.length,
    usage: "AUTHENTICATED_DEMO_OBSERVATION",
    explorer: `https://testnet.monadexplorer.com/tx/${hash}`,
  });
});

app.use((_req, res) => res.status(404).json({ error: "not_found" }));
app.listen(Number(process.env.PORT ?? 4000), () =>
  console.log("AgroShield API listening on :" + (process.env.PORT ?? 4000))
);
