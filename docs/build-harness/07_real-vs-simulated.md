# Real vs Simulated

Status: **LIVE CORE IMPLEMENTED**

| Capability | Status | Evidence / note |
|---|---|---|
| Brief parsing | REAL — LOCAL | Typed schema and deterministic validation; fixture-tested |
| Qloo resolution and insights | LIVE VERIFIED | Credentialed tests exercise the hackathon server and save redacted evidence |
| Qloo tags | LIVE VERIFIED | Free-text city-pulse queries use `/v2/tags` before insights |
| Market scoring and policy | REAL — LOCAL | Deterministic top-three affinity scoring and fail-closed constraints; fixture-tested |
| Taste Receipt and verifier | REAL — LOCAL | Canonical SHA-256 seal and mutation detection; fixture-tested |
| Interactive frontend | REAL — LOCAL | Brief builder, market, receipt, and evidence views; browser-smoke-tested |
| Frontend → backend execution | LOCALLY VERIFIED | Browser smoke test renders live tags, cities, places, scores, and receipt |
| Hosted end-to-end demo | PLANNED | Must be externally accessible |
| Attendance/revenue prediction | NOT IMPLEMENTED | Explicit non-goal |
| Booking/availability | NOT IMPLEMENTED | Always labeled unverified |

Fixtures may support deterministic tests and a labeled ablation/replay mode. No fixture output may be presented as live Qloo execution.

