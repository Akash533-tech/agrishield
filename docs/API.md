# AgroShield API

All financial integer amounts use the test token's smallest unit. Blockchain ownership and settlement are source of truth; database records are an indexed, reorg-aware projection.

- `GET /health` — API and database readiness.
- `POST /v1/policies/quote` — validated deterministic demo quote. Does not bind coverage.
- `POST /v1/evidence` — validates an offchain evidence envelope. Does not pin without configured credentials and does not claim chain registration.
- `GET /v1/public/impact` — confirmed event-derived impact totals plus live pool capital and index cursor.
- `GET /v1/indexer/status` — chain head, finalized cursor, lag, indexed event count, reorg count and watched contracts.
- `GET /v1/events?contract=InsurancePolicy&event=PolicyCreated&wallet=0x...&limit=25` — decoded confirmed event feed with optional filters.
- `GET /v1/dashboard/:wallet` — wallet-specific confirmed activity and aggregate policy, payout, evidence, credit, retirement and pool metrics.
- `GET /v1/weather?lat=20.7&lon=78.6` — Open-Meteo seven-day forecast, explicitly non-settling.
- `POST /v1/storage/evidence` — Pinata-compatible metadata pinning; returns `503` without credentials rather than simulating an upload.
- `POST /v1/storage/file` — validated JPEG/PNG/WebP evidence upload (7.5 MB maximum) to Pinata; returns a real public CID. The UI warns users to remove sensitive identity/EXIF data.
- `POST /v1/oracle/settle` — API-key authenticated, freshness-checked, multi-source-agreement demo settlement adapter that returns a real Monad receipt.

Run `npm run indexer:once -w @agroshield/api` for a single synchronization, `npm run indexer:backfill -w @agroshield/api` to safely re-decode from the configured deployment block, or `npm run indexer:watch -w @agroshield/api` for the persistent worker. The worker waits for the configured confirmation depth, rescans an overlap window, verifies canonical block hashes, marks orphaned logs `REORGED`, decodes known contract events and advances a durable PostgreSQL cursor.

Production adapters must authenticate oracle reports, store encrypted private evidence offchain, and wait for configured chain confirmations before projecting final state.
