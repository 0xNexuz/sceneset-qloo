import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverCityPulse } from "../agent/lib/city-pulse";
import { LiveQlooClient } from "../agent/lib/qloo";
import { verifyCityPulseReceipt } from "../agent/lib/receipt";

const runLive = process.env.QLOO_LIVE_TEST === "1";

describe.skipIf(!runLive)("Qloo live suggested-search matrix", () => {
  it("records honest outcomes for the other suggested scenes", async () => {
    const apiKey = process.env.QLOO_API_KEY;
    expect(apiKey, "QLOO_API_KEY must be configured").toBeTruthy();
    const provider = new LiveQlooClient(apiKey!, { baseUrl: process.env.QLOO_API_BASE_URL });
    const cases = [
      { query: "Late-night jazz", cities: ["Lagos", "London"] },
      { query: "Food + live music", cities: ["Lagos", "Accra"] },
      { query: "Art + fashion", cities: ["Lagos", "London"] },
    ];
    const observations = [];
    for (const entry of cases) {
      const result = await discoverCityPulse(provider, { ...entry, constraints: { minRating: 4, takePerMarket: 4 } }, "live");
      expect(result.status).toBe("COMPLETE");
      if (result.status !== "COMPLETE") continue;
      expect(verifyCityPulseReceipt(result.receipt)).toBe(true);
      observations.push({ query: entry.query, cities: entry.cities, selectedCity: result.selectedCity,
        confidence: result.confidence.level, resolvedTags: result.intent.tags.map(({ id, name }) => ({ id, name })),
        comparisons: result.comparisons.map(({ city, candidateCount, qualifiedCount, directMatchCount, score, topPlaces }) => ({
          city, candidateCount, qualifiedCount, directMatchCount, score,
          topPlaces: topPlaces.map(({ name, fit }) => ({ name, fit: fit.level })),
        })), providerCallCount: result.receipt.providerCalls.length });
    }
    const evidenceDir = resolve(import.meta.dirname, "../../evidence/qloo");
    await mkdir(evidenceDir, { recursive: true });
    await writeFile(resolve(evidenceDir, "live-suggested-searches.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), observations }, null, 2)}\n`, "utf8");
  }, 240_000);
});
