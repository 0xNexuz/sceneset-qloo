# SceneSet verification summary

Local branch `feat/scene-agent-upgrade`, 2026-10-21. The baseline deployment and its earlier smoke tests predate this branch; no push or deployment was performed here.

## Executed

- Backend TypeScript check: passed.
- Backend deterministic suite: 17 passed; the three credentialed suites are skipped by default and run separately with the Vercel Development credential. Fixtures cover London-first Afrobeats rejection, no-winner handling, compound food/music and art/fashion, missing metadata, conflicting constraints, provider failure, cached versus fresh refinement, investigation budgets, and receipt tampering.
- Frontend TypeScript check, two browser-hash tests, and Vite production build: passed. The gated Eve client is split into a separately loaded chunk; the initial JS chunk is about 242 KB.
- Backend Eve/Nitro build: passed, 15.4 MB output. Eve manifest lists only `discover_city_pulse` and `refine_city_pulse` as model-facing tools.
- Local backend HTTP smoke with a sealed fixture: cached explain and exclusion returned 200 without Qloo; a tampered receipt was rejected with 400. Additional input guards returned 400 for malformed JSON and an invalid brief, and 413 for an oversized body.
- Desktop (1440 px) and mobile (390 px) landing screenshots: inspected. A clipped mobile hero headline was corrected and rechecked. Mocked Chrome UI smoke passed at both sizes through discovery, why/exclude/fresh guided refinement, receipt download, hash match, tamper mismatch, and no horizontal overflow. A separate mocked 403 Eve-session test confirmed fallback to guided Qloo discovery.
- Live model catalog: `reflection/beam-free` listed as free. A fresh credentialed AI SDK required-tool-call preflight against the linked project **failed HTTP 403** (`Free tier users do not have access to this model`) before tool execution. The only configured chat model has no paid fallback; public chat remains gated off. The local browser with chat enabled fell back to the real Qloo backend after the chat route was unavailable; the mocked 403 fallback also passed.
- Current-branch credentialed Qloo suite: **2 passed** using Vercel Development environment injection, rerun with Node system CA verification enabled. The legacy planner selected Lagos and verified its receipt. The new `Afrobeats parties` search resolved the Afro Beat tag and returned six candidates in each of Lagos, Accra, and London, but **selected no city** because none met its combined venue-evidence rule; its receipt hash verified. This is a conservative no-winner result, not a successful cultural recommendation. See `../qloo/live-city-pulse.json` and `../qloo/live-plan.json`.
- A third credentialed suite covered the other suggested searches: `Late-night jazz` selected no city, `Food + live music` selected Accra among Lagos/Accra with one qualifying venue in each, and `Art + fashion` selected no city. Receipt checks passed. The Afrobeats candidate diagnostic found no Afrobeats mention in any of the 18 first-pass venue records; the focused Qloo retry returned zero venues. These are provider-result/metadata limitations, not proof that no real venues exist. See `../qloo/live-suggested-searches.json`.
- Real local browser → API → Qloo → UI path passed at desktop and mobile sizes. Desktop exercised cached explanation, fresh jazz refinement, food/music venue exclusion without another Qloo call, receipt download, embedded hash match, and tampered-file mismatch; mobile checked the live result and horizontal overflow. A three-city food/music check selected London with five venues having both food and live-music metadata; current programming was not verified. No browser console exceptions occurred.
- A small primary-source spot check found both food and live-music descriptions on The Bedford's official pages and on La Palm Royal Beach Hotel's page for The Ghanaian Village Restaurant. This supports venue-category plausibility for two returned places only, not event-date or booking claims; links are in `../relevance-review.md`.

## Still unverified

- Live Eve tool-calling on the target project remains **blocked by 403**. Unavailable-model fallback in a **deployed** browser cannot be tested on this undeployed branch. Account auto-top-up settings were not available from the local CLI; no paid fallback or auto-top-up is configured in code.
- Independent cultural relevance review with real-world ground truth; fixture passes are not an accuracy metric.
- Broader human venue-page/programme review is still needed, especially for the non-winning suggestions. Qloo venue metadata and the two spot-checked operator pages cannot confirm a specific future schedule, ticket, or availability.
- This branch is committed locally but not on `origin` and not deployed, so current-branch GitHub/Vercel deployment checks remain unexecuted. Video and submission are user-owned.

## Trust boundary

The receipt's unkeyed SHA-256 hash detects edits unless the hash is recomputed. It cannot prove the Qloo response source or factual venue accuracy. Origin/CORS restrictions and process-local throttles are best-effort demo controls, not distributed abuse protection.
