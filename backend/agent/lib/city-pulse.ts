import type { QlooProvider } from "./qloo";
import { sealCityPulseReceipt } from "./receipt";
import type {
  CityPlace,
  CityPulseBrief,
  CityPulseComparison,
  CityPulseConfidence,
  CityPulseRefinement,
  CityPulseResult,
  ExecutionMode,
  QlooEntity,
  QlooTag,
} from "./types";

const LIMITATIONS = [
  "Qloo affinity is normalized in query context and is not a calibrated cross-city probability.",
  "Venue descriptions can suggest a suitable setting but do not verify current programming.",
  "Opening hours, event dates, ticket inventory, and availability are not verified.",
];
const STOP_WORDS = new Set([
  "a", "an", "and", "around", "at", "events", "event", "for", "in", "late", "live",
  "near", "night", "nights", "of", "parties", "party", "places", "scene", "the", "with",
]);

function words(value: string): string[] {
  return value.toLowerCase()
    .replace(/afro[\s-]*beats?/g, "afrobeat")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.endsWith("ies") && word.length > 4 ? `${word.slice(0, -3)}y` : word.endsWith("s") && word.length > 4 ? word.slice(0, -1) : word);
}

function coreWords(query: string): string[] {
  return [...new Set(words(query).filter((word) => !STOP_WORDS.has(word)))];
}

function validateBrief(brief: CityPulseBrief): string | null {
  if (brief.query.trim().length < 2) return "Describe the kind of scene you want to find.";
  if (brief.cities.length < 2 || brief.cities.length > 5) return "Choose between two and five cities.";
  if (new Set(brief.cities.map((city) => city.trim().toLowerCase())).size !== brief.cities.length) {
    return "Candidate cities must be unique.";
  }
  return null;
}

function selectTags(query: string, tags: QlooTag[]): QlooTag[] {
  const core = coreWords(query);
  const seen = new Set<string>();
  return tags
    .map((tag) => ({
      tag,
      overlap: core.filter((word) => words(tag.name).includes(word)).length,
      exact: words(tag.name).join(" ") === words(query).join(" "),
    }))
    .filter(({ tag, overlap }) => {
      if (overlap === 0 || seen.has(tag.id)) return false;
      seen.add(tag.id);
      return true;
    })
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.overlap - a.overlap || a.tag.name.localeCompare(b.tag.name))
    .slice(0, 2)
    .map(({ tag }) => tag);
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function tagNames(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  return entries.map((entry) => stringValue(record(entry).name) ?? stringValue(entry)).filter((name): name is string => Boolean(name));
}

function venueContext(place: QlooEntity): CityPlace["venue"] {
  const properties = place.properties;
  const addressObject = record(properties.address);
  const rawWebsite = stringValue(properties.website);
  let website: string | undefined;
  if (rawWebsite) {
    try {
      const parsed = new URL(rawWebsite);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") website = parsed.toString();
    } catch { /* Ignore malformed provider URLs. */ }
  }
  const rating = properties.business_rating;
  return {
    category: stringValue(record(properties.primary_genre).name) ?? stringValue(properties.primary_genre) ?? (place.type.split(":").at(-1) === "place" ? undefined : place.type.split(":").at(-1)?.replace(/_/g, " ")),
    description: stringValue(properties.short_description) ?? stringValue(properties.description) ?? stringValue(properties.overall_description),
    address: stringValue(properties.address) ?? ([addressObject.street, addressObject.city, addressObject.country].filter((part): part is string => typeof part === "string" && part.length > 0).join(", ") || undefined),
    website,
    rating: typeof rating === "number" && Number.isFinite(rating) ? Number(rating.toFixed(1)) : undefined,
    liveMusic: typeof properties.live_music === "boolean" ? properties.live_music : undefined,
  };
}

