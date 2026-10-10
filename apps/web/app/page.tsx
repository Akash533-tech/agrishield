"use client";

import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Blocks,
  Check,
  ChevronRight,
  CircleDollarSign,
  CloudRain,
  Coins,
  FileCheck2,
  Gauge,
  HandCoins,
  Home,
  Leaf,
  LockKeyhole,
  Menu,
  PackageCheck,
  PanelLeftClose,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  TrendingUp,
  UploadCloud,
  Users,
  WalletCards,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import dynamic from "next/dynamic";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  credits,
  evidence,
  impact,
  policies,
  weather,
  type Role,
} from "@/lib/data";
import { calculateScenario } from "@/lib/simulator";
import { useWeb3 } from "@/components/Web3Provider";

const navItems = [
  ["Overview", Home],
  ["Insurance", Shield],
  ["Evidence", FileCheck2],
  ["Green credits", Leaf],
  ["Climate lab", Gauge],
  ["Underwriter", TrendingUp],
  ["Verifier", BadgeCheck],
  ["Impact", BarChart3],
  ["Business", ShoppingBag],
  ["Administration", Users],
] as const;
const FarmMap = dynamic(() => import("@/components/FarmMap"), {
  ssr: false,
  loading: () => (
    <div className="farm-map" style={{ display: "grid", placeItems: "center" }}>
      Loading farm map…
    </div>
  ),
});
type AppRole =
  | "Farmer"
  | "Underwriter"
  | "Verifier"
  | "Business Buyer"
  | "Administrator";
type Profile = {
  name: string;
  role: AppRole;
  region: string;
  crop: string;
  acreage: string;
  lat: number;
  lon: number;
};
type IndexedEvent = {
  id: string;
  txHash: string;
  eventName: string;
  contractName: string;
  blockNumber: string;
  blockTimestamp: string;
  confirmations: number;
  payload: Record<string, string | boolean>;
};
type IndexedDashboard = {
  wallet: string;
  summary: Record<string, string | number>;
  activity: IndexedEvent[];
  source: string;
};

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Sprout />
      </span>
      <span>AgroShield</span>
    </div>
  );
}

