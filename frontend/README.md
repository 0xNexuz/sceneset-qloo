# SceneSet frontend

An interactive visual shell for the SceneSet Qloo agent. Its visual direction comes exclusively from the two supplied references: the teal/parchment blueprint illustration and the moonlit pixel monolith artwork. Both supplied images are used directly as unchanged source assets.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run typecheck
npm run build
```

The UI does not invent live Qloo output. Until the backend has a `QLOO_API_KEY`, market scores and receipt sealing remain visibly pending.
