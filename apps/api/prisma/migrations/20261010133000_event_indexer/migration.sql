ALTER TABLE "TransactionLog"
ADD COLUMN "contractName" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN "blockTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "TransactionLog_chainId_contractName_eventName_state_idx"
ON "TransactionLog"("chainId", "contractName", "eventName", "state");

CREATE INDEX "TransactionLog_chainId_blockTimestamp_idx"
ON "TransactionLog"("chainId", "blockTimestamp");

CREATE TABLE "IndexerCursor" (
  "chainId" INTEGER NOT NULL,
  "lastProcessedBlock" BIGINT NOT NULL,
  "lastProcessedBlockHash" TEXT NOT NULL,
  "lastFinalizedBlock" BIGINT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IndexerCursor_pkey" PRIMARY KEY ("chainId")
);
