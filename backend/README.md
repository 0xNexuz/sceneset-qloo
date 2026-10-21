# SceneSet backend

Eve + TypeScript backend for Qloo-grounded city-scene discovery.

## Main route

`POST /api/city-pulse` accepts a free-text cultural query, two to five cities, and optional place constraints. It resolves Qloo tags, requests Qloo place insights for each city, applies a deterministic multi-facet scorer, and returns a versioned Taste Receipt. `POST /api/refine-city-pulse` accepts a completed result plus a structured follow-up; cached explanation/exclusion calls do not contact Qloo, while changed preferences do.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev -- --no-ui
```

Required server environment:

```dotenv
QLOO_API_KEY=your_key_here
QLOO_API_BASE_URL=https://hackathon.api.qloo.com
```

Eve browser chat remains disabled unless `SCENESET_CHAT_ENABLED=true` and `SCENESET_UI_ORIGIN` is set to the exact frontend origin. It uses only `reflection/beam-free`. Do not enable until a live tool-calling preflight succeeds; the current project received HTTP 403 on 2026-10-21. There is no paid fallback. `SCENESET_UI_ORIGIN`/CORS and in-memory rate limits are not distributed abuse protection.

## Verify

```bash
npm run check

# Credentialed Qloo integration
QLOO_LIVE_TEST=1 npm run test:live
```

## Safety boundary

- Only Qloo-returned tags and entities may enter a completed result.
- Provider failures stop the run; fixtures never masquerade as live data.
- Requests are size-limited and best-effort rate-limited. The rate limiter is process-local, not a distributed public-abuse defense.
- Eve attachments and default shell/filesystem/web tools are disabled; sessions and Qloo investigations have explicit caps.
- Receipt verification checks an unkeyed embedded hash, not Qloo provenance.
- The Qloo key remains server-side.
- Scheduled events, tickets, opening hours, and availability are never claimed as verified.

Production: https://sceneset-qloo-api.vercel.app
