# SceneSet judging evidence — local branch

Status: **PARTIAL**. This branch has not been pushed or deployed. The public URLs in the README still serve the earlier build. The existing YouTube demo has not been inspected in this checkout; treat it as **outdated for this new refinement and receipt flow** until rerecorded, but do not alter it without authorization.

## Reproducible walkthrough

1. Configure a server-side Qloo hackathon key, start the backend and frontend as described in the README. Search **Afrobeats parties** across **Lagos, Accra, London**, rating **4.0+**. Confirm the result shows Qloo tags and per-city venue evidence; London high-affinity but culturally unsupported places must not lead. A no-winner result is valid when evidence is inadequate.
2. In City pulse, press **Why this ranking?**. Confirm the status says **Qloo was not called**. Pick a listed venue and **Exclude and compare**; inspect the before/after city, confidence, and venue change. The cached-shortlist caveat must remain visible.
3. Change the cultural search to **Food + live music** and select **Search again**. Confirm the status says **Qloo was called**. A food-only Pizza Hut result must not qualify; “live band” may support the music facet, but no listing confirms a current event.
4. Open Taste receipt, download JSON, verify the current receipt, then edit a decision field in the saved JSON and upload it. The untouched receipt should say **Embedded hash matches**; the altered one should say **Mismatch**. Neither state proves provenance or factual correctness.

## Sponsor integration

Qloo Tags resolves the cultural signal, and Qloo Insights supplies place candidates and metadata per city. The scorer checks those candidates for each query facet and hard user constraints. A weak initial pass makes at most one focused retry. A changed follow-up makes a fresh bounded Qloo investigation; an explanation or exclusion works from cached evidence. Qloo entity IDs, request fingerprints, evidence counts, and decision changes appear in the receipt. No mock data is substituted for a failed live request.

## What this does not establish

- Venue-fit confidence is not an event schedule, opening-hour check, ticket feed, or booking confirmation.
- The SHA-256 hash is unkeyed and checks internal consistency only. It does not authenticate Qloo responses.
- Deterministic fixtures catch known failures; they are not independent cultural ground truth or a measured accuracy percentage.
- A [small qualitative relevance review](relevance-review.md) is kept separately from the fixture tests.
- A credentialed live Qloo check and an updated deployed-browser check for this branch remain pending.
- Free-form Eve chat is implemented behind a gate but **not enabled**: the live `reflection/beam-free` preflight on this project returned HTTP 403 before tool execution. No paid fallback is permitted.
