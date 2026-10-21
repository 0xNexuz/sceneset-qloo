import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const tabs = ["Discover", "City pulse", "Taste receipt", "Evidence"];
const cityOptions = ["Lagos", "Accra", "London", "Nairobi", "Johannesburg"];
const suggestions = ["Afrobeats parties", "Late-night jazz", "Art + fashion", "Food + live music"];
const apiBaseUrl = (import.meta.env.VITE_SCENESET_API_URL ?? "http://127.0.0.1:2000").replace(/\/$/, "");

function Mark() {
  return <span className="mark" aria-hidden="true"><span className="mark-ring" /><span className="mark-axis mark-axis-x" /><span className="mark-axis mark-axis-y" /></span>;
}

function Arrow() { return <span aria-hidden="true">↗</span>; }

function Topbar({ live }) {
  return <header className="topbar">
    <a className="brand" href="#top" aria-label="SceneSet home"><Mark /><span>SCENESET</span></a>
    <nav className="utility-nav" aria-label="Utility navigation"><a href="#discover">Discover</a><a href="#evidence">Evidence</a><span className="online"><i /> {live ? "Qloo result live" : "Qloo connected"}</span></nav>
    <span className="square-button" aria-hidden="true">⌘</span>
  </header>;
}

function Hero({ onStart }) {
  return <section className="hero" id="top">
    <div className="hero-art hero-art-blueprint" aria-hidden="true"><img src="/scene-blueprint.png" alt="" /></div>
    <div className="hero-art hero-art-moon" aria-hidden="true"><img src="/moon-monoliths.png" alt="" /></div>
    <div className="hero-scrim" /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
    <div className="hero-copy">
      <p className="eyebrow light"><span>QLOO-GROUNDED</span> / CITY SCENE DISCOVERY</p>
      <h1>Find the night<br />your taste<br /><em>belongs in.</em></h1>
      <p className="hero-deck">Search a mood, scene, cuisine, or genre. SceneSet reads the cultural signal, compares real places across cities, and picks the strongest fit.</p>
      <div className="hero-actions"><button className="button button-gold" onClick={onStart}>Search the cities <Arrow /></button><a className="text-link" href="#evidence">Inspect the proof <span>↓</span></a></div>
    </div>
    <div className="hero-index" aria-hidden="true"><span>SS—02</span><span>AFR / GLOBAL</span><span>2026</span></div>
    <div className="hero-caption"><span className="caption-number">01</span><div><strong>THE CITY PULSE</strong><small>Intent → taste signal → place</small></div></div>
  </section>;
}

function TabRail({ active, setActive }) {
  return <div className="tab-shell"><nav className="tabs" aria-label="Product sections">{tabs.map((tab, index) => <button key={tab} className={active === index ? "active" : ""} onClick={() => setActive(index)}><span>0{index + 1}</span>{tab}</button>)}</nav></div>;
}

