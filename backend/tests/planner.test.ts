import { describe, expect, it } from "vitest";
import { planScene } from "../agent/lib/planner";
import type { QlooProvider } from "../agent/lib/qloo";
import { verifyReceipt } from "../agent/lib/receipt";
import type { EntityType, QlooEntity, QlooResult, QlooTagResult } from "../agent/lib/types";

function entity(id: string, name: string, type: string, affinity: number | null): QlooEntity {
  return { id, name, type, affinity, properties: {} };
}

class FakeQloo implements QlooProvider {
  private call = 0;

  private result(items: QlooEntity[], operation: "search" | "insights"): QlooResult {
    this.call += 1;
    return {
      items,
      evidence: {
        operation,
        requestHash: `hash-${this.call}`,
        resultCount: items.length,
      },
    };
  }

  async search(name: string, type: EntityType): Promise<QlooResult> {
    return this.result([entity(`${type}:${name}`, name, type, 1)], "search");
  }

  async searchTags(query: string): Promise<QlooTagResult> {
    return {
      items: [{ id: `tag:${query}`, name: query, type: "urn:tag:keyword" }],
      evidence: { operation: "tags", requestHash: "tag-hash", resultCount: 1 },
    };
  }

  async insights(input: Parameters<QlooProvider["insights"]>[0]): Promise<QlooResult> {
    if (input.type === "place" && input.location === "Lagos") {
      return this.result(
        [
          entity("place:1", "Freedom Park", "place", 0.93),
          entity("place:2", "Bogobiri House", "place", 0.89),
          entity("place:3", "Terra Kulture", "place", 0.86),
        ],
        "insights",
      );
    }
    if (input.type === "place") {
      return this.result(
        [
          entity("place:4", "Other One", "place", 0.61),
          entity("place:5", "Other Two", "place", 0.58),
          entity("place:6", "Other Three", "place", 0.55),
        ],
        "insights",
      );
    }
    if (input.type === "artist") {
      return this.result([entity("artist:2", "Support Artist", "artist", 0.82)], "insights");
    }
    return this.result([entity("brand:1", "Partner Brand", "brand", 0.78)], "insights");
  }
}

const brief = {
  artist: "Burna Boy",
  anchors: [
    { name: "Moonlight", type: "movie" as const },
    { name: "Nike", type: "brand" as const },
  ],
  cities: ["Accra", "Lagos"],
  constraints: { maxPriceLevel: 3 as const, minRating: 4 },
};

describe("planScene", () => {
  it("selects the strongest market and emits a verifiable receipt", async () => {
    const result = await planScene(new FakeQloo(), brief, "fixture");
    expect(result.status).toBe("COMPLETE");
    if (result.status !== "COMPLETE") return;

    expect(result.selectedCity).toBe("Lagos");
    expect(result.scene.places[0]?.name).toBe("Freedom Park");
    expect(result.receipt.providerCalls).toHaveLength(7);
    expect(verifyReceipt(result.receipt)).toBe(true);
  });

  it("detects receipt mutation", async () => {
    const result = await planScene(new FakeQloo(), brief, "fixture");
    if (result.status !== "COMPLETE") throw new Error("expected complete plan");
    result.receipt.decision.city = "Tampered City";
    expect(verifyReceipt(result.receipt)).toBe(false);
  });

  it("rejects underspecified briefs before calling Qloo", async () => {
    const result = await planScene(
      new FakeQloo(),
      { artist: "", anchors: [], cities: ["Lagos"] },
      "fixture",
    );
    expect(result.status).toBe("NEEDS_INPUT");
  });
});

