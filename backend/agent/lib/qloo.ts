import { createHash } from "node:crypto";
import type {
  EntityType,
  QlooCallEvidence,
  QlooEntity,
  QlooResult,
  QlooTag,
  QlooTagResult,
  SceneConstraints,
} from "./types";

export interface QlooProvider {
  search(name: string, type: EntityType): Promise<QlooResult>;
  searchTags(query: string, take?: number): Promise<QlooTagResult>;
  insights(input: {
    type: EntityType;
    entityIds?: string[];
    tagIds?: string[];
    location?: string;
    constraints?: SceneConstraints;
    excludeEntityIds?: string[];
    take?: number;
  }): Promise<QlooResult>;
}

function getTagItems(payload: unknown): unknown[] {
  const body = asRecord(payload);
  const results = asRecord(body.results);
  if (Array.isArray(results.tags)) return results.tags;
  if (Array.isArray(body.tags)) return body.tags;
  return [];
}

function normalizeTag(value: unknown): QlooTag | null {
  const raw = asRecord(value);
  const id = raw.tag_id ?? raw.id;
  const name = raw.name ?? raw.title;
  const type = raw.type ?? raw.tag_type ?? "urn:tag";
  if (typeof id !== "string" || typeof name !== "string") return null;
  return { id, name, type: String(type) };
}

function hashRequest(url: URL): string {
  return createHash("sha256").update(url.toString()).digest("hex");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function getItems(payload: unknown): unknown[] {
  const body = asRecord(payload);
  if (Array.isArray(body.results)) return body.results;
  const results = asRecord(body.results);
  if (Array.isArray(results.entities)) return results.entities;
  if (Array.isArray(results.items)) return results.items;
  if (Array.isArray(body.entities)) return body.entities;
  return [];
}

function normalizeEntity(value: unknown): QlooEntity | null {
  const raw = asRecord(value);
  const entity = asRecord(raw.entity);
  const properties = asRecord(raw.properties ?? entity.properties);
  const query = asRecord(raw.query);
  const id = raw.entity_id ?? raw.entityId ?? raw.id ?? entity.id;
  const name = raw.name ?? entity.name ?? properties.name;
  const types = Array.isArray(raw.types) ? raw.types : [];
  const type = raw.type ?? raw.subtype ?? types[0] ?? entity.type ?? properties.type ?? "unknown";
  const rawAffinity = raw.affinity ?? raw.score ?? query.affinity ?? properties.affinity;
  const affinity =
    typeof rawAffinity === "number" && Number.isFinite(rawAffinity)
      ? Math.max(0, Math.min(1, rawAffinity))
      : null;

  if (typeof id !== "string" || typeof name !== "string") return null;

  return {
    id,
    name,
    type: String(type),
    affinity,
    properties,
    explainability: raw.explainability ?? query.explainability,
  };
}

function requestId(payload: unknown): string | undefined {
  const body = asRecord(payload);
  const value = body.request_id ?? body.requestId ?? asRecord(body.meta).request_id;
  return typeof value === "string" ? value : undefined;
}

export class QlooHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "QlooHttpError";
  }
}

export class LiveQlooClient implements QlooProvider {
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    options: { baseUrl?: string; timeoutMs?: number } = {},
  ) {
    this.baseUrl = (options.baseUrl ?? "https://hackathon.api.qloo.com").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? 25_000;
  }

  private readonly timeoutMs: number;

  private async get(url: URL, operation: QlooCallEvidence["operation"]): Promise<QlooResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: { "X-Api-Key": this.apiKey, Accept: "application/json" },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!response.ok) {
          const error = new QlooHttpError(`Qloo ${operation} failed with HTTP ${response.status}`, response.status);
          if (response.status !== 429 && response.status < 500) throw error;
          lastError = error;
          continue;
        }

        const payload: unknown = await response.json();
        const items = getItems(payload)
          .map(normalizeEntity)
          .filter((item): item is QlooEntity => item !== null);

        return {
          items,
          evidence: {
            operation,
            requestHash: hashRequest(url),
            requestId: requestId(payload),
            resultCount: items.length,
          },
        };
      } catch (error) {
        if (
          error instanceof QlooHttpError &&
          error.status !== 429 &&
          error.status < 500
        ) {
          throw error;
        }
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`Qloo ${operation} failed`);
  }

  search(name: string, type: EntityType): Promise<QlooResult> {
    const url = new URL("/search", this.baseUrl);
    url.searchParams.set("query", name);
    url.searchParams.set("types", `urn:entity:${type}`);
    url.searchParams.set("take", "5");
    return this.get(url, "search");
  }

  async searchTags(query: string, take = 6): Promise<QlooTagResult> {
    const url = new URL("/v2/tags", this.baseUrl);
    url.searchParams.set("filter.query", query);
    url.searchParams.set("feature.typo_tolerance", "true");
    url.searchParams.set("take", String(take));

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: { "X-Api-Key": this.apiKey, Accept: "application/json" },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) {
          const error = new QlooHttpError(`Qloo tags failed with HTTP ${response.status}`, response.status);
          if (response.status !== 429 && response.status < 500) throw error;
          lastError = error;
          continue;
        }
        const payload: unknown = await response.json();
        const items = getTagItems(payload)
          .map(normalizeTag)
          .filter((item): item is QlooTag => item !== null);
        return {
          items,
          evidence: {
            operation: "tags",
            requestHash: hashRequest(url),
            requestId: requestId(payload),
            resultCount: items.length,
          },
        };
      } catch (error) {
        if (error instanceof QlooHttpError && error.status !== 429 && error.status < 500) throw error;
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Qloo tags failed");
  }

  insights(input: {
    type: EntityType;
    entityIds?: string[];
    tagIds?: string[];
    location?: string;
    constraints?: SceneConstraints;
    excludeEntityIds?: string[];
    take?: number;
  }): Promise<QlooResult> {
    const url = new URL("/v2/insights", this.baseUrl);
    url.searchParams.set("filter.type", `urn:entity:${input.type}`);
    if (input.entityIds?.length) {
      url.searchParams.set("signal.interests.entities", input.entityIds.join(","));
    }
    if (input.tagIds?.length) {
      url.searchParams.set("signal.interests.tags", input.tagIds.join(","));
    }
    if (!input.entityIds?.length && !input.tagIds?.length) {
      throw new Error("Qloo insights requires at least one entity or tag signal.");
    }
    url.searchParams.set("feature.explainability", "true");
    url.searchParams.set("take", String(input.take ?? 8));

    if (input.location) url.searchParams.set("filter.location.query", input.location);
    if (input.excludeEntityIds?.length) {
      url.searchParams.set("filter.exclude.entities", input.excludeEntityIds.join(","));
    }
    if (input.type === "place" && input.constraints?.maxPriceLevel) {
      url.searchParams.set("filter.price_level.max", String(input.constraints.maxPriceLevel));
    }
    if (input.type === "place" && input.constraints?.minRating !== undefined) {
      url.searchParams.set(
        "filter.properties.business_rating.min",
        String(input.constraints.minRating),
      );
    }

    return this.get(url, "insights");
  }
}

