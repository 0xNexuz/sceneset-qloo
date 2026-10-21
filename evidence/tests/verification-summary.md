# SceneSet verification summary

Local branch `feat/scene-agent-upgrade`, 2026-10-21. The baseline deployment and its earlier smoke tests predate this branch; no push or deployment was performed here.

## Executed

- Backend TypeScript check: passed.
- Backend deterministic suite: 17 passed, 2 credentialed suites skipped. Fixtures cover London-first Afrobeats rejection, no-winner handling, compound food/music and art/fashion, missing metadata, conflicting constraints, provider failure, cached versus fresh refinement, investigation budgets, and receipt tampering.
- Frontend TypeScript check, two browser-hash tests, and Vite production build: passed. The gated Eve client is split into a separately loaded chunk; the initial JS chunk is about 242 KB.
- Backend Eve/Nitro build: passed, 15.4 MB output. Eve manifest lists only `discover_city_pulse` and `refine_city_pulse` as model-facing tools.
- Local backend HTTP smoke with a sealed fixture and no Qloo key: cached explain and exclusion returned 200 without Qloo; a tampered receipt was rejected with 400. This does not exercise live provider calls.
- Desktop (1440 px) and mobile (390 px) landing screenshots: inspected. A clipped mobile hero headline was corrected and rechecked. Mocked Chrome UI smoke passed at both sizes through discovery, why/exclude/fresh guided refinement, receipt download, hash match, tamper mismatch, and no horizontal overflow. A separate mocked 403 Eve-session test confirmed fallback to guided Qloo discovery.
- Live model catalog: `reflection/beam-free` listed with zero input/output price. Credentialed AI SDK tool-call preflight against the linked project: **failed HTTP 403** (`Free tier users do not have access to this model`) before tool execution. Public chat remains gated off.

## Still unverified

- Current-branch credentialed Qloo integration: local `QLOO_API_KEY` is not configured. Earlier credentialed and deployed checks apply only to the prior branch/deployment.
- Credentialed browser click-through against this branch's live Qloo backend; the completed browser smoke used explicit fixture responses.
- Live Eve tool-calling on the target project, unavailable-model fallback in a **deployed** browser, and paid-fallback/auto-top-up account settings. Local mocked fallback passed; no paid fallback is coded.
- Independent cultural relevance review with real-world ground truth; fixture passes are not an accuracy metric.
- GitHub/Vercel/Devpost/video release checks and publication; not authorized in this implementation scope.

## Trust boundary

The receipt's unkeyed SHA-256 hash detects edits unless the hash is recomputed. It cannot prove the Qloo response source or factual venue accuracy. Origin/CORS restrictions and process-local throttles are best-effort demo controls, not distributed abuse protection.
