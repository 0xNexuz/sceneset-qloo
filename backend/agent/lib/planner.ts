import type { QlooProvider } from "./qloo";
import { sealReceipt } from "./receipt";
import type {
  ExecutionMode,
  MarketComparison,
  QlooCallEvidence,
  QlooEntity,
  SceneBrief,
  ScenePlanResult,
} from "./types";

const LIMITATIONS = [
  "Cultural affinity is decision support, not proof of demand or causal fit.",
  "Artist, venue, and brand availability is not verified.",
  "Attendance, revenue, and booking outcomes are not predicted.",
];

function validateBrief(brief: SceneBrief): string | null {
  if (!brief.artist.trim()) return "An artist is required.";
  if (brief.anchors.length < 1 || brief.anchors.length > 3) {
    return "Provide between one and three taste anchors.";
  }
  if (brief.cities.length < 2 || brief.cities.length > 3) {
    return "Provide two or three candidate cities.";
  }
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

export async function planScene(
  provider: QlooProvider,
  brief: SceneBrief,
  executionMode: ExecutionMode = "live",
): Promise<ScenePlanResult> {
  const validationError = validateBrief(brief);
  if (validationError) {
    return { status: "NEEDS_INPUT", executionMode, reason: validationError };
  }

  const evidence: QlooCallEvidence[] = [];
  const resolvedAnchors: QlooEntity[] = [];
  const allAnchors = [{ name: brief.artist, type: "artist" as const }, ...brief.anchors];

  try {
    for (const anchor of allAnchors) {
      const result = await provider.search(anchor.name, anchor.type);
      evidence.push(result.evidence);
      const resolved = result.items[0];
      if (!resolved) {
        return {
          status: "NEEDS_INPUT",
          executionMode,
          reason: `Qloo could not resolve ${anchor.type} anchor “${anchor.name}”.`,
          details: { anchor },
        };
      }
      resolvedAnchors.push(resolved);
    }

    const anchorIds = resolvedAnchors.map((entity) => entity.id);
    const comparisons: MarketComparison[] = [];

    for (const city of brief.cities) {
      const result = await provider.insights({
        type: "place",
        entityIds: anchorIds,
        location: city,
        constraints: brief.constraints,
        excludeEntityIds: anchorIds,
        take: brief.constraints?.takePerMarket ?? 8,
      });
      evidence.push(result.evidence);
      comparisons.push({
        city,
        score: scoreMarket(result.items),
        candidateCount: result.items.length,
        topPlaces: result.items.slice(0, 3),
      });
    }

    comparisons.sort((a, b) => b.score - a.score || a.city.localeCompare(b.city));
    const winner = comparisons[0];
    if (!winner || winner.topPlaces.length === 0) {
      return {
        status: "NO_VALID_PLAN",
        executionMode,
        reason: "Qloo returned no policy-valid places for the candidate cities.",
      };
    }

    const sceneSignals = [...anchorIds, ...winner.topPlaces.map((place) => place.id)];
    const [artists, brands] = await Promise.all([
      provider.insights({
        type: "artist",
        entityIds: sceneSignals,
        excludeEntityIds: anchorIds,
        take: 4,
      }),
      provider.insights({
        type: "brand",
        entityIds: sceneSignals,
        excludeEntityIds: anchorIds,
        take: 4,
      }),
    ]);
    evidence.push(artists.evidence, brands.evidence);

    const selectedArtists = artists.items.slice(0, 2);
    const selectedBrands = brands.items.slice(0, 2);
    const decision = {
      city: winner.city,
      placeIds: winner.topPlaces.map((entity) => entity.id),
      artistIds: selectedArtists.map((entity) => entity.id),
      brandIds: selectedBrands.map((entity) => entity.id),
    };

    const receipt = sealReceipt({
      schemaVersion: "1.0",
      createdAt: new Date().toISOString(),
      executionMode,
      scorerVersion: "market-affinity-v1",
      inputs: brief,
      resolvedAnchors,
      providerCalls: evidence,
      comparisons: comparisons.map(({ topPlaces, ...comparison }) => ({
        ...comparison,
        topPlaceIds: topPlaces.map((entity) => entity.id),
      })),
      decision,
      limitations: LIMITATIONS,
    });

    return {
      status: "COMPLETE",
      executionMode,
      selectedCity: winner.city,
      comparisons,
      scene: {
        places: winner.topPlaces,
        artists: selectedArtists,
        brands: selectedBrands,
      },
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

