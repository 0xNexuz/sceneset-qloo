# SceneSet backend

An Eve agent backend that resolves free-text cultural intent with Qloo tags, compares real place affinities across cities, and emits a tamper-evident Taste Receipt.

## Current status

- Agent runtime and typed `plan_scene` tool: **IMPLEMENTED**
- Deterministic market scorer and policy boundary: **IMPLEMENTED**
- Taste Receipt hashing and verifier: **IMPLEMENTED**
- Unit and live-contract tests: **IMPLEMENTED**
- Live Qloo execution: **VERIFIED** against the hackathon server on 2026-10-20
- Free-text `discover_city_pulse` tool and live tag resolution: **IMPLEMENTED**
- Browser-facing direct tool routes: **IMPLEMENTED** at `POST /api/city-pulse` and `POST /api/scene-plan`
- Public-demo request limits: **IMPLEMENTED**

The production tool fails closed when the Qloo key is absent. It never silently substitutes fixtures or model memory.

## Requirements

- Node.js 24
- A Qloo hackathon API key
- A supported Eve model connection for conversational use

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `QLOO_API_KEY` in the server environment. Do not expose it to browser code or paste it into chat.

## Verify

```bash
npm run check
```

This runs typecheck, tests, and an Eve production build.

Run the credential-gated live integration separately:

```bash
QLOO_LIVE_TEST=1 npm run test:live
```

## Run

```bash
npm run dev -- --no-ui
```

Eve exposes its durable HTTP session API and a structured direct-tool route at `POST /api/city-pulse`. Discovery accepts free text, two to five cities, and optional place constraints.

Example discovery request:

> Find “Afrobeats parties” across Lagos, Accra, and London, with place ratings of 4 or above.

## Safety boundary

- Only Qloo-returned candidates may enter a final plan.
- Hard constraints are re-evaluated server-side.
- Qloo/API failures stop the run.
- The agent does not claim availability, booking, demand, attendance, or revenue.
- Optional Eve default filesystem, shell, and web tools are disabled.

## Important files

- `agent/tools/plan_scene.ts` — typed agent capability
- `agent/tools/discover_city_pulse.ts` — free-text city-scene discovery
- `agent/channels/scene-api.ts` — structured browser API route
- `agent/lib/qloo.ts` — Qloo HTTP adapter
- `agent/lib/planner.ts` — deterministic planning and scoring
- `agent/lib/receipt.ts` — canonical hashing and receipt verification
- `tests/planner.test.ts` — core invariant coverage
- `tests/qloo.test.ts` — Qloo response-contract coverage
- `tests/qloo.live.test.ts` — credential-gated live integration and redacted evidence
- `tests/city-pulse.live.test.ts` — credentialed live tag + multi-city proof
