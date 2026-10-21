import { defineChannel, POST } from "eve/channels";
import { z } from "zod";
import { LiveQlooClient } from "../lib/qloo";
import { planScene } from "../lib/planner";
import { refineCityPulse } from "../lib/refinement";
import { verifyCityPulseReceipt } from "../lib/receipt";
import { entityTypes, type CityPulseResult } from "../lib/types";

const publicDemoPrincipal = {
  authenticator: "sceneset-public-demo",
  principalType: "service",
  principalId: "anonymous",
  attributes: {},
};

const requestWindows = new Map<string, { count: number; resetAt: number }>();

function receiptMatchesResult(result: Extract<CityPulseResult, { status: "COMPLETE" }>): boolean {
  const receipt = result.receipt;
  if (!receipt.inputs || !receipt.decision || !receipt.confidence || !Array.isArray(receipt.comparisons)) return false;
  if (result.selectedCity !== receipt.decision.city || result.intent?.query !== receipt.inputs.query || result.confidence?.level !== receipt.confidence.level) return false;
  if (result.comparisons.length !== receipt.comparisons.length) return false;
  return result.comparisons.every((market, index) => {
    const recorded = receipt.comparisons[index];
    return recorded && market.city === recorded.city && market.score === recorded.score && market.qualifiedCount === recorded.qualifiedCount &&
      market.topPlaces.map((place) => place.id).join("|") === recorded.topPlaceIds.join("|");
  });
}
const refinementInput = z.object({
  prior: z.object({ status: z.literal("COMPLETE"), receipt: z.object({ integrity: z.object({ algorithm: z.literal("sha256"), hash: z.string() }) }).passthrough() }).passthrough(),
  request: z.object({ action: z.enum(["explain", "alternatives", "exclude", "refine"]),
    query: z.string().trim().min(2).max(120).optional(),
    cities: z.array(z.string().trim().min(2).max(120)).min(2).max(5).optional(),
    minRating: z.number().min(0).max(5).optional(),
    maxPriceLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    excludePlaceIds: z.array(z.string().min(1).max(160)).max(12).optional(),
  }),
});
const legacyPlanInput = z.object({
  artist: z.string().trim().min(1).max(120),
  anchors: z.array(z.object({ name: z.string().trim().min(1).max(120), type: z.enum(entityTypes) })).min(1).max(3),
  cities: z.array(z.string().trim().min(2).max(120)).min(2).max(3),
  constraints: z.object({ maxPriceLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(), minRating: z.number().min(0).max(5).optional(), takePerMarket: z.number().int().min(3).max(12).optional() }).optional(),
});

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const current = requestWindows.get(ip);
  if (!current || current.resetAt <= now) {
    requestWindows.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  if (requestWindows.size > 1_000) for (const [key, value] of requestWindows) if (value.resetAt < now) requestWindows.delete(key);
  return current.count > 12;
}

async function jsonWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  const body = await request.text();
  if (new TextEncoder().encode(body).length > maxBytes) throw new Error("Request body is too large.");
  return JSON.parse(body);
}

function directToolRoute(path: string, toolName: string) {
  return POST(path, async (request, { invokeTool, requestIp }) => {
    if (rateLimited(requestIp ?? "unknown")) {
      return Response.json(
        { status: "RATE_LIMITED", reason: "Too many demo requests. Try again in one minute." },
        { status: 429, headers: { "cache-control": "no-store" } },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 8_192) {
      return Response.json(
        { status: "INVALID_REQUEST", reason: "Request body is too large." },
        { status: 413 },
      );
    }

    let input: unknown;
    try {
      input = await jsonWithLimit(request, 8_192);
    } catch {
      return Response.json(
        { status: "INVALID_REQUEST", reason: "Expected a JSON request body." },
        { status: 400 },
      );
    }

    const result = await invokeTool(toolName, input, { auth: publicDemoPrincipal });
    if (result.status === "completed") {
      return Response.json(result.output, { headers: { "cache-control": "no-store" } });
    }

    const responseStatus =
      result.status === "invalid-input"
        ? 400
        : result.status === "denied"
          ? 403
          : result.status === "authorization-required"
            ? 401
            : 502;
    return Response.json(
      {
        status: "API_ERROR",
        reason: "message" in result ? result.message : `SceneSet returned ${result.status}.`,
      },
      { status: responseStatus, headers: { "cache-control": "no-store" } },
    );
  });
}

export default defineChannel({
  cors: true,
  routes: [
    directToolRoute("/api/city-pulse", "discover_city_pulse"),
    POST("/api/scene-plan", async (request, { requestIp }) => {
      if (rateLimited(requestIp ?? "unknown")) return Response.json({ status: "RATE_LIMITED", reason: "Try again in one minute." }, { status: 429 });
      let input: z.infer<typeof legacyPlanInput>;
      try { input = legacyPlanInput.parse(await jsonWithLimit(request, 8_192)); }
      catch { return Response.json({ status: "INVALID_REQUEST", reason: "Expected a valid scene-plan brief." }, { status: 400 }); }
      const apiKey = process.env.QLOO_API_KEY?.trim();
      if (!apiKey) return Response.json({ status: "BLOCKED_QLOO", executionMode: "live", reason: "QLOO_API_KEY is not configured on the server." }, { status: 503 });
      return Response.json(await planScene(new LiveQlooClient(apiKey, { baseUrl: process.env.QLOO_API_BASE_URL }), input, "live"), { headers: { "cache-control": "no-store" } });
    }),
    POST("/api/refine-city-pulse", async (request, { requestIp }) => {
      if (rateLimited(requestIp ?? "unknown")) return Response.json({ status: "RATE_LIMITED", reason: "Try again in one minute." }, { status: 429 });
      let parsed: z.infer<typeof refinementInput>;
      try { parsed = refinementInput.parse(await jsonWithLimit(request, 96_000)); }
      catch { return Response.json({ status: "INVALID_REQUEST", reason: "Expected a valid bounded refinement request." }, { status: 400 }); }
      const prior = parsed.prior as unknown as Extract<CityPulseResult, { status: "COMPLETE" }>;
      if (!prior.receipt || !prior.receipt.inputs || !Array.isArray(prior.comparisons) || !verifyCityPulseReceipt(prior.receipt) || !receiptMatchesResult(prior)) {
        return Response.json({ status: "INVALID_RECEIPT", reason: "The prior receipt hash does not match." }, { status: 400 });
      }
      const history = prior.receipt.refinementHistory ?? [{ query: prior.receipt.inputs.query, cities: prior.receipt.inputs.cities, changed: ["initial discovery"], qlooCalled: true }];
      const fresh = parsed.request.action === "refine" || parsed.request.query !== undefined || parsed.request.cities !== undefined || parsed.request.minRating !== undefined || parsed.request.maxPriceLevel !== undefined;
      if (fresh && history.filter((entry) => entry.qlooCalled).length >= 3) return Response.json({ status: "BUDGET_REACHED", reason: "This search has used its three Qloo investigations." }, { status: 429 });
      const apiKey = process.env.QLOO_API_KEY?.trim();
      if (fresh && !apiKey) return Response.json({ status: "BLOCKED_QLOO", reason: "QLOO_API_KEY is not configured on the server." }, { status: 503 });
      const outcome = await refineCityPulse(new LiveQlooClient(apiKey ?? "", { baseUrl: process.env.QLOO_API_BASE_URL }),
        { brief: prior.receipt.inputs, result: prior, history }, parsed.request);
      return Response.json(outcome, { headers: { "cache-control": "no-store" } });
    }),
  ],
});
