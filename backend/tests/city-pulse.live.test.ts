import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverCityPulse } from "../agent/lib/city-pulse";
import { LiveQlooClient, type QlooProvider } from "../agent/lib/qloo";
import { verifyCityPulseReceipt } from "../agent/lib/receipt";

const runLive = process.env.QLOO_LIVE_TEST === "1";

describe.skipIf(!runLive)("Qloo live city pulse", () => {
  it("resolves free-text intent and ranks real places", async () => {
    const apiKey = process.env.QLOO_API_KEY;
    expect(apiKey, "QLOO_API_KEY must be configured").toBeTruthy();
    const client = new LiveQlooClient(apiKey!, { baseUrl: process.env.QLOO_API_BASE_URL });
    const observedCandidates: unknown[] = [];
    const provider: QlooProvider = {
      search: (name, type) => client.search(name, type),
      searchTags: (query, take) => client.searchTags(query, take),
      insights: async (input) => {
        const response = await client.insights(input);
        observedCandidates.push({
          city: input.location,
          focusedRetry: Boolean(input.requiredTagIds?.length),
          places: response.items.map(({ name, type, affinity, properties }) => {
            const metadata = JSON.stringify({ name, type, properties });
            const genre = properties.primary_genre;
            const description = properties.short_description ?? properties.description ?? properties.overall_description;
            return { name, type, affinity, rating: properties.business_rating,
              genre: typeof genre === "string" ? genre : typeof genre === "object" && genre !== null && "name" in genre ? genre.name : undefined,
              descriptionSnippet: typeof description === "string" ? description.slice(0, 120) : undefined,
              afroMention: /afro[\s-]*beats?/i.test(metadata),
              partyMention: /part(y|ies)|nightclub|dance floor|dj set/i.test(metadata),
              liveMusic: properties.live_music === true,
            };
          }),
        });
        return response;
      },
    };
    const result = await discoverCityPulse(provider, {
      query: "Afrobeats parties",
      cities: ["Lagos", "Accra", "London"],
      constraints: { minRating: 4, takePerMarket: 6 },
    }, "live");

    if (result.status !== "COMPLETE") throw new Error(`${result.status}: ${result.reason}`);
    expect(result.status).toBe("COMPLETE");
    expect(result.intent.tags.length).toBeGreaterThan(0);
    expect(result.receipt.providerCalls.length).toBeGreaterThanOrEqual(4);
    expect(result.comparisons.every(({ candidateCount }) => candidateCount > 0)).toBe(true);
    expect(verifyCityPulseReceipt(result.receipt)).toBe(true);

    const evidence = {
      generatedAt: new Date().toISOString(),
      provider: new URL(process.env.QLOO_API_BASE_URL ?? "https://hackathon.api.qloo.com").host,
      query: result.intent.query,
      resolvedTags: result.intent.tags,
      selectedCity: result.selectedCity,
      comparisons: result.comparisons.map((market) => ({
        city: market.city,
        score: market.score,
        candidateCount: market.candidateCount,
        topPlaces: market.topPlaces.map(({ id, name, affinity }) => ({ id, name, affinity })),
      })),
      receipt: {
        hash: result.receipt.integrity.hash,
        verified: verifyCityPulseReceipt(result.receipt),
        providerCallCount: result.receipt.providerCalls.length,
      },
      observedCandidates,
    };
    const evidenceDir = resolve(import.meta.dirname, "../../evidence/qloo");
    await mkdir(evidenceDir, { recursive: true });
    await writeFile(resolve(evidenceDir, "live-city-pulse.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  }, 180_000);
});
