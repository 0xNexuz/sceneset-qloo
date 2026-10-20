# SceneSet verification summary

Verified on 2026-10-20 with Node.js 24 on Windows x64 and production Vercel deployments.

## Passed gates

- Backend `npm run typecheck` — exit 0.
- Backend deterministic suite — 8 tests passed; credentialed suites skipped by default.
- Backend `npm run build` — exit 0; Eve/Nitro emitted a 15.4 MB production bundle.
- Credentialed `city-pulse.live.test.ts` — passed against the Qloo hackathon server; four provider calls and receipt verification.
- Frontend `npm run typecheck` — exit 0.
- Frontend `npm run build` — exit 0; Vite production bundle emitted.
- Local browser E2E — “Afrobeats parties” rendered Qloo tags, three city scores, twelve place names, the selected market, and explicit non-calendar limits.
- Production API smoke — `POST https://sceneset-qloo-api.vercel.app/api/city-pulse` returned `COMPLETE`, three comparisons, four provider calls, and a 64-character SHA-256 seal.
- Deployed browser E2E — `https://sceneset-qloo.vercel.app` completed the same anonymous live journey and visibly rendered the selected city.

## Evidence boundary

- `evidence/qloo/live-city-pulse.json` is redacted live evidence. It contains no credential.
- Place recommendations and affinities come from Qloo.
- SceneSet does not verify scheduled events, dates, tickets, opening hours, booking availability, attendance, or revenue.
- Devpost registration, video upload, and final form submission have not been inspected or performed.

## Dependency note

The production install reports four moderate advisories inherited through Eve's sandbox dependency chain. The agent disables Eve's optional default shell, filesystem, and web tools. No forced breaking dependency upgrade was applied.
