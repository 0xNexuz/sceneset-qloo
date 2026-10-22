# SceneSet judging evidence — release candidate

Status: **PARTIAL**. The feature branch is pushed and protected Vercel previews have passed direct API → Qloo checks; the production URLs in the README still serve the earlier build until a staged release is verified and promoted. Public Eve chat is off. The existing YouTube demo has not been inspected in this checkout; treat it as **outdated for the new refinement and receipt flow** until the user rerecords it.

## Reproducible walkthrough

1. Configure a server-side Qloo hackathon key, start the backend and frontend as described in the README. Search **Live music** across **Lagos, Accra, London**, rating **4.0+**. Confirm the result shows Qloo tags, supported venue leads, and per-city evidence. A live protected-preview API check found qualifying leads in all three cities; the exact ranking can change with Qloo data.
2. In City pulse, press **Why this ranking?**. Confirm the status says **Qloo was not called**. Pick a listed venue and **Exclude and compare**; inspect the before/after city, confidence, and venue change. The cached-shortlist caveat must remain visible.
3. Change the cultural search to **Food + live music** and select **Search again**. Confirm the status says **Qloo was called**. A food-only Pizza Hut result must not qualify; “live band” may support the music facet, but no listing confirms a current event.
4. Open Taste receipt, download JSON, verify the current receipt, then edit a decision field in the saved JSON and upload it. The untouched receipt should say **Embedded hash matches**; the altered one should say **Mismatch**. Neither state proves provenance or factual correctness.
5. For the honest failure case, search **Afrobeats parties** across the same cities. If no venue has evidence for both the cultural and party facets, expect **No clear city** and a refinement prompt rather than a fabricated winner. A prior live check returned this state; do not present it as proof no real Afrobeats venue exists.

## Sponsor integration

Qloo Tags resolves the cultural signal, and Qloo Insights supplies place candidates and metadata per city. The scorer checks those candidates for each query facet and hard user constraints. A weak initial pass makes at most one focused retry. A changed follow-up makes a fresh bounded Qloo investigation; an explanation or exclusion works from cached evidence. Qloo entity IDs, request fingerprints, evidence counts, and decision changes appear in the receipt. No mock data is substituted for a failed live request.

## What this does not establish

- Venue-fit confidence is not an event schedule, opening-hour check, ticket feed, or booking confirmation.
- The SHA-256 hash is unkeyed and checks internal consistency only. It does not authenticate Qloo responses.
- Deterministic fixtures catch known failures; they are not independent cultural ground truth or a measured accuracy percentage.
- A [small qualitative relevance review](relevance-review.md) is kept separately from the fixture tests.
- Credentialed local Qloo checks and direct protected-preview API → Qloo checks passed; a complete deployed-browser click-through remains pending until the release is staged and checked.
- Free-form Eve chat is implemented behind a gate but **not enabled**. The originally proposed `reflection/beam-free` returned 403. A zero-price replacement passed a live tool-call preflight and Eve eval, but deployed fallback and account billing checks remain pending. No paid fallback is permitted.
