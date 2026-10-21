import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveQlooClient, QlooHttpError } from "../agent/lib/qloo";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LiveQlooClient", () => {
  it("normalizes the live Qloo response shape and sends supported place filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: {
            entities: [
              {
                entity_id: "place-1",
                name: "Ofadaboy",
                subtype: "urn:entity:place:restaurant",
                properties: { business_rating: 4.6 },
                query: {
                  affinity: 0.82,
                  explainability: { signals: ["artist-1"] },
                },
              },
            ],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new LiveQlooClient("secret", { baseUrl: "https://example.test" });
    const result = await client.insights({
      type: "place",
      entityIds: ["artist-1"],
      requiredTagIds: ["urn:tag:good_for:qloo:afrobeat_parties"],
      location: "Lagos",
      constraints: { maxPriceLevel: 3, minRating: 4 },
      take: 3,
    });

    expect(result.items[0]).toMatchObject({
      id: "place-1",
      name: "Ofadaboy",
      type: "urn:entity:place:restaurant",
      affinity: 0.82,
      explainability: { signals: ["artist-1"] },
    });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("filter.location.query")).toBe("Lagos");
    expect(url.searchParams.get("filter.price_level.max")).toBe("3");
    expect(url.searchParams.get("filter.properties.business_rating.min")).toBe("4");
    expect(url.searchParams.get("filter.tags")).toBe("urn:tag:good_for:qloo:afrobeat_parties");
    expect(url.searchParams.has("filter.rating.min")).toBe(false);
  });

  it("does not retry permanent client errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("bad request", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new LiveQlooClient("secret", { baseUrl: "https://example.test" });
    await expect(client.search("Burna Boy", "artist")).rejects.toBeInstanceOf(QlooHttpError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolves free-text intent through the tags endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        results: {
          tags: [
            {
              tag_id: "urn:tag:good_for:qloo:afrobeat_parties",
              name: "Afrobeat Parties",
              type: "urn:tag:good_for:qloo",
            },
          ],
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new LiveQlooClient("secret", { baseUrl: "https://example.test" });
    const result = await client.searchTags("Afrobeats party");

    expect(result.items[0]).toEqual({
      id: "urn:tag:good_for:qloo:afrobeat_parties",
      name: "Afrobeat Parties",
      type: "urn:tag:good_for:qloo",
    });
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/v2/tags");
    expect(url.searchParams.get("filter.query")).toBe("Afrobeats party");
  });
});
