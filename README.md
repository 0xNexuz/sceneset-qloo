# SceneSet

**Search the culture. Find the city. Prove the recommendation.**

SceneSet is a Qloo-grounded city-scene discovery agent built for the Qloo Agentic Hackathon. A user searches a genre, mood, cuisine, or scene—such as “Afrobeats parties”—and compares two to five cities. SceneSet resolves that language to Qloo taste tags, retrieves real place recommendations for every city, applies one deterministic scoring policy, and seals the decision in a tamper-evident Taste Receipt.

> SceneSet recommends culturally relevant places. It does not claim to provide scheduled events, opening hours, ticket inventory, availability, attendance, or revenue forecasts.

## Why Qloo matters

A generic language model can write a plausible city guide. It cannot credibly resolve free-text cultural intent to Qloo’s taste graph, run the same place-affinity query across multiple markets, or preserve provider fingerprints for inspection. SceneSet uses Qloo Tags and Insights as the decision substrate; the agent layer validates, scores, limits, and proves the result.

## Live flow

1. Search a cultural scene in plain language.
2. Select two to five cities.
3. Qloo resolves the intent to taste tags.
4. Qloo returns place affinities for each city.
5. SceneSet ranks markets using the mean affinity of the top three candidates.
6. A SHA-256 Taste Receipt records inputs, resolved tags, provider-call fingerprints, comparisons, decision, limitations, and execution mode.

## Repository

- `frontend/` — React + Vite experience based exclusively on the two supplied visual references.
- `backend/` — Eve agent, direct browser routes, Qloo adapter, deterministic scoring, and receipt verification.
- `evidence/` — redacted credentialed Qloo run artifacts.
- `docs/build-harness/` — architecture, threat model, test/evidence plans, demo, and submission mapping.
- `docs/SUBMISSION_DRAFT.md` — ready-to-paste Devpost copy.
- `docs/DEMO_SCRIPT.md` — 90-second walkthrough script.

## Local setup

Requirements: Node.js 24 and a Qloo hackathon API key.

```bash
cd backend
npm install
cp .env.example .env.local
# Add QLOO_API_KEY and QLOO_API_BASE_URL to .env.local
npm run check
npm run dev -- --no-ui
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://127.0.0.1:2000`. Set `VITE_SCENESET_API_URL` for another backend origin.

## Verification

```bash
cd backend
npm run typecheck
npm test -- --run
npm run build

# Credentialed Qloo proof
QLOO_LIVE_TEST=1 npx vitest run tests/city-pulse.live.test.ts

cd ../frontend
npm run typecheck
npm run build
```

Verified on 2026-10-20: 8 deterministic tests passed, the Eve production bundle built, the frontend production bundle built, and the credentialed city-pulse test completed with four live Qloo calls and a verified receipt.

## API

`POST /api/city-pulse`

```json
{
  "query": "Afrobeats parties",
  "cities": ["Lagos", "Accra", "London"],
  "constraints": { "minRating": 4, "takePerMarket": 6 }
}
```

The public demo route is rate-limited, rejects oversized input, keeps the Qloo key server-side, and fails closed when Qloo is unavailable.

## License

[MIT](LICENSE)
