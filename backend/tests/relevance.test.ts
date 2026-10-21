import { describe, expect, it } from "vitest";
import { discoverCityPulse } from "../agent/lib/city-pulse";
import { refineCityPulse } from "../agent/lib/refinement";
import { verifyCityPulseReceipt } from "../agent/lib/receipt";
import { investigationBudgetError } from "../agent/lib/session";
import type { QlooProvider } from "../agent/lib/qloo";
import type { QlooEntity, QlooResult, QlooTagResult } from "../agent/lib/types";

function venue(id: string, name: string, description: string, extras: Record<string, unknown> = {}): QlooEntity {
  return { id, name, type: "urn:entity:place", affinity: 0.9, properties: { description, business_rating: 4.5, ...extras } };
}

class FixtureQloo implements QlooProvider {
  insightsCalls = 0;
  constructor(readonly byCity: Record<string, QlooEntity[]>, readonly fails = false) {}
  async search(): Promise<QlooResult> { throw new Error("unused"); }
  async searchTags(query: string): Promise<QlooTagResult> {
    if (this.fails) throw new Error("fixture provider unavailable");
    return { items: [{ id: "tag:scene", name: query, type: "urn:tag" }], evidence: { operation: "tags", requestHash: "fixture-tags", resultCount: 1 } };
  }
  async insights(input: Parameters<QlooProvider["insights"]>[0]): Promise<QlooResult> {
    this.insightsCalls++;
    return { items: this.byCity[input.location ?? ""] ?? [], evidence: { operation: "insights", requestHash: `fixture-${input.location}-${this.insightsCalls}`, resultCount: this.byCity[input.location ?? ""]?.length ?? 0 } };
  }
}

