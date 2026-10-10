import "dotenv/config";
import { ChainState, Prisma, PrismaClient } from "@prisma/client";
import { decodeEventLog, type Address } from "viem";
import {
  CHAIN_ID,
  contractByAddress,
  contracts,
  jsonSafe,
  publicClient,
} from "./chain.js";

const db = new PrismaClient();
const confirmations = BigInt(process.env.INDEXER_CONFIRMATIONS ?? "8");
const reorgDepth = BigInt(process.env.INDEXER_REORG_DEPTH ?? "32");
const requestedChunkSize = BigInt(process.env.INDEXER_CHUNK_SIZE ?? "100");
const chunkSize = requestedChunkSize > 100n ? 100n : requestedChunkSize;
const intervalMs = Number(process.env.INDEXER_POLL_INTERVAL_MS ?? "12000");

async function reconcileReorgs(fromBlock: bigint, toBlock: bigint) {
  const rows = await db.transactionLog.findMany({
    where: {
      chainId: CHAIN_ID,
      blockNumber: { gte: fromBlock, lte: toBlock },
      state: ChainState.CONFIRMED,
    },
    select: { id: true, blockNumber: true, blockHash: true },
  });
  const hashes = new Map<bigint, string>();
  for (const row of rows) {
    let canonical = hashes.get(row.blockNumber);
    if (!canonical) {
      canonical = (
        await publicClient.getBlock({ blockNumber: row.blockNumber })
      ).hash;
      hashes.set(row.blockNumber, canonical);
    }
    if (canonical.toLowerCase() !== row.blockHash.toLowerCase())
      await db.transactionLog.update({
        where: { id: row.id },
        data: { state: ChainState.REORGED },
      });
  }
  return rows.length;
}

export async function indexOnce() {
  const head = await publicClient.getBlockNumber();
  if (head <= confirmations) return { head, indexed: 0, safeHead: 0n };
  const safeHead = head - confirmations;
  const cursor = await db.indexerCursor.findUnique({
    where: { chainId: CHAIN_ID },
  });
  const forceBackfill = process.argv.includes("--backfill");
  const configuredStart = process.env.INDEXER_START_BLOCK
    ? BigInt(process.env.INDEXER_START_BLOCK)
    : safeHead > 500n
    ? safeHead - 500n
    : 0n;
  const overlapStart =
    cursor && !forceBackfill
      ? cursor.lastProcessedBlock > reorgDepth
        ? cursor.lastProcessedBlock - reorgDepth + 1n
        : 0n
      : configuredStart;
  const fromBlock =
    overlapStart > configuredStart ? overlapStart : configuredStart;
  const reconciled = await reconcileReorgs(fromBlock, safeHead);
  let indexed = 0;

  for (
    let chunkFrom = fromBlock;
    chunkFrom <= safeHead;
    chunkFrom += chunkSize
  ) {
    const chunkTo =
      chunkFrom + chunkSize - 1n < safeHead
        ? chunkFrom + chunkSize - 1n
        : safeHead;
    const logs = await publicClient.getLogs({
      address: contracts.map((contract) => contract.address) as Address[],
      fromBlock: chunkFrom,
      toBlock: chunkTo,
    });
    const timestamps = new Map<bigint, Date>();
    for (const log of logs) {
      if (
        !log.transactionHash ||
        log.logIndex == null ||
        !log.blockHash ||
        log.blockNumber == null
      )
        continue;
      const contract = contractByAddress.get(log.address.toLowerCase());
      if (!contract) continue;
      let eventName = "Unknown";
      let args: unknown = {};
      try {
        const decoded = decodeEventLog({
          abi: contract.abi,
          data: log.data,
          topics: log.topics,
          strict: true,
        });
        eventName = decoded.eventName;
        args = decoded.args;
      } catch {
        // Keep undecodable logs for auditability without inventing a projection.
      }
      let blockTimestamp = timestamps.get(log.blockNumber);
      if (!blockTimestamp) {
        const block = await publicClient.getBlock({
          blockNumber: log.blockNumber,
        });
        blockTimestamp = new Date(Number(block.timestamp) * 1000);
        timestamps.set(log.blockNumber, blockTimestamp);
      }
      await db.transactionLog.upsert({
        where: {
          chainId_txHash_logIndex: {
            chainId: CHAIN_ID,
            txHash: log.transactionHash,
            logIndex: log.logIndex,
          },
        },
        update: {
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          contract: log.address,
          contractName: contract.name,
          eventName,
          payload: jsonSafe(args) as Prisma.InputJsonValue,
          blockTimestamp,
          state: ChainState.CONFIRMED,
          confirmations: Number(head - log.blockNumber),
        },
        create: {
          chainId: CHAIN_ID,
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          txHash: log.transactionHash,
          logIndex: log.logIndex,
          contract: log.address,
          contractName: contract.name,
          eventName,
          payload: jsonSafe(args) as Prisma.InputJsonValue,
          blockTimestamp,
          state: ChainState.CONFIRMED,
          confirmations: Number(head - log.blockNumber),
        },
      });
      indexed += 1;
    }
  }

  const finalBlock = await publicClient.getBlock({ blockNumber: safeHead });
  await db.indexerCursor.upsert({
    where: { chainId: CHAIN_ID },
    update: {
      lastProcessedBlock: safeHead,
      lastProcessedBlockHash: finalBlock.hash,
      lastFinalizedBlock: safeHead,
    },
    create: {
      chainId: CHAIN_ID,
      lastProcessedBlock: safeHead,
      lastProcessedBlockHash: finalBlock.hash,
      lastFinalizedBlock: safeHead,
    },
  });
  return { head, safeHead, fromBlock, indexed, reconciled };
}

async function main() {
  const watch = process.argv.includes("--watch");
  do {
    const result = await indexOnce();
    console.log(
      JSON.stringify(
        jsonSafe({
          chainId: CHAIN_ID,
          contracts: contracts.length,
          ...result,
          at: new Date().toISOString(),
        })
      )
    );
    if (watch) await new Promise((resolve) => setTimeout(resolve, intervalMs));
  } while (watch);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
