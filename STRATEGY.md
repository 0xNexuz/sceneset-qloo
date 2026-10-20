# Qloo Hackathon Strategy

## What the brief actually requires

The current official rules and overview supersede the date visible in the supplied screenshot. The submission deadline is **October 30, 2026 at 11:45 PM EDT** (**October 31 at 4:45 AM WAT**). A qualifying entry needs a working agentic application with a meaningful Qloo integration, a public repository, a fully hosted end-to-end demo, a text description, and a visible open-source license. A video is not required.

Stage two scores four equally weighted criteria: technological implementation, design, potential impact, and quality of idea. The tie-break begins with technological implementation. The build should therefore prioritize a deep, inspectable Qloo path before optional polish.

Sources:

- https://qloo.devpost.com/
- https://qloo.devpost.com/rules
- https://github.com/qloo/docs-public/blob/main/reference/insights-api-deep-dive.md

## Ranked shortlist

Scores use the project-idea-strategist rubric.

| Rank | Concept | Score | Target user | Mechanism | MVP effort | Principal risk |
|---:|---|---:|---|---|---|---|
| 1 | **SceneSet** | **89** | Independent promoters and touring teams | Compare markets, then compose a cross-domain local event scene with Qloo and an auditable Taste Receipt | 8–10 focused days | Qloo may not expose availability; product must remain a planning shortlist |
| 2 | ShelfSignal | 84 | Small retail and pop-up operators | Convert brand/product anchors into neighborhood-specific assortment and activation recommendations | 6–8 days | Can resemble standard market research unless the live assortment workflow is excellent |
| 3 | CommonGround | 81 | Friends, concierges, and travel planners | Optimize a group outing for shared affinity rather than averaging preferences | 5–7 days | Group recommendation is a crowded hackathon category |
| 4 | MemoryLane Local | 77 | Caregivers and senior-living activity coordinators | Turn a resident's cultural anchors into local engagement plans | 7–9 days | Health/accessibility claims require data Qloo may not provide |

Category coverage: **CommonGround** is conservative; **SceneSet** is high-upside; **MemoryLane Local** is unusual and cross-domain.

## Winning concept: SceneSet

### Problem

Independent promoters and lean touring teams must decide where an artist should activate and what local combination of collaborators and places will feel authentic. Today that work depends on personal networks, generic popularity lists, and manual research; it is slow, difficult to explain, and biased toward already-famous options.

### Solution

SceneSet turns an artist, audience taste anchors, candidate cities, and hard constraints into a ranked market decision and a locally coherent event blueprint. It queries Qloo across artists, destinations, places, brands, and tags; applies deterministic constraints; retries when a plan fails policy; and produces a Taste Receipt for independent inspection.

### Why Qloo is load-bearing

The core task is not finding popular venues. It is inferring cross-domain cultural adjacency: which city and local places fit the combined audience implied by an artist, film, brand, or other taste anchors. Qloo resolves those entities, supplies affinity-ranked candidates, supports location and price/rating filters, and can return explainability metadata. Without those relationships, SceneSet degrades into generic suggestions.

### Agent loop

1. Parse the brief into typed anchors, candidate cities, and constraints.
2. Resolve every anchor to a Qloo entity; ask for clarification on ambiguous matches.
3. Derive a taste fingerprint from tags and cross-domain signals.
4. Score each candidate city using the same normalized query plan.
5. Compose a stop from Qloo-ranked local places and cultural collaborators.
6. Apply deterministic policy gates; reject and retry candidates that violate hard constraints.
7. Emit the plan plus a hashed Taste Receipt.

The model interprets and narrates. It does not invent candidates, affinity, availability, or execution.

## MVP boundary

### Must build

- Polished input: artist, 1–3 taste anchors, 2–3 cities, supported constraints.
- Live server-side Qloo entity resolution and `/v2/insights` calls.
- Visible agent state machine and one retry/rejection path.
- Market comparison plus one launch-night plan.
- Taste Receipt with entity IDs, request hashes, returned explainability, policy results, and execution mode.
- Honest Qloo failure state; no silent mock fallback.
- Ablation showing what disappears without Qloo.
- Public repo, license, hosted app, setup instructions, tests, and evidence bundle.

### Nice to have

Shareable receipt URL, map, exportable promoter brief, and saved comparisons.

### Explicitly excluded

Ticketing, booking, payments, availability claims, revenue forecasts, social scraping, multi-day routing, and a broad chat interface.

## Reuse map

Reuse from proven project DNA: deterministic policy/fail-closed authorization; verifiable receipts; scoring pipelines and visible rejection states; premium interactive demo design.

Build new: typed Qloo adapter, cross-domain market scorer, Taste Receipt schema/verifier, and Qloo ablation benchmark.

Future primitive: `@sceneset/taste-receipt`, a vendor-aware record of taste inputs, cultural inference, constraints, candidates, selection, and execution status.

## Pitch

**Name:** SceneSet  
**Hook:** Pick the city. Build the scene. Prove the taste.

> Independent promoters know an artist can sell in more than one city; the hard part is knowing where the launch will feel culturally inevitable. SceneSet resolves an artist and their audience's taste anchors through Qloo, compares candidate markets, and composes a locally coherent night across places and collaborators. Every recommendation comes with a Taste Receipt showing the live cultural signals, constraints, and rejected alternatives—so the agent is useful because it has taste, and trustworthy because it can show its work.

## Exact next move

Request the hackathon Qloo API key, then run a one-day feasibility spike against three fixed briefs. Verify entity resolution, location-filtered place insights, cross-domain artist/place recommendations, tags, and explainability. Do not build the frontend until at least two briefs produce materially different, defensible results with live Qloo data.

