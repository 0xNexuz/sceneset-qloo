import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { planScene } from "../agent/lib/planner";
import { LiveQlooClient } from "../agent/lib/qloo";
import { verifyReceipt } from "../agent/lib/receipt";

const runLive = process.env.QLOO_LIVE_TEST === "1";

describe.skipIf(!runLive)("Qloo live integration", () => {
  it(
    "produces a verified city plan from the hackathon API",
    async () => {
      const apiKey = process.env.QLOO_API_KEY;
      expect(apiKey, "QLOO_API_KEY must be configured").toBeTruthy();

      const provider = new LiveQlooClient(apiKey!, {
        baseUrl: process.env.QLOO_API_BASE_URL,
      });
      const result = await planScene(
        provider,
        {
          artist: "Burna Boy",
          anchors: [
            { name: "Moonlight", type: "movie" },
            { name: "Nike", type: "brand" },
          ],
          cities: ["Lagos", "Accra"],
          constraints: { maxPriceLevel: 3, minRating: 4, takePerMarket: 4 },
        },
        "live",
      );

      expect(result.status).toBe("COMPLETE");
      if (result.status !== "COMPLETE") {
        throw new Error(`${result.status}: ${result.reason}`);
      }

      expect(result.receipt.providerCalls).toHaveLength(7);
      expect(result.comparisons.every(({ candidateCount }) => candidateCount > 0)).toBe(true);
      expect(result.comparisons.flatMap(({ topPlaces }) => topPlaces).some(({ affinity }) => affinity !== null)).toBe(true);
      expect(verifyReceipt(result.receipt)).toBe(true);

      const evidence = {
        generatedAt: new Date().toISOString(),
        provider: new URL(process.env.QLOO_API_BASE_URL ?? "https://hackathon.api.qloo.com").host,
        status: result.status,
        selectedCity: result.selectedCity,
        comparisons: result.comparisons.map((market) => ({
          city: market.city,
          score: market.score,
          candidateCount: market.candidateCount,
          topPlaces: market.topPlaces.map((place) => ({
            id: place.id,
            name: place.name,
            affinity: place.affinity,
            hasExplainability: place.explainability !== undefined,
          })),
        })),
        scene: {
          artists: result.scene.artists.map(({ id, name, affinity }) => ({ id, name, affinity })),
          brands: result.scene.brands.map(({ id, name, affinity }) => ({ id, name, affinity })),
        },
        receipt: {
          hash: result.receipt.integrity.hash,
          verified: verifyReceipt(result.receipt),
          providerCallCount: result.receipt.providerCalls.length,
          providerCalls: result.receipt.providerCalls,
        },
      };

      const evidenceDir = resolve(import.meta.dirname, "../../evidence/qloo");
      await mkdir(evidenceDir, { recursive: true });
      await writeFile(
        resolve(evidenceDir, "live-plan.json"),
        `${JSON.stringify(evidence, null, 2)}\n`,
        "utf8",
      );
    },
    180_000,
  );
});