describe("cultural facets and refinements", () => {
  it("requires food and live music together, allowing live band but rejecting Pizza Hut", async () => {
    const qloo = new FixtureQloo({ Accra: [venue("pizza", "Pizza Hut", "Pizza restaurant"), venue("village", "Ghanaian Village", "Restaurant with a live band")], London: [venue("diner", "Diner", "Food and dining")] });
    const result = await discoverCityPulse(qloo, { query: "Food + live music", cities: ["Accra", "London"] }, "fixture");
    expect(result.status).toBe("COMPLETE");
    if (result.status !== "COMPLETE") return;
    expect(result.selectedCity).toBe("Accra");
    expect(result.comparisons[0].topPlaces.map((place) => place.id)).toEqual(["village"]);
    expect(result.comparisons[0].topPlaces[0].fit.evidence).toHaveLength(2);
  });

  it("requires both art and fashion, not an art gallery alone", async () => {
    const qloo = new FixtureQloo({ Lagos: [venue("gallery", "Art Gallery", "Gallery exhibits")], Accra: [venue("show", "Creative Hall", "Art exhibition and fashion designer showcase")] });
    const result = await discoverCityPulse(qloo, { query: "Art + fashion", cities: ["Lagos", "Accra"] }, "fixture");
    expect(result.status).toBe("COMPLETE");
    if (result.status !== "COMPLETE") return;
    expect(result.selectedCity).toBe("Accra");
    expect(result.comparisons.find((market) => market.city === "Lagos")?.qualifiedCount).toBe(0);
  });

  it("rejects unknown or over-limit prices and explicit no-live-music metadata", async () => {
    const qloo = new FixtureQloo({ Lagos: [venue("unknown", "Music Cafe", "Food and live music"), venue("expensive", "Music Hall", "Food and live music", { price_level: 4 }), venue("no-live", "No Live Cafe", "Food and live music", { price_level: 2, live_music: false })], Accra: [] });
    const result = await discoverCityPulse(qloo, { query: "Food + live music", cities: ["Lagos", "Accra"], constraints: { maxPriceLevel: 2 } }, "fixture");
    expect(result.status).toBe("COMPLETE");
    if (result.status !== "COMPLETE") return;
    expect(result.selectedCity).toBeNull();
    expect(result.comparisons.find((market) => market.city === "Lagos")?.qualifiedCount).toBe(0);
  });

  it("does not mistake a generic bar for late-night jazz or missing metadata for proof", async () => {
    const qloo = new FixtureQloo({ Lagos: [venue("bar", "Night Bar", "Late night drinks"), venue("blank", "Unknown", "")], London: [venue("jazz", "Jazz Cellar", "Live jazz music", { live_music: true })] });
    const result = await discoverCityPulse(qloo, { query: "Late-night jazz", cities: ["Lagos", "London"] }, "fixture");
    expect(result.status).toBe("COMPLETE");
    if (result.status !== "COMPLETE") return;
    expect(result.selectedCity).toBe("London");
    expect(result.comparisons.find((market) => market.city === "Lagos")?.qualifiedCount).toBe(0);
  });

  it("preserves no-winner and provider-failure states", async () => {
    const empty = await discoverCityPulse(new FixtureQloo({ Lagos: [], London: [] }), { query: "Afrobeats parties", cities: ["Lagos", "London"] }, "fixture");
    expect(empty.status).toBe("COMPLETE");
    if (empty.status === "COMPLETE") expect(empty.selectedCity).toBeNull();
    const failed = await discoverCityPulse(new FixtureQloo({}, true), { query: "Afrobeats parties", cities: ["Lagos", "London"] }, "fixture");
    expect(failed.status).toBe("BLOCKED_QLOO");
  });

  it("uses cached evidence for exclusions and explanation, fresh Qloo for changed signals", async () => {
    const qloo = new FixtureQloo({ Lagos: [venue("a", "Afrobeats Hall", "Afrobeats parties"), venue("b", "Afrobeats Club", "Afrobeats parties")], London: [] });
    const brief = { query: "Afrobeats parties", cities: ["Lagos", "London"] };
    const initial = await discoverCityPulse(qloo, brief, "fixture");
    if (initial.status !== "COMPLETE") throw new Error("fixture failed");
    const calls = qloo.insightsCalls;
    const explained = await refineCityPulse(qloo, { brief, result: initial, history: [] }, { action: "explain" });
    expect(explained.qlooCalled).toBe(false);
    const excluded = await refineCityPulse(qloo, { brief, result: initial, history: [] }, { action: "exclude", excludePlaceIds: ["a"] });
    expect(excluded.qlooCalled).toBe(false);
    expect(qloo.insightsCalls).toBe(calls);
    if (excluded.result.status === "COMPLETE") expect(excluded.result.comparisons[0].topPlaces.map((place) => place.id)).toEqual(["b"]);
    const fresh = await refineCityPulse(qloo, { brief, result: initial, history: [] }, { action: "refine", query: "Afrobeats" });
    expect(fresh.qlooCalled).toBe(true);
    expect(qloo.insightsCalls).toBeGreaterThan(calls);
    const mixed = await refineCityPulse(qloo, { brief, result: initial, history: [] }, { action: "refine", query: "Afrobeats", excludePlaceIds: ["a"] });
    expect(mixed.qlooCalled).toBe(true);
    if (mixed.result.status === "COMPLETE") expect(mixed.result.comparisons[0].topPlaces.map((place) => place.id)).not.toContain("a");
    const unknown = await refineCityPulse(qloo, { brief, result: initial, history: [] }, { action: "exclude", excludePlaceIds: ["not-in-shortlist"] });
    expect(unknown.changed[0]).toContain("No listed venue");
  });

  it("detects receipt tampering but does not claim provenance", async () => {
    const result = await discoverCityPulse(new FixtureQloo({ Lagos: [venue("a", "Afrobeats Hall", "Afrobeats parties")], London: [] }), { query: "Afrobeats parties", cities: ["Lagos", "London"] }, "fixture");
    if (result.status !== "COMPLETE") throw new Error("fixture failed");
    expect(result.receipt.schemaVersion).toBe("1.1");
    expect(verifyCityPulseReceipt(result.receipt)).toBe(true);
    const tampered = structuredClone(result.receipt);
    tampered.decision.city = "London";
    expect(verifyCityPulseReceipt(tampered)).toBe(false);
  });

  it("allows one investigation per turn and three per session", () => {
    expect(investigationBudgetError(0, undefined, "turn-1")).toBeNull();
    expect(investigationBudgetError(1, "turn-1", "turn-1")).toContain("one city investigation");
    expect(investigationBudgetError(2, "turn-2", "turn-3")).toBeNull();
    expect(investigationBudgetError(3, "turn-2", "turn-3")).toContain("three Qloo investigations");
  });
});
