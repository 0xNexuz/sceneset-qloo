import { describe, expect, it } from "vitest";
import { discoverCityPulse } from "../agent/lib/city-pulse";
import type { QlooProvider } from "../agent/lib/qloo";
import { verifyCityPulseReceipt } from "../agent/lib/receipt";
import type { EntityType, QlooEntity, QlooResult, QlooTagResult } from "../agent/lib/types";

function place(id: string, name: string, affinity: number): QlooEntity {
  return { id, name, type: "urn:entity:place", affinity, properties: {} };
}

class PulseQloo implements QlooProvider {
  async search(): Promise<QlooResult> {
    throw new Error("not used");
  }

  async searchTags(): Promise<QlooTagResult> {
    return {
      items: [
        { id: "tag:genre", name: "Afrobeats", type: "urn:tag:genre:music" },
        { id: "tag:party", name: "Afrobeat Parties", type: "urn:tag:good_for:qloo" },
      ],
      evidence: { operation: "tags", requestHash: "tags-1", resultCount: 2 },
    };
  }

  async insights(input: Parameters<QlooProvider["insights"]>[0]): Promise<QlooResult> {
    const items = input.location === "Lagos"
      ? [place("lagos-1", "Royal Lounge", 0.91), place("lagos-2", "The Village", 0.88), place("lagos-3", "Canyon", 0.86)]
      : [place("accra-1", "Pulse Room", 0.72), place("accra-2", "Night Yard", 0.69), place("accra-3", "The Deck", 0.65)];
    return {
      items,
      evidence: { operation: "insights", requestHash: `places-${input.location}`, resultCount: items.length },
    };
  }
}

describe("discoverCityPulse", () => {
  it("selects the strongest city from resolved Qloo taste tags", async () => {
    const result = await discoverCityPulse(
      new PulseQloo(),
      { query: "Afrobeats party", cities: ["Lagos", "Accra"] },
      "fixture",
    );

    expect(result.status).toBe("COMPLETE");
    if (result.status !== "COMPLETE") return;
    expect(result.selectedCity).toBe("Lagos");
    expect(result.intent.tags[0]?.id).toBe("tag:party");
    expect(result.receipt.providerCalls).toHaveLength(3);
    expect(verifyCityPulseReceipt(result.receipt)).toBe(true);
  });

  it("rejects a one-city comparison", async () => {
    const result = await discoverCityPulse(
      new PulseQloo(),
      { query: "late-night jazz", cities: ["Lagos"] },
      "fixture",
    );
    expect(result.status).toBe("NEEDS_INPUT");
  });
});
