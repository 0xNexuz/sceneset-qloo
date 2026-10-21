import { defineTool } from "eve/tools";
import { z } from "zod";
import { discoverCityPulse } from "../lib/city-pulse";
import { LiveQlooClient } from "../lib/qloo";
import { reserveInvestigation, sceneSession } from "../lib/session";

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
  async execute(input, ctx) {
    const budgetError = reserveInvestigation(ctx.session.turn.id);
    if (budgetError) return { status: "NEEDS_INPUT" as const, executionMode: "live" as const, reason: budgetError };
    const apiKey = process.env.QLOO_API_KEY?.trim();
    if (!apiKey) {
      return {
        status: "BLOCKED_QLOO" as const,
        executionMode: "live" as const,
        reason: "QLOO_API_KEY is not configured on the server.",
      };
    }
    const result = await discoverCityPulse(
      new LiveQlooClient(apiKey, { baseUrl: process.env.QLOO_API_BASE_URL }),
      input,
      "live",
    );
    if (result.status === "COMPLETE") sceneSession.update((state) => ({
      ...state, originalBrief: state.originalBrief ?? input, currentBrief: input,
      latestResult: result, history: result.receipt.refinementHistory ?? [],
    }));
    return result;
  },
});
