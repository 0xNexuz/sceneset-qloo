# SceneSet project context

Updated 2026-10-21. This is a concise recovery record; executed checks are detailed in [`../evidence/tests/verification-summary.md`](../evidence/tests/verification-summary.md).

## Identity and approved direction

SceneSet is a Qloo-grounded city-scene discovery app for the Qloo Agentic Hackathon. React/Vite frontend, Eve/TypeScript backend, Qloo Tags + Insights, deterministic cultural-evidence scorer, SHA-256 Taste Receipt. The approved upgrade adds Eve conversations, bounded refinements, stronger multi-facet matching, receipt export/verification, and judging evidence without redesigning the UI. No paid model, push, deployment, Devpost edit, or video update is authorized.

## Git and milestone state

- Base: `dbf6c58` on `main`; work is on local branch `feat/scene-agent-upgrade`.
- Current milestone: implementation and local verification. Git commit status must be checked on resumption; this file does not assert that work was pushed.
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
- No local Qloo key is configured for a current-branch live integration test. Prior production Qloo checks predate these changes.
- No independent relevance ground truth, current-event feed, distributed abuse protection, or provenance authentication exists.

## Decision log

### 2026-10-21 — Keep chat gated and guided refinement usable

- **Decision:** Use only `reflection/beam-free`; leave Eve browser chat off after the 403 preflight. Keep the existing discovery form and structured follow-ups working through Qloo routes.
- **Reason:** The user approved no paid model and requested a truthful unavailable-model fallback.
- **Evidence:** Live model catalog price check, linked-project tool-call preflight, and local deterministic/UI checks.
- **Status:** APPROVED direction; chat enablement BLOCKED.

## Next action and authorization boundary

Finish local verification and commit this branch. A new credentialed Qloo run and free-model tool-call preflight are needed before claiming full readiness. Pushing, deploying, publishing, or updating the video requires separate user authorization.
