import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { downloadReceipt, verifyReceiptInBrowser } from "./receipt";
import "./styles.css";

const tabs = ["Discover", "City pulse", "Taste receipt", "Evidence"];
const cityOptions = ["Lagos", "Accra", "London", "Nairobi", "Johannesburg"];
const suggestions = ["Afrobeats parties", "Late-night jazz", "Art + fashion", "Food + live music"];
const apiBaseUrl = (import.meta.env.VITE_SCENESET_API_URL ?? "http://127.0.0.1:2000").replace(/\/$/, "");
const chatEnabled = import.meta.env.VITE_SCENESET_CHAT_ENABLED === "true";
const EveBridge = React.lazy(() => import("./eve-bridge"));

function Mark() {
  return <span className="mark" aria-hidden="true"><span className="mark-ring" /><span className="mark-axis mark-axis-x" /><span className="mark-axis mark-axis-y" /></span>;
}

function Arrow() { return <span aria-hidden="true">↗</span>; }

function Topbar({ live }) {
  return <header className="topbar">
    <a className="brand" href="#top" aria-label="SceneSet home"><Mark /><span>SCENESET</span></a>
    <nav className="utility-nav" aria-label="Utility navigation"><a href="#discover">Discover</a><a href="#evidence">Evidence</a><span className="online"><i /> {live ? "Qloo result loaded" : "Qloo-backed search"}</span></nav>
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

function Discovery({ onResult, onSearch }) {
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
      const brief = { query: query.trim(), cities, constraints: { minRating, takePerMarket: 6 } };
      if (chatEnabled) {
        await onSearch(brief);
        setRun({ status: "complete", message: "Eve is reading the city evidence. The result will appear in City pulse." });
      } else {
        const response = await fetch(`${apiBaseUrl}/api/city-pulse`, {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(brief),
        });
        const result = await response.json();
        if (!response.ok || result.status !== "COMPLETE") throw new Error(result.reason ?? "City discovery did not complete.");
        setRun({ status: "complete", message: result.selectedCity ? `${result.selectedCity} has the strongest supported venue leads (${result.confidence.level} confidence).` : "No city has a sufficiently supported venue lead yet." });
        onResult(result);
      }
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

function EvePanel({ agent, onFollowUp }) {
  const [message, setMessage] = useState("");
  const busy = agent.status === "submitted" || agent.status === "streaming" || agent.status === "resuming";
  return <section className="eve-panel" aria-label="Eve conversation">
    <p className="eyebrow"><span>EVE / FOLLOW-UP</span> TOOL-BACKED CONVERSATION</p>
    <div className="eve-messages" aria-live="polite">{agent.data.messages.filter((item) => item.role === "assistant").map((item) => <article key={item.id}>{item.parts.map((part, index) => part.type === "text" ? <p key={part.id ?? index}>{part.text}</p> : part.type === "dynamic-tool" ? <small key={part.toolCallId}>{part.toolMetadata?.eve?.label ?? "Checking venue evidence"}</small> : null)}</article>)}</div>
    {agent.error && <p className="run-error" role="alert">Eve chat is unavailable. Guided refinements below still work.</p>}
    <form onSubmit={(event) => { event.preventDefault(); const value = message.trim(); if (!value || busy) return; setMessage(""); onFollowUp(value); }}><label htmlFor="eve-followup">Ask Eve a follow-up</label><div><input id="eve-followup" value={message} maxLength={500} onChange={(event) => setMessage(event.target.value)} placeholder="Why Lagos? Exclude a venue…" disabled={busy} /><button className="button button-ink" type="submit" disabled={busy || !message.trim()}>{busy ? "Reading…" : "Ask Eve"}</button></div></form>
  </section>;
}

function GuidedFollowUps({ result, onRefine, busy, note, agent }) {
  const [query, setQuery] = useState(result.receipt.inputs.query);
  const [excludedId, setExcludedId] = useState("");
  const places = result.comparisons.flatMap((market) => market.topPlaces);
  return <section className="guided-panel" aria-label="Guided refinements">
    <p className="eyebrow"><span>CHALLENGE / REFINE</span> ASK THE SECOND QUESTION</p>
    {chatEnabled ? <EvePanel agent={agent} onFollowUp={(message) => { void agent.send(message); }} /> : <p className="guided-fallback">Free-form Eve chat is off in this demo. These guided, deterministic refinements remain available.</p>}
    <div className="guided-actions"><button type="button" disabled={busy} onClick={() => onRefine({ action: "explain" })}>Why this ranking?</button><button type="button" disabled={busy} onClick={() => onRefine({ action: "alternatives" })}>Show alternatives</button></div>
    <div className="guided-fields"><label>Exclude a venue<select value={excludedId} disabled={!places.length} onChange={(event) => setExcludedId(event.target.value)}><option value="">{places.length ? "Choose a venue" : "No supported venue to exclude"}</option>{places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label><button type="button" disabled={busy || !excludedId || !places.length} onClick={() => { onRefine({ action: "exclude", excludePlaceIds: [excludedId] }); setExcludedId(""); }}>Exclude and compare</button></div>
    <form className="guided-fields" onSubmit={(event) => { event.preventDefault(); if (query.trim().length >= 2) onRefine({ action: "refine", query: query.trim() }); }}><label>Change the cultural search<input value={query} maxLength={120} onChange={(event) => setQuery(event.target.value)} /></label><button type="submit" disabled={busy || query.trim().length < 2}>Search again</button></form>
    {note && <p className={note.error ? "run-error" : "run-status"} role={note.error ? "alert" : "status"}>{note.text}</p>}
  </section>;
}

function CityPulse({ result, previous, change, onRefine, refining, note, agent }) {
  if (!result) return <div className="panel empty-panel"><p className="eyebrow"><span>PULSE / 02</span> NO RESULT YET</p><h2>Search first.<br />Then compare.</h2><p>Run a live city search to populate the ranked shortlist.</p></div>;
  return <div className="panel pulse-panel">
    <div className="pulse-heading"><p className="eyebrow"><span>PULSE / 02</span> CULTURAL EVIDENCE</p><h2>{result.selectedCity ?? "No clear city"}<br /><em>{result.selectedCity ? "leads—with caveats." : "yet."}</em></h2><p>Qloo resolved your search to {result.intent.tags.length} taste signals. SceneSet checked each returned place for relevant venue evidence and your rating threshold.</p><div className="tag-cloud">{result.intent.tags.map((tag) => <span key={tag.id}>{tag.name}</span>)}</div><div className={`confidence-card confidence-${result.confidence.level}`}><strong>{result.confidence.level} confidence · evidence strength, not probability</strong><p>{result.confidence.summary}</p>{result.confidence.reasons.map((reason) => <small key={reason}>{reason}</small>)}</div><div className="scope-card"><strong>Next step</strong><p>{result.selectedCity ? "Open a venue link or map and confirm its current programme directly before travelling." : "No returned place cleared the evidence checks. Try a more specific scene, compare different cities, or lower the rating threshold. This does not mean no suitable venue exists."}</p><small>{result.refinement.attempted ? `A narrower Qloo search was tried: ${result.refinement.tagQuery}. ` : ""}Events, opening hours, tickets, and availability are unverified.</small></div></div>
    <div className="city-results">{previous && change && <div className="comparison-strip"><strong>Before → after</strong><span>{previous.selectedCity ?? "No supported city"} ({previous.confidence.level}) → {result.selectedCity ?? "No supported city"} ({result.confidence.level})</span><small>{change.changed?.join(" · ") || "No preferences changed"} · Qloo {change.qlooCalled ? "called" : "not called"}</small></div>}{result.comparisons.map((market, index) => <article className={`city-result ${result.selectedCity === market.city ? "winner" : ""}`} key={market.city} style={{ "--delay": `${index * 80}ms` }}><header><span>0{index + 1}</span><h3>{market.city}</h3><strong>{market.score} <small>evidence pts</small></strong></header><p className="market-explanation">{market.explanation} {market.rejectedCount} of {market.candidateCount} returned places excluded.</p><div className="place-list">{market.topPlaces.length ? market.topPlaces.map((place) => <div className="place-card" key={place.id}><div className="place-title"><strong>{place.name}</strong><span>{place.fit.level === "direct" ? "Cultural mention" : "Venue lead"}</span></div><p>{place.venue.description ?? place.venue.category ?? "Qloo place listing"}</p><small>{place.fit.reason}</small><div className="place-meta">{place.venue.rating && <span>★ {place.venue.rating}</span>}{place.venue.category && <span>{place.venue.category}</span>}{place.venue.address && <span>{place.venue.address}</span>}</div><div className="place-actions">{place.venue.website && <a href={place.venue.website} target="_blank" rel="noopener noreferrer">Venue website ↗</a>}<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.name, place.venue.address, market.city].filter(Boolean).join(", "))}`} target="_blank" rel="noopener noreferrer">Find on map ↗</a></div></div>) : <p className="no-place">No returned venue cleared the cultural and quality checks.</p>}</div>{result.selectedCity === market.city && <footer>BEST SUPPORTED LEAD · CHECK CURRENT EVENTS</footer>}</article>)}<GuidedFollowUps key={result.receipt.createdAt} result={result} onRefine={onRefine} busy={refining} note={note} agent={agent} /></div>
  </div>;
}

function Receipt({ result }) {
  const receipt = result?.receipt;
  const [verification, setVerification] = useState("");
  useEffect(() => { setVerification(""); }, [receipt?.integrity.hash]);
  async function check(value) {
    try { setVerification(await verifyReceiptInBrowser(value) ? "Embedded hash matches. This does not prove Qloo provenance or real-world accuracy." : "Mismatch: receipt contents differ from the embedded hash."); }
    catch { setVerification("Could not read this receipt as valid JSON."); }
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 128_000) { setVerification("Receipt file is too large (128 KB maximum)."); return; }
    try { await check(JSON.parse(await file.text())); } catch { setVerification("Could not read this receipt as valid JSON."); }
    event.target.value = "";
  }
  return <div className="panel receipt-panel"><div className="receipt-art" aria-hidden="true"><img src="/scene-blueprint.png" alt="" /></div><div className="receipt-paper">
    <div className="receipt-title"><Mark /><span>TASTE RECEIPT</span><small>{receipt ? "LIVE / SEALED" : "AWAITING SEARCH"}</small></div>
    <div className="receipt-hash">SHA-256&nbsp;&nbsp;{receipt?.integrity.hash ?? "— — — — — — — — — — — — — — — —"}</div>
    <div className="receipt-grid"><div><small>QUERY RECORD</small><strong>{receipt ? `${receipt.resolvedTags.length} Qloo tags` : "Qloo tags only"}</strong></div><div><small>SCORER</small><strong>{receipt?.scorerVersion ?? "Cultural evidence v2.1"}</strong></div><div><small>PROVIDER CALLS</small><strong>{receipt ? receipt.providerCalls.length : "—"}</strong></div><div><small>REFINEMENTS</small><strong>{receipt?.refinementHistory?.length ?? "—"}</strong></div></div>
    <p>A canonical record of the query, tag resolution, request fingerprints, venue evidence, refinements, and decision. Its unkeyed hash checks internal consistency only—not Qloo provenance, current events, or real-world accuracy.</p>
    <div className="receipt-actions"><button className="button button-ink" disabled={!receipt} onClick={() => receipt && downloadReceipt(receipt)}>Download JSON receipt</button><button type="button" disabled={!receipt} onClick={() => receipt && check(receipt)}>Verify current receipt</button><label>Verify a saved receipt<input type="file" accept=".json,application/json" onChange={upload} /></label></div>
    {verification && <p role="status" className="receipt-verification">{verification}</p>}
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

function SceneApp({ agent }) {
  const [active, setActive] = useState(0);
  const [result, setResult] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [change, setChange] = useState(null);
  const [refining, setRefining] = useState(false);
  const [note, setNote] = useState(null);
  const handledTools = useRef(new Set());
  const pendingBrief = useRef(null);
  async function fallbackDiscovery(brief) {
    const response = await fetch(`${apiBaseUrl}/api/city-pulse`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(brief) });
    const value = await response.json();
    if (!response.ok || value.status !== "COMPLETE") throw new Error(value.reason ?? "Guided discovery failed.");
    setResult(value); setPrevious(null); setChange(null); setActive(1);
    setNote({ text: "Eve chat is unavailable. Qloo-backed guided discovery and follow-ups remain usable." });
  }
  useEffect(() => {
    if (!chatEnabled || !agent) return;
    for (const message of agent.data.messages) for (const part of message.parts) {
      if (part.type !== "dynamic-tool" || part.state !== "output-available" || handledTools.current.has(part.toolCallId)) continue;
      handledTools.current.add(part.toolCallId);
      let output = part.output;
      if (typeof output === "string") { try { output = JSON.parse(output); } catch { continue; } }
      const next = output?.result?.status === "COMPLETE" ? output.result : output?.status === "COMPLETE" ? output : null;
      if (next) { pendingBrief.current = null; setResult((current) => { if (current) setPrevious(current); return next; }); setChange(output?.changed ? { changed: output.changed, qlooCalled: output.qlooCalled } : null); setActive(1); }
    }
  }, [agent?.data.messages]);
  useEffect(() => {
    if (!chatEnabled || !agent?.error || !pendingBrief.current) return;
    const brief = pendingBrief.current;
    pendingBrief.current = null;
    void fallbackDiscovery(brief).catch((error) => setNote({ error: true, text: error instanceof Error ? error.message : "Guided discovery failed." }));
  }, [agent?.error]);
  async function startEveSearch(brief) {
    if (!agent) throw new Error("Eve chat is unavailable. Use guided search instead.");
    agent.reset(); handledTools.current.clear(); setPrevious(null); setChange(null);
    pendingBrief.current = brief;
    try { await agent.send(`Discover this scene using discover_city_pulse. Use exactly this structured brief: ${JSON.stringify(brief)}. Report only tool-backed evidence.`); }
    catch { if (pendingBrief.current) { pendingBrief.current = null; await fallbackDiscovery(brief); } }
  }
  async function guidedRefine(request) {
    if (!result || refining) return;
    setRefining(true); setNote({ text: "Reviewing existing evidence…" });
    try {
      const response = await fetch(`${apiBaseUrl}/api/refine-city-pulse`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prior: result, request }) });
      const outcome = await response.json();
      if (!response.ok || outcome.result?.status !== "COMPLETE") throw new Error(outcome.reason ?? outcome.result?.reason ?? "Refinement did not complete.");
      if (outcome.result.receipt.integrity.hash !== result.receipt.integrity.hash) { setPrevious(result); setResult(outcome.result); setChange({ changed: outcome.changed, qlooCalled: outcome.qlooCalled }); }
      setNote({ text: `${outcome.changed.join(" · ")}. Qloo ${outcome.qlooCalled ? "was called" : "was not called"}.` });
    } catch (error) { setNote({ error: true, text: error instanceof Error ? error.message : "Refinement failed." }); }
    finally { setRefining(false); }
  }
  function start() { setActive(0); window.setTimeout(() => document.querySelector(".tab-shell")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); }
  return <div className="app-shell"><Topbar live={Boolean(result)} /><Hero onStart={start} /><TabRail active={active} setActive={setActive} /><section className="content-stage">{active === 0 && <Discovery onSearch={startEveSearch} onResult={(value) => { setResult(value); setPrevious(null); setChange(null); setActive(1); }} />}{active === 1 && <CityPulse result={result} previous={previous} change={change} onRefine={guidedRefine} refining={refining} note={note} agent={agent} />}{active === 2 && <Receipt result={result} />}{active === 3 && <Evidence result={result} />}</section><footer><div><Mark /><strong>SCENESET</strong></div><p>Culture is not a demographic.<br />Search accordingly.</p><div className="footer-meta"><span>QLOO AGENTIC HACKATHON</span><span>BUILD / 2026</span></div></footer></div>;
}

function App() {
  return chatEnabled
    ? <React.Suspense fallback={<p className="app-loading">Preparing Eve…</p>}><EveBridge host={apiBaseUrl}>{(agent) => <SceneApp agent={agent} />}</EveBridge></React.Suspense>
    : <SceneApp agent={null} />;
}

createRoot(document.getElementById("root")).render(<App />);
