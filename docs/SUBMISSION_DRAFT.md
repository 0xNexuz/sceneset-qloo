# SceneSet — Devpost submission draft

## Tagline

Search the culture. Find the city. Prove the recommendation.

## Inspiration

City discovery usually begins with popularity lists, demographics, or whatever a model remembers. Those answers are broad, hard to audit, and often culturally interchangeable. We wanted a system that begins with taste: the scene someone actually wants, the cities they can reach, and evidence for why one market fits better than another.

## What it does

SceneSet turns a free-text cultural search—such as “Afrobeats parties,” “late-night jazz,” or “food + live music”—into a ranked city shortlist. Users choose two to five cities. SceneSet resolves the search to Qloo taste tags, queries Qloo place insights in every city, scores each market with the same deterministic rule, and recommends the strongest cultural fit. Every completed run generates a SHA-256 Taste Receipt with resolved tags, request fingerprints, candidates, scores, limitations, and the selected city.

SceneSet is precise about scope: these are Qloo-grounded place recommendations, not a calendar of scheduled events. It never invents opening hours, ticket inventory, or availability.

## How we built it

The frontend is React and Vite. The visual language blends only two supplied references: a teal-and-gold technical blueprint character and a moonlit pixel-art monolith landscape. The backend is an Eve agent app written in TypeScript. Its custom channel exposes a structured route that directly invokes a typed discovery tool. The tool calls Qloo Tags, sends the resolved tag IDs into Qloo Insights for each city, normalizes results, and scores the top three affinities. A canonical serializer and SHA-256 seal make each Taste Receipt tamper-evident.

The public API applies input-size and request-rate limits. Secrets stay server-side, provider failures fail closed, and fixtures are never presented as live results.

## Challenges

The most important challenge was honesty. Qloo provides powerful taste and place intelligence, but it is not an event-calendar or ticketing API. We designed the product and copy around that boundary instead of fabricating event dates. We also normalized several valid Qloo response shapes while preserving provider IDs, affinities, and request evidence.

## Accomplishments

- Free-text search rather than a fixed artist demo.
- Multi-city Qloo comparison using real taste tags and place insights.
- Deterministic ranking outside the language model.
- Tamper-evident receipts and explicit execution modes.
- Eight passing deterministic tests plus a credentialed live Qloo integration test.
- Responsive, animated interface with accessible controls and reduced-motion support.

## What we learned

Agentic systems become more useful when the model does less hidden deciding. Qloo supplies cultural relationships, deterministic code enforces policy, and the UI exposes the evidence. That division makes recommendations easier to trust and easier to challenge.

## What's next

Next we would add an independent calendar/ticketing provider to verify scheduled events, dates, and inventory; venue opening-hours verification; saved shortlists; and a promoter workflow for comparing neighborhoods and nights. The Taste Receipt format can also become a reusable SDK for other Qloo-powered decisions.

## Built with

Qloo Tags API, Qloo Insights API, Eve, TypeScript, React, Vite, Vitest, Vercel.