function Discovery({ onResult }) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState(["Lagos", "Accra", "London"]);
  const [minRating, setMinRating] = useState(4);
  const [run, setRun] = useState({ status: "idle", message: "" });
  const cityText = useMemo(() => cities.join(" · "), [cities]);

  function toggleCity(city) {
    setRun({ status: "idle", message: "" });
    setCities((current) => current.includes(city) ? current.filter((item) => item !== city) : current.length < 5 ? [...current, city] : current);
  }

  async function discover(event) {
    event.preventDefault();
    if (query.trim().length < 2 || cities.length < 2) {
      setRun({ status: "error", message: "Describe the scene and choose at least two cities." });
      return;
    }
    setRun({ status: "loading", message: "Resolving the signal and reading each city…" });
    try {
      const response = await fetch(`${apiBaseUrl}/api/city-pulse`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: query.trim(), cities, constraints: { minRating, takePerMarket: 6 } }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "COMPLETE") throw new Error(result.reason ?? "City discovery did not complete.");
      setRun({ status: "complete", message: result.selectedCity ? `${result.selectedCity} has the strongest supported venue leads (${result.confidence.level} confidence).` : "No city has a sufficiently supported venue lead yet." });
      onResult(result);
    } catch (error) {
      setRun({ status: "error", message: error instanceof Error ? error.message : "The Qloo request failed." });
    }
  }

  const loading = run.status === "loading";
  return <div className="panel brief-panel discover-panel" id="discover">
    <div className="brief-heading">
      <p className="eyebrow"><span>SEARCH / 01</span> DEFINE THE NIGHT</p>
      <h2>What are you<br />looking for?</h2>
      <p>No fixed artist. Search the cultural feeling, then compare where it lands best.</p>
      <div className="truth-note"><strong>REAL DATA</strong><span>Qloo taste tags + place recommendations</span><small>Not a scheduled-events or ticket feed.</small></div>
    </div>
    <form className="brief-form search-form" onSubmit={discover}>
      <label><span>Scene, mood, cuisine, or genre</span><input aria-label="Scene search" value={query} placeholder="Try “Afrobeats parties”" onChange={(e) => { setQuery(e.target.value); setRun({ status: "idle", message: "" }); }} /></label>
      <div className="suggestions" aria-label="Suggested searches">{suggestions.map((item) => <button type="button" key={item} onClick={() => setQuery(item)}>{item}</button>)}</div>
      <fieldset><legend>Compare cities <small>choose 2–5</small></legend><div className="city-pills">{cityOptions.map((city) => <button type="button" key={city} aria-pressed={cities.includes(city)} onClick={() => toggleCity(city)} className={cities.includes(city) ? "selected" : ""}>{city}</button>)}</div></fieldset>
      <label className="rating-field"><span>Minimum place rating</span><select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}><option value="3.5">3.5+</option><option value="4">4.0+</option><option value="4.5">4.5+</option></select></label>
      <button className="button button-gold" type="submit" disabled={loading}>{loading ? "Reading the cities…" : "Find the best scene"} <Arrow /></button>
      {run.message && <p className={run.status === "error" ? "run-error" : "run-status"} role={run.status === "error" ? "alert" : "status"}>{run.message}</p>}
    </form>
    <aside className={`compiled-card ${run.status === "complete" ? "is-ready" : ""}`} aria-live="polite">
      <div className="radar"><i /><i /><i /><span /></div><p className="eyebrow"><span>CITY FIELD / LIVE</span></p>
      <h3>{loading ? "Scanning cultural fit." : query ? `“${query}”` : "Awaiting a scene."}</h3>
      <dl><div><dt>Query</dt><dd>{query || "Type anything cultural"}</dd></div><div><dt>Markets</dt><dd>{cityText || "Choose at least two"}</dd></div><div><dt>Source</dt><dd>Qloo Tags + Insights API</dd></div><div><dt>Scope</dt><dd>Places, not event dates</dd></div></dl>
      <small>SceneSet never invents availability, schedules, or ticket inventory.</small>
    </aside>
  </div>;
}

