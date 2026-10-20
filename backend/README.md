# SceneSet backend

Eve + TypeScript backend for Qloo-grounded city-scene discovery.

## Main route

`POST /api/city-pulse` accepts a free-text cultural query, two to five cities, and optional place constraints. It resolves Qloo tags, requests Qloo place insights for each city, applies a deterministic scorer, and returns a sealed Taste Receipt.

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

## Verify

```bash
npm run check

# Credentialed Qloo integration
QLOO_LIVE_TEST=1 npm run test:live
```

## Safety boundary

- Only Qloo-returned tags and entities may enter a completed result.
- Provider failures stop the run; fixtures never masquerade as live data.
- Requests are size-limited and rate-limited.
- The Qloo key remains server-side.
- Scheduled events, tickets, opening hours, and availability are never claimed as verified.

Production: https://sceneset-qloo-api.vercel.app
