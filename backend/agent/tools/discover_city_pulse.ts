import { defineTool } from "eve/tools";
import { z } from "zod";
import { discoverCityPulse } from "../lib/city-pulse";
import { LiveQlooClient } from "../lib/qloo";

const inputSchema = z.object({
  query: z.string().trim().min(2).max(120),
  cities: z.array(z.string().trim().min(2).max(120)).min(2).max(5),
  constraints: z
    .object({
      maxPriceLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
      minRating: z.number().min(0).max(5).optional(),
      takePerMarket: z.number().int().min(3).max(12).optional(),
    })
    .optional(),
});

export default defineTool({
  description:
    "Resolve a free-text cultural intent through Qloo tags, compare real places across selected cities, and return a tamper-evident city-pulse receipt. Results are place recommendations, not verified scheduled events or ticket listings.",
  inputSchema,
  label: {
    start: ({ query, cities }) => `Search ${cities.join(", ")} for ${query}`,
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
    return discoverCityPulse(
      new LiveQlooClient(apiKey, { baseUrl: process.env.QLOO_API_BASE_URL }),
      input,
      "live",
    );
  },
});
