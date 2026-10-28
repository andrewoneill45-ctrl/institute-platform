/* Horizon — forecasts and policy levers, by invitation. Five rooms on one
   page: Forecasts, Falling rolls, Funding, Accountability and SEND. Every
   model runs in the browser on the published national data; every
   assumption is a control on the left; every view downloads as a page for a
   position paper. Access: administrators, and members the administrator has
   ticked for Horizon in Accounts. */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { getDataset, getPlaces, getIntake } from "../../lib/dataset.js";
import { PZ_CSS, attachTipCard } from "../prizm/render.js";
import { scopeSchools, forecastRolls, forecastDemand, forecastResults, placesSim, fundingSim, FUND_PRESETS, accountabilitySim, ACC_MEASURES, sendSim } from "./models.js";
import { forecastsHtml, placesSimHtml, fundingHtml, accountabilityHtml, sendHtml, horizonDoc } from "./views.js";

const INK = "#221233", PURPLE = "#6A0CA0", DEEP = "#4B0875", GOLD = "#C6A035", MUTED = "#6F6580";
const TABS = [["forecast", "Forecasts"], ["rolls", "Falling rolls"], ["funding", "Funding"], ["acc", "Accountability"], ["send", "SEND"]];
const REGIONS = ["North East", "North West", "Yorkshire and the Humber", "East Midlands", "West Midlands", "East of England", "London", "South East", "South West"];
let sendPromise = null;
const getSend = () => (sendPromise = sendPromise || fetch("/data/send.json").then((r) => r.json()).catch(() => { sendPromise = null; return null; }));

const lab = { display: "grid", gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: MUTED, textTransform: "uppercase" };
const fld = { boxSizing: "border-box", padding: "8px 10px", borderRadius: 9, border: "1px solid rgba(34,18,51,.16)", fontSize: 13, background: "#fff", fontFamily: "inherit", color: INK, width: "100%" };

export function horizonAllowed(user) { return !!(user && (user.isAdmin || user.horizonAccess)); }

