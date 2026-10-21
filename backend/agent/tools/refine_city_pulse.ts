import { defineTool } from "eve/tools";
import { z } from "zod";
import { LiveQlooClient } from "../lib/qloo";
import { refineCityPulse } from "../lib/refinement";
import { reserveInvestigation, sceneSession } from "../lib/session";

export default defineTool({
  description: "Explain current Qloo evidence, show cached alternatives, exclude named place IDs, or perform one structured Qloo-backed refinement. Always report changed preferences and whether Qloo was called. Never claim an event is scheduled.",
  inputSchema: z.object({
    action: z.enum(["explain", "alternatives", "exclude", "refine"]),
    query: z.string().trim().min(2).max(120).optional(),
    cities: z.array(z.string().trim().min(2).max(120)).min(2).max(5).optional(),
    minRating: z.number().min(0).max(5).optional(),
    maxPriceLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    excludePlaceIds: z.array(z.string().min(1).max(160)).max(12).optional(),
  }),
  label: { start: ({ action }) => action === "refine" ? "Refining Qloo city search" : "Reviewing current venue evidence" },
  async execute(input, ctx) {
    const state = sceneSession.get();
    if (!state.currentBrief || state.latestResult?.status !== "COMPLETE") {
      return { status: "NEEDS_INPUT", reason: "Run a city discovery in this conversation first." };
    }
    const needsFresh = input.action === "refine" || input.query !== undefined || input.cities !== undefined || input.minRating !== undefined || input.maxPriceLevel !== undefined;
    if (needsFresh) {
      const budgetError = reserveInvestigation(ctx.session.turn.id);
      if (budgetError) return { status: "BUDGET_REACHED", reason: budgetError, qlooCalled: false };
    }
    const apiKey = process.env.QLOO_API_KEY?.trim();
    if (!apiKey && needsFresh) return { status: "BLOCKED_QLOO", reason: "QLOO_API_KEY is not configured on the server.", qlooCalled: false };
    const outcome = await refineCityPulse(
      new LiveQlooClient(apiKey ?? "", { baseUrl: process.env.QLOO_API_BASE_URL }),
      { brief: state.currentBrief, result: state.latestResult, history: state.history }, input,
    );
    if (outcome.result.status === "COMPLETE") sceneSession.update((current) => ({
      ...current, currentBrief: outcome.brief ?? current.currentBrief,
      latestResult: outcome.result, history: outcome.history,
    }));
    return { status: outcome.result.status, changed: outcome.changed, qlooCalled: outcome.qlooCalled,
      previousCity: state.latestResult.selectedCity, result: outcome.result };
  },
});
