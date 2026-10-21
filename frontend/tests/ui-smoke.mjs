import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chromium } from "playwright-core";

const base = process.env.SCENESET_UI_TEST_URL ?? "http://127.0.0.1:5183/";
const executablePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)]));
  return value;
}

function fixtureResult(query = "Afrobeats parties") {
  const brief = { query, cities: ["Lagos", "Accra", "London"], constraints: { minRating: 4, takePerMarket: 6 } };
  const place = { id: "qloo:lagos-1", name: "The Musical Village", type: "urn:entity:place", affinity: .72, properties: {}, fit: { level: "direct", reason: "Qloo venue details support each requested facet; current programming is unverified.", evidence: ["Afrobeats: explicit Qloo venue detail", "party: explicit Qloo venue detail"] }, venue: { category: "music venue", description: "Afrobeats parties and live music", address: "Lagos", rating: 4.5, website: "https://example.com/venue" } };
  const comparisons = [
    { city: "Lagos", score: 3, candidateCount: 1, qualifiedCount: 1, directMatchCount: 1, rejectedCount: 0, topPlaces: [place], explanation: "One venue supports the requested culture." },
    ...["Accra", "London"].map((city) => ({ city, score: 0, candidateCount: 1, qualifiedCount: 0, directMatchCount: 0, rejectedCount: 1, topPlaces: [], explanation: "No returned venue had enough evidence." })),
  ];
  const confidence = { level: "medium", summary: "Lagos has the strongest venue evidence for this search.", reasons: ["One direct venue lead; current programming is unverified."] };
  const payload = { schemaVersion: "1.1", createdAt: "2026-10-21T00:00:00.000Z", executionMode: "fixture", scorerVersion: "cultural-evidence-v2.1", inputs: brief,
    resolvedTags: [{ id: "tag:afrobeat", name: "Afrobeat Parties", type: "urn:tag" }], providerCalls: [{ operation: "tags", requestHash: "fixture", resultCount: 1 }],
    comparisons: comparisons.map(({ topPlaces, ...market }) => ({ ...market, topPlaceIds: topPlaces.map((item) => item.id) })), refinement: { attempted: false, additionalCalls: 0 }, confidence,
    decision: { city: "Lagos", placeIds: [place.id] }, limitations: ["Events are unverified."],
    refinementHistory: [{ query, cities: brief.cities, changed: ["initial discovery"], qlooCalled: true }],
    evidenceSummaries: comparisons.map((market) => ({ city: market.city, direct: market.directMatchCount, plausible: 0, rejected: market.rejectedCount })) };
  const hash = createHash("sha256").update(JSON.stringify(canonicalize(payload))).digest("hex");
  return { status: "COMPLETE", executionMode: "fixture", selectedCity: "Lagos", intent: { query, tags: payload.resolvedTags }, comparisons, confidence, refinement: payload.refinement, receipt: { ...payload, integrity: { algorithm: "sha256", hash } } };
}

const browser = await chromium.launch({ headless: true, executablePath });
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    await page.route("**/api/city-pulse", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtureResult()) }));
    await page.route("**/api/refine-city-pulse", async (route) => {
      const request = route.request().postDataJSON().request;
      const fresh = request.action === "refine";
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: fixtureResult(fresh ? request.query : "Afrobeats parties"), changed: [fresh ? `query: Afrobeats parties → ${request.query}` : request.action === "exclude" ? "excluded 1 venue" : "explained existing evidence"], qlooCalled: fresh }) });
    });
    await page.goto(base);
    assert.ok(await page.getByRole("heading", { name: /Find the night/ }).isVisible());
    await page.getByRole("button", { name: /Find the best scene/ }).first().waitFor({ state: "attached", timeout: 5_000 });
    await page.getByRole("textbox", { name: "Scene search" }).fill("Afrobeats parties");
    await page.getByRole("button", { name: /Find the best scene/ }).click();
    await page.getByText("The Musical Village").first().waitFor({ state: "visible" });
    assert.ok(await page.getByRole("button", { name: "Why this ranking?" }).isVisible());
    await page.getByRole("button", { name: "Why this ranking?" }).click();
    await page.getByText(/Qloo was not called/).waitFor({ state: "visible" });
    await page.getByLabel(/Exclude a venue/).selectOption("qloo:lagos-1");
    await page.getByRole("button", { name: "Exclude and compare" }).click();
    await page.getByText(/excluded 1 venue/).first().waitFor({ state: "visible" });
    await page.getByLabel("Change the cultural search").fill("Food + live music");
    await page.getByRole("button", { name: "Search again" }).click();
    await page.getByText(/Qloo was called/).waitFor({ state: "visible" });
    await page.getByRole("button", { name: /Taste receipt/ }).click();
    await page.getByRole("button", { name: "Verify current receipt" }).click();
    await page.getByText(/Embedded hash matches/).waitFor({ state: "visible" });
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download JSON receipt" }).click();
    assert.match((await downloadPromise).suggestedFilename(), /^sceneset-receipt-.*\.json$/);
    const tampered = fixtureResult().receipt;
    tampered.decision.city = "London";
    await page.getByLabel("Verify a saved receipt").setInputFiles({ name: "tampered.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(tampered)) });
    await page.getByText(/Mismatch: receipt contents differ/).waitFor({ state: "visible" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflow, false, `horizontal overflow at ${viewport.width}px`);
    console.log(`UI smoke passed at ${viewport.width}px`);
    await page.close();
  }
} finally { await browser.close(); }
