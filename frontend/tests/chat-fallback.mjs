import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route("**/eve/v1/**", (route) => route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "free model unavailable" }) }));
  await page.route("**/api/city-pulse", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    status: "COMPLETE", selectedCity: "Lagos", intent: { query: "Afrobeats parties", tags: [] },
    comparisons: [{ city: "Lagos", score: 1, candidateCount: 1, qualifiedCount: 0, directMatchCount: 0, rejectedCount: 1, topPlaces: [], explanation: "A venue lead needs confirmation." }],
    confidence: { level: "low", summary: "Lagos has a tentative venue lead.", reasons: ["Events are unverified."] }, refinement: { attempted: false, additionalCalls: 0 },
    receipt: { createdAt: "2026-10-21T00:00:00.000Z", inputs: { query: "Afrobeats parties", cities: ["Lagos", "Accra"] }, resolvedTags: [], providerCalls: [], integrity: { algorithm: "sha256", hash: "0".repeat(64) } },
  }) }));
  await page.goto("http://127.0.0.1:5184/");
  await page.getByRole("textbox", { name: "Scene search" }).fill("Afrobeats parties");
  await page.getByRole("button", { name: /Find the best scene/ }).click();
  await page.getByText(/Eve chat is unavailable. Qloo-backed guided discovery/).waitFor({ state: "visible", timeout: 20_000 });
  assert.ok(await page.getByRole("button", { name: "Why this ranking?" }).isVisible());
  console.log("Unavailable-model guided fallback passed");
} finally { await browser.close(); }
