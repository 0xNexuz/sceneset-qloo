# Threat Model

Status: **CORE CONTROLS IMPLEMENTED**

## Objective

Protect the Qloo key, decision/receipt integrity, user briefs, service quota, and the boundary between verified cultural inference and unverified operational claims.

Threats include quota exhaustion, prompt injection, client-side constraint tampering, forged receipts, stale/false external data, and secret leakage. The system trusts Qloo to return authentic data but not as proof of availability or business outcome.

## Planned controls

- Schema/length validation, rate limits, and origin/CSRF protection where applicable.
- Tool allowlist, bounded steps, retry/call budgets, and deterministic final authorization.
- Server-only key, timeouts, response validation, and redacted logs.
- Canonical receipt JSON, request/response hashes, versioned scorer, optional signature.
- Anonymous-by-default runs and explicit retention.

| Attack | Defense | Test | Status |
|---|---|---|---|
| Model invents venue | Provenance gate | Injection E2E | PLANNED |
| Client changes hard constraint | Server recomputes policy | Tamper test | PLANNED |
| User drains quota | 12 requests/minute/IP and bounded cities/take | Route review | IMPLEMENTED |
| Fixture shown as live | Mode in API/receipt/UI | Mode mismatch | PLANNED |
| Receipt edited | SHA-256 canonical hash verification | Mutation test | IMPLEMENTED |

The product does not guarantee availability, suitability, attendance, revenue, or absence of cultural bias. Explainability is influence metadata, not causal truth.

