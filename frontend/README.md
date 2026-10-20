# SceneSet frontend

React + Vite interface for free-text Qloo-grounded city-scene discovery.

## Run

```bash
npm install
npm run dev
```

The app uses `http://127.0.0.1:2000` by default. Set `VITE_SCENESET_API_URL` to the deployed Eve backend for production builds.

## Visual direction

The interface uses only the two supplied references: the teal-and-gold technical blueprint character and the moonlit pixel-art monolith landscape. It adds smooth hover/reveal motion and honors `prefers-reduced-motion`.

## Product boundary

The UI labels Qloo results as taste-grounded place recommendations. It never presents them as scheduled event listings, verified opening hours, ticket inventory, or availability.
