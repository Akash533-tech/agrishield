# AgroShield

Decentralized climate insurance and a verified green-credit network for a Monad-compatible EVM. This repository is a demo-ready hackathon vertical slice with an explicit separation between sample data, forecasts, authenticated settlement observations, and confirmed blockchain actions.

## What works

- Premium responsive Next.js experience with public landing page and role-aware Farmer, Underwriter, Verifier, Buyer/Marketplace, Impact, and climate-simulation surfaces.
- Interactive policy quote, evidence package, marketplace, verifier/pool views, toast/error feedback, responsive navigation, and live hypothetical drought/flood/heat stress modeling.
- Solidity contracts for a solvent insurance pool, one-time parametric settlement, immutable evidence hashes, staked quorum attestations with appeal-delayed slashing, and ERC-1155 issuance/retirement.
- PostgreSQL/Prisma domain model, typed Zod request contracts, deterministic sample seed, Express API, and deterministic FastAPI risk service.
- Hardhat security tests and deployment script that refuses to infer a trusted oracle.
- Live Monad Testnet deployment plus MetaMask/viem transaction flows for aUSD faucet funding, pool deposits/withdrawals, policy creation, real Pinata evidence registration, verifier staking/voting, verified-only issuance, atomic listing/purchase, and burn-based retirement.
- Role-aware onboarding with a Leaflet farm picker and role-filtered Farmer, Underwriter, Verifier, Buyer, and Administrator navigation.

## Honest demo boundaries

- Local UI data is deterministic sample data. It represents no real farmer, climate observation, transaction, certification, or return.
- The UI never invents transaction hashes. Without wallet/testnet configuration, blockchain actions stop at a clear wallet/configuration prompt.
- Open-Meteo-style forecast information is informational only. Contract settlement accepts only a fresh, monitoring-window observation from the configured oracle role with at least two agreeing sources.
- Credits are **demo environmental units**, not certified or regulatory carbon offsets. Sensitive identity and raw evidence must remain encrypted and offchain; contracts store hashes/CIDs only.
- The eco signal is based on verified practices and is not a weather-risk predictor. The demo pricing adjustment is capped and separately disclosed.

## Repository

```text
apps/web           Next.js App Router interface
apps/api           Express + Prisma API and index projection
apps/risk-service  Explainable deterministic FastAPI score
packages/contracts Solidity + Hardhat tests and deploy script
packages/shared    Shared Zod API contracts
docs               API notes and 3-minute walkthrough
```

## Local setup

Requirements: Node 20+, npm 10+, Docker (for PostgreSQL), and optionally Python 3.11+.

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run db:generate -w @agroshield/api
npm run db:deploy -w @agroshield/api
npm run db:seed -w @agroshield/api
npm run dev
```

The web app opens at `http://localhost:3000`. Start the API separately with:

```bash
npm run dev -w @agroshield/api
```

Start the persistent Monad event indexer in a third terminal:

```bash
npm run indexer:watch -w @agroshield/api
```

The worker decodes all six protocol contracts, waits for confirmation depth, persists a durable cursor, and reconciles overlapping blocks for reorgs. `GET /v1/indexer/status`, `/v1/events`, `/v1/dashboard/:wallet`, and `/v1/public/impact` expose the confirmed read model used by the dashboards.

Optional risk service:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r apps/risk-service/requirements.txt
uvicorn apps.risk-service.main:app --reload --port 8000
```

## Verification

```bash
npm run typecheck
npm run build
npm test
npm run test:e2e -w @agroshield/web
```

Contract tests cover unauthorized payout attempts, stale and insufficient-source oracle reports, one-time settlement, reserve-protected withdrawals, insolvency, duplicate evidence/issuance, verified-only issuance, three-wallet quorum, atomic marketplace exchange, replay-safe burn retirement, faucet replay, insufficient verifier stake, duplicate voting, and dispute quorum. Playwright covers Farmer and Underwriter onboarding/navigation.

## Monad testnet deployment

Set `MONAD_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, and a deliberately selected `ORACLE_ADDRESS` in the environment. Use only a testnet-funded account.

```bash
npm run contracts:compile
npm run deploy:monad -w @agroshield/contracts
```

The deploy script prints addresses only after confirmed deployments. The current deployment is recorded in `packages/contracts/deployments/monad-testnet.json`:

| Contract          | Monad Testnet address                        |
| ----------------- | -------------------------------------------- |
| TestToken         | `0x30e55dcAb786463BaE3cF6CC0D0b294b0dBd12D7` |
| InsurancePool     | `0x2499e8B7b12D1f261b481c1F449a79a0829d99eB` |
| InsurancePolicy   | `0x4C3Bfecb2Ef67D6D7B7F95eb2F3bDc7ffd26591c` |
| EvidenceRegistry  | `0xf9e9F834E17a0D35D7178ad965f2546ac1C484Ce` |
| VerifierStaking   | `0x6F9d46E3f58Fe8Caa209076feceb8b6CFd7a8750` |
| GreenCredit       | `0x10dc5e9B7555dBF5bce612bA0438568cE2372e3B` |
| CreditMarketplace | `0x8845F0d15274e873281d1504c4731931a9F48bD2` |

Each UI transaction waits for a receipt and generates a real `https://testnet.monadexplorer.com/tx/<hash>` link.

## Production work still required

The vertical slice does not claim production readiness. A launch requires independent contract audits, production oracle authentication and multi-source policy, encrypted evidence storage, key management, chain reorg/finality tuning, sanctions/identity/compliance review, actuarial calibration, recognized environmental methodologies, additionality/permanence/leakage rules, independent validation, monitoring, incident response, and complete wallet/e2e coverage.

See [API notes](docs/API.md) and the [three-minute demo](docs/DEMO.md).
