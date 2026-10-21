export const entityTypes = [
  "artist",
  "book",
  "brand",
  "destination",
  "movie",
  "place",
  "podcast",
  "tv_show",
  "videogame",
] as const;

export type EntityType = (typeof entityTypes)[number];

export type ExecutionMode = "live" | "fixture" | "replay";

export interface TasteAnchor {
  name: string;
  type: EntityType;
}

export interface SceneConstraints {
  maxPriceLevel?: 1 | 2 | 3 | 4;
  minRating?: number;
  takePerMarket?: number;
}

export interface SceneBrief {
  artist: string;
  anchors: TasteAnchor[];
  cities: string[];
  constraints?: SceneConstraints;
}

export interface CityPulseBrief {
  query: string;
  cities: string[];
  constraints?: SceneConstraints;
}

export interface QlooEntity {
  id: string;
  name: string;
  type: string;
  affinity: number | null;
  properties: Record<string, unknown>;
  explainability?: unknown;
}

export interface QlooCallEvidence {
  operation: "search" | "tags" | "insights";
  requestHash: string;
  requestId?: string;
  resultCount: number;
}

export interface QlooTag {
  id: string;
  name: string;
  type: string;
}

export interface QlooTagResult {
  items: QlooTag[];
  evidence: QlooCallEvidence;
}

export interface QlooResult {
  items: QlooEntity[];
  evidence: QlooCallEvidence;
}

export interface MarketComparison {
  city: string;
  score: number;
  candidateCount: number;
  topPlaces: QlooEntity[];
}

export interface CityPlace extends QlooEntity {
  fit: {
    level: "direct" | "scene";
    reason: string;
    evidence?: string[];
  };
  venue: {
    category?: string;
    description?: string;
    address?: string;
    website?: string;
    rating?: number;
    liveMusic?: boolean;
  };
}

export interface CityPulseComparison {
  city: string;
  score: number;
  candidateCount: number;
  qualifiedCount: number;
  directMatchCount: number;
  rejectedCount: number;
  topPlaces: CityPlace[];
  explanation: string;
}

export interface CityPulseConfidence {
  level: "high" | "medium" | "low";
  summary: string;
  reasons: string[];
}

export interface CityPulseRefinement {
  attempted: boolean;
  reason?: string;
  tagQuery?: string;
  additionalCalls: number;
}

export interface TasteReceipt {
  schemaVersion: "1.0";
  createdAt: string;
  executionMode: ExecutionMode;
  scorerVersion: "market-affinity-v1";
  inputs: SceneBrief;
  resolvedAnchors: QlooEntity[];
  providerCalls: QlooCallEvidence[];
  comparisons: Array<Omit<MarketComparison, "topPlaces"> & { topPlaceIds: string[] }>;
  decision: {
    city: string;
    placeIds: string[];
    artistIds: string[];
    brandIds: string[];
  };
  limitations: string[];
  integrity: { algorithm: "sha256"; hash: string };
}

export interface CityPulseReceipt {
  schemaVersion: "1.0" | "1.1";
  createdAt: string;
  executionMode: ExecutionMode;
  scorerVersion: "cultural-evidence-v2" | "cultural-evidence-v2.1";
  inputs: CityPulseBrief;
  resolvedTags: QlooTag[];
  providerCalls: QlooCallEvidence[];
  comparisons: Array<Omit<CityPulseComparison, "topPlaces"> & { topPlaceIds: string[] }>;
  refinement: CityPulseRefinement;
  confidence: CityPulseConfidence;
  decision: { city: string | null; placeIds: string[] };
  limitations: string[];
  refinementHistory?: Array<{ query: string; cities: string[]; changed: string[]; qlooCalled: boolean }>;
  evidenceSummaries?: Array<{ city: string; direct: number; plausible: number; rejected: number }>;
  integrity: { algorithm: "sha256"; hash: string };
}

export type CityPulseResult =
  | {
      status: "COMPLETE";
      executionMode: ExecutionMode;
      selectedCity: string | null;
      intent: { query: string; tags: QlooTag[] };
      comparisons: CityPulseComparison[];
      confidence: CityPulseConfidence;
      refinement: CityPulseRefinement;
      receipt: CityPulseReceipt;
    }
  | {
      status: "NEEDS_INPUT" | "NO_VALID_PLAN" | "BLOCKED_QLOO";
      executionMode: ExecutionMode;
      reason: string;
      details?: Record<string, unknown>;
    };

export type ScenePlanResult =
  | {
      status: "COMPLETE";
      executionMode: ExecutionMode;
      selectedCity: string;
      comparisons: MarketComparison[];
      scene: {
        places: QlooEntity[];
        artists: QlooEntity[];
        brands: QlooEntity[];
      };
      receipt: TasteReceipt;
    }
  | {
      status: "NEEDS_INPUT" | "NO_VALID_PLAN" | "BLOCKED_QLOO";
      executionMode: ExecutionMode;
      reason: string;
      details?: Record<string, unknown>;
    };

