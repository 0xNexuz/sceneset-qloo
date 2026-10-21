import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { verifyReceiptInBrowser } from "./receipt.js";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)]));
  return value;
}

function receipt(version) {
  const payload = { schemaVersion: version, decision: { city: "Lagos", placeIds: ["qloo:one"] }, inputs: { query: "Afrobeats parties", cities: ["Lagos", "London"] } };
  if (version === "1.1") payload.refinementHistory = [{ query: "Afrobeats parties", cities: ["Lagos", "London"], changed: ["initial discovery"], qlooCalled: true }];
  const hash = createHash("sha256").update(JSON.stringify(canonicalize(payload))).digest("hex");
  return { ...payload, integrity: { algorithm: "sha256", hash } };
}

test("verifies existing 1.0 and new 1.1 embedded hashes", async () => {
  assert.equal(await verifyReceiptInBrowser(receipt("1.0")), true);
  assert.equal(await verifyReceiptInBrowser(receipt("1.1")), true);
});

test("reports mismatch after decision or history tampering", async () => {
  const changed = receipt("1.1");
  changed.decision.city = "London";
  assert.equal(await verifyReceiptInBrowser(changed), false);
  const changedHistory = receipt("1.1");
  changedHistory.refinementHistory[0].qlooCalled = false;
  assert.equal(await verifyReceiptInBrowser(changedHistory), false);
});
