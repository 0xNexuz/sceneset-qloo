# SceneSet: a guide for judges

SceneSet helps you compare cities around a specific cultural interest, then look at the places behind the recommendation. Start with [the live app](https://sceneset-qloo.vercel.app/). No local setup is needed.

The walkthrough below covers discovery, questioning a result, changing your preferences, and downloading the decision record. Rankings may change as Qloo's data changes.

## Try a search

Search **Live music** across **Lagos, Accra, and London**, with a minimum rating of **4.0**.

Open **City pulse** to see the city rankings and suggested venues. Each lead includes the information used to assess its fit. Previous live checks found qualifying places in all three cities, but there is no fixed winner you need to reproduce.

## Question the result

Select **Why this ranking?** to see an explanation based on the results already returned. The status should say **Qloo was not called**.

Next, choose a venue and select **Exclude and compare**. Look at what changes in the shortlist, ranking, and confidence. This step works with the existing results; it does not search for replacement venues.

## Change what you want

Change the search to **Food + live music** and select **Search again**. This time, the status should say **Qloo was called**.

A qualifying venue needs evidence for both parts of the request. A restaurant listing alone is not enough. A description mentioning a live band can support the music requirement, but it cannot tell you whether a performance is scheduled for your visit.

## Inspect the receipt

Open **Taste receipt**, download the JSON, and verify it. The original should show **Embedded hash matches**.

Change a decision field in the downloaded file without updating its hash, then upload it for verification. It should show **Mismatch**.

The receipt records the query, Qloo tags and place IDs, request fingerprints, ranking evidence, and refinements. Its SHA-256 hash lets you check whether the stored contents match the embedded hash. It is not a digital signature, and someone who edits the contents can also recompute the hash.

## Try a search with limited evidence

Search **Afrobeats parties** across the same three cities.

Earlier live checks returned **No clear city** because the retrieved places did not support both parts of the request. If that happens, SceneSet offers a refinement rather than naming a winner. It means the returned data was insufficient; it does not mean those cities have no Afrobeats venues.

## Where Qloo and Eve fit

Qloo Tags turns the search into cultural signals. Qloo Insights returns places and metadata for each city. SceneSet checks those places against the request and user constraints before ranking them. If the first pass has no direct cultural matches, it makes at most one focused retry. Failed live requests do not fall back to mock venues.

Eve exposes the typed discovery and refinement tools. The public app supports discovery and guided follow-ups. **Free-form Eve chat is currently disabled.** The earlier Beam model returned HTTP 403; its replacement passed a live tool-call check and an Eve evaluation. Deployed chat-fallback testing and account billing checks remain pending. No paid model fallback is configured.

## Testing and current limits

The [verification summary](tests/verification-summary.md) records automated checks, live Qloo requests, and desktop/mobile browser tests covering search, refinements, receipt verification, and results with no supported winner. These are recorded release checks, not a claim that every possible query has been tested.

The [relevance review](relevance-review.md) looks at a small set of venues and retrieval misses. There is no measured recommendation-accuracy percentage.

SceneSet recommends places. It does not verify opening hours, event schedules, ticket availability, or bookings. The earlier demo video has not been checked against the current refinement and receipt flow; use the live app and this walkthrough to assess those features.
