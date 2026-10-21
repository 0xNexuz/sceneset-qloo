import assert from "node:assert/strict";
import { createHash } from "node:crypto";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)]));
  return value;
}

const brief = { query: "Afrobeats parties", cities: ["Lagos", "London"] };
const place = { id: "fixture:one", name: "Afrobeats Hall", type: "urn:entity:place", affinity: .8, properties: {}, fit: { level: "direct", reason: "Afrobeats and parties mentioned." }, venue: { category: "event venue" } };
const comparisons = [
  { city: "Lagos", score: 3, candidateCount: 1, qualifiedCount: 1, directMatchCount: 1, rejectedCount: 0, topPlaces: [place], explanation: "One direct venue." },
  { city: "London", score: 0, candidateCount: 0, qualifiedCount: 0, directMatchCount: 0, rejectedCount: 0, topPlaces: [], explanation: "No venue." },
];
const confidence = { level: "medium", summary: "Lagos leads.", reasons: ["One direct venue."] };
const payload = { schemaVersion: "1.1", createdAt: "2026-10-21T00:00:00.000Z", executionMode: "fixture", scorerVersion: "cultural-evidence-v2.1", inputs: brief,
  resolvedTags: [], providerCalls: [], comparisons: comparisons.map(({ topPlaces, ...market }) => ({ ...market, topPlaceIds: topPlaces.map((venue) => venue.id) })), refinement: { attempted: false, additionalCalls: 0 }, confidence,
  decision: { city: "Lagos", placeIds: [place.id] }, limitations: [], refinementHistory: [{ query: brief.query, cities: brief.cities, changed: ["initial discovery"], qlooCalled: true }], evidenceSummaries: [] };
const hash = createHash("sha256").update(JSON.stringify(canonicalize(payload))).digest("hex");
const prior = { status: "COMPLETE", executionMode: "fixture", selectedCity: "Lagos", intent: { query: brief.query, tags: [] }, comparisons, confidence,
  refinement: payload.refinement, receipt: { ...payload, integrity: { algorithm: "sha256", hash } } };

async function call(body) {
  const response = await fetch("http://127.0.0.1:2000/api/refine-city-pulse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

const explained = await call({ prior, request: { action: "explain" } });
assert.equal(explained.status, 200, JSON.stringify(explained.body));
assert.equal(explained.body.qlooCalled, false);
assert.equal(explained.body.result.status, "COMPLETE");
const excluded = await call({ prior, request: { action: "exclude", excludePlaceIds: [place.id] } });
assert.equal(excluded.status, 200, JSON.stringify(excluded.body));
assert.equal(excluded.body.result.selectedCity, null);
assert.equal(excluded.body.result.comparisons[0].topPlaces.length, 0);
const tampered = structuredClone(prior);
tampered.receipt.decision.city = "London";
const rejected = await call({ prior: tampered, request: { action: "explain" } });
assert.equal(rejected.status, 400);
console.log("Local cached refinement route passed (explain, exclude, tamper rejection)");