function Landing({ enter }: { enter: () => void }) {
  return (
    <div className="landing">
      <nav className="nav shell">
        <Logo />
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#protocol">Protocol</a>
          <a href="#impact">Impact</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="actions">
          <button className="btn btn-outline" onClick={enter}>
            View dashboard
          </button>
          <button className="btn btn-primary" onClick={enter}>
            Launch app <ArrowRight size={15} />
          </button>
        </div>
      </nav>
      <div className="network-rail">
        <div className="shell network-rail-inner">
          <span>
            <i /> Protocol operational
          </span>
          <span>
            Network <strong>Monad Testnet</strong>
          </span>
          <span>
            Settlement mode <strong>Authenticated observations</strong>
          </span>
          <span className="network-rail-right">
            Demo environment · no real funds
          </span>
        </div>
      </div>
      <main>
        <section className="hero shell">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="eyebrow">
              <span className="pulse" />
              Climate risk infrastructure for agriculture
            </div>
            <h1>
              Weather cover that <em>settles by rule.</em>
            </h1>
            <p>
              Pre-agreed rainfall and temperature triggers protect the season.
              Independently reviewed farm practices create traceable demo
              environmental units. Every critical state change is visible on
              Monad.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={enter}>
                Configure protection <ArrowRight size={16} />
              </button>
              <a className="btn btn-outline" href="#how">
                Explore the protocol
              </a>
            </div>
            <div className="trust-line">
              <span>
                <ShieldCheck size={15} />
                Parametric protection
              </span>
              <span>
                <Blocks size={15} />
                Auditable provenance
              </span>
              <span>
                <Zap size={15} />
                Fast EVM settlement
              </span>
            </div>
          </motion.div>
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <div className="risk-console">
              <div className="console-head">
                <div>
                  <small>Policy monitor</small>
                  <strong>Wardha / Soybean</strong>
                </div>
                <span className="console-live">
                  <i /> Live
                </span>
              </div>
              <div
                className="console-map"
                aria-label="Illustrative field risk map"
              >
                <span className="plot plot-a" />
                <span className="plot plot-b" />
                <span className="plot plot-c" />
                <span className="plot plot-d" />
                <div className="map-pin">
                  <span />
                  POL–1048
                </div>
                <div className="map-legend">
                  <span>
                    <i className="safe" /> Normal
                  </span>
                  <span>
                    <i className="watch" /> Watch
                  </span>
                  <span>
                    <i className="trigger" /> Trigger
                  </span>
                </div>
              </div>
              <div className="console-metrics">
                <div>
                  <small>Coverage</small>
                  <strong>
                    8,400 <em>aUSD</em>
                  </strong>
                </div>
                <div>
                  <small>Observed rain</small>
                  <strong>
                    64 <em>mm</em>
                  </strong>
                </div>
                <div>
                  <small>Trigger</small>
                  <strong>
                    &lt; 42 <em>mm</em>
                  </strong>
                </div>
              </div>
              <div className="console-foot">
                <span>Observation window</span>
                <strong>15 OCT — 30 NOV 2026</strong>
                <span className="console-state">Monitoring</span>
              </div>
            </div>
          </motion.div>
        </section>
        <section className="metrics shell" id="impact">
          {impact.map((x) => (
            <div className="metric" key={x.label}>
              <strong>{x.value}</strong>
              <span>
                {x.label} · <small>{x.note}</small>
              </span>
            </div>
          ))}
        </section>
        <section className="section shell" id="how">
          <div className="section-head">
            <div>
              <div className="kicker">A policy without paperwork theatre</div>
              <h2>Terms first. Observation second. Settlement once.</h2>
            </div>
            <p>
              Farmers see the trigger, monitoring window, premium, coverage, and
              available pool capital before signing anything.
            </p>
          </div>
          <div className="steps">
            {(
              [
                [
                  "01",
                  Shield,
                  "Choose your protection",
                  "Set a crop, location, observation window, and weather threshold. Coverage is reserved only when the pool remains solvent.",
                ],
                [
                  "02",
                  CloudRain,
                  "Weather is independently observed",
                  "Forecasts inform your dashboard. Financial settlement only uses fresh, authenticated observations with source agreement.",
                ],
                [
                  "03",
                  HandCoins,
                  "Receive automatic settlement",
                  "When verified observations cross the policy trigger, the oracle adapter settles once and the pool releases test-token coverage.",
                ],
              ] as const
            ).map(([n, I, t, d]) => (
              <article className="step" key={String(n)}>
                <span className="step-num">{n}</span>
                <div className="step-icon">
                  <I size={23} />
                </div>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section dark" id="protocol">
          <div className="shell">
            <div className="section-head">
              <div>
                <div className="kicker">Trust, with receipts</div>
                <h2>Two rails. One resilient agricultural economy.</h2>
              </div>
              <p>
                The chain records settlement and provenance. Private evidence
                stays offchain with immutable content references.
              </p>
            </div>
            <div className="dark-grid">
              <div className="protocol-card chain-flow">
                <div className="eyebrow">Monad-compatible EVM</div>
                <h3>Every critical state transition is verifiable.</h3>
                <p>
                  Role-gated contracts reserve liabilities, enforce one-time
                  settlement, prevent duplicate credit issuance, and record
                  permanent retirement.
                </p>
                <div style={{ marginTop: 30 }}>
                  {(
                    [
                      [LockKeyhole, "Policy funded", "Liability reserved"],
                      [CloudRain, "Oracle report", "Fresh observation"],
                      [
                        CircleDollarSign,
                        "Payout executed",
                        "Single settlement",
                      ],
                      [PackageCheck, "Credit retired", "Burn recorded"],
                    ] as const
                  ).map(([I, t, s]) => (
                    <div className="chain-row" key={String(t)}>
                      <div>
                        <I size={18} />
                      </div>
                      <p>
                        <strong>{t}</strong>
                        <span>{s}</span>
                      </p>
                      <Check className="check" size={16} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="protocol-card">
                <Leaf color="#69d499" />
                <h3>Verified green activity</h3>
                <p>
                  Evidence gains value only after staked, quorum-based
                  verification. Issued units remain explicitly labeled demo
                  environmental units unless a recognized methodology applies.
                </p>
              </div>
              <div className="protocol-card">
                <ShieldCheck color="#69d499" />
                <h3>Solvency before growth</h3>
                <p>
                  Capital cannot leave while it backs active liabilities. Stress
                  scenarios show what happens before new coverage is accepted.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="section shell" id="faq">
          <div className="section-head">
            <div>
              <div className="kicker">Built for honest demos</div>
              <h2>Clear about what is—and isn’t—production ready.</h2>
            </div>
          </div>
          <div className="disclaimer">
            AgroShield’s local demo uses sample profiles, test tokens, test
            liquidity, and deterministic scenarios. Forecasts never authorize
            settlement. Environmental units are not represented as certified
            carbon offsets. Testnet transaction links appear only after a wallet
            signs and a chain confirms them.
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="shell">
          <div className="footer-grid">
            <div>
              <Logo />
              <p>
                Transparent climate protection and verifiable environmental
                action for the people who feed the world.
              </p>
            </div>
            <div>
              <h4>Platform</h4>
              <a href="#how">Insurance</a>
              <a href="#protocol">Evidence network</a>
              <a href="#impact">Public impact</a>
            </div>
            <div>
              <h4>Principles</h4>
              <a>Observation-led</a>
              <a>Privacy-aware</a>
              <a>Testnet-first</a>
            </div>
          </div>
          <div className="copyright">
            <span>© 2026 AgroShield Labs · Hackathon prototype</span>
            <span>Built on Monad-compatible EVM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  foot,
  icon: Icon,
}: {
  label: string;
  value: string;
  foot: string;
  icon: any;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={15} />
        </span>
      </div>
      <strong>{value}</strong>
      <span className="stat-foot">{foot}</span>
    </div>
  );
}

const displayUnits = (value?: string | number) =>
  Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const displayToken = (value?: string | number) => {
  const amount = Number(BigInt(String(value ?? 0))) / 1e18;
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
};
const eventTitle: Record<string, string> = {
  PolicyCreated: "Policy created",
  PolicySettled: "Policy settled",
  Payout: "Coverage paid",
  EvidenceRegistered: "Evidence registered",
  Attested: "Verification vote submitted",
  QuorumReached: "Evidence quorum reached",
  BatchIssued: "Environmental units issued",
  Listed: "Units listed",
  Purchased: "Units purchased",
  Retired: "Units permanently retired",
  Deposited: "Pool capital deposited",
  Withdrawn: "Pool capital withdrawn",
};

function Overview({
  go,
  indexed,
  connected,
}: {
  go: (s: string) => void;
  indexed?: IndexedDashboard;
  connected: boolean;
}) {
  const summary = indexed?.summary;
  return (
    <section className="view-section">
      <div className="welcome">
        <div>
          <h1>Good morning, Meera.</h1>
          <p>
            Your farm is protected. Rainfall is below the seasonal baseline.
          </p>
        </div>
        <span className="date-chip">Oct 10, 2026 · Wardha, MH</span>
      </div>
      <div className="grid-4">
        <Stat
          label="Onchain coverage created"
          value={
            connected
              ? `${displayToken(summary?.coverageCreatedMinor)} aUSD`
              : "—"
          }
          foot={
            connected
              ? `${summary?.policiesCreated ?? 0} confirmed policies`
              : "Connect wallet to load"
          }
          icon={Shield}
        />
        <Stat
          label="Units received"
          value={
            connected ? `${displayUnits(summary?.issuedUnits)} units` : "—"
          }
          foot={
            connected ? "Confirmed issuance events" : "Connect wallet to load"
          }
          icon={Leaf}
        />
        <Stat
          label="Evidence registered"
          value={connected ? String(summary?.evidenceSubmitted ?? 0) : "—"}
          foot={
            connected ? "Immutable Monad records" : "Connect wallet to load"
          }
          icon={Sprout}
        />
        <Stat
          label="Confirmed payouts"
          value={
            connected
              ? `${displayToken(summary?.payoutsReceivedMinor)} aUSD`
              : "—"
          }
          foot={
            connected
              ? `${summary?.payoutsReceived ?? 0} payout events`
              : "Connect wallet to load"
          }
          icon={TrendingUp}
        />
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>7-day rainfall outlook</h3>
              <span>Forecast information only · not used for settlement</span>
            </div>
            <button onClick={() => go("Climate lab")}>
              Open climate lab →
            </button>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weather}>
                <defs>
                  <linearGradient id="rain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#2fa772" stopOpacity=".35" />
                    <stop offset="1" stopColor="#2fa772" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf0eb" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#7b8781" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "#7b8781" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #dce3dc",
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rainfall"
                  stroke="#21845a"
                  strokeWidth={2}
                  fill="url(#rain)"
                />
                <Line
                  dataKey="baseline"
                  stroke="#c89443"
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="weather-summary">
            <div>
              <small>Observed to date</small>
              <strong>64 mm</strong>
            </div>
            <div>
              <small>Policy threshold</small>
              <strong>42 mm / window</strong>
            </div>
            <div>
              <small>Source status</small>
              <strong className="up">● Healthy</strong>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Eco signal</h3>
              <span>Verified practice signals only</span>
            </div>
            <span className="badge">Good</span>
          </div>
          <div className="risk-ring">
            <div className="ring-label">
              <strong>78</strong>
              <small>of 100</small>
            </div>
          </div>
          {[
            ["Cover crop", "Verified"],
            ["Water efficiency", "Measured"],
            ["Soil sample", "Due in 18d"],
          ].map((x) => (
            <div className="signal" key={x[0]}>
              <span>{x[0]}</span>
              <strong>{x[1]}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>Active protection</h3>
            <button onClick={() => go("Insurance")}>All policies →</button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Crop / Location</th>
                  <th>Trigger</th>
                  <th>Coverage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.id}</td>
                    <td>
                      <strong>{p.crop}</strong>
                      <small>{p.location}</small>
                    </td>
                    <td>{p.threshold}</td>
                    <td>{p.coverage}</td>
                    <td>
                      <span className="badge">{p.state}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>Recent activity</h3>
            <button>View all →</button>
          </div>
          <div className="activity-list">
            {!connected ? (
              <div className="empty">
                Connect your wallet to load confirmed Monad activity.
              </div>
            ) : !indexed ? (
              <div className="empty">Waiting for the event indexer…</div>
            ) : indexed.activity.length === 0 ? (
              <div className="empty">
                No confirmed contract activity for this wallet yet.
              </div>
            ) : (
              indexed.activity.slice(0, 5).map((event) => {
                const I =
                  event.eventName === "Retired" ||
                  event.eventName === "BatchIssued"
                    ? Leaf
                    : event.eventName === "Payout" ||
                      event.eventName === "Deposited"
                    ? Coins
                    : BadgeCheck;
                return (
                  <a
                    className="activity"
                    key={event.id}
                    href={`https://testnet.monadexplorer.com/tx/${event.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="activity-icon">
                      <I size={15} />
                    </div>
                    <div>
                      <strong>
                        {eventTitle[event.eventName] ?? event.eventName}
                      </strong>
                      <span>
                        {event.contractName} · block {event.blockNumber}
                      </span>
                    </div>
                    <div className="amount">{event.confirmations} conf. ↗</div>
                  </a>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Insurance({
  notify,
  createPolicy,
  pending,
}: {
  notify: (a: string, b: string) => void;
  createPolicy: (coverage: number, premium: number) => Promise<void>;
  pending?: string;
}) {
  const [coverage, setCoverage] = useState(8400);
  const premium = Math.round(coverage * 0.015);
  return (
    <section className="view-section">
      <div className="welcome">
        <div>
          <h1>Insurance marketplace</h1>
          <p>Configure transparent, observation-based crop protection.</p>
        </div>
        <span className="badge">Onchain · Monad Testnet</span>
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>Build a policy</h3>
            <span>Terms are locked after purchase</span>
          </div>
          <div className="form-grid">
            <label>
              <span className="field-label">Region</span>
              <select className="input">
                <option>Wardha, Maharashtra</option>
                <option>Nagpur, Maharashtra</option>
              </select>
            </label>
            <label>
              <span className="field-label">Crop</span>
              <select className="input">
                <option>Soybean</option>
                <option>Cotton</option>
                <option>Rice</option>
              </select>
            </label>
            <label>
              <span className="field-label">Weather trigger</span>
              <select className="input">
                <option>Window rainfall below threshold</option>
                <option>Maximum temperature above threshold</option>
              </select>
            </label>
            <label>
              <span className="field-label">Threshold</span>
              <input className="input" defaultValue="42 mm" />
            </label>
            <label>
              <span className="field-label">Monitoring starts</span>
              <input type="date" className="input" defaultValue="2026-10-15" />
            </label>
            <label>
              <span className="field-label">Monitoring ends</span>
              <input type="date" className="input" defaultValue="2026-11-30" />
            </label>
          </div>
          <div className="control" style={{ marginTop: 20 }}>
            <label>
              <span>Coverage amount</span>
              <output>${coverage.toLocaleString()}</output>
            </label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="100"
              value={coverage}
              onChange={(e) => setCoverage(+e.target.value)}
            />
          </div>
          <div className="notice">
            <strong>Settlement rule:</strong> Authenticated observation reports
            must be fresh, inside the monitoring window, and agree across
            configured sources. Forecast data never settles this policy.
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>Quote summary</h3>
            <span className="badge gold">Test-token quote</span>
          </div>
          <div className="signal">
            <span>Coverage</span>
            <strong>{coverage.toLocaleString()} aUSD</strong>
          </div>
          <div className="signal">
            <span>Base premium</span>
            <strong>{premium} aUSD</strong>
          </div>
          <div className="signal">
            <span>Transparent eco discount</span>
            <strong className="up">−{Math.round(premium * 0.06)} aUSD</strong>
          </div>
          <div className="signal">
            <span>Protocol fee</span>
            <strong>3 aUSD</strong>
          </div>
          <button
            disabled={!!pending}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 22 }}
            onClick={() => createPolicy(coverage, premium)}
          >
            {pending ?? "Approve & create onchain"} <ArrowRight size={14} />
          </button>
          <p style={{ fontSize: 9, color: "var(--muted)", lineHeight: 1.5 }}>
            Two wallet confirmations are required: test-token approval followed
            by policy creation.
          </p>
        </div>
      </div>
    </section>
  );
}

function Evidence({
  registerEvidence,
  pending,
}: {
  registerEvidence: () => Promise<void>;
  pending?: string;
}) {
  return (
    <section className="view-section">
      <div className="welcome">
        <div>
          <h1>Sustainability evidence</h1>
          <p>
            Submit private evidence offchain; register only its content hash and
            metadata CID.
          </p>
        </div>
        <span className="badge">Monad registry live</span>
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>New evidence package</h3>
            <span>Encrypted upload recommended</span>
          </div>
          <div className="form-grid">
            <label>
              <span className="field-label">Practice category</span>
              <select className="input">
                <option>Cover cropping</option>
                <option>Reduced tillage</option>
                <option>Water stewardship</option>
              </select>
            </label>
            <label>
              <span className="field-label">Activity date</span>
              <input className="input" type="date" defaultValue="2026-10-09" />
            </label>
          </div>
          <label style={{ display: "block", marginTop: 13 }}>
            <span className="field-label">Description</span>
            <textarea
              className="input"
              rows={4}
              placeholder="What changed, where, and how was it measured?"
            />
          </label>
          <div className="upload" style={{ marginTop: 13 }}>
            <UploadCloud size={25} />
            <strong>Drop photos and measurements</strong>
            <p>
              Local adapter hashes metadata; configure Pinata to persist private
              files offchain.
            </p>
            <button className="btn btn-outline btn-small">Choose files</button>
          </div>
          <button
            disabled={!!pending}
            className="btn btn-primary"
            style={{ marginTop: 15 }}
            onClick={registerEvidence}
          >
            {pending ?? "Hash & register onchain"}
          </button>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>Privacy checklist</h3>
          </div>
          {[
            ["EXIF review", "Remove personal device data"],
            ["Location precision", "Use field-level geohash"],
            ["Public metadata", "No identity or raw documents"],
            ["Content hash", "Immutable after registration"],
          ].map((x) => (
            <div className="signal" key={x[0]}>
              <span>
                {x[0]}
                <small style={{ display: "block" }}>{x[1]}</small>
              </span>
              <Check size={15} color="#2fa772" />
            </div>
          ))}
        </div>
      </div>
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head">
          <h3>Submission history</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Evidence</th>
                <th>Practice</th>
                <th>Submitted</th>
                <th>Review</th>
                <th>Integrity</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((e) => (
                <tr key={e.id}>
                  <td className="mono">{e.id}</td>
                  <td>
                    <strong>{e.practice}</strong>
                    <small>{e.farm}</small>
                  </td>
                  <td>{e.submitted}</td>
                  <td>
                    <span
                      className={
                        "badge " + (e.status === "Disputed" ? "red" : "")
                      }
                    >
                      {e.status}
                    </span>
                  </td>
                  <td>{e.score}% signals</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Marketplace({ notify }: { notify: (a: string, b: string) => void }) {
  return (
    <section className="view-section">
      <div className="welcome">
        <div>
          <h1>Green credit marketplace</h1>
          <p>Trace every demo environmental unit back to verified evidence.</p>
        </div>
        <span className="disclaimer">Not certified carbon offsets</span>
      </div>
      <div className="market-grid">
        {credits.map((c, i) => (
          <article className="panel credit-card" key={c.id}>
            <div
              className="credit-art"
              style={{ filter: `hue-rotate(${i * 18}deg)` }}
            >
              <span className="credit-id">{c.id}</span>
            </div>
            <div className="credit-body">
              <span className="badge">
                <BadgeCheck size={11} />
                {c.verified} verifier quorum
              </span>
              <h3 style={{ marginTop: 12 }}>{c.project}</h3>
              <p>{c.methodology}</p>
              <div className="credit-meta">
                <div>
                  <small>AVAILABLE</small>
                  <strong>{c.units} units</strong>
                </div>
                <div>
                  <small>PRICE / UNIT</small>
                  <strong>${c.price.toFixed(2)}</strong>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() =>
                  notify(
                    "Purchase needs a wallet",
                    "Connect MetaMask to approve test-token payment and receive ERC-1155 units."
                  )
                }
              >
                View provenance <ChevronRight size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type Runner = (
  fn: () => Promise<{ url: string; hash: string; cid?: string }>
) => Promise<void>;
type Web3 = ReturnType<typeof useWeb3>;

function EvidenceFlow({ web3, run }: { web3: Web3; run: Runner }) {
  const [name, setName] = useState("Cover crop evidence");
  const [category, setCategory] = useState("COVER_CROP");
  const [activityDate, setActivityDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState(
    "Cover crop established across the registered field with field-level measurements and reviewable supporting records."
  );
  const [measurements, setMeasurements] = useState(
    "Ground cover percentage: 68% (demo measurement)"
  );
  const [lat, setLat] = useState(""),
    [lon, setLon] = useState("");
  const [photo, setPhoto] = useState<{
    name: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    base64: string;
  }>();
  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 7_500_000
    ) {
      alert("Choose a JPEG, PNG, or WebP image up to 7.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setPhoto({
        name: file.name,
        mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
        base64: String(reader.result),
      });
    reader.readAsDataURL(file);
  };
  const submit = () =>
    run(() =>
      web3.registerEvidence({
        name,
        description,
        category,
        activityDate,
        measurements,
        gps:
          lat && lon
            ? { lat: +lat, lon: +lon, precision: "field-level" }
            : undefined,
        photo,
      })
    );
  return (
    <section className="view-section">
      <div className="welcome">
        <div>
          <h1>Sustainability evidence</h1>
          <p>
            Pin an optional photo and metadata to IPFS, then register the
            immutable metadata hash and CID on Monad.
          </p>
        </div>
        <span className="badge">Pinata + Monad live</span>
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>New evidence package</h3>
            <span>Public metadata only</span>
          </div>
          <label>
            <span className="field-label">Evidence name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="form-grid" style={{ marginTop: 13 }}>
            <label>
              <span className="field-label">Practice</span>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="COVER_CROP">Cover cropping</option>
                <option value="REDUCED_TILLAGE">Reduced tillage</option>
                <option value="WATER_STEWARDSHIP">Water stewardship</option>
                <option value="AGROFORESTRY">Agroforestry</option>
              </select>
            </label>
            <label>
              <span className="field-label">Activity date</span>
              <input
                className="input"
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
              />
            </label>
          </div>
          <label style={{ display: "block", marginTop: 13 }}>
            <span className="field-label">Description</span>
            <textarea
              className="input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label style={{ display: "block", marginTop: 13 }}>
            <span className="field-label">Supporting measurements</span>
            <input
              className="input"
              value={measurements}
              onChange={(e) => setMeasurements(e.target.value)}
            />
          </label>
          <div className="form-grid" style={{ marginTop: 13 }}>
            <label>
              <span className="field-label">Field latitude</span>
              <input
                className="input"
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Field longitude</span>
              <input
                className="input"
                type="number"
                step="0.0001"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
              />
            </label>
          </div>
          <label className="upload" style={{ marginTop: 13, display: "block" }}>
            <UploadCloud size={25} />
            <strong>
              {photo ? photo.name : "Add optional evidence photo"}
            </strong>
            <p>
              JPEG, PNG, or WebP · maximum 7.5 MB · uploaded publicly for this
              demo
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => choosePhoto(e.target.files?.[0])}
            />
          </label>
          <div className="notice">
            <strong>Privacy:</strong> Remove identifying EXIF data before
            upload. Do not upload private documents or sensitive exact
            locations.
          </div>
          <button
            disabled={
              !!web3.pending ||
              description.length < 20 ||
              !Number.isFinite(+lat) ||
              !Number.isFinite(+lon)
            }
            className="btn btn-primary"
            style={{ marginTop: 15 }}
            onClick={submit}
          >
            {web3.pending ?? "Upload to IPFS & register onchain"}
          </button>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>Two-stage integrity</h3>
          </div>
          {[
            ["1. Photo CID", "Optional evidence image pinned first"],
            ["2. Metadata CID", "Practice, measurements and photo reference"],
            [
              "3. Monad registry",
              "Metadata hash and CID committed by your wallet",
            ],
            ["4. Quorum", "Three independently staked approvals required"],
          ].map((x) => (
            <div className="signal" key={x[0]}>
              <span>
                {x[0]}
                <small style={{ display: "block" }}>{x[1]}</small>
              </span>
              <Check size={15} color="#2fa772" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProtocolMarketplace({ web3, run }: { web3: Web3; run: Runner }) {
  const [batchId, setBatchId] = useState(1),
    [evidenceId, setEvidenceId] = useState(1),
    [quantity, setQuantity] = useState(10),
    [price, setPrice] = useState(2),
    [listingId, setListingId] = useState(1),
    [recipient, setRecipient] = useState("");
  const toRecipient = () => {
    const value = (recipient || web3.account) as Address | undefined;
    if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value))
      throw new Error("Enter a valid recipient wallet");
    return value;
  };
  return (
    <section className="view-section">
      <div className="welcome">
        <div>
          <h1>Green credit marketplace</h1>
          <p>
            Issue only from verified evidence, exchange atomically for test
            aUSD, or burn units permanently.
          </p>
        </div>
        <span className="disclaimer">
          Demo environmental units · not certified offsets
        </span>
      </div>
      <div className="grid-4">
        <Stat
          label="Batch ID"
          value={String(batchId)}
          foot="ERC-1155 token ID"
          icon={PackageCheck}
        />
        <Stat
          label="Quantity"
          value={String(quantity)}
          foot="Whole demo units"
          icon={Leaf}
        />
        <Stat
          label="Price"
          value={`${price} aUSD`}
          foot="Per unit · test token"
          icon={Coins}
        />
        <Stat label="Network" value="Monad" foot="Chain 10143" icon={Blocks} />
      </div>
      <div className="dashboard-grid" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="panel-head">
            <h3>Verified issuance</h3>
            <span>Issuer role required</span>
          </div>
          <div className="form-grid">
            <label>
              <span className="field-label">Batch ID</span>
              <input
                className="input"
                type="number"
                min="1"
                value={batchId}
                onChange={(e) => setBatchId(+e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Evidence ID</span>
              <input
                className="input"
                type="number"
                min="1"
                value={evidenceId}
                onChange={(e) => setEvidenceId(+e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Quantity</span>
              <input
                className="input"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(+e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Recipient</span>
              <input
                className="input"
                placeholder={web3.account ?? "0x…"}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </label>
          </div>
          <button
            disabled={!!web3.pending}
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => {
              try {
                const r = toRecipient();
                run(() => web3.issue(batchId, evidenceId, quantity, r));
              } catch (e: any) {
                alert(e.message);
              }
            }}
          >
            {web3.pending ?? "Pin metadata & issue"}
          </button>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>List units</h3>
            <span>Seller approves ERC-1155 operator</span>
          </div>
          <div className="form-grid">
            <label>
              <span className="field-label">Batch ID</span>
              <input
                className="input"
                type="number"
                min="1"
                value={batchId}
                onChange={(e) => setBatchId(+e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Quantity</span>
              <input
                className="input"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(+e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Unit price aUSD</span>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(+e.target.value)}
              />
            </label>
          </div>
          <button
            disabled={!!web3.pending}
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => run(() => web3.list(batchId, quantity, price))}
          >
            {web3.pending ?? "Approve & create listing"}
          </button>
        </div>
      </div>
      <div className="dashboard-grid" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="panel-head">
            <h3>Buy listed units</h3>
            <span>Atomic payment and transfer</span>
          </div>
          <div className="form-grid">
            <label>
              <span className="field-label">Listing ID</span>
              <input
                className="input"
                type="number"
                min="1"
                value={listingId}
                onChange={(e) => setListingId(+e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Quantity</span>
              <input
                className="input"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(+e.target.value)}
              />
            </label>
          </div>
          <button
            disabled={!!web3.pending}
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => run(() => web3.purchase(listingId, quantity))}
          >
            {web3.pending ?? "Approve aUSD & purchase"}
          </button>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>Permanent retirement</h3>
            <span>Burns owned units</span>
          </div>
          <button
            disabled={!!web3.pending}
            className="btn btn-outline"
            onClick={() =>
              run(() =>
                web3.retire(
                  batchId,
                  quantity,
                  "Connected wallet",
                  "Demo environmental claim"
                )
              )
            }
          >
            {web3.pending ?? `Retire ${quantity} units from batch ${batchId}`}
          </button>
          <p style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.7 }}>
            A unique replay-protected retirement record is emitted onchain.
            Retirement is irreversible.
          </p>
        </div>
      </div>
    </section>
  );
}

function RolePortal({
  section,
  web3,
  run,
}: {
  section: string;
  web3: Web3;
  run: Runner;
}) {
  const [evidenceId, setEvidenceId] = useState(1),
    [reason, setReason] = useState(
      "Evidence and public metadata reviewed independently."
    );
  const [impactState, setImpactState] = useState<any>();
  useEffect(() => {
    if (section === "Impact")
      fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
        }/v1/public/impact`
      )
        .then((r) => (r.ok ? r.json() : undefined))
        .then(setImpactState)
        .catch(() => {});
  }, [section]);
  if (section === "Underwriter")
    return (
      <section className="view-section">
        <div className="welcome">
          <div>
            <h1>Underwriter pool</h1>
            <p>
              Deposit test liquidity and withdraw only capital not reserved for
              active liabilities.
            </p>
          </div>
          <span className="badge">Live contract state</span>
        </div>
        <div className="grid-4">
          <Stat
            label="Pool capital"
            value={`${web3.stats.poolAssets} aUSD`}
            foot="Onchain assets"
            icon={CircleDollarSign}
          />
          <Stat
            label="Reserved exposure"
            value={`${web3.stats.reserved} aUSD`}
            foot="Protected from withdrawal"
            icon={LockKeyhole}
          />
          <Stat
            label="Your shares"
            value={web3.stats.poolShares}
            foot="Liquidity position"
            icon={Coins}
          />
          <Stat
            label="Wallet aUSD"
            value={web3.stats.aUsd}
            foot="Test token only"
            icon={WalletCards}
          />
        </div>
        <div className="panel" style={{ marginTop: 14 }}>
          <div className="actions">
            <button
              disabled={!!web3.pending}
              className="btn btn-outline"
              onClick={() => run(web3.faucet)}
            >
              {web3.pending ?? "Claim demo aUSD"}
            </button>
            <button
              disabled={!!web3.pending}
              className="btn btn-primary"
              onClick={() => run(web3.deposit)}
            >
              {web3.pending ?? "Deposit 100,000 aUSD"}
            </button>
            <button
              disabled={!!web3.pending}
              className="btn btn-outline"
              onClick={() => run(web3.withdraw)}
            >
              {web3.pending ?? "Withdraw all free shares"}
            </button>
          </div>
          <div className="notice">
            <strong>Solvency enforcement:</strong> a withdrawal reverts if its
            asset value exceeds free liquidity after reserved policy
            liabilities.
          </div>
        </div>
      </section>
    );
  if (section === "Verifier")
    return (
      <section className="view-section">
        <div className="welcome">
          <div>
            <h1>Verifier workbench</h1>
            <p>
              Stake 100 test aUSD, inspect the referenced CID, and submit one
              independent vote.
            </p>
          </div>
          <span className="badge">Three-vote quorum</span>
        </div>
        <div className="dashboard-grid">
          <div className="panel">
            <div className="panel-head">
              <h3>Verifier access</h3>
            </div>
            <button
              disabled={!!web3.pending}
              className="btn btn-outline"
              onClick={() => run(web3.faucet)}
            >
              Claim demo aUSD
            </button>
            <button
              disabled={!!web3.pending}
              className="btn btn-primary"
              style={{ marginLeft: 8 }}
              onClick={() => run(web3.stake)}
            >
              Approve & stake 100 aUSD
            </button>
          </div>
          <div className="panel">
            <div className="panel-head">
              <h3>Attestation</h3>
              <span>One vote per wallet</span>
            </div>
            <label>
              <span className="field-label">Evidence ID</span>
              <input
                className="input"
                type="number"
                min="1"
                value={evidenceId}
                onChange={(e) => setEvidenceId(+e.target.value)}
              />
            </label>
            <label style={{ display: "block", marginTop: 10 }}>
              <span className="field-label">Review reasoning</span>
              <textarea
                className="input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <div className="actions" style={{ marginTop: 12 }}>
              <button
                disabled={!!web3.pending || reason.length < 10}
                className="btn btn-primary"
                onClick={() => run(() => web3.attest(evidenceId, true, reason))}
              >
                Approve evidence
              </button>
              <button
                disabled={!!web3.pending || reason.length < 10}
                className="btn btn-outline"
                onClick={() =>
                  run(() => web3.attest(evidenceId, false, reason))
                }
              >
                Reject evidence
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  if (section === "Impact")
    return (
      <section className="view-section">
        <div className="welcome">
          <div>
            <h1>Public impact</h1>
            <p>
              Database projection counts; blockchain remains the ownership and
              settlement source of truth.
            </p>
          </div>
          <span className="badge gold">
            {impactState ? "API connected" : "Loading / unavailable"}
          </span>
        </div>
        <div className="grid-4">
          <Stat
            label="Farms"
            value={String(impactState?.farms ?? "—")}
            foot="Indexed records"
            icon={Sprout}
          />
          <Stat
            label="Policies"
            value={String(impactState?.policies ?? "—")}
            foot="Indexed records"
            icon={Shield}
          />
          <Stat
            label="Evidence"
            value={String(impactState?.evidence ?? "—")}
            foot="Indexed records"
            icon={FileCheck2}
          />
          <Stat
            label="Retirements"
            value={String(impactState?.retirements ?? "—")}
            foot="Indexed records"
            icon={Leaf}
          />
        </div>
      </section>
    );
  const title =
    section === "Business" ? "Business portfolio" : "Protocol administration";
  const description =
    section === "Business"
      ? "Use Green credits to purchase and permanently retire demo environmental units. Confirmed transactions appear with explorer receipts."
      : "Deployed addresses, oracle controls, disputes, roles and pause operations remain restricted to administrator wallets.";
  return (
    <section className="view-section">
      <div className="welcome">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className="badge">Monad Testnet</span>
      </div>
      <div className="panel">
        <div className="notice">
          {section === "Business"
            ? "Open Green credits for the live purchase and retirement forms. Units are not certified offsets."
            : "Administrative contract controls are intentionally not exposed to arbitrary connected wallets. Use the deployment administrator for role and pause operations."}
        </div>
      </div>
    </section>
  );
}

function Simulator() {
  const [rain, setRain] = useState(62),
    [temp, setTemp] = useState(34),
    [severity, setSeverity] = useState(35),
    [farmers, setFarmers] = useState(1000),
    [liquidity, setLiquidity] = useState(2.4);
  const results = useMemo(
    () =>
      calculateScenario({
        rainfall: rain,
        temperature: temp,
        severity,
        farmers,
        liquidityMillions: liquidity,
      }),
    [rain, temp, severity, farmers, liquidity]
  );
  function preset(n: string) {
    if (n === "Normal") {
      setRain(94);
      setTemp(31);
      setSeverity(8);
    }
    if (n === "Drought") {
      setRain(28);
      setTemp(39);
      setSeverity(82);
    }
    if (n === "Flood") {
      setRain(180);
      setTemp(29);
      setSeverity(72);
    }
    if (n === "Heat") {
      setRain(55);
      setTemp(44);
      setSeverity(75);
    }
  }
  return (
    <section className="view-section">
      <div className="welcome">
        <div>
          <h1>Climate stress lab</h1>
          <p>
            Explore hypothetical pool outcomes. Results are illustrative, not
            forecasts or returns.
          </p>
        </div>
        <span className="badge gold">Interactive model</span>
      </div>
      <div className="sim-grid">
        <div className="panel controls">
          <div>
            <span className="field-label">SCENARIO PRESETS</span>
            <div className="preset-row">
              {["Normal", "Drought", "Flood", "Heat"].map((x) => (
                <button className="preset" onClick={() => preset(x)} key={x}>
                  {x}
                </button>
              ))}
            </div>
          </div>
          {[
            ["Rainfall vs normal", rain, setRain, 0, 200, "%"],
            ["Peak temperature", temp, setTemp, 20, 50, "°C"],
            [
              "Drought / hazard severity",
              severity,
              setSeverity,
              0,
              100,
              "/100",
            ],
            ["Covered farmers", farmers, setFarmers, 100, 5000, ""],
          ].map(([l, v, s, min, max, u]: any) => (
            <div className="control" key={l}>
              <label>
                <span>{l}</span>
                <output>
                  {v}
                  {u}
                </output>
              </label>
              <input
                type="range"
                min={min}
                max={max}
                value={v}
                onChange={(e) => s(+e.target.value)}
              />
            </div>
          ))}
          <div className="control">
            <label>
              <span>Initial pool liquidity</span>
              <output>${liquidity.toFixed(1)}M</output>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step=".1"
              value={liquidity}
              onChange={(e) => setLiquidity(+e.target.value)}
            />
          </div>
          <div className="assumption">
            Assumes $8,400 mean coverage, 58% average payout when triggered, and
            a simplified hazard response. This is not actuarial advice or a
            promised underwriter return.
          </div>
        </div>
        <div className="panel">
          <div className="result-hero">
            <div>
              <small>Estimated triggered policies</small>
              <strong>{results.triggered.toLocaleString()}</strong>
            </div>
            <div>
              <small>Illustrative payout load</small>
              <strong>${(results.payouts / 1e6).toFixed(2)}M</strong>
            </div>
          </div>
          <div className="result-grid">
            <div className="result-box">
              <small>Capital remaining</small>
              <strong>${(results.remain / 1e6).toFixed(2)}M</strong>
            </div>
            <div className="result-box">
              <small>Solvency ratio</small>
              <strong
                style={{
                  color:
                    results.solvency < 100 ? "var(--danger)" : "var(--forest)",
                }}
              >
                {results.solvency}%
              </strong>
            </div>
            <div className="result-box">
              <small>Modeled hazard</small>
              <strong>{results.loss}/100</strong>
            </div>
          </div>
          <div className="panel-head" style={{ marginTop: 24 }}>
            <h3>Capital path under scenario</h3>
            <span>Hypothetical USD equivalent</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { x: "Start", capital: liquidity * 1e6 },
                  {
                    x: "Reserved",
                    capital: liquidity * 1e6 - results.payouts * 0.2,
                  },
                  {
                    x: "Triggered",
                    capital: liquidity * 1e6 - results.payouts * 0.65,
                  },
                  { x: "Settled", capital: results.remain },
                ]}
              >
                <CartesianGrid stroke="#edf0eb" vertical={false} />
                <XAxis
                  dataKey="x"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(x) => `$${(x / 1e6).toFixed(1)}M`}
                  tick={{ fontSize: 9 }}
                />
                <Tooltip formatter={(v: any) => `$${(+v / 1e6).toFixed(2)}M`} />
                <Area
                  dataKey="capital"
                  type="monotone"
                  stroke="#2fa772"
                  fill="#dff3e6"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <span className="field-label">REMAINING CAPITAL</span>
            <div className="progress">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    (results.remain / (liquidity * 1e6)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Generic({
  section,
  action,
  pending,
}: {
  section: string;
  action: () => Promise<void>;
  pending?: string;
}) {
  const config: any = {
    Underwriter: [
      "Underwriter pool",
      "Capital can exit only when free liquidity remains after reserved liabilities.",
      [
        ["Pool capital", "Onchain"],
        ["Reserved exposure", "Contract state"],
        ["Utilization", "Live after index"],
        ["Solvency", "Enforced"],
      ],
    ],
    Verifier: [
      "Verifier workbench",
      "Stake, inspect evidence, and attest independently. Slashing requires an evidence-based dispute and appeal delay.",
      [
        ["Minimum stake", "100 aUSD"],
        ["Open reviews", "12 sample"],
        ["Reputation", "Onchain"],
        ["Disputes", "Appeal delayed"],
      ],
    ],
    Impact: [
      "Public impact",
      "Transparent network activity with sample data clearly separated from production measurements.",
      [
        ["Farmers", "1,248"],
        ["Insured value", "$2.84M"],
        ["Verified evidence", "3,106"],
        ["Retired units", "8,420"],
      ],
    ],
    Business: [
      "Business portfolio",
      "Track acquired demo environmental units, provenance, retirements and certificates.",
      [
        ["Holdings", "0 units"],
        ["Purchases", "0"],
        ["Retired", "0 units"],
        ["Certificates", "0"],
      ],
    ],
    Administration: [
      "Protocol administration",
      "Monitor deployed contracts, oracle configuration, disputes, pause state and indexed logs.",
      [
        ["Contracts", "6 live"],
        ["Oracle", "Configured"],
        ["Paused", "No"],
        ["Chain", "10143"],
      ],
    ],
  };
  const [title, desc, stats] = config[section];
  const actionable = section === "Verifier" || section === "Underwriter";
  return (
    <section className="view-section">
      <div className="welcome">
        <div>
          <h1>{title}</h1>
          <p>{desc}</p>
        </div>
        <span className={"badge " + (section === "Impact" ? "gold" : "")}>
          {section === "Impact" ? "Sample aggregates" : "Monad Testnet live"}
        </span>
      </div>
      <div className="grid-4">
        {stats.map((s: any, i: number) => (
          <Stat
            key={s[0]}
            label={s[0]}
            value={s[1]}
            foot={i === 0 ? "Connected contract" : "Transparent demo state"}
            icon={[CircleDollarSign, LockKeyhole, Gauge, ShieldCheck][i]}
          />
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>
              {section === "Verifier"
                ? "Evidence review queue"
                : section === "Underwriter"
                ? "Pool activity"
                : section === "Business"
                ? "Provenance ledger"
                : section === "Administration"
                ? "Monitoring log"
                : "Network activity"}
            </h3>
            <span>Indexer-backed after API start</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((e, i) => (
                  <tr key={e.id}>
                    <td className="mono">{e.id}</td>
                    <td>
                      {section === "Verifier"
                        ? e.practice
                        : i === 0
                        ? "Capital deposit"
                        : "Policy reserve"}
                    </td>
                    <td>{e.farm}</td>
                    <td>
                      <span className="badge">{e.status}</span>
                    </td>
                    <td>{e.submitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>{actionable ? "Onchain action" : "Status"}</h3>
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.7 }}>
            {section === "Verifier"
              ? "Approve 100 aUSD and stake it in the verifier contract."
              : section === "Underwriter"
              ? "Approve and deposit 100,000 aUSD as test pool liquidity."
              : section === "Administration"
              ? "Pause and role-management controls remain restricted to the deployed administrator address."
              : "No confirmed holdings are shown until indexed purchase or retirement events exist."}
          </p>
          {actionable && (
            <button
              disabled={!!pending}
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={action}
            >
              {pending ??
                (section === "Verifier"
                  ? "Approve & stake"
                  : "Approve & deposit")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function LoginHub({
  select,
  back,
}: {
  select: (role: AppRole) => void;
  back: () => void;
}) {
  const portals: [AppRole, any, string][] = [
    ["Farmer", Sprout, "Buy protection and submit farm evidence"],
    ["Underwriter", TrendingUp, "Fund the pool and monitor solvency"],
    ["Verifier", BadgeCheck, "Stake and independently review evidence"],
    ["Business Buyer", ShoppingBag, "Purchase and permanently retire units"],
    [
      "Administrator",
      LockKeyhole,
      "Monitor protocol roles, oracle and controls",
    ],
  ];
  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="panel-head">
          <Logo />
          <button className="btn btn-outline btn-small" onClick={back}>
            Back to website
          </button>
        </div>
        <div className="kicker">Separate role portals</div>
        <h1>Choose your AgroShield login.</h1>
        <p style={{ color: "var(--muted)" }}>
          These are demo profile portals. Contract permissions still depend on
          the connected Monad wallet; selecting a role never grants an onchain
          role.
        </p>
        <div className="market-grid" style={{ marginTop: 22 }}>
          {portals.map(([role, Icon, description]) => (
            <article className="panel" key={role}>
              <div className="step-icon">
                <Icon size={22} />
              </div>
              <h3>{role}</h3>
              <p style={{ minHeight: 42, color: "var(--muted)" }}>
                {description}
              </p>
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={() => select(role)}
              >
                Login as {role} <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function Onboarding({
  initialRole,
  complete,
  back,
}: {
  initialRole: AppRole;
  complete: (profile: Profile) => void;
  back: () => void;
}) {
  const web3 = useWeb3();
  const role = initialRole;
  const [name, setName] = useState(""),
    [region, setRegion] = useState("Wardha, Maharashtra"),
    [crop, setCrop] = useState("Soybean"),
    [acreage, setAcreage] = useState("12.5"),
    [lat, setLat] = useState(20.7453),
    [lon, setLon] = useState(78.6022);
  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="panel-head">
          <Logo />
          <button className="btn btn-outline btn-small" onClick={back}>
            Change login
          </button>
        </div>
        <div className="kicker">{role} login</div>
        <h1>Configure your {role.toLowerCase()} workspace.</h1>
        <p style={{ color: "var(--muted)" }}>
          This local demo profile contains no identity verification. Your wallet
          remains the authority for every blockchain action.
        </p>
        <div className="form-grid">
          <label>
            <span className="field-label">
              {role === "Farmer"
                ? "Farmer name"
                : role === "Business Buyer"
                ? "Company name"
                : "Display name"}
            </span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                role === "Business Buyer"
                  ? "Your company or organization"
                  : "Your name or organization"
              }
            />
          </label>
          <label>
            <span className="field-label">Monad wallet</span>
            <button
              className="btn btn-outline"
              style={{ width: "100%" }}
              onClick={web3.connect}
            >
              {web3.account
                ? `${web3.account.slice(0, 8)}…${web3.account.slice(-6)}`
                : "Connect MetaMask"}
            </button>
          </label>
        </div>
        {role === "Farmer" && (
          <>
            <div className="form-grid" style={{ marginTop: 13 }}>
              <label>
                <span className="field-label">Farm region</span>
                <input
                  className="input"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </label>
              <label>
                <span className="field-label">Crop</span>
                <input
                  className="input"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                />
              </label>
              <label>
                <span className="field-label">Acreage</span>
                <input
                  className="input"
                  type="number"
                  min="0.1"
                  value={acreage}
                  onChange={(e) => setAcreage(e.target.value)}
                />
              </label>
            </div>
            <div style={{ marginTop: 15 }}>
              <span className="field-label">
                Approximate farm location · click the map to adjust
              </span>
              <FarmMap
                lat={lat}
                lon={lon}
                onChange={(a, b) => {
                  setLat(a);
                  setLon(b);
                }}
              />
              <small style={{ color: "var(--muted)" }}>
                Saved locally for this demo. Only deliberately submitted
                hashes/CIDs go onchain.
              </small>
            </div>
          </>
        )}
        <div className="actions" style={{ marginTop: 20 }}>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() =>
              complete({
                name: name.trim(),
                role,
                region,
                crop,
                acreage,
                lat,
                lon,
              })
            }
          >
            Enter {role} dashboard <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ exit, profile }: { exit: () => void; profile: Profile }) {
  const [section, setSection] = useState(
      profile.role === "Farmer"
        ? "Overview"
        : profile.role === "Underwriter"
        ? "Underwriter"
        : profile.role === "Verifier"
        ? "Verifier"
        : profile.role === "Business Buyer"
        ? "Green credits"
        : "Administration"
    ),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState<{ a: string; b: string } | null>(null),
    [indexed, setIndexed] = useState<IndexedDashboard>();
  const web3 = useWeb3();
  useEffect(() => {
    if (!web3.account) {
      setIndexed(undefined);
      return;
    }
    let active = true;
    const load = () =>
      fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
        }/v1/dashboard/${web3.account}`
      )
        .then((response) =>
          response.ok
            ? response.json()
            : Promise.reject(new Error("indexer unavailable"))
        )
        .then((data) => {
          if (active) setIndexed(data);
        })
        .catch(() => {
          if (active) setIndexed(undefined);
        });
    load();
    const timer = setInterval(load, 12_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [web3.account, web3.lastTx?.hash]);
  const roleSections: Record<AppRole, string[]> = {
    Farmer: [
      "Overview",
      "Insurance",
      "Evidence",
      "Green credits",
      "Climate lab",
      "Impact",
    ],
    Underwriter: ["Underwriter", "Climate lab", "Impact"],
    Verifier: ["Verifier", "Evidence", "Impact"],
    "Business Buyer": ["Green credits", "Business", "Impact"],
    Administrator: ["Administration", "Underwriter", "Verifier", "Impact"],
  };
  function notify(a: string, b: string) {
    setToast({ a, b });
    setTimeout(() => setToast(null), 5000);
  }
  const run: Runner = async (fn) => {
    try {
      const tx = await fn();
      notify(
        "Transaction confirmed",
        `${tx.hash.slice(0, 18)}…${
          tx.cid ? ` · IPFS ${tx.cid.slice(0, 12)}…` : ""
        }`
      );
    } catch (e: any) {
      notify("Transaction not submitted", e.message);
    }
  };
  const content =
    section === "Overview" ? (
      <Overview
        go={setSection}
        indexed={indexed}
        connected={Boolean(web3.account)}
      />
    ) : section === "Insurance" ? (
      <Insurance
        notify={notify}
        pending={web3.pending}
        createPolicy={(c, p) => run(() => web3.createPolicy(c, p))}
      />
    ) : section === "Evidence" ? (
      <EvidenceFlow web3={web3} run={run} />
    ) : section === "Green credits" ? (
      <ProtocolMarketplace web3={web3} run={run} />
    ) : section === "Climate lab" ? (
      <Simulator />
    ) : (
      <RolePortal section={section} web3={web3} run={run} />
    );
  return (
    <div className="app">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Logo />
        <div className="side-label">{profile.role} workspace</div>
        {navItems
          .filter(([n]) => roleSections[profile.role].includes(n))
          .map(([n, I]) => (
            <button
              className={`side-link ${section === n ? "active" : ""}`}
              onClick={() => {
                setSection(n);
                setMenu(false);
              }}
              key={n}
            >
              <I />
              {n}
            </button>
          ))}
        <div className="side-bottom">
          <button className="side-link" onClick={exit}>
            <PanelLeftClose />
            Change profile
          </button>
          <div className="user-card">
            <div className="avatar">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <strong>{profile.name}</strong>
              <span>
                {web3.account
                  ? `${web3.balance} MON · ${web3.stats.aUsd} aUSD`
                  : profile.role}
              </span>
            </div>
          </div>
        </div>
      </aside>
      <div
        className={`mobile-overlay ${menu ? "open" : ""}`}
        onClick={() => setMenu(false)}
      />
      <main className="main">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMenu(true)}
          >
            <Menu size={18} />
          </button>
          <div className="page-title">
            <small>{profile.role} · AgroShield</small>
            <strong>{section}</strong>
          </div>
          <div className="top-actions">
            <span className="chain-health">
              <i /> Monad Testnet
            </span>
            {web3.account && (
              <span className="wallet">
                {web3.stats.aUsd} aUSD · {web3.balance} MON
              </span>
            )}
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <button
              className="btn btn-primary btn-small"
              onClick={() => web3.connect()}
            >
              <WalletCards size={14} />
              {web3.connecting
                ? "Connecting…"
                : web3.account
                ? "Connected"
                : "Connect wallet"}
            </button>
          </div>
        </header>
        {web3.lastTx && (
          <div className="tx-banner">
            <BadgeCheck size={15} />
            <span>
              Confirmed on Monad Testnet
              {web3.lastTx.cid ? " · IPFS metadata pinned" : ""}
            </span>
            <a href={web3.lastTx.url} target="_blank" rel="noreferrer">
              View transaction ↗
            </a>
          </div>
        )}
        <div className="content">{content}</div>
      </main>
      {toast && (
        <div className="toast">
          <Check size={17} />
          <div>
            <strong>{toast.a}</strong>
            <small>{toast.b}</small>
          </div>
          <button
            onClick={() => setToast(null)}
            style={{ background: "none", border: 0, color: "white" }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [stage, setStage] = useState<
      "landing" | "login" | "onboarding" | "app"
    >("landing"),
    [selectedRole, setSelectedRole] = useState<AppRole>(),
    [profile, setProfile] = useState<Profile>();
  const complete = (p: Profile) => {
    setProfile(p);
    localStorage.setItem("agroshield-profile", JSON.stringify(p));
    setStage("app");
  };
  return stage === "landing" ? (
    <Landing enter={() => setStage("login")} />
  ) : stage === "login" ? (
    <LoginHub
      select={(role) => {
        setSelectedRole(role);
        setStage("onboarding");
      }}
      back={() => setStage("landing")}
    />
  ) : stage === "onboarding" && selectedRole ? (
    <Onboarding
      initialRole={selectedRole}
      complete={complete}
      back={() => setStage("login")}
    />
  ) : stage === "app" && profile ? (
    <Dashboard profile={profile} exit={() => setStage("login")} />
  ) : null;
}
