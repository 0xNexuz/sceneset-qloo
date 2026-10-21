import { describe, expect, it } from "vitest";
import { discoverCityPulse } from "../agent/lib/city-pulse";
import type { QlooProvider } from "../agent/lib/qloo";
import { verifyCityPulseReceipt } from "../agent/lib/receipt";
import type { QlooEntity, QlooResult, QlooTagResult } from "../agent/lib/types";

function place(id: string, name: string, affinity: number, description: string, rating = 4.5): QlooEntity {
  return { id, name, type: "urn:entity:place", affinity, properties: { description, business_rating: rating, address: `${name} street` } };
}

class PulseQloo implements QlooProvider {
  calls: Array<Parameters<QlooProvider["insights"]>[0]> = [];
  tagCalls: string[] = [];
  async search(): Promise<QlooResult> { throw new Error("not used"); }
  async searchTags(query: string): Promise<QlooTagResult> {
    this.tagCalls.push(query);
    return {
      items: [
        { id: "tag:party", name: "Afrobeat Parties", type: "urn:tag:good_for:qloo" },
        { id: "tag:private", name: "Private Parties", type: "urn:tag:good_for:qloo" },
      ],
      evidence: { operation: "tags", requestHash: `tags-${query}`, resultCount: 2 },
    };
  }
  async insights(input: Parameters<QlooProvider["insights"]>[0]): Promise<QlooResult> {
    this.calls.push(input);
    const items = input.location === "Lagos"
      ? [place("lagos-1", "The Musical Village", 0.70, "Event venue for concerts and Afrobeats parties"), place("lagos-2", "Canyon", 0.65, "Event venue for concerts")]
      : input.location === "London"
        ? [place("london-1", "The Farmers Mistress", 0.95, "Brunch restaurant"), place("london-2", "Imperial Arms", 0.91, "Gastropub with Sunday roast")]
        : [place("accra-1", "Pizza Hut", 0.90, "Pizza restaurant"), place("accra-2", "Accra Stage", 0.64, "Event venue for live music", 3.1)];
    return { items, evidence: { operation: "insights", requestHash: `places-${input.location}-${Boolean(input.requiredTagIds)}`, resultCount: items.length } };
  }
}

describe("discoverCityPulse", () => {
  it("rejects culturally unsupported high-affinity London places and under-rated venues", async () => {
    const provider = new PulseQloo();
    const result = await discoverCityPulse(provider, { query: "Afrobeats parties", cities: ["London", "Lagos", "Accra"], constraints: { minRating: 4 } }, "fixture");
    expect(result.status).toBe("COMPLETE");
    if (result.status !== "COMPLETE") return;
    expect(result.selectedCity).toBe("Lagos");
    expect(result.intent.tags.map((tag) => tag.id)).not.toContain("tag:private");
    expect(result.comparisons.find((city) => city.city === "London")?.qualifiedCount).toBe(0);
    expect(result.comparisons.find((city) => city.city === "Accra")?.qualifiedCount).toBe(0);
    expect(result.confidence.level).toBe("medium");
    expect(result.refinement.attempted).toBe(false);
    expect(result.receipt.providerCalls).toHaveLength(4);
    expect(verifyCityPulseReceipt(result.receipt)).toBe(true);
  });

  it("retries weak results using a focused required Qloo tag and preserves low confidence", async () => {
    const provider = new PulseQloo();
    const result = await discoverCityPulse(provider, { query: "Afrobeats parties", cities: ["London", "Accra"] }, "fixture");
    expect(result.status).toBe("COMPLETE");
    if (result.status !== "COMPLETE") return;
    expect(result.refinement.attempted).toBe(true);
    expect(result.refinement.additionalCalls).toBe(3);
    expect(provider.tagCalls).toEqual(["Afrobeats parties", "afrobeat"]);
    expect(provider.calls.filter((call) => call.requiredTagIds?.length)).toHaveLength(2);
    expect(result.confidence.level).toBe("low");
    expect(result.selectedCity).toBeNull();
    expect(result.confidence.summary).toContain("No city");
    expect(verifyCityPulseReceipt(result.receipt)).toBe(true);
  });

  it("rejects a one-city comparison", async () => {
    const result = await discoverCityPulse(new PulseQloo(), { query: "late-night jazz", cities: ["Lagos"] }, "fixture");
    expect(result.status).toBe("NEEDS_INPUT");
  });
});
