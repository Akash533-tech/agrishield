-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'UNDERWRITER', 'VERIFIER', 'BUYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ChainState" AS ENUM ('PENDING', 'CONFIRMED', 'REORGED', 'FAILED');

-- CreateEnum
CREATE TYPE "PolicyState" AS ENUM ('QUOTED', 'ACTIVE', 'TRIGGERED', 'PAID', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewState" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'DISPUTED', 'APPEALED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "geohash" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "acreage" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "chainPolicyId" BIGINT,
    "farmId" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "peril" TEXT NOT NULL,
    "threshold" DECIMAL(18,6) NOT NULL,
    "coverageMinor" BIGINT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "state" "PolicyState" NOT NULL DEFAULT 'QUOTED',
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Premium" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "txHash" TEXT,

    CONSTRAINT "Premium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolPosition" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "sharesMinor" BIGINT NOT NULL,
    "depositedMinor" BIGINT NOT NULL,
    "withdrawnMinor" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoolPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherObservation" (
    "id" TEXT NOT NULL,
    "policyId" TEXT,
    "source" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DECIMAL(18,6) NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "rawHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleReport" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "reportNonce" BIGINT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(18,6) NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "agreementBps" INTEGER NOT NULL,
    "signature" TEXT NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "chainEvidenceId" BIGINT,
    "submitterId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "metadataCid" TEXT NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "state" "ReviewState" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationVote" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "approve" BOOLEAN NOT NULL,
    "reasonCid" TEXT NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifierStake" (
    "id" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "txHash" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerifierStake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditBatch" (
    "id" TEXT NOT NULL,
    "chainBatchId" BIGINT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "quantity" BIGINT NOT NULL,
    "metadataCid" TEXT NOT NULL,
    "issuanceTxHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sellerWallet" TEXT NOT NULL,
    "quantity" BIGINT NOT NULL,
    "priceMinor" BIGINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "txHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "quantity" BIGINT NOT NULL,
    "totalMinor" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retirement" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "quantity" BIGINT NOT NULL,
    "beneficiary" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Retirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceId" TEXT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLog" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "contract" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "state" "ChainState" NOT NULL DEFAULT 'CONFIRMED',
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_key" ON "User"("wallet");

-- CreateIndex
CREATE INDEX "Farm_ownerId_region_idx" ON "Farm"("ownerId", "region");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_chainPolicyId_key" ON "Policy"("chainPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_txHash_key" ON "Policy"("txHash");

-- CreateIndex
CREATE INDEX "Policy_state_startsAt_endsAt_idx" ON "Policy"("state", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Policy_farmId_createdAt_idx" ON "Policy"("farmId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Premium_txHash_key" ON "Premium"("txHash");

-- CreateIndex
CREATE INDEX "PoolPosition_wallet_idx" ON "PoolPosition"("wallet");

-- CreateIndex
CREATE INDEX "WeatherObservation_metric_observedAt_idx" ON "WeatherObservation"("metric", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherObservation_source_sourceRef_key" ON "WeatherObservation"("source", "sourceRef");

-- CreateIndex
CREATE UNIQUE INDEX "OracleReport_reportNonce_key" ON "OracleReport"("reportNonce");

-- CreateIndex
CREATE UNIQUE INDEX "OracleReport_txHash_key" ON "OracleReport"("txHash");

-- CreateIndex
CREATE INDEX "OracleReport_policyId_observedAt_idx" ON "OracleReport"("policyId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_chainEvidenceId_key" ON "Evidence"("chainEvidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_contentHash_key" ON "Evidence"("contentHash");

-- CreateIndex
CREATE INDEX "Evidence_state_createdAt_idx" ON "Evidence"("state", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_farmId_category_idx" ON "Evidence"("farmId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationVote_txHash_key" ON "VerificationVote"("txHash");

-- CreateIndex
CREATE INDEX "VerificationVote_verifierId_createdAt_idx" ON "VerificationVote"("verifierId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationVote_evidenceId_verifierId_key" ON "VerificationVote"("evidenceId", "verifierId");

-- CreateIndex
CREATE UNIQUE INDEX "VerifierStake_txHash_key" ON "VerifierStake"("txHash");

-- CreateIndex
CREATE INDEX "VerifierStake_verifierId_lockedUntil_idx" ON "VerifierStake"("verifierId", "lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "CreditBatch_chainBatchId_key" ON "CreditBatch"("chainBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditBatch_evidenceId_key" ON "CreditBatch"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditBatch_issuanceTxHash_key" ON "CreditBatch"("issuanceTxHash");

-- CreateIndex
CREATE INDEX "CreditBatch_projectId_createdAt_idx" ON "CreditBatch"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_txHash_key" ON "Listing"("txHash");

-- CreateIndex
CREATE INDEX "Listing_active_createdAt_idx" ON "Listing"("active", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_txHash_key" ON "Purchase"("txHash");

-- CreateIndex
CREATE INDEX "Purchase_buyerId_createdAt_idx" ON "Purchase"("buyerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Retirement_certificateId_key" ON "Retirement"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "Retirement_txHash_key" ON "Retirement"("txHash");

-- CreateIndex
CREATE INDEX "Retirement_ownerId_createdAt_idx" ON "Retirement"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "ReputationEvent_userId_createdAt_idx" ON "ReputationEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TransactionLog_chainId_blockNumber_state_idx" ON "TransactionLog"("chainId", "blockNumber", "state");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionLog_chainId_txHash_logIndex_key" ON "TransactionLog"("chainId", "txHash", "logIndex");

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Premium" ADD CONSTRAINT "Premium_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherObservation" ADD CONSTRAINT "WeatherObservation_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OracleReport" ADD CONSTRAINT "OracleReport_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationVote" ADD CONSTRAINT "VerificationVote_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationVote" ADD CONSTRAINT "VerificationVote_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifierStake" ADD CONSTRAINT "VerifierStake_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditBatch" ADD CONSTRAINT "CreditBatch_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CreditBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retirement" ADD CONSTRAINT "Retirement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CreditBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retirement" ADD CONSTRAINT "Retirement_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationEvent" ADD CONSTRAINT "ReputationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
