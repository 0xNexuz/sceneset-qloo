# Invariants

Status: **CORE INVARIANTS TESTED**

| ID | Invariant | Enforcement | Verification | Status |
|---|---|---|---|---|
| INV-001 | Every final candidate appears in a recorded Qloo response | Provenance gate | Injected-candidate rejection | PLANNED |
| INV-002 | Hard constraints cannot be overridden by prose/client state | Server policy | Tamper and injection tests | PLANNED |
| INV-003 | Live, fixture, replay, and blocked modes are never conflated | Mode enum | Mode mismatch tests | PLANNED |
| INV-004 | Credentials never appear in client, logs, receipts, or errors | Server env + redaction | Bundle/log/response scans | PLANNED |
| INV-005 | Cities use the same versioned scoring recipe | Normalized scorer | Determinism test | IMPLEMENTED |
| INV-006 | No availability, attendance, or revenue claim is presented as verified | Claim vocabulary | Content tests | PLANNED |
| INV-007 | Agent calls, duration, and retries are bounded | Runtime budget | Runaway tests | PLANNED |
| INV-008 | Receipt mutation invalidates integrity | Canonical serializer | Mutation test | IMPLEMENTED |

All critical invariants remain untested until implementation exists.

