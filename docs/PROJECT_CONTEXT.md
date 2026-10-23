# SceneSet project context

Updated 2026-10-22. This is a concise recovery record; executed checks are detailed in [`../evidence/tests/verification-summary.md`](../evidence/tests/verification-summary.md).

## Identity and approved direction

SceneSet is a Qloo-grounded city-scene discovery app for the Qloo Agentic Hackathon. React/Vite frontend, Eve/TypeScript backend, Qloo Tags + Insights, deterministic cultural-evidence scorer, SHA-256 Taste Receipt. The approved upgrade adds Eve conversations, bounded refinements, stronger multi-facet matching, receipt export/verification, and judging evidence without redesigning the UI. The user authorized push/merge and handling the non-Eve release blockers. The frontend and backend are promoted to production; no paid model, Devpost edit, or video update has been done.

## Git and milestone state

- Base: `dbf6c58` on `main`; work is on local branch `feat/scene-agent-upgrade`.
- The feature branch was pushed through `7f8d49c`; final release-evidence changes are pending a new commit. The default branch must be checked after the merge rather than assumed current.
- Backend production deployment `dpl_G7a7R4SMnhSDJAiVC7gUASh3Z6LL` and frontend `dpl_2iSBKZwYFA3WiyoxpdoTqo1Z2j3P` were staged, verified, and promoted. The public URLs in README now serve this upgrade. Vercel projects are not connected to Git, so the deployments were manual.

## Verified implementation

- Qloo-backed discovery remains available through `POST /api/city-pulse`.
- New scorer requires evidence for every explicit facet. Food alone cannot satisfy food + live music; a no-winner decision is allowed.
- Eve has durable per-session context, three-investigation/one-per-turn caps, and only `discover_city_pulse` and `refine_city_pulse` model-facing tools. Attachments and optional default tools are disabled.
- Guided refinement route supports cached explanation/exclusion and fresh Qloo search for changed preferences. The legacy `/api/scene-plan` route remains; its model-facing tool was removed.
- Receipt `1.1` adds history and evidence summaries; browser verifier accepts `1.0` and `1.1` and says “embedded hash matches” or “mismatch.”
- No-winner City Pulse guidance now suggests refinement rather than sending users to a nonexistent venue link; exclusion is disabled when no qualified venue exists. Desktop and mobile UI fixture tests cover this state.
- Featured searches now use live-positive venue-fit queries (`Live music`, `Art galleries`, `Food + live music`) instead of three weak/no-winner prompts. Free-text searches still allow no-winner results. `Brunch` was not featured because the current facet map treats it as generic food rather than verifying brunch service.
- Backend deterministic fixtures and a local cached-refinement HTTP smoke, frontend receipt tests, production builds, mocked desktop/mobile browser flow, and mocked Eve-403 fallback have passed locally. See verification summary for exact counts and limits.

## Blockers and limits

- `reflection/beam-free` returned HTTP 403 for the linked project. The replacement `nvidia/nemotron-3.5-lightning-free` appeared at zero price and passed a live required-tool preflight and Eve eval using the actual `discover_city_pulse` tool. Public/free-form chat is still off by default until deployed-browser fallback and account billing/auto-top-up settings are reviewed. Do not switch to paid.
- Vercel Development provides `QLOO_API_KEY` to local commands without committing it. A preview-only sensitive Qloo variable was added to the backend Vercel project for its protected preview. Three current-branch live suites and a local desktop/mobile browser → API → Qloo flow passed with system CA verification. The deployed preview API also returned a real Accra food/music lead and a real art/fashion no-winner result. Afrobeats parties, late-night jazz, and art + fashion selected no city; the sparse results remain a relevance/usefulness gap, not an API-connectivity blocker.
- A small primary-source relevance review exists and identifies a missed London jazz positive control; no representative independent truth set, measured accuracy, current-event feed, distributed abuse protection, or provenance authentication exists.
- `evidence/judging-evidence.md` now reflects the pushed branch and protected previews instead of claiming no deployment; the user owns the video and submission.
- Public production browser → API → Qloo checks passed at desktop and mobile widths, including guided refinement, receipt integrity, venue exclusion, and an honest no-winner result. This verifies the core flow, not future event schedules or measured cultural accuracy.

## Decision log

### 2026-10-22 — Replace inaccessible Beam with a preflighted zero-price tool model

- **Decision:** Configure only `nvidia/nemotron-3.5-lightning-free` for Eve. Keep public browser chat gated until deployed-browser and account-settings checks.
- **Reason:** Beam returned HTTP 403 for the target project; Nemotron was listed at zero price and invoked a required tool, then Eve called the real discovery tool in a live eval.
- **Evidence:** Linked-project preflight `TOOL_INVOKED`, Eve eval 2/2 gates, backend and frontend checks, and qualitative venue review.
- **Status:** Live Eve tool calling VERIFIED locally; public deployment UNVERIFIED.

### 2026-10-21 — Keep chat gated and guided refinement usable

- **Decision:** Use only `reflection/beam-free`; leave Eve browser chat off after the 403 preflight. Keep the existing discovery form and structured follow-ups working through Qloo routes.
- **Reason:** The user approved no paid model and requested a truthful unavailable-model fallback.
- **Evidence:** Live model catalog price check, linked-project tool-call preflight, and local deterministic/UI checks.
- **Status:** APPROVED direction; chat enablement BLOCKED.

## Next action and authorization boundary

The public core discovery flow is verified and live. Finish the Git branch alignment and accurate release-evidence commit, then leave video and Devpost submission to the user. Public Eve chat remains off until deployed fallback and billing settings are checked. Broader venue/programme review and an independent relevance dataset remain future quality work, not evidence already achieved.
