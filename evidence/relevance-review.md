# Small manual relevance review

Reviewed 2026-10-21. This is a qualitative inspection of deterministic fixture cases and the earlier redacted live Afrobeats audit; it is **not** an independent ground-truth study or a measured accuracy rate. No current-branch credentialed Qloo run was available locally.

| Query | Observed check | Human assessment | Remaining uncertainty |
|---|---|---|---|
| Afrobeats parties, Lagos/Accra/London | Generic London pubs and brunch places no longer qualify; Lagos venue with explicit Afrobeats party detail outranks them. If no explicit culture lead exists, no city may win. | Corrects the London-first failure pattern in the available fixture. | An event-venue description is not a dated Afrobeats event. Real current-branch Qloo results remain unreviewed. |
| Food + live music | Pizza Hut food-only listing is rejected; restaurant with “live band” qualifies for both facets. | Better aligned with the combined request. | Live band metadata may be stale; schedule and hours are unverified. |
| Art + fashion | Gallery-only listing is rejected; venue describing both an art exhibition and fashion showcase qualifies. | Appropriate facet conjunction in the fixture. | Real-world programme is not confirmed. |
| Late-night jazz | Generic late bar is rejected; explicit jazz venue qualifies. | Genre specificity is appropriately prioritized. | “Late-night” hours are not verified, so the recommendation still needs a venue check. |

Next evidence needed: a credentialed sample across these queries, a human review of returned venue pages/programmes, and an independent truth set before making a quantified relevance claim.