function assessPlace(place: QlooEntity, query: string, constraints: CityPulseBrief["constraints"]): CityPlace | null {
  const venue = venueContext(place);
  if (place.properties.is_closed === true) return null;
  if (constraints?.minRating !== undefined && (venue.rating === undefined || venue.rating < constraints.minRating)) return null;
  const price = place.properties.price_level;
  if (constraints?.maxPriceLevel !== undefined && typeof price === "number" && price > constraints.maxPriceLevel) return null;

  const keywords = Array.isArray(place.properties.keywords)
    ? place.properties.keywords.map((entry) => stringValue(record(entry).name)).filter(Boolean).join(" ")
    : "";
  const searchable = [place.name, venue.category, venue.description, keywords, ...tagNames(place.properties.good_for)].filter(Boolean).join(" ");
  const venueWords = new Set(words(searchable));
  const core = coreWords(query);
  const direct = core.length > 0 && core.every((word) => venueWords.has(word));

  const setting = [place.name, venue.category, venue.description].filter(Boolean).join(" ").toLowerCase();
  const socialQuery = /part(y|ies)|night|club|dance|concert|music|jazz|gig/i.test(query);
  const socialSetting = /nightclub|night club|dance club|music venue|concert|event venue|performance venue|jazz club|dj set|dance floor|live music venue/i.test(setting);
  const foodQuery = /food|dining|restaurant|cuisine|brunch/i.test(query);
  const foodSetting = /restaurant|cafe|dining|brunch|food hall/i.test(setting);
  if (!direct && !((socialQuery && socialSetting) || (foodQuery && foodSetting))) return null;

  return {
    ...place,
    venue,
    fit: direct
      ? { level: "direct", reason: `Qloo venue details mention ${core.join(" and ")}.` }
      : { level: "scene", reason: `Qloo describes a suitable ${venue.category?.toLowerCase() ?? "venue"}; ${core.join(" and ") || "specific"} programming is unverified.` },
  };
}

function compareCity(city: string, items: QlooEntity[], brief: CityPulseBrief): CityPulseComparison {
  const unique = [...new Map(items.map((item) => [item.id, item])).values()];
  const qualified = unique.map((item) => assessPlace(item, brief.query, brief.constraints)).filter((item): item is CityPlace => item !== null);
  qualified.sort((a, b) => Number(b.fit.level === "direct") - Number(a.fit.level === "direct") || (b.affinity ?? 0) - (a.affinity ?? 0));
  const directMatchCount = qualified.filter((item) => item.fit.level === "direct").length;
  const sceneCount = qualified.length - directMatchCount;
  const score = directMatchCount * 3 + sceneCount;
  const explanation = directMatchCount > 0
    ? `${directMatchCount} venue${directMatchCount === 1 ? "" : "s"} mention the requested culture; ${sceneCount} additional venue${sceneCount === 1 ? "" : "s"} fit the setting.`
    : sceneCount > 0
      ? `${sceneCount} venue${sceneCount === 1 ? "" : "s"} fit the setting, but none confirm the requested culture.`
      : `No returned venue had enough evidence for this scene.`;
  return {
    city, score, candidateCount: unique.length, qualifiedCount: qualified.length,
    directMatchCount, rejectedCount: unique.length - qualified.length,
    topPlaces: qualified.slice(0, 4), explanation,
  };
}

function confidenceFor(comparisons: CityPulseComparison[], refinement: CityPulseRefinement, core: string[]): CityPulseConfidence {
  const first = comparisons[0];
  if (!first || first.score === 0) {
    return { level: "low", summary: "No city has a supported venue lead.", reasons: ["Qloo returned places, but their metadata did not support this scene."] };
  }
  const level = first.directMatchCount >= 2 ? "high" : first.directMatchCount === 1 ? "medium" : "low";
  const reasons = [first.explanation];
  if (level === "low") reasons.push(`No venue explicitly confirmed ${core.join(" and ") || "the requested culture"}.`);
  if (comparisons[1]?.score === first.score) reasons.push("The leading cities have equal evidence scores; the displayed order is a deterministic tie break.");
  if (refinement.attempted) reasons.push("The agent retried with a narrower Qloo tag filter because the first pass was weak.");
  return {
    level,
    summary: level === "low"
      ? `${first.city} has the most promising venue leads, but the cultural match needs confirmation.`
      : `${first.city} has the strongest venue evidence for this search.`,
    reasons,
  };
}

