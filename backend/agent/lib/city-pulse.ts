import type { QlooProvider } from "./qloo";
import { sealCityPulseReceipt } from "./receipt";
import type {
  CityPulseBrief,
  CityPulseResult,
  ExecutionMode,
  MarketComparison,
  QlooEntity,
  QlooTag,
} from "./types";

const LIMITATIONS = [
  "Results are Qloo taste-affinity recommendations, not a calendar of scheduled events.",
  "Opening hours, event dates, ticket inventory, and availability are not verified.",
  "Cultural affinity is decision support, not proof of demand or causal fit.",
];

function validateBrief(brief: CityPulseBrief): string | null {
  if (brief.query.trim().length < 2) return "Describe the kind of scene you want to find.";
  if (brief.cities.length < 2 || brief.cities.length > 5) return "Choose between two and five cities.";
  if (new Set(brief.cities.map((city) => city.trim().toLowerCase())).size !== brief.cities.length) {
    return "Candidate cities must be unique.";
  }
  return null;
}

function scoreMarket(items: QlooEntity[]): number {
  const top = items.slice(0, 3);
  if (top.length === 0) return 0;
  const values = top.map((item, index) => item.affinity ?? 1 / (index + 2));
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4));
}

function selectTags(query: string, tags: QlooTag[]): QlooTag[] {
  const normalized = query.trim().toLowerCase();
  return [...tags]
    .sort((a, b) => {
      const aExact = a.name.toLowerCase() === normalized ? 1 : 0;
      const bExact = b.name.toLowerCase() === normalized ? 1 : 0;
      const aUseful = a.type.includes("good_for") ? 1 : 0;
      const bUseful = b.type.includes("good_for") ? 1 : 0;
      return bExact - aExact || bUseful - aUseful;
    })
    .slice(0, 3);
}

export async function discoverCityPulse(
  provider: QlooProvider,
  brief: CityPulseBrief,
  executionMode: ExecutionMode = "live",
): Promise<CityPulseResult> {
  const validationError = validateBrief(brief);
  if (validationError) return { status: "NEEDS_INPUT", executionMode, reason: validationError };

  try {
    const tagResult = await provider.searchTags(brief.query, 8);
    const resolvedTags = selectTags(brief.query, tagResult.items);
    if (resolvedTags.length === 0) {
      return {
        status: "NEEDS_INPUT",
        executionMode,
        reason: `Qloo could not resolve “${brief.query}” to a cultural signal. Try a genre, mood, cuisine, or scene.`,
      };
    }

    const providerCalls = [tagResult.evidence];
    const comparisons: MarketComparison[] = [];
    for (const city of brief.cities) {
      const result = await provider.insights({
        type: "place",
        tagIds: resolvedTags.map((tag) => tag.id),
        location: city,
        constraints: brief.constraints,
        take: brief.constraints?.takePerMarket ?? 6,
      });
      providerCalls.push(result.evidence);
      comparisons.push({
        city,
        score: scoreMarket(result.items),
        candidateCount: result.items.length,
        topPlaces: result.items.slice(0, 4),
      });
    }

    comparisons.sort((a, b) => b.score - a.score || a.city.localeCompare(b.city));
    const winner = comparisons[0];
    if (!winner || winner.topPlaces.length === 0) {
      return { status: "NO_VALID_PLAN", executionMode, reason: "Qloo returned no matching places for these cities." };
    }

    const receipt = sealCityPulseReceipt({
      schemaVersion: "1.0",
      createdAt: new Date().toISOString(),
      executionMode,
      scorerVersion: "market-affinity-v1",
      inputs: brief,
      resolvedTags,
      providerCalls,
      comparisons: comparisons.map(({ topPlaces, ...comparison }) => ({
        ...comparison,
        topPlaceIds: topPlaces.map((place) => place.id),
      })),
      decision: { city: winner.city, placeIds: winner.topPlaces.map((place) => place.id) },
      limitations: LIMITATIONS,
    });

    return {
      status: "COMPLETE",
      executionMode,
      selectedCity: winner.city,
      intent: { query: brief.query, tags: resolvedTags },
      comparisons,
      receipt,
    };
  } catch (error) {
    return {
      status: "BLOCKED_QLOO",
      executionMode,
      reason: error instanceof Error ? error.message : "Qloo request failed.",
    };
  }
}
