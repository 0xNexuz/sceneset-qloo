# Backend verification summary

Verified locally on 2026-10-17 using Node.js 24 on Windows x64.

## Passed gates

- `npm run typecheck` — exit 0.
- `npm test` — exit 0; 1 test file and 3 tests passed.
- `npm run build` — exit 0; Eve/Nitro emitted a 15.4 MB Node server bundle at `backend/.output`.
- `npm run dev -- --no-ui` — boot smoke test reached `server listening at http://127.0.0.1:2000/`; the test process was then stopped.

The deterministic tests cover winning-city selection, Taste Receipt seal verification and mutation detection, and rejection of an underspecified brief. They use a labeled fake Qloo provider; they are not evidence of a live Qloo call.

## Dependency review

`npm audit --omit=dev` reports four moderate advisories inherited through Eve's Windows `just-bash` sandbox dependency. No non-breaking upstream fix is currently offered. The high-severity nested `undici` advisory was removed with a package override to 7.30.1. Eve's default shell, filesystem, and web tools are disabled for this agent.

## Outstanding external gates

- `QLOO_API_KEY` was absent, so live Qloo execution is unverified.
- No hosted deployment or public health check exists.
- No model-provider conversational run was performed.
- Frontend, browser E2E, adversarial tests, and ablation evidence remain open.

This document is a verification record, not a claim that the product is submission-ready.

## Frontend verification

- `frontend/npm run typecheck` — exit 0.
- `frontend/npm run build` — exit 0; Vite emitted the production bundle.
- Desktop render smoke test — passed with both supplied reference assets visible.
- Brief interaction — passed; a valid local draft changes the preview to `Ready for Qloo` while keeping execution gated on the live key.
- Responsive render at 390 × 844 — passed.
- Browser console warnings/errors — none reported.