function CityPulse({ result }) {
  if (!result) return <div className="panel empty-panel"><p className="eyebrow"><span>PULSE / 02</span> NO RESULT YET</p><h2>Search first.<br />Then compare.</h2><p>Run a live city search to populate the ranked shortlist.</p></div>;
  return <div className="panel pulse-panel">
    <div className="pulse-heading"><p className="eyebrow"><span>PULSE / 02</span> CULTURAL EVIDENCE</p><h2>{result.selectedCity ?? "No clear city"}<br /><em>{result.selectedCity ? "leads—with caveats." : "yet."}</em></h2><p>Qloo resolved your search to {result.intent.tags.length} taste signals. SceneSet checked each returned place for relevant venue evidence and your rating threshold.</p><div className="tag-cloud">{result.intent.tags.map((tag) => <span key={tag.id}>{tag.name}</span>)}</div><div className={`confidence-card confidence-${result.confidence.level}`}><strong>{result.confidence.level} confidence · evidence strength, not probability</strong><p>{result.confidence.summary}</p>{result.confidence.reasons.map((reason) => <small key={reason}>{reason}</small>)}</div><div className="scope-card"><strong>Next step</strong><p>Open a venue link or map and confirm its current programme directly before travelling.</p><small>{result.refinement.attempted ? `A narrower Qloo search was tried: ${result.refinement.tagQuery}. ` : ""}Events, opening hours, tickets, and availability are unverified.</small></div></div>
    <div className="city-results">{result.comparisons.map((market, index) => <article className={`city-result ${result.selectedCity === market.city ? "winner" : ""}`} key={market.city} style={{ "--delay": `${index * 80}ms` }}><header><span>0{index + 1}</span><h3>{market.city}</h3><strong>{market.score} <small>evidence pts</small></strong></header><p className="market-explanation">{market.explanation} {market.rejectedCount} of {market.candidateCount} returned places excluded.</p><div className="place-list">{market.topPlaces.length ? market.topPlaces.map((place) => <div className="place-card" key={place.id}><div className="place-title"><strong>{place.name}</strong><span>{place.fit.level === "direct" ? "Cultural mention" : "Venue lead"}</span></div><p>{place.venue.description ?? place.venue.category ?? "Qloo place listing"}</p><small>{place.fit.reason}</small><div className="place-meta">{place.venue.rating && <span>★ {place.venue.rating}</span>}{place.venue.category && <span>{place.venue.category}</span>}{place.venue.address && <span>{place.venue.address}</span>}</div><div className="place-actions">{place.venue.website && <a href={place.venue.website} target="_blank" rel="noopener noreferrer">Venue website ↗</a>}<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.name, place.venue.address, market.city].filter(Boolean).join(", "))}`} target="_blank" rel="noopener noreferrer">Find on map ↗</a></div></div>) : <p className="no-place">No returned venue cleared the cultural and quality checks.</p>}</div>{result.selectedCity === market.city && <footer>BEST SUPPORTED LEAD · CHECK CURRENT EVENTS</footer>}</article>)}</div>
  </div>;
}

function Receipt({ result }) {
  const receipt = result?.receipt;
  return <div className="panel receipt-panel"><div className="receipt-art" aria-hidden="true"><img src="/scene-blueprint.png" alt="" /></div><div className="receipt-paper">
    <div className="receipt-title"><Mark /><span>TASTE RECEIPT</span><small>{receipt ? "LIVE / SEALED" : "AWAITING SEARCH"}</small></div>
    <div className="receipt-hash">SHA-256&nbsp;&nbsp;{receipt?.integrity.hash ?? "— — — — — — — — — — — — — — — —"}</div>
    <div className="receipt-grid"><div><small>QUERY PROVENANCE</small><strong>{receipt ? `${receipt.resolvedTags.length} Qloo tags` : "Qloo tags only"}</strong></div><div><small>SCORER</small><strong>Cultural evidence v2</strong></div><div><small>PROVIDER CALLS</small><strong>{receipt ? receipt.providerCalls.length : "—"}</strong></div><div><small>SEAL STATUS</small><strong>{receipt ? "Integrity sealed" : "Not generated"}</strong></div></div>
    <p>A canonical record of the query, resolved taste tags, request fingerprints, place candidates, ranking policy, and selected city. Change one byte and verification fails.</p>
    <button className="button button-ink" disabled={!receipt}>{receipt ? `Selected: ${result.selectedCity ?? "No supported city"}` : "Search to generate proof"}</button>
  </div></div>;
}

function Evidence({ result }) {
  return <div className="panel evidence-panel" id="evidence"><div><p className="eyebrow light"><span>PROOF / 04</span> CURRENTLY VERIFIED</p><h2>Built to survive<br />the second question.</h2></div><div className="proof-list">
    <article><span>PASS</span><div><h3>Type-safe agent backend</h3><p>Eve, TypeScript, and Nitro compile without errors.</p></div></article>
    <article><span>TESTED</span><div><h3>Deterministic tests</h3><p>Discovery, ranking, refinement, receipt integrity, and Qloo contracts are covered.</p></div></article>
    <article><span>LIVE</span><div><h3>Qloo-grounded discovery</h3><p>Free-text intent resolves to Qloo tags before any place ranking occurs.</p></div></article>
    <article className={result ? "" : "pending"}><span>{result ? "SEALED" : "READY"}</span><div><h3>Browser-visible evidence</h3><p>{result ? `${result.receipt.providerCalls.length} provider calls sealed; ${result.confidence.level} confidence${result.selectedCity ? ` in ${result.selectedCity}` : " with no selected city"}.` : "Run a search to generate a tamper-evident receipt."}</p></div></article>
  </div></div>;
}

function App() {
  const [active, setActive] = useState(0); const [result, setResult] = useState(null);
  function start() { setActive(0); window.setTimeout(() => document.querySelector(".tab-shell")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); }
  return <div className="app-shell"><Topbar live={Boolean(result)} /><Hero onStart={start} /><TabRail active={active} setActive={setActive} /><section className="content-stage">{active === 0 && <Discovery onResult={(value) => { setResult(value); setActive(1); }} />}{active === 1 && <CityPulse result={result} />}{active === 2 && <Receipt result={result} />}{active === 3 && <Evidence result={result} />}</section><footer><div><Mark /><strong>SCENESET</strong></div><p>Culture is not a demographic.<br />Search accordingly.</p><div className="footer-meta"><span>QLOO AGENTIC HACKATHON</span><span>BUILD / 2026</span></div></footer></div>;
}

createRoot(document.getElementById("root")).render(<App />);
