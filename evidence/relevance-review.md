# Small manual relevance review

Reviewed 2026-10-21. This is a qualitative inspection of deterministic fixture cases, the earlier redacted live Afrobeats audit, and the current-branch credentialed smoke; it is **not** an independent ground-truth study or a measured accuracy rate.

| Query | Observed check | Human assessment | Remaining uncertainty |
|---|---|---|---|
| Afrobeats parties, Lagos/Accra/London | Generic London pubs and brunch places no longer qualify; Lagos venue with explicit Afrobeats party detail outranks them in the fixture. In the live run, Qloo returned six candidates per city but no candidate qualified, so no city won. | Corrects the London-first failure pattern, but the live query was not actionable. | Inspect provider metadata and real venue pages to determine whether the filter is too strict or the evidence is genuinely insufficient. A venue description is not a dated event. |
| Food + live music | Pizza Hut food-only listing is rejected; restaurant with “live band” qualifies for both facets. | Better aligned with the combined request. | Live band metadata may be stale; schedule and hours are unverified. |
| Art + fashion | Gallery-only listing is rejected; venue describing both an art exhibition and fashion showcase qualifies. | Appropriate facet conjunction in the fixture. | Real-world programme is not confirmed. |
| Late-night jazz | Generic late bar is rejected; explicit jazz venue qualifies. | Genre specificity is appropriately prioritized. | “Late-night” hours are not verified, so the recommendation still needs a venue check. |

Next evidence needed: inspect the rejected live candidates' metadata, run credentialed samples for the other queries, review venue pages/programmes, and build an independent truth set before making a quantified relevance claim.
