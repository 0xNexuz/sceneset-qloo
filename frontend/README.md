# SceneSet frontend

React + Vite interface for free-text Qloo-grounded city-scene discovery.

## Run

```bash
npm install
npm run dev
```

The app uses `http://127.0.0.1:2000` by default. Set `VITE_SCENESET_API_URL` to the deployed Eve backend for production builds.

The discovery form, guided why/alternatives/exclusion/fresh-search controls, comparison strip, and receipt download/browser verification work without free-form chat. `VITE_SCENESET_CHAT_ENABLED` defaults off because the target project's free-model tool-call preflight returned HTTP 403. Do not enable it until the backend gate passes. The Eve client is lazy-loaded only when chat is enabled.

Run `npm test` for receipt hashing. With the frontend dev server on port 5183, run `npm run test:ui` for mocked desktop/mobile interaction coverage. For the unavailable-model fallback, run a second dev server on port 5184 with `VITE_SCENESET_CHAT_ENABLED=true`, then `npm run test:chat-fallback`. These browser checks use fixtures, not live Qloo evidence.

## Visual direction

The interface uses only the two supplied references: the teal-and-gold technical blueprint character and the moonlit pixel-art monolith landscape. It adds smooth hover/reveal motion and honors `prefers-reduced-motion`.

## Product boundary

The UI labels Qloo results as taste-grounded place recommendations. It never presents them as scheduled event listings, verified opening hours, ticket inventory, or availability.
