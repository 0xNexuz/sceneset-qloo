import assert from "node:assert/strict";

const endpoint = "http://127.0.0.1:2000/api/city-pulse";
const headers = { "content-type": "application/json" };
const invalidJson = await fetch(endpoint, { method: "POST", headers, body: "{" });
assert.equal(invalidJson.status, 400);
const oversized = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ query: "x".repeat(8_300), cities: ["Lagos", "London"] }) });
assert.equal(oversized.status, 413);
const invalidBrief = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ query: "Afrobeats", cities: ["Lagos"] }) });
assert.equal(invalidBrief.status, 400);
console.log("Local API input guards passed (invalid JSON, oversized body, invalid brief)");
