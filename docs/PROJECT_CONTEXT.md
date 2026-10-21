# SceneSet project context

Updated 2026-10-21. This is a concise recovery record; executed checks are detailed in [`../evidence/tests/verification-summary.md`](../evidence/tests/verification-summary.md).

## Identity and approved direction

SceneSet is a Qloo-grounded city-scene discovery app for the Qloo Agentic Hackathon. React/Vite frontend, Eve/TypeScript backend, Qloo Tags + Insights, deterministic cultural-evidence scorer, SHA-256 Taste Receipt. The approved upgrade adds Eve conversations, bounded refinements, stronger multi-facet matching, receipt export/verification, and judging evidence without redesigning the UI. No paid model, push, deployment, Devpost edit, or video update is authorized.

## Git and milestone state

- Base: `dbf6c58` on `main`; work is on local branch `feat/scene-agent-upgrade`.
- Current milestone: implementation and expanded local/live verification committed locally through `92857b9`. The branch has not been pushed.
- Prior deployment links in README serve the earlier build, not this upgrade.

## Verified implementation

- Qloo-backed discovery remains available through `POST /api/city-pulse`.
- New scorer requires evidence for every explicit facet. Food alone cannot satisfy food + live music; a no-winner decision is allowed.
- Eve has durable per-session context, three-investigation/one-per-turn caps, and only `discover_city_pulse` and `refine_city_pulse` model-facing tools. Attachments and optional default tools are disabled.
- Guided refinement route supports cached explanation/exclusion and fresh Qloo search for changed preferences. The legacy `/api/scene-plan` route remains; its model-facing tool was removed.
- Receipt `1.1` adds history and evidence summaries; browser verifier accepts `1.0` and `1.1` and says “embedded hash matches” or “mismatch.”
- Backend deterministic fixtures and a local cached-refinement HTTP smoke, frontend receipt tests, production builds, mocked desktop/mobile browser flow, and mocked Eve-403 fallback have passed locally. See verification summary for exact counts and limits.

## Blockers and limits

- `reflection/beam-free` is listed at zero price but the linked project's live required-tool preflight returned HTTP 403. Public/free-form chat is therefore **disabled and incomplete**; do not enable or switch to paid.
- Vercel Development provides `QLOO_API_KEY` to local commands without committing it. Three current-branch live suites and a desktop/mobile browser → API → Qloo flow passed with system CA verification. Afrobeats parties, late-night jazz, and art + fashion selected no city; food + live music produced supported venue leads. The sparse results remain a relevance/usefulness gap, not an API-connectivity blocker.
- No independent relevance ground truth, current-event feed, distributed abuse protection, or provenance authentication exists.

## Decision log

### 2026-10-21 — Keep chat gated and guided refinement usable

- **Decision:** Use only `reflection/beam-free`; leave Eve browser chat off after the 403 preflight. Keep the existing discovery form and structured follow-ups working through Qloo routes.
- **Reason:** The user approved no paid model and requested a truthful unavailable-model fallback.
- **Evidence:** Live model catalog price check, linked-project tool-call preflight, and local deterministic/UI checks.
- **Status:** APPROVED direction; chat enablement BLOCKED.

## Next action and authorization boundary

Review live venue programmes and improve discovery coverage before claiming recommendation readiness. The free-model tool-call preflight still fails HTTP 403, so keep public Eve chat off. Pushing or deploying requires separate user authorization; the user owns video and submission.
