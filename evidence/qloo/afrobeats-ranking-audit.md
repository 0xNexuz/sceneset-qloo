# Afrobeats ranking audit

The earlier credentialed `Afrobeats parties` run compared Lagos, Accra, and London using separate location-filtered Qloo Insights calls and the mean affinity of the top three results. It ranked London first (0.848), ahead of Lagos and Accra (both 0.765). This was **not sufficient evidence** that London was culturally the best match.

The London shortlist included Imperial Arms Pub & Courtyard Bistro, The Farmers Mistress, Gipsy Queen, and Chapter One. Their returned descriptions indicated a gastropub, brunch restaurant, pub, and Modern European restaurant. None of the inspected metadata established an Afrobeats party. Accra's list included Pizza Hut-East Legon; Lagos included an event venue and also hotels. One Lagos hotel had a returned business rating of 1 despite the request's 4.0 minimum, demonstrating that client-side constraint validation was necessary.

The old scorer rewarded high-affinity generic places and compared affinity values from different location queries. Qloo's [affinity guidance](https://github.com/qloo/docs-public/blob/main/docs/interpreting-affinity-scores.md) describes scores as query-context normalized, so that cross-query numerical comparison was not justified. The repeated Lagos/Accra score was observed but its upstream cause was not established.

The current scorer uses Qloo affinity only to order qualified places *within* a city. It excludes places without cultural or relevant setting evidence and applies rating/closure/price checks locally. It gives more weight to an explicit cultural mention than to a venue lead, retries with a focused required Qloo tag when no direct match appears, and displays low confidence when programming remains unverified. A suitable event venue is still not proof of a scheduled Afrobeats event; users should confirm current programming with the venue.

After deploying the revision, a production request for the same query with a 4.0 minimum rating returned eight sealed Qloo calls (initial search plus focused retry). Lagos led with two qualified event-venue leads, The Musical Village and The Canyon Lekki Halls & Event Centre. Accra and London each had zero qualified places. The result correctly reported **low confidence** and zero direct Afrobeats mentions across the shortlisted places. This validates the filtering and explanation behavior, not any current event schedule.

The historical JSON beside this audit remains a record of the old behavior, not proof of the revised ranking.
