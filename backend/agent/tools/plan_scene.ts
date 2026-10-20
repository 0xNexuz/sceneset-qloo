import { defineTool } from "eve/tools";
import { z } from "zod";
import { LiveQlooClient } from "../lib/qloo";
import { planScene } from "../lib/planner";
import { entityTypes } from "../lib/types";

const inputSchema = z.object({
  artist: z.string().trim().min(1).max(120),
  anchors: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        type: z.enum(entityTypes),
      }),
    )
    .min(1)
    .max(3),
  cities: z.array(z.string().trim().min(2).max(120)).min(2).max(3),
  constraints: z
    .object({
      maxPriceLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
      minRating: z.number().min(0).max(5).optional(),
      takePerMarket: z.number().int().min(3).max(12).optional(),
    })
    .optional(),
});

const executionModeSchema = z.enum(["live", "fixture", "replay"]);
const entitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  affinity: z.number().nullable(),
  properties: z.record(z.string(), z.unknown()),
  explainability: z.unknown().optional(),
});
const comparisonSchema = z.object({
  city: z.string(),
  score: z.number(),
  candidateCount: z.number(),
  topPlaces: z.array(entitySchema),
});
const evidenceSchema = z.object({
  operation: z.enum(["search", "tags", "insights"]),
  requestHash: z.string(),
  requestId: z.string().optional(),
  resultCount: z.number(),
});
const receiptSchema = z.object({
  schemaVersion: z.literal("1.0"),
  createdAt: z.string(),
  executionMode: executionModeSchema,
  scorerVersion: z.literal("market-affinity-v1"),
  inputs: inputSchema,
  resolvedAnchors: z.array(entitySchema),
  providerCalls: z.array(evidenceSchema),
  comparisons: z.array(
    z.object({
      city: z.string(),
      score: z.number(),
      candidateCount: z.number(),
      topPlaceIds: z.array(z.string()),
    }),
  ),
  decision: z.object({
    city: z.string(),
    placeIds: z.array(z.string()),
    artistIds: z.array(z.string()),
    brandIds: z.array(z.string()),
  }),
  limitations: z.array(z.string()),
  integrity: z.object({ algorithm: z.literal("sha256"), hash: z.string() }),
});
const outputSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("COMPLETE"),
    executionMode: executionModeSchema,
    selectedCity: z.string(),
    comparisons: z.array(comparisonSchema),
    scene: z.object({
      places: z.array(entitySchema),
      artists: z.array(entitySchema),
      brands: z.array(entitySchema),
    }),
    receipt: receiptSchema,
  }),
  z.object({
    status: z.enum(["NEEDS_INPUT", "NO_VALID_PLAN", "BLOCKED_QLOO"]),
    executionMode: executionModeSchema,
    reason: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
]);

export default defineTool({
  description:
    "Compare two or three candidate cities using live Qloo cultural affinity, compose a local scene, and return a tamper-evident Taste Receipt. This does not verify availability, booking, attendance, or revenue.",
  inputSchema,
  outputSchema,
  label: {
    start: ({ artist, cities }) => `Compare ${cities.join(", ")} for ${artist}`,
    complete: (_input, output) =>
      output.status === "COMPLETE"
        ? `Scene ready for ${output.selectedCity}`
        : `Scene planning stopped: ${output.status}`,
  },
  async execute(input) {
    const apiKey = process.env.QLOO_API_KEY?.trim();
    if (!apiKey) {
      return {
        status: "BLOCKED_QLOO" as const,
        executionMode: "live" as const,
        reason: "QLOO_API_KEY is not configured on the server.",
      };
    }

    const provider = new LiveQlooClient(apiKey, {
      baseUrl: process.env.QLOO_API_BASE_URL,
    });
    return planScene(provider, input, "live");
  },
  toModelOutput(output) {
    if (output.status !== "COMPLETE") {
      return { type: "json", value: output };
    }

    return {
      type: "json",
      value: {
        status: output.status,
        selectedCity: output.selectedCity,
        comparisons: output.comparisons.map(({ city, score, candidateCount }) => ({
          city,
          score,
          candidateCount,
        })),
        scene: {
          places: output.scene.places.map(({ id, name, affinity }) => ({ id, name, affinity })),
          artists: output.scene.artists.map(({ id, name, affinity }) => ({ id, name, affinity })),
          brands: output.scene.brands.map(({ id, name, affinity }) => ({ id, name, affinity })),
        },
        receiptHash: output.receipt.integrity.hash,
        limitations: output.receipt.limitations,
      },
    };
  },
});

