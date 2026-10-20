# Test Plan

Status: **LOCAL, LIVE-INTEGRATION, AND BROWSER SMOKE PASSING**

## Objective

Prove that Qloo is genuinely used, final candidates have provenance, constraints dominate model output, receipts detect tampering, execution is bounded, and the hosted journey works.

## Coverage

- Unit: request normalization, scoring, policy rules, state transitions, canonical receipt serializer.
- Integration: Qloo adapter contract, cache, timeouts, malformed/empty responses.
- E2E: valid brief, ambiguous anchor, no valid plan, Qloo outage, model outage, changed taste anchor.
- Adversarial: prompt injection, client constraint tampering, fabricated candidate, receipt mutation, retry amplification, key leakage.
- Browser: desktop/mobile, keyboard, loading, failed network, reduced motion.

## Implemented gate

```bash
npm run typecheck
npm test
npm run build
```

Verified 2026-10-17: TypeScript passed, Vitest passed 3/3 tests, and Eve produced a 15.4 MB Node server bundle. Covered: winning-city selection, receipt verification/mutation detection, and underspecified-brief rejection.

Frontend verified 2026-10-17: TypeScript passed, Vite production build passed, desktop and 390px responsive views rendered, the brief compilation interaction reached its expected gated state, and no browser console errors were reported.

Still required: live Qloo contract test, timeout/malformed-response integration tests, prompt-injection tests, hosted E2E, browser coverage, and evidence capture. Submission remains blocked on those gates.