export async function discoverCityPulse(
  provider: QlooProvider,
  brief: CityPulseBrief,
  executionMode: ExecutionMode = "live",
): Promise<CityPulseResult> {
  const validationError = validateBrief(brief);
  if (validationError) return { status: "NEEDS_INPUT", executionMode, reason: validationError };

  try {
    const core = coreWords(brief.query);
    if (core.length === 0) return { status: "NEEDS_INPUT", executionMode, reason: "Add a cultural genre, cuisine, or mood to refine the search." };
    const firstTags = await provider.searchTags(brief.query, 8);
    const initialTags = selectTags(brief.query, firstTags.items);
    if (initialTags.length === 0) {
      return { status: "NEEDS_INPUT", executionMode, reason: `Qloo could not resolve “${brief.query}” to a specific cultural signal. Try a genre, cuisine, or mood.` };
    }

    const providerCalls = [firstTags.evidence];
    const results = new Map<string, QlooEntity[]>();
    for (const city of brief.cities) {
      const response = await provider.insights({
        type: "place", tagIds: initialTags.map((tag) => tag.id), location: city,
        constraints: brief.constraints, take: brief.constraints?.takePerMarket ?? 8,
      });
      providerCalls.push(response.evidence);
      results.set(city, response.items);
    }

    let comparisons = brief.cities.map((city) => compareCity(city, results.get(city) ?? [], brief));
    let refinement: CityPulseRefinement = { attempted: false, additionalCalls: 0 };
    let resolvedTags = initialTags;
    if (comparisons.every((market) => market.directMatchCount === 0)) {
      const tagQuery = core.join(" ");
      let refinedTags = initialTags;
      if (tagQuery.toLowerCase() !== brief.query.trim().toLowerCase()) {
        // Keep the retry in the receipt even when Qloo finds no narrower tag.
        const retry = await provider.searchTags(tagQuery, 8);
        providerCalls.push(retry.evidence);
        const selected = selectTags(tagQuery, retry.items);
        if (selected.length) refinedTags = selected;
      }
      const focus = refinedTags[0] ?? initialTags[0];
      if (focus) {
        for (const city of brief.cities) {
          const response = await provider.insights({
            type: "place", tagIds: [focus.id], requiredTagIds: [focus.id], location: city,
            constraints: brief.constraints, take: brief.constraints?.takePerMarket ?? 8,
          });
          providerCalls.push(response.evidence);
          results.set(city, [...(results.get(city) ?? []), ...response.items]);
        }
        resolvedTags = [focus];
      }
      refinement = {
        attempted: true,
        reason: "The first pass found no venue with explicit cultural evidence.",
        tagQuery,
        additionalCalls: providerCalls.length - (1 + brief.cities.length),
      };
      comparisons = brief.cities.map((city) => compareCity(city, results.get(city) ?? [], brief));
    }

    comparisons.sort((a, b) => b.score - a.score || b.directMatchCount - a.directMatchCount || b.qualifiedCount - a.qualifiedCount || a.city.localeCompare(b.city));
    const selectedCity = comparisons[0]?.score ? comparisons[0].city : null;
    const confidence = confidenceFor(comparisons, refinement, core);
    const receipt = sealCityPulseReceipt({
      schemaVersion: "1.0", createdAt: new Date().toISOString(), executionMode,
      scorerVersion: "cultural-evidence-v2", inputs: brief, resolvedTags, providerCalls,
      comparisons: comparisons.map(({ topPlaces, ...comparison }) => ({
        ...comparison, topPlaceIds: topPlaces.map((place) => place.id),
      })),
      refinement, confidence,
      decision: { city: selectedCity, placeIds: comparisons[0]?.topPlaces.map((place) => place.id) ?? [] },
      limitations: LIMITATIONS,
    });
    return {
      status: "COMPLETE", executionMode, selectedCity,
      intent: { query: brief.query, tags: resolvedTags },
      comparisons, confidence, refinement, receipt,
    };
  } catch (error) {
    return {
      status: "BLOCKED_QLOO", executionMode,
      reason: error instanceof Error ? error.message : "Qloo request failed.",
    };
  }
}
