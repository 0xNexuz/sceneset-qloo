import { discoverCityPulse } from "./city-pulse";
import type { QlooProvider } from "./qloo";
import { sealCityPulseReceipt } from "./receipt";
import type { CityPulseBrief, CityPulseComparison, CityPulseResult } from "./types";

export type RefinementRequest = {
  action: "explain" | "alternatives" | "exclude" | "refine";
  query?: string;
  cities?: string[];
  minRating?: number;
  maxPriceLevel?: 1 | 2 | 3 | 4;
  excludePlaceIds?: string[];
};

export type RefinementState = {
  brief: CityPulseBrief;
  result: Extract<CityPulseResult, { status: "COMPLETE" }>;
  history: Array<{ query: string; cities: string[]; changed: string[]; qlooCalled: boolean }>;
};

export type RefinementOutcome = {
  result: CityPulseResult;
  brief?: CityPulseBrief;
  changed: string[];
  qlooCalled: boolean;
  history: RefinementState["history"];
};

export async function refineCityPulse(provider: QlooProvider, prior: RefinementState, request: RefinementRequest): Promise<RefinementOutcome> {
  const { brief, result, history } = prior;
  const changed: string[] = [];
  const nextBrief: CityPulseBrief = {
    query: request.query?.trim() ?? brief.query,
    cities: request.cities ?? brief.cities,
    constraints: { ...brief.constraints,
      ...(request.minRating === undefined ? {} : { minRating: request.minRating }),
      ...(request.maxPriceLevel === undefined ? {} : { maxPriceLevel: request.maxPriceLevel }),
    },
  };
  if (nextBrief.query !== brief.query) changed.push(`query: ${brief.query} → ${nextBrief.query}`);
  if (nextBrief.cities.join("|") !== brief.cities.join("|")) changed.push(`cities: ${brief.cities.join(", ")} → ${nextBrief.cities.join(", ")}`);
  if (nextBrief.constraints?.minRating !== brief.constraints?.minRating) changed.push(`minimum rating: ${brief.constraints?.minRating ?? "any"} → ${nextBrief.constraints?.minRating}`);
  if (nextBrief.constraints?.maxPriceLevel !== brief.constraints?.maxPriceLevel) changed.push(`maximum price level: ${brief.constraints?.maxPriceLevel ?? "any"} → ${nextBrief.constraints?.maxPriceLevel}`);
  const knownIds = new Set(result.comparisons.flatMap((market) => market.topPlaces.map((place) => place.id)));
  const exclusions = new Set((request.excludePlaceIds ?? []).filter((id) => knownIds.has(id)));
  if (exclusions.size) changed.push(`excluded ${exclusions.size} venue${exclusions.size === 1 ? "" : "s"}`);
  const needsQloo = changed.some((item) => !item.startsWith("excluded")) || request.action === "refine";
  if (needsQloo) {
    const fresh = await discoverCityPulse(provider, nextBrief, "live");
    if (fresh.status !== "COMPLETE") return { result: fresh, changed, qlooCalled: true, history };
    const nextHistory = [...history, { query: nextBrief.query, cities: nextBrief.cities, changed, qlooCalled: true }];
    const { integrity: _integrity, ...payload } = fresh.receipt;
    const receipt = sealCityPulseReceipt({ ...payload, refinementHistory: nextHistory });
    const freshResult = { ...fresh, receipt };
    if (exclusions.size) {
      const freshIds = new Set(fresh.comparisons.flatMap((market) => market.topPlaces.map((place) => place.id)));
      const applicable = [...exclusions].filter((id) => freshIds.has(id));
      if (applicable.length) {
        const afterExclusion = await refineCityPulse(provider, { brief: nextBrief, result: freshResult, history: nextHistory }, { action: "exclude", excludePlaceIds: applicable });
        return { ...afterExclusion, changed: [...changed.filter((item) => !item.startsWith("excluded")), `excluded ${applicable.length} venue${applicable.length === 1 ? "" : "s"} from fresh results`], qlooCalled: true };
      }
      return { result: freshResult, brief: nextBrief, changed: [...changed.filter((item) => !item.startsWith("excluded")), "requested exclusions were absent from fresh results"], qlooCalled: true, history: nextHistory };
    }
    return { result: freshResult, brief: nextBrief, changed, qlooCalled: true, history: nextHistory };
  }
  if (!exclusions.size) {
    return { result, brief, changed: [request.excludePlaceIds?.length ? "No listed venue matched the exclusion" : request.action === "alternatives" ? "showed existing alternatives" : "explained existing evidence"], qlooCalled: false, history };
  }
  const comparisons: CityPulseComparison[] = result.comparisons.map((market) => {
    const topPlaces = market.topPlaces.filter((place) => !exclusions.has(place.id));
    const directMatchCount = topPlaces.filter((place) => place.fit.level === "direct").length;
    const qualifiedCount = topPlaces.length;
    return { ...market, topPlaces, directMatchCount, qualifiedCount,
      score: directMatchCount * 3 + qualifiedCount - directMatchCount,
      rejectedCount: market.candidateCount - qualifiedCount,
      explanation: qualifiedCount ? `${directMatchCount} direct and ${qualifiedCount - directMatchCount} plausible cached venue leads remain after exclusion.` : "No cached venue lead remains after exclusion; run a fresh search for more alternatives.",
    };
  }).sort((a, b) => b.score - a.score || b.directMatchCount - a.directMatchCount || a.city.localeCompare(b.city));
  const selectedCity = comparisons[0]?.score ? comparisons[0].city : null;
  const confidence = selectedCity ? {
    level: (comparisons[0].directMatchCount >= 2 ? "high" : comparisons[0].directMatchCount === 1 ? "medium" : "low") as "high" | "medium" | "low",
    summary: `${selectedCity} leads among the cached venues after exclusion; no new Qloo call was made.`,
    reasons: [comparisons[0].explanation, "Only previously returned shortlist venues were reconsidered; a fresh search may reveal more."],
  } : { level: "low" as const, summary: "No supported city remains among the cached venues.", reasons: ["Run a fresh search for more alternatives."] };
  const nextHistory = [...history, { query: brief.query, cities: brief.cities, changed, qlooCalled: false }];
  const { integrity: _integrity, ...payload } = result.receipt;
  const receipt = sealCityPulseReceipt({ ...payload, schemaVersion: "1.1", comparisons: comparisons.map(({ topPlaces, ...market }) => ({ ...market, topPlaceIds: topPlaces.map((place) => place.id) })), confidence,
    decision: { city: selectedCity, placeIds: comparisons[0]?.topPlaces.map((place) => place.id) ?? [] }, refinementHistory: nextHistory,
    evidenceSummaries: comparisons.map((market) => ({ city: market.city, direct: market.directMatchCount, plausible: market.qualifiedCount - market.directMatchCount, rejected: market.rejectedCount })),
  });
  return { result: { ...result, comparisons, confidence, selectedCity, receipt }, brief, changed, qlooCalled: false, history: nextHistory };
}