export default function Horizon() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ok = horizonAllowed(user);
  const [all, setAll] = useState(null);
  const [places, setPlaces] = useState(null);
  const [intake, setIntake] = useState(null);
  const [send, setSend] = useState(null);
  const [tab, setTab] = useState("forecast");
  const [phase, setPhase] = useState("secondary");
  const [scType, setScType] = useState("england");
  const [scName, setScName] = useState("");
  /* lever settings */
  const [minPer, setMinPer] = useState("");
  const [shift, setShift] = useState(0.5);
  const [close, setClose] = useState([]);
  const [fund, setFund] = useState({ preset: "inclusion", potM: 250, neutral: false, ...FUND_PRESETS.inclusion });
  const [accW, setAccW] = useState({ a8: 1, b95: 0, dis: 1, odds: 1, att: 0.5, incl: 0.5, dest: 0, rwm: 1, high: 0 });
  const [growth, setGrowth] = useState("trend");
  const [custom, setCustom] = useState(8);
  const [incl, setIncl] = useState(0);
  const [heavy, setHeavy] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ok) return;
    /* the models need every field, so they wait for the detail to merge */
    getDataset().then((d) => setAll(d && d.raw ? d.raw : null)).catch(() => {});
    getPlaces().then((d) => d && setPlaces(d));
    getIntake().then((d) => d && setIntake(d));
    getSend().then((d) => d && setSend(d));
  }, [ok]);
  useEffect(() => attachTipCard(document, (u) => navigate(`/members/prizm?school=${encodeURIComponent(u)}`)), [navigate]);

  const PRI = phase === "primary";
  const scope = useMemo(() => (scType === "england" ? { type: "england", phase: PRI ? "primary" : undefined } : { type: scType, name: scName, phase: PRI ? "primary" : undefined }), [scType, scName, PRI]);
  const schools = useMemo(() => (all && (scType === "england" || scName) ? scopeSchools(all, scope) : []), [all, scope, scType, scName]);
  const label = scType === "england" ? "England" : scName || "…";
  const names = useMemo(() => {
    if (!all) return [];
    const k = scType === "la" ? "la" : scType === "trust" ? "trust" : null;
    if (!k) return [];
    return [...new Set(all.map((s) => s[k]).filter((v) => v && v !== "Not supported by a trust"))].sort();
  }, [all, scType]);
  useEffect(() => { setClose([]); }, [scType, scName, phase]);

  /* the two models that walk every school's twins run off the main beat */
  useEffect(() => {
    if (!all || !schools.length || (tab !== "forecast" && tab !== "acc")) { setHeavy(null); return; }
    setBusy(true);
    const t = setTimeout(() => {
      try {
        if (tab === "forecast") setHeavy({ tab, v: forecastResults(schools, all, PRI, intake) });
        else setHeavy({ tab, v: accountabilitySim(all, PRI, intake, accW, scType === "england" ? null : schools) });
      } finally { setBusy(false); }
    }, 30);
    return () => clearTimeout(t);
  }, [all, schools, tab, PRI, intake, accW, scType]);

  const html = useMemo(() => {
    if (!all || !schools.length) return "";
    if (tab === "forecast") return places ? forecastsHtml({ label, PRI, rolls: forecastRolls(schools, places, PRI), demand: forecastDemand(schools, places, PRI), results: heavy && heavy.tab === "forecast" ? heavy.v : null }) : "";
    if (tab === "rolls") return places ? placesSimHtml({ label, PRI, sim: placesSim(schools, places, PRI, { minPerYear: +minPer || undefined, demandShift: shift, close }) }) : "";
    if (tab === "funding") return fundingHtml({ label, sim: fundingSim(scType === "england" ? schools : scopeSchools(all, { type: "england", phase: PRI ? "primary" : undefined }), { ...fund, PRI }, scType === "england" ? null : new Set(schools.map((s) => String(s.urn)))) });
    if (tab === "acc") return heavy && heavy.tab === "acc" ? accountabilityHtml({ label, sim: heavy.v }) : "";
    if (tab === "send") {
      if (!send) return "";
      const las = scType === "england" ? null : new Set(schools.map((s) => s.la).filter(Boolean));
      return sendHtml({ label, sim: sendSim(send, { growth: growth === "custom" ? +custom : growth, shift: incl }, las) });
    }
    return "";
  }, [all, schools, tab, places, label, PRI, heavy, minPer, shift, close, fund, send, growth, custom, incl, scType]);

  const rollsList = useMemo(() => (tab === "rolls" && places && schools.length ? placesSim(schools, places, PRI, { minPerYear: +minPer || undefined, demandShift: shift }).rows.slice(0, 30) : []), [tab, places, schools, PRI, minPer, shift]);

  function download() {
    const T = TABS.find((t) => t[0] === tab)[1];
    const params = `${label} · ${PRI ? "primary" : "secondary"} · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
    const doc = horizonDoc(`${T}: ${label}`, params, html, PZ_CSS);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
    a.download = `horizon-${tab}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    a.click();
  }

  if (!ok) {
    return (
      <div style={{ maxWidth: 560, margin: "80px auto", textAlign: "center", padding: "0 16px" }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 34, color: INK, margin: 0 }}>Horizon</h1>
        <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.55 }}>Forecasts and policy levers for the whole system. Horizon is by invitation; ask the Institute if you would like access.</p>
      </div>
    );
  }

  const ready = all && (tab === "funding" || (tab === "send" ? send : places));
  return (
    <div style={{ padding: "26px 22px 60px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", color: GOLD, textTransform: "uppercase" }}>By invitation · modelling</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 40, color: INK, margin: "4px 0 2px", letterSpacing: "-.01em" }}>Horizon</h1>
          <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Where the system is heading, and what each lever would do. Every figure is &ldquo;if this held&rdquo;.</p>
        </div>
        <button onClick={download} disabled={!html} style={{ border: "none", cursor: html ? "pointer" : "default", background: `linear-gradient(135deg,${PURPLE},${DEEP})`, color: "#fff", borderRadius: 999, padding: "11px 20px", fontSize: 13, fontWeight: 600, fontFamily: "inherit", opacity: html ? 1 : 0.5 }}>Download for a paper</button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "20px 0 0", borderBottom: "1px solid rgba(34,18,51,.1)" }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "10px 14px", fontSize: 14, fontWeight: 600, fontFamily: "inherit", color: tab === k ? INK : MUTED, borderBottom: `2.5px solid ${tab === k ? GOLD : "transparent"}`, marginBottom: -1 }}>{l}</button>
        ))}
      </div>

      <div className="hz-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 26, marginTop: 22, alignItems: "start" }}>
        <aside style={{ position: "sticky", top: 12, display: "grid", gap: 14, background: "#fff", borderRadius: 18, padding: "18px 18px 20px", boxShadow: "0 1px 2px rgba(34,18,51,.04), 0 16px 44px rgba(34,18,51,.08)" }}>
          <div style={{ display: "flex", background: "#F4EEFA", borderRadius: 999, padding: 3 }}>
            {[["secondary", "Secondary"], ["primary", "Primary"]].map(([k, l]) => (
              <button key={k} onClick={() => setPhase(k)} style={{ flex: 1, border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 0", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", background: phase === k ? "#fff" : "transparent", color: phase === k ? DEEP : MUTED, boxShadow: phase === k ? "0 1px 3px rgba(34,18,51,.12)" : "none" }}>{l}</button>
            ))}
          </div>
          <label style={lab}>Area
            <select style={fld} value={scType} onChange={(e) => { setScType(e.target.value); setScName(e.target.value === "region" ? "London" : ""); }}>
              <option value="england">England</option><option value="region">A region</option><option value="la">A local authority</option><option value="trust">A trust</option>
            </select>
          </label>
          {scType === "region" && <select style={fld} value={scName} onChange={(e) => setScName(e.target.value)}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>}
          {(scType === "la" || scType === "trust") && (<>
            <input style={fld} list="hz-names" value={scName} onChange={(e) => setScName(e.target.value)} placeholder={scType === "la" ? "Start typing an authority" : "Start typing a trust"} />
            <datalist id="hz-names">{names.map((n) => <option key={n} value={n} />)}</datalist>
          </>)}
          <div style={{ fontSize: 12, color: MUTED }}>{all ? `${schools.length.toLocaleString("en-GB")} ${PRI ? "primaries" : "secondaries"} in scope` : "The national dataset is arriving…"}</div>
          <hr style={{ border: "none", borderTop: "1px solid rgba(34,18,51,.08)", margin: "2px 0" }} />

          {tab === "forecast" && <p style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>Rolls carried forward by the authorities&rsquo; planning-area forecasts; demand by its five-year trend; results by how far schools hold their distance from their twins. Change the area or phase to re-run.</p>}

          {tab === "rolls" && (<>
            <label style={lab}>Smallest viable year group
              <input style={fld} type="number" min="10" step="5" value={minPer} placeholder={PRI ? "30 (one form of entry)" : "120 (four forms)"} onChange={(e) => setMinPer(e.target.value)} />
            </label>
            <label style={lab}>Demand shift
              <select style={fld} value={shift} onChange={(e) => setShift(+e.target.value)}>
                <option value={0}>Off: every school shrinks with its area</option>
                <option value={0.5}>Half: shares follow first preferences, damped</option>
                <option value={1}>Full: shares follow the five-year trend</option>
              </select>
            </label>
            <div style={lab}>Close schools (try it)
              <div style={{ maxHeight: 260, overflow: "auto", display: "grid", gap: 4, fontWeight: 500, letterSpacing: 0, textTransform: "none", fontSize: 12.5, color: INK }}>
                {rollsList.map((r) => (
                  <label key={r.urn} style={{ display: "flex", gap: 7, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" checked={close.includes(String(r.urn))} onChange={(e) => setClose((c) => (e.target.checked ? [...c, String(r.urn)] : c.filter((x) => x !== String(r.urn))))} style={{ accentColor: PURPLE, marginTop: 2 }} />
                    <span>{r.name} <span style={{ color: r.risk ? "#B4475A" : MUTED }}>{r.fill}%</span></span>
                  </label>
                ))}
                {!rollsList.length && <span style={{ color: MUTED }}>Choose an area to list its schools.</span>}
              </div>
            </div>
          </>)}

          {tab === "funding" && (<>
            <label style={lab}>Model
              <select style={fld} value={fund.preset} onChange={(e) => setFund((f) => ({ ...f, preset: e.target.value, ...(FUND_PRESETS[e.target.value] || {}) }))}>
                {Object.entries(FUND_PRESETS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                <option value="custom">My own weights</option>
              </select>
            </label>
            <label style={lab}>Pot (£ millions)
              <input style={fld} type="number" min="1" step="10" value={fund.potM} onChange={(e) => setFund((f) => ({ ...f, potM: +e.target.value || 0 }))} />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: INK, fontWeight: 600, cursor: "pointer" }}>
              <input type="checkbox" checked={fund.neutral} onChange={(e) => setFund((f) => ({ ...f, neutral: e.target.checked }))} style={{ accentColor: PURPLE }} />
              Budget-neutral (top-slice every school)
            </label>
            {[["fsm", "Per FSM pupil"], ["senk", "Per SEN support pupil"], ["ehcp", "Per EHC plan"], ["eal", "Per EAL pupil"], ["idaci", "Area deprivation"]].map(([k, l]) => (
              <label key={k} style={{ ...lab, gridTemplateColumns: "1fr 70px", alignItems: "center" }}>{l}
                <input style={fld} type="number" min="0" step="0.5" value={fund[k]} onChange={(e) => setFund((f) => ({ ...f, preset: "custom", [k]: +e.target.value || 0 }))} />
              </label>
            ))}
            <p style={{ margin: 0, fontSize: 11.5, color: MUTED }}>Weights are relative: an EHC plan at 4 draws four times what an FSM pupil at 1 does.</p>
          </>)}

          {tab === "acc" && (<>
            <p style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>Today&rsquo;s league uses {PRI ? "RWM expected standard" : "Attainment 8"} alone. Weight a proposed measure:</p>
            {ACC_MEASURES[PRI ? "P" : "S"].map((m) => (
              <label key={m.k} style={{ ...lab, letterSpacing: 0, textTransform: "none", fontSize: 12.5, color: INK, fontWeight: 600 }}>
                <span style={{ display: "flex", justifyContent: "space-between" }}>{m.label}<b style={{ color: PURPLE }}>{accW[m.k] ?? 0}</b></span>
                <input type="range" min="0" max="2" step="0.5" value={accW[m.k] ?? 0} onChange={(e) => setAccW((w) => ({ ...w, [m.k]: +e.target.value }))} style={{ accentColor: PURPLE }} />
              </label>
            ))}
          </>)}

          {tab === "send" && (<>
            <label style={lab}>EHC plan growth
              <select style={fld} value={growth} onChange={(e) => setGrowth(e.target.value)}>
                <option value="trend">Each authority&rsquo;s five-year trend</option>
                <option value="half">Half that trend</option>
                <option value="flat">No further growth</option>
                <option value="custom">A rate I set</option>
              </select>
            </label>
            {growth === "custom" && <label style={lab}>% a year<input style={fld} type="number" step="0.5" value={custom} onChange={(e) => setCustom(e.target.value)} /></label>}
            <label style={{ ...lab, letterSpacing: 0, textTransform: "none", fontSize: 12.5, color: INK, fontWeight: 600 }}>
              <span style={{ display: "flex", justifyContent: "space-between" }}>New specialist demand met in mainstream<b style={{ color: PURPLE }}>{incl}%</b></span>
              <input type="range" min="0" max="100" step="5" value={incl} onChange={(e) => setIncl(+e.target.value)} style={{ accentColor: PURPLE }} />
            </label>
          </>)}
        </aside>

        <section style={{ minWidth: 0 }}>
          <style>{PZ_CSS}{`.hz-out .pz-block{margin-top:0}.hz-out .pz-block+.pz-block{margin-top:34px}@media(max-width:880px){.hz-grid{grid-template-columns:1fr!important}}`}</style>
          {!ready || (!html && (busy || !all)) ? (
            <div style={{ color: MUTED, fontSize: 14, padding: "40px 0" }}>{busy ? "Walking every school's twins across England…" : "The national data is arriving…"}</div>
          ) : !schools.length ? (
            <div style={{ color: MUTED, fontSize: 14, padding: "40px 0" }}>Choose an area to model.</div>
          ) : (
            <div className="pz-report hz-out" style={{ padding: "26px 30px", background: "#FBFAF7", borderRadius: 18 }}>
              {busy && <div style={{ color: MUTED, fontSize: 12.5, marginBottom: 10 }}>Re-running the model…</div>}
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
