# SceneSet project context

Last updated: 2026-10-20

## Product decision

SceneSet is a Qloo-grounded city-scene discovery agent. Its primary path accepts any cultural query—genre, mood, cuisine, or scene—and two to five cities. It resolves the query to Qloo tags, compares real place affinities under one deterministic scorer, and seals its evidence in a tamper-evident Taste Receipt. The original artist-route planner remains available as a secondary API.

The product must never substitute model memory or fixtures when live Qloo execution fails. Availability, demand, attendance, booking, and revenue are outside the claim boundary.

## Implemented milestones

- Eve agent with optional default tools disabled.
- Typed `plan_scene` tool and deterministic market-affinity scorer.
- Live Qloo search and insights adapter using the hackathon API.
- Live response normalization for `types`, `subtype`, `query.affinity`, and `query.explainability`.
- Supported place filters: location, maximum price level, and minimum business rating.
- Fail-closed provider errors with retries limited to transient failures.
- Canonical SHA-256 Taste Receipt sealing and verification.
- Structured browser route at `POST /api/scene-plan`, implemented as a direct Eve tool invocation with no model turn.
- Responsive React interface using only the two supplied visual references.
- UI states for live execution, market comparisons, sealed receipt, and evidence.
- Free-text `discover_city_pulse` tool using Qloo Tags and Insights.
- `POST /api/city-pulse` browser route with input-size and per-IP demo rate limits.
- Search-first UI with suggestions, 2–5 city selection, resolved tags, ranked real places, and explicit calendar/ticket limitations.
- SceneSet SVG favicon.

## Verification evidence

- TypeScript passes; 8 deterministic tests pass; the Eve production build and Vite production build pass.
- `QLOO_LIVE_TEST=1 npm run test:live` passes against `hackathon.api.qloo.com`.
- Redacted live artifact: `evidence/qloo/live-plan.json`.
- Representative live result: Lagos `0.9531`, Accra `0.9227`; receipt verified after seven provider calls.
- Direct route smoke test returns `COMPLETE`, two comparisons, seven provider calls, and a receipt hash.
- Browser smoke test submits the default three-city brief, renders Lagos `0.953`, London `0.936`, Accra `0.923`, and shows `LIVE / SEALED` in the Taste Receipt.
- Credentialed city-pulse proof resolves “Afrobeats parties,” performs four live Qloo calls across Lagos, Accra, and London, returns real places, and verifies its receipt.
- Browser city-pulse smoke test renders the selected city, three scores, twelve real place names, Qloo tags, and the non-calendar truth boundary.

No credential value is stored in evidence or committed source. `.env.local` is ignored by Git.

## Local run

Backend:

```bash
cd backend
npm run dev -- --no-ui
```

Frontend:

```bash
cd frontend
npm run dev
```

The frontend defaults to `http://127.0.0.1:2000` and can be pointed elsewhere with `VITE_SCENESET_API_URL`.

## Remaining release work

- Deploy the backend and frontend to Vercel, configure secrets server-side, and run an anonymous deployed E2E check.
- Publish the authorized public GitHub repository after a secret scan.
- Paste the saved draft into Devpost and record the walkthrough; actual Devpost submission remains a separate explicit action.

## Environment caution

The parent shell currently sets `NODE_TLS_REJECT_UNAUTHORIZED=0`. This is not defined by the project, but Node processes inherit it. Remove that override before deployment so TLS certificate validation is enforced.
