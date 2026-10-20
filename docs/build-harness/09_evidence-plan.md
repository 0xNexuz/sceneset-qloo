# Evidence Plan

Status: **LOCAL AND LIVE EVIDENCE RECORDED; DEPLOYED PROOF PENDING**

| Claim | Evidence required | Planned artifact |
|---|---|---|
| Qloo drives the result | Live search/insights/tags transcript, key redacted | `evidence/qloo/live-run.json` |
| City comparison is fair | Normalized inputs + scorer version | `evidence/runs/market-comparison.json` |
| Constraints fail closed | Passing and rejected run | `evidence/tests/constraint-rejection.json` |
| Candidate provenance holds | Receipt and verifier output | `evidence/receipts/sample.receipt.json` |
| Qloo changes quality | Fixed-brief ablation with rubric | `evidence/ablation/report.md` |
| Backend compiles and bundles | Typecheck, tests, production build | `evidence/tests/verification-summary.md` |
| App is deployable | Public health check | `evidence/deployment/` |

## Verify it yourself

1. `pnpm evidence:live-qloo` → redacted timestamped transcript with non-empty Qloo IDs.
2. `pnpm verify:receipts evidence/receipts/sample.receipt.json` → exits 0; mutation exits non-zero.
3. `pnpm test:e2e` → success, Qloo failure, and constraint rejection pass.

The local verification summary exists. Qloo, comparison, receipt sample, ablation, and deployment artifacts remain implementation targets, not evidence claims.

