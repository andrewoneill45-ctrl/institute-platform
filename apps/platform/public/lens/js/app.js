/* All Saints Catholic College – Inspection Hub app */
(() => {
"use strict";

const params = new URLSearchParams(location.search);
const SCHOOL_MODE = params.get("school") === "ascc" ? "ascc" : "new";
const SCHOOL_NAME = params.get("name") || (SCHOOL_MODE === "ascc" ? "All Saints Catholic College" : "Your school");
const BRAND = {
  purple: "#6A0CA0", purpleLight: "#8E3DBE", purpleFaint: "#D9CFE4",
  gold: "#C6A035", green: "#2F7A39", red: "#B03050", grey: "#B7AFC4", amber: "#C79A3B"
};
let askStance = "critical";
function unlock() {
  const l = document.getElementById("login"); if (l) l.style.display = "none";
  document.getElementById("app").classList.add("active");
  const sn = document.getElementById("school-name"); if (sn) sn.textContent = SCHOOL_NAME;
  if (SCHOOL_MODE !== "ascc") document.body.classList.add("lens-blank");
  initApp();
  buildBridge().then(b => { __atlasCtx = b.atlas; injectAtlasStrip(__atlasCtx); });
}

/* ---------------- Router ---------------- */
let appInitialised = false;
const rendered = {};
const VIEW_TITLES = {
  dashboard: "Dashboard", sef: "Self-Evaluation", foundations: "Reading, Literacy & Numeracy – Foundational Skills", pshe: "PSHE & Life Curriculum", send: "SEND – Interventions & Impact", staff: "Staff Development", results: "Results & Trends",
  years: "Year Groups", attendance: "Attendance", behaviour: "Behaviour", external: "IDSR & Pupil Premium",
  enrichment: "Enrichment", careers: "Careers & Gatsby Benchmarks", voice: "Student & Parent Voice", library: "Library – Evidence Vault",
  briefings: "Briefing – Staff",
  scenarios: "Scenario Lab", governors: "Governors' Challenge",
  framework: "Renewed Framework", media: "Innovation & Press", ask: "Ask the Portal – AI conversation"
};
function initApp() {
  if (appInitialised) return;
  appInitialised = true;
  const tabs = document.getElementById("tabs");
  tabs.addEventListener("click", e => {
    const ddBtn = e.target.closest(".dd-btn");
    if (ddBtn) {
      const dd = ddBtn.parentElement;
      const wasOpen = dd.classList.contains("open");
      tabs.querySelectorAll(".dd").forEach(d => d.classList.remove("open"));
      if (!wasOpen) dd.classList.add("open");
      return;
    }
    const btn = e.target.closest("button[data-view]");
    if (!btn) return;
    tabs.querySelectorAll(".dd").forEach(d => d.classList.remove("open"));
    showView(btn.dataset.view);
  });
  document.addEventListener("click", e => {
    if (!e.target.closest("#tabs .dd")) tabs.querySelectorAll(".dd").forEach(d => d.classList.remove("open"));
  });

  /* Crest → Dashboard */
  const crest = document.querySelector("header.topbar img.crest");
  if (crest) {
    crest.style.cursor = "pointer";
    crest.title = "Back to Dashboard";
    crest.addEventListener("click", () => showView("dashboard"));
  }

  /* Export to PDF: browser print dialog with A4-landscape print styles */
  el("export-pdf").addEventListener("click", () => window.print());
  window.addEventListener("beforeprint", () => {
    el("ph-date").textContent = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    // reflow charts to the print layout
    Object.values(Chart.instances || {}).forEach(c => { try { c.resize(); } catch {} });
  });
  window.addEventListener("afterprint", () => {
    Object.values(Chart.instances || {}).forEach(c => { try { c.resize(); } catch {} });
  });

  showView("dashboard");
}
function showView(name) {
  document.querySelectorAll(".tabs button[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  // highlight a group button when one of its children is the active view
  document.querySelectorAll(".tabs .dd").forEach(dd => {
    const owns = !!dd.querySelector(`button[data-view="${name}"]`);
    dd.querySelector(".dd-btn").classList.toggle("active", owns);
  });
  document.querySelectorAll("section.view").forEach(s => s.classList.toggle("active", s.id === "view-" + name));
  if (!rendered[name]) { RENDER[name](); rendered[name] = true; }
  // print header + PDF filename follow the current page
  const t = VIEW_TITLES[name] || name;
  const ph = el("ph-section"); if (ph) ph.textContent = t;
  document.title = `ASCC Portal – ${t}`;
  window.scrollTo({ top: 0 });
}
window.gotoView = showView;
document.addEventListener("click", e => {
  const b = e.target.closest(".stance-btn"); if (!b) return;
  askStance = b.dataset.stance;
  document.querySelectorAll(".stance-btn").forEach(x => x.classList.toggle("on", x === b));
});

/* ---------------- Helpers ---------------- */
const el = (id) => document.getElementById(id);
function h(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content; }
function pillClass(grade) {
  if (grade === "Met") return "met";
  return grade.toLowerCase().includes("exceptional") ? "exceptional" : "strong";
}
let chartIdSeq = 0;
function makeChart(containerId, config) {
  const wrap = el(containerId);
  const canvas = document.createElement("canvas");
  wrap.appendChild(canvas);
  Chart.defaults.font.family = "Inter, sans-serif";
  Chart.defaults.color = "#6b6176";
  new Chart(canvas, config);
}

/* ================= DASHBOARD ================= */
function renderDashboard() {
  const c = ASCC.context, s = ASCC.school;
  el("view-dashboard").appendChild(h(`
    <div class="view-head">
      <h2>The All Saints story, at a glance</h2>
      <p>${c.keyLine}</p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      <div class="card stat"><div class="num">+0.69</div><div class="lbl">Progress 8, 2024 (published)</div><div class="ctx">One of 75 measures Ofsted's own IDSR flags 'Above (sig+)'</div></div>
      <div class="card stat"><div class="num">+0.26</div><div class="lbl">Disadvantaged P8, 2024</div><div class="ctx">vs −0.57 national disadvantaged</div></div>
      <div class="card stat"><div class="num">92.41%</div><div class="lbl">Attendance (FFT, May 2026)</div><div class="ctx">+0.78 vs national · +2.22 vs similar schools</div></div>
      <div class="card stat"><div class="num">0</div><div class="lbl">Permanent exclusions this year</div><div class="ctx">7 → 3 → 2 → 0 over four years · suspensions −43.9% from peak</div></div>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      <div class="card stat"><div class="num">100%</div><div class="lbl">of surveyed parents say their child feels safe – and 100% would recommend the school</div><div class="ctx">82/82, Y7 & Y10 · safeguarding audit: “exemplary”</div></div>
      <div class="card stat"><div class="num">45%</div><div class="lbl">of the roll in tracked clubs – members attend +7.2 points better</div><div class="ctx">SEN members +12.1 · Elev:8 Y8 at 91% participation</div></div>
      <div class="card stat"><div class="num">8/8</div><div class="lbl">DfE enrichment benchmarks met · Gatsby careers at 92%</div><div class="ctx">Both frameworks arrived after we already met them</div></div>
      <div class="card stat"><div class="num">45%</div><div class="lbl">of teachers freely chose the school's #1 priority as their own target</div><div class="ctx">Codified handbook → coaching → T&L 2.08 → 100% parent satisfaction</div></div>
    </div>
    <div class="grid cols-4" style="margin-bottom:26px">
      <div class="card stat"><div class="num">${c.fsm.pct}%</div><div class="lbl">Free School Meals (${c.fsm.n} pupils)</div><div class="ctx neutral">FSM6 41.8% – well above national</div></div>
      <div class="card stat"><div class="num">${c.ehcp.pct}%</div><div class="lbl">EHC Plans (${c.ehcp.n} pupils)</div><div class="ctx neutral">Well above average, rising each year</div></div>
      <div class="card stat"><div class="num">${c.eal.pct}%</div><div class="lbl">English as an Additional Language</div><div class="ctx neutral">${c.eal.n} pupils</div></div>
      <div class="card stat"><div class="num">Top 20%</div><div class="lbl">Deprivation nationally (IDACI)</div><div class="ctx neutral">Local FSM6 60.4% – well above average</div></div>
    </div>
    <div class="grid cols-2">
      <div class="card">
        <h3>Self-evaluation summary – renewed framework</h3>
        <div id="dash-sef"></div>
        <p class="note">Click any area for the full evidence base and priorities – or open the <a href="#" onclick="gotoView('sef');return false;">Self-Evaluation</a> tab.</p>
      </div>
      <div class="card chart-card">
        <h3>Progress 8 vs national</h3>
        <div class="chart-wrap" id="dash-p8"></div>
        <p class="note">2025 is a SISRA estimate (provisional); 2026 is a prediction. 2023 &amp; 2024 are published.</p>
      </div>
    </div>
    <div class="card" style="margin-top:18px;border-left:5px solid var(--green)">
      <h3>Evidence-led, innovation-minded</h3>
      <div class="sef-cols" style="margin-top:8px">
        <div>
          <h4 style="color:var(--green)">Where we follow the evidence</h4>
          <ul style="margin-left:18px;font-size:0.86rem">
            <li style="margin-bottom:6px"><strong>Active Ingredients coaching</strong> → EEF metacognition, <strong>+8 months</strong> – the Toolkit's highest-impact strand.</li>
            <li style="margin-bottom:6px"><strong>Thinking Reading & Y7 Fluency Pilot</strong> → reading comprehension <strong>+7</strong>, phonics <strong>+5</strong> – answering our own reading data (54% below age-related), and now moving it: summer tests put Y7 &amp; Y10 mean SAS at/above the national 100, with 75% of Thinking Reading pupils at age-expected reading age.</li>
            <li style="margin-bottom:6px"><strong>Oracy in every Scheme of Work</strong> → oral language (high impact); national Oracy Commission case study.</li>
            <li style="margin-bottom:6px"><strong>Y11 intervention</strong> → small-group <strong>+4</strong> / one-to-one <strong>+5</strong>; book priorities → feedback <strong>+6</strong>.</li>
            <li style="margin-bottom:6px"><strong>Elev:8</strong> → built on Professor John Jerrim's research on the Year 8 engagement dip – visible in our own matched data (−2.29pts Y7→Y8).</li>
            <li><strong>Staff development</strong> → EEF Effective PD mechanisms end-to-end: 54 narrative self-reflections, coached targets, drop-ins against each teacher's own goal – 45% chose the school's #1 priority themselves.</li>
          </ul>
        </div>
        <div>
          <h4 style="color:var(--gold)">Where we lead the evidence</h4>
          <ul style="margin-left:18px;font-size:0.86rem">
            <li style="margin-bottom:6px"><strong>The extended enrichment day</strong> – running years before the DfE's Enrichment Framework (June 2026); we already meet all <strong>8 benchmarks</strong>. Covered by Guardian, Times, Fortune, BBC.</li>
            <li style="margin-bottom:6px"><strong>Elev:8</strong> – no other school has redesigned Year 8 around the engagement dip: residential, compulsory P7 enrichment, London Leaders.</li>
            <li style="margin-bottom:6px"><strong>Phone-free culture</strong> – national and international coverage before the policy debate caught up.</li>
            <li style="margin-bottom:6px"><strong>Teacher 'lie-ins' & flexible working</strong> – retention innovation the Education Secretary later endorsed.</li>
            <li style="margin-bottom:6px"><strong>Emmanuel</strong> – £400k of secured capital for a reintegration hub and literacy pathway, business-cased from our own data triangulation.</li>
            <li><strong>System leadership</strong> – Headteacher advises the Secretary of State; DSL audits other schools' safeguarding.</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:18px">
      <h3>Inspection context – what this school is</h3>
      <p style="font-size:0.9rem">${s.name} is a ${s.type} in ${s.la} (${s.address}). Previous inspection: <strong>${s.lastOfsted}</strong>. Motto: <strong>${s.motto}</strong> – <em>${s.mottoMeaning}</em>. ${c.onRoll} pupils on roll across ${s.years}. The school is nationally known for the extended enrichment day, phone-free culture, staff-wellbeing innovation and system leadership – see <a href="#" onclick="gotoView('media');return false;">Innovation &amp; Press</a>.</p>
    </div>
  `));
  const dashSef = el("dash-sef");
  ASCC.sef.forEach(a => {
    dashSef.appendChild(h(`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer" onclick="gotoView('sef')">
        <span style="font-size:0.9rem;font-weight:550">${a.area}</span>
        <span class="pill ${pillClass(a.grade)}">${a.grade}</span>
      </div>`));
  });
  const ws = ASCC.results.wholeSchool;
  makeChart("dash-p8", {
    type: "bar",
    data: {
      labels: ws.map(r => r.year),
      datasets: [
        { label: "All Saints", data: ws.map(r => r.p8), backgroundColor: BRAND.purple, borderRadius: 6 },
        { label: "National", data: ws.map(r => r.p8Nat), backgroundColor: BRAND.grey, borderRadius: 6 }
      ]
    },
    options: { maintainAspectRatio: false, scales: { y: { title: { display: true, text: "Progress 8" } } } }
  });
}

/* ================= SEF ================= */
function renderSef() {
  const v = el("view-sef");
  v.appendChild(h(`
    <div class="view-head">
      <h2>Self-Evaluation – July 2026</h2>
      <p>Eight evaluation areas, each pinned to the renewed framework's toolkit tests: every Exceptional grade argues all three tests – <em>sustained exceptionally high standards · transformational impact on disadvantaged pupils and those with SEND · nothing significant unaddressed</em> – with the evidence beneath each; and every Strong grade states, on the record, exactly what is holding it there. Every improvement lever is anchored to the <a href="https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit" target="_blank" rel="noopener">EEF Toolkit</a>: evidence-led where the evidence exists, innovation-minded where the school is ahead of it.</p>
    </div>
    <div id="sef-list"></div>
  `));
  const list = el("sef-list");
  ASCC.sef.forEach(a => {
    const evid = a.evidence.map(x => `<li>${x}</li>`).join("");
    const dev = a.development.map(x => `<li>${x}</li>`).join("");
    const prio = a.priorities.map(p => `<tr><td>${p[0]}</td><td>${p[1]}</td><td>${p[2]}</td></tr>`).join("");
    const eef = a.eef ? `
      <h4>Evidence base – EEF Teaching &amp; Learning Toolkit</h4>
      <div class="eef-grid">
        ${a.eef.map(e => `
          <a class="eef-card" href="${e.url}" target="_blank" rel="noopener">
            <div class="eef-head"><span class="eef-strand">${e.strand}</span><span class="eef-impact">${e.impact}</span></div>
            <div class="eef-action">${e.action}</div>
          </a>`).join("")}
      </div>` : "";
    const phrases = a.phrases ? `<h4>Phrases that land</h4>` + a.phrases.map(p => `<span class="phrase">“${p}”</span>`).join("") : "";
    const note = a.note ? `<span style="font-size:0.72rem;color:var(--muted);font-style:italic">${a.note}</span>` : "";
    const exc = a.exceptional ? `
      <div class="exc-block">
        <div class="exc-title">Why Exceptional – pinned to the framework toolkit</div>
        ${a.exceptional.map(t => `
          <div class="exc-test">
            <div class="exc-test-name">${t[0]}</div>
            <div class="exc-test-ev">${t[1]}</div>
          </div>`).join("")}
      </div>` : "";
    const rationale = a.gradeRationale ? `
      <div class="exc-block" style="border-color:var(--purple-500);background:var(--purple-50)">
        <div class="exc-title" style="color:var(--purple-800)">Why this grade – calibration, on the record</div>
        <div class="exc-test-ev" style="margin-top:6px">${a.gradeRationale}</div>
      </div>` : "";
    const item = h(`
      <div class="sef-item" id="sef-${a.id}">
        <button class="sef-head">
          <span class="area">${a.area}</span>${note}
          <span class="pill ${pillClass(a.grade)}">${a.grade}</span>
          <span class="chev">▾</span>
        </button>
        <div class="sef-body">
          <div class="sef-headline">${a.headline}</div>
          ${exc}
          ${rationale}
          <div class="sef-cols">
            <div><h4>Headline evidence</h4><ul>${evid}</ul></div>
            <div class="dev"><h4>We know, we act – development areas</h4><ul>${dev}</ul></div>
          </div>
          <h4>Priorities to January 2027</h4>
          <table class="prio"><tr><th>Priority / action</th><th>Owner</th><th>Milestone</th></tr>${prio}</table>
          ${eef}
          ${phrases}
        </div>
      </div>`);
    list.appendChild(item);
  });
  list.addEventListener("click", e => {
    const head = e.target.closest(".sef-head");
    if (head) head.parentElement.classList.toggle("open");
  });
}

/* ================= FOUNDATIONAL SKILLS (Reading, Literacy & Numeracy) ================= */
function renderFoundations() {
  const f = ASCC.foundations, rd = f.reading, lit = f.literacy, nm = f.numeracy, cl = f.clubs;
  el("view-foundations").appendChild(h(`
    <div class="view-head">
      <h2>Reading, Literacy &amp; Numeracy – the foundational skills case</h2>
      <p>${f.intro}</p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      ${f.tiles.map(t => `<div class="card stat"><div class="num" style="font-size:1.6rem">${t[0]}</div><div class="lbl">${t[1]}</div></div>`).join("")}
    </div>

    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card">
        <h3>Whole-cohort reading: autumn → summer, matched pupils</h3>
        <div class="chart-wrap" id="fd-sas"></div>
        <p class="note">${rd.sasNote}</p>
      </div>
      <div class="card chart-card">
        <h3>Reading at 'expected &amp; above' (%)</h3>
        <div class="chart-wrap" id="fd-exp"></div>
        <p class="note">The band the strategy exists to grow – up in Years 7 (+1.8pp) and 10 (+6.8pp); Year 8 shown honestly on a partial cohort (60 pupils still to test). Whole-school culture markers moved with it: SORA e-book check-outs 254 → 487.</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--green)">
      <h3>Intervention headlines – impact with receipts</h3>
      <div class="grid cols-2" style="margin-top:10px">
        ${rd.interventions.map(x => `
          <div style="border-left:4px solid var(--green);padding:2px 0 2px 14px">
            <div style="font-weight:650;color:var(--purple-900);font-size:0.92rem">${x[0]} <span style="color:var(--green);font-family:sans-serif;font-size:1.05rem;margin-left:6px">${x[1]}</span></div>
            <div style="font-size:0.85rem;margin-top:3px">${x[2]}</div>
          </div>`).join("")}
      </div>
      <p class="note" style="margin-top:10px">Fresh Start Speed Sound recall (up to 3× faster) and Galilee grammar gains (+27–44pp) are charted pupil-by-pupil on the <a href="#" onclick="gotoView('send');return false;">SEND tab</a> – one reading strategy, evidenced at both whole-cohort and named-pupil level.</p>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3>How pupils are identified and placed – triangulated, never SAS alone</h3>
      <p style="font-size:0.88rem">${rd.identification}</p>
      <table class="data" style="margin-top:10px">
        <tr><th>Route</th><th>Criteria</th><th>Primary provision</th></tr>
        ${rd.routes.map(r => `<tr><td style="white-space:nowrap;font-weight:650">${r[0]}</td><td style="font-size:0.82rem">${r[1]}</td><td style="font-size:0.82rem">${r[2]}</td></tr>`).join("")}
      </table>
      <p class="note">${rd.routesNote}</p>
    </div>

    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card">
        <h3>The universal tier – every subject, every pupil</h3>
        <ul style="margin-left:18px;font-size:0.85rem;margin-top:8px">${rd.universal.map(u => `<li style="margin-bottom:7px">${u}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <h3>Staff development carrying the strategy</h3>
        <table class="data" style="margin-top:8px">
          <tr><th>2026</th><th>6-Minute Takeaway</th><th>Literacy relevance</th></tr>
          ${rd.takeaways.map(t => `<tr><td style="white-space:nowrap;font-weight:650">${t[0]}</td><td style="font-size:0.8rem;font-weight:600;color:var(--purple-700)">${t[1]}</td><td style="font-size:0.78rem">${t[2]}</td></tr>`).join("")}
        </table>
        <p class="note">${rd.takeawaysNote}</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--purple-500)">
      <h3>Oracy – ${lit.oracy.headline}</h3>
      <div class="grid cols-3" style="margin-top:10px">
        ${lit.oracy.points.map(p => `
          <div style="border-left:4px solid var(--purple-500);padding:2px 0 2px 14px">
            <div style="font-weight:650;color:var(--purple-900);font-size:0.9rem">${p[0]}</div>
            <div style="font-size:0.84rem;margin-top:3px">${p[1]}</div>
          </div>`).join("")}
      </div>
    </div>

    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card" style="border-left:5px solid var(--gold)">
        <h3>Academic writing – stretch with a university address</h3>
        <p class="sef-headline" style="margin-top:8px">${lit.writing.headline}</p>
        ${lit.writing.points.map(p => `
          <h4>${p[0]}</h4>
          <p style="font-size:0.85rem">${p[1]}</p>`).join("")}
      </div>
      <div class="card">
        <h3>Spelling &amp; handwriting – the mechanics, held high</h3>
        ${lit.mechanics.map(m => `
          <h4>${m[0]}</h4>
          <p style="font-size:0.85rem">${m[1]}</p>`).join("")}
      </div>
    </div>

    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--purple-600)">
      <h3>Foundational numeracy – the same discipline, in Maths</h3>
      <p style="font-size:0.88rem">${nm.intro}</p>
      <div class="grid cols-3" style="margin-top:12px;margin-bottom:14px">
        ${nm.elements.map(e => `
          <div style="border-left:4px solid var(--purple-600);padding:2px 0 2px 14px">
            <div style="font-weight:650;color:var(--purple-900);font-size:0.9rem">${e[0]}</div>
            <div style="font-size:0.83rem;margin-top:3px">${e[1]}</div>
          </div>`).join("")}
      </div>
      <h4>Impact – three case studies spanning the range</h4>
      <div class="quote-grid" style="margin-top:8px">
        ${nm.cases.map(c => `
          <div class="quote-card">
            <div class="quote-theme">${c[0]}</div>
            <div class="quote-text" style="font-size:0.85rem">${c[1]}</div>
          </div>`).join("")}
      </div>
      <p class="note">${nm.casesNote}</p>
    </div>

    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--green)">
      <h3>The extended day, closing the homework gap</h3>
      <p class="sef-headline" style="margin-top:8px">${cl.headline}</p>
      <div class="grid cols-2" style="margin-top:12px">
        <div class="chart-card">
          <h4 style="margin-top:0">${cl.pp.title}</h4>
          <div class="chart-wrap" id="fd-pp" style="height:250px"></div>
          <div class="grid cols-2" style="margin:10px 0 0">
            ${cl.pp.stats.map(s => `<div class="card stat" style="box-shadow:none;padding:10px"><div class="num" style="font-size:1.25rem">${s[0]}</div><div class="lbl" style="font-size:0.72rem">${s[1]}</div></div>`).join("")}
          </div>
          <p class="note">${cl.pp.note}</p>
        </div>
        <div class="chart-card">
          <h4 style="margin-top:0">${cl.sen.title}</h4>
          <div class="chart-wrap" id="fd-sen" style="height:250px"></div>
          <div class="grid cols-2" style="margin:10px 0 0">
            ${cl.sen.stats.map(s => `<div class="card stat" style="box-shadow:none;padding:10px"><div class="num" style="font-size:1.25rem">${s[0]}</div><div class="lbl" style="font-size:0.72rem">${s[1]}</div></div>`).join("")}
          </div>
          <p class="note">${cl.sen.note}</p>
        </div>
      </div>
      <p style="font-size:0.87rem;margin-top:12px">${cl.closing}</p>
    </div>

    <div class="card" style="border-left:5px solid var(--green)">
      <h3>Where it lands</h3>
      <p style="font-size:0.9rem">${f.closing}</p>
    </div>
  `));
  makeChart("fd-sas", { type: "bar", data: { labels: rd.sas.labels, datasets: [
    { label: "Autumn 2025", data: rd.sas.aut, backgroundColor: BRAND.grey, borderRadius: 5 },
    { label: "Summer 2026", data: rd.sas.sum, backgroundColor: BRAND.purple, borderRadius: 5 } ] },
    options: { maintainAspectRatio: false, scales: { y: { min: 90, max: 105, title: { display: true, text: "Mean SAS (national = 100)" } } } } });
  makeChart("fd-exp", { type: "bar", data: { labels: rd.sas.labels, datasets: [
    { label: "Autumn 2025", data: rd.sas.expAut, backgroundColor: BRAND.grey, borderRadius: 5 },
    { label: "Summer 2026", data: rd.sas.expSum, backgroundColor: BRAND.green, borderRadius: 5 } ] },
    options: { maintainAspectRatio: false, scales: { y: { min: 30, max: 65, title: { display: true, text: "% expected & above" } } } } });
  makeChart("fd-pp", { type: "bar", data: { labels: cl.pp.terms, datasets: [
    { type: "bar", label: "Homework-related negative logs", data: cl.pp.neg, backgroundColor: BRAND.purple, borderRadius: 6, yAxisID: "y" },
    { type: "line", label: "Positive points as % of all logs", data: cl.pp.pwShare, borderColor: BRAND.gold, backgroundColor: BRAND.gold, tension: 0.3, yAxisID: "y1" } ] },
    options: { maintainAspectRatio: false, scales: {
      y: { beginAtZero: true, title: { display: true, text: "Negative logs" } },
      y1: { position: "right", min: 0, max: 30, grid: { drawOnChartArea: false }, title: { display: true, text: "% positive" } } } } });
  makeChart("fd-sen", { type: "bar", data: { labels: cl.sen.terms, datasets: [
    { label: "Low-engagement cohort (behaviour incidents)", data: cl.sen.low, backgroundColor: BRAND.purpleLight, borderRadius: 5, stack: "s" },
    { label: "High-engagement cohort (homework incidents)", data: cl.sen.high, backgroundColor: BRAND.purple, borderRadius: 5, stack: "s" } ] },
    options: { maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: "Combined incidents" } } } } });
}

/* ================= PSHE / LIFE CURRICULUM ================= */
function renderPshe() {
  const p = ASCC.pshe;
  el("view-pshe").appendChild(h(`
    <div class="view-head">
      <h2>PSHE &amp; Life Curriculum – found weak, rebuilt strong</h2>
      <p>${p.intro}</p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      ${p.tiles.map(t => `<div class="card stat"><div class="num" style="font-size:1.6rem">${t[0]}</div><div class="lbl">${t[1]}</div></div>`).join("")}
    </div>
    <div class="card" style="margin-bottom:18px">
      <h3>The five-year journey</h3>
      <table class="data" style="margin-top:8px">
        <tr><th>Year</th><th>Theme</th><th>What is taught</th></tr>
        ${p.journey.map(j => `<tr><td style="white-space:nowrap;font-weight:650">${j[0]}</td><td style="white-space:nowrap;font-weight:650;color:var(--purple-700)">${j[1]}</td><td style="font-size:0.83rem">${j[2]}</td></tr>`).join("")}
      </table>
      <p class="note">${p.journeyNote}</p>
    </div>
    <div class="card" style="margin-bottom:18px">
      <h3>Built like the main curriculum, because it is one</h3>
      <div class="grid cols-2" style="margin-top:10px">
        ${p.design.map(d => `
          <div style="border-left:4px solid var(--purple-500);padding:2px 0 2px 14px">
            <div style="font-weight:650;color:var(--purple-900);font-size:0.92rem">${d[0]}</div>
            <div style="font-size:0.85rem;margin-top:3px">${d[1]}</div>
          </div>`).join("")}
      </div>
    </div>
    <div class="card" style="border-left:5px solid var(--green)">
      <h3>Where it lands</h3>
      <p style="font-size:0.9rem">${p.closing}</p>
    </div>
  `));
}

/* ================= SEND ================= */
function renderSend() {
  const s = ASCC.send;
  el("view-send").appendChild(h(`
    <div class="view-head">
      <h2>SEND – interventions &amp; impact</h2>
      <p>${s.intro}</p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      ${s.tiles.map(t => `<div class="card stat"><div class="num">${t[0]}</div><div class="lbl">${t[1]}</div></div>`).join("")}
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3>The provision map – a graduated response you can hold in your hand</h3>
      <div class="grid cols-2" style="margin-top:10px">
        <div>
          <table class="data"><tr><th>Area of concern</th><th>Provisions</th><th>What's in it</th></tr>
            ${s.map.areas.map(a => `<tr><td style="font-weight:650;white-space:nowrap">${a[0]}</td><td>${a[1]}</td><td style="font-size:0.8rem">${a[2]}</td></tr>`).join("")}
          </table>
        </div>
        <div class="chart-card"><h4 style="margin-top:0">Biggest provisions by pupils reached</h4><div class="chart-wrap" id="sd-map" style="height:320px"></div></div>
      </div>
      <p class="note">${s.map.note}</p>
    </div>

    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card">
        <h3>Fresh Start phonics – measured pupil by pupil</h3>
        <div class="chart-wrap" id="sd-fs"></div>
        <p class="note">${s.freshStart.pairsNote}</p>
      </div>
      <div class="card">
        <h3>What Fresh Start is</h3>
        <p style="font-size:0.88rem">${s.freshStart.what}</p>
        <h4>Honest, graded reviews</h4>
        <p style="font-size:0.86rem">${s.freshStart.outcomes}</p>
      </div>
    </div>

    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card">
        <h3>Galilee literacy – pre/post assessment gains</h3>
        <div class="chart-wrap" id="sd-gal"></div>
        <p class="note">${s.galilee.gainsNote}</p>
      </div>
      <div class="card">
        <h3>What Galilee is</h3>
        <p style="font-size:0.88rem">${s.galilee.what}</p>
        <h4>1:1 speech &amp; language therapy</h4>
        <p style="font-size:0.86rem">${s.salt.what}</p>
        <ul style="margin-left:18px;font-size:0.84rem;margin-top:8px">${s.salt.points.map(p => `<li style="margin-bottom:6px">${p}</li>`).join("")}</ul>
      </div>
    </div>

    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--purple-600)">
      <h3>Academic Support Assistants – one graduate team, the whole ability range</h3>
      <p class="sef-headline" style="margin-top:10px">${s.asa.headline}</p>
      <div class="grid cols-4" style="margin:14px 0">
        ${s.asa.aquinas.stats.map(x => `
          <div class="card stat" style="box-shadow:none"><div class="num" style="font-size:1.5rem">${x[0]}</div><div class="lbl">${x[1]}</div></div>`).join("")}
      </div>
      <h4>The St Thomas Aquinas Award</h4>
      <p style="font-size:0.87rem">${s.asa.aquinas.what}</p>
      <span class="phrase">“${s.asa.aquinas.line}”</span>
    </div>

    <div class="card" style="border-left:5px solid var(--green);margin-bottom:18px">
      <h3>Where it lands</h3>
      <p style="font-size:0.9rem">${s.closing}</p>
    </div>

    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--purple-500)">
      <h3>Lego Therapy – an EHCP outcome, made buildable</h3>
      <p class="sef-headline" style="margin-top:10px">${s.lego.headline}</p>
      <div class="grid cols-2" style="margin-top:12px">
        ${s.lego.points.map(x => `
          <div style="border-left:4px solid var(--purple-500);padding:2px 0 2px 14px">
            <div style="font-weight:650;color:var(--purple-900);font-size:0.9rem">${x[0]}</div>
            <div style="font-size:0.84rem;margin-top:3px">${x[1]}</div>
          </div>`).join("")}
      </div>
      <span class="phrase">“${s.lego.line}”</span>
    </div>

    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--green)">
      <h3>AllChild – the embedded Link Worker</h3>
      <p class="sef-headline" style="margin-top:10px">${s.allchild.headline}</p>
      <div class="grid cols-4" style="margin:14px 0">
        ${s.allchild.tiles.map(t => `
          <div class="card stat" style="box-shadow:none"><div class="num" style="font-size:1.5rem">${t[0]}</div><div class="lbl">${t[1]}</div></div>`).join("")}
      </div>
      <div class="grid cols-2">
        <div class="chart-card"><h4 style="margin-top:0">What the cohort worked on this term</h4><div class="chart-wrap" id="sd-allchild" style="height:230px"></div>
          <p class="note">${s.allchild.outcomes.note}</p></div>
        <div>
          <h4 style="margin-top:0">Engagement, in the Link Worker's words</h4>
          <p style="font-size:0.86rem">${s.allchild.engagement}</p>
          <h4>One pupil's term (anonymised)</h4>
          <p style="font-size:0.86rem">${s.allchild.vignette}</p>
        </div>
      </div>
      <h4>Where it intersects</h4>
      <div class="perm-grid">
        ${s.allchild.intersections.map(x => `
          <div class="perm-card"><div class="perm-title">${x[0]}</div><div class="perm-text">${x[1]}</div></div>`).join("")}
      </div>
      <p class="note" style="margin-top:10px">${s.allchild.community}</p>
    </div>

    <div class="card elev8-card">
      <div class="elev8-head">
        <h3>${s.emmanuel.tagline}</h3>
        <span class="elev8-tag">Next build</span>
      </div>
      <p style="font-size:0.9rem;margin-top:8px">${s.emmanuel.what}</p>
      <div class="grid cols-4" style="margin:14px 0">
        ${s.emmanuel.funding.map(f => `
          <div class="card stat" style="box-shadow:none"><div class="num" style="font-size:1.5rem">${f[0]}</div><div class="lbl">${f[1]}</div></div>`).join("")}
      </div>
      <h4>The data-informed case</h4>
      <p style="font-size:0.87rem">${s.emmanuel.case}</p>
      <span class="phrase">“${s.emmanuel.line}”</span>
    </div>
  `));
  makeChart("sd-map", { type: "bar", data: { labels: s.map.biggest.map(x => x[0]), datasets: [
    { label: "Pupils", data: s.map.biggest.map(x => x[1]), backgroundColor: BRAND.purple, borderRadius: 5 } ] },
    options: { maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } } });
  makeChart("sd-fs", { type: "bar", data: { labels: s.freshStart.pairs.labels, datasets: [
    { label: "Entry (seconds – lower is better)", data: s.freshStart.pairs.before, backgroundColor: BRAND.grey, borderRadius: 5 },
    { label: "July 2026", data: s.freshStart.pairs.after, backgroundColor: BRAND.green, borderRadius: 5 } ] },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: "Speed Sound time (s)" } } } } });
  makeChart("sd-allchild", { type: "doughnut", data: { labels: s.allchild.outcomes.labels, datasets: [
    { label: "% of cohort goals", data: s.allchild.outcomes.pct,
      backgroundColor: [BRAND.purple, BRAND.gold, BRAND.purpleLight, BRAND.green, BRAND.grey] } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 10, font: { size: 10 } } } } } });
  makeChart("sd-gal", { type: "bar", data: { labels: s.galilee.gains.labels, datasets: [
    { label: "Percentage-point gain, pre → post", data: s.galilee.gains.pct, backgroundColor: BRAND.gold, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 50 } } } });
}

/* ================= STAFF DEVELOPMENT ================= */
function renderStaff() {
  const st = ASCC.staff;
  el("view-staff").appendChild(h(`
    <div class="view-head">
      <h2>Staff Development – the engine room</h2>
      <p>${st.intro}</p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      ${st.tiles.map(t => `<div class="card stat"><div class="num">${t[0]}</div><div class="lbl">${t[1]}</div></div>`).join("")}
    </div>

    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card">
        <h3>Teachers chose the school's priorities as their own</h3>
        <div class="chart-wrap" id="st-domains"></div>
        <p class="note">${st.domains.note}</p>
      </div>
      <div class="card">
        <h3>The development cycle – bespoke to every teacher</h3>
        <div id="st-cycle"></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--gold)">
      <h3>${ASCC.handbook.title}</h3>
      <p class="sef-headline" style="margin-top:10px">${ASCC.handbook.intro}</p>
      <div id="st-handbook" style="margin-top:6px"></div>
      <h4>The proof it's lived, not laminated</h4>
      <p style="font-size:0.87rem">${ASCC.handbook.proof}</p>
      <span class="phrase">“${ASCC.handbook.line}”</span>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3>Real targets, this year (anonymised)</h3>
      <div class="quote-grid" style="margin-top:10px">
        ${st.targets.map(t => `
          <div class="quote-card">
            <div class="quote-theme">${t[0]}</div>
            <div class="quote-text" style="font-size:0.88rem">${t[1]}</div>
          </div>`).join("")}
      </div>
      <p class="note">${st.targetsNote}</p>
    </div>

    <div class="grid cols-2">
      <div class="card">
        <h3>Evidence base – EEF</h3>
        <div class="eef-grid" style="margin-top:10px">
          ${st.eef.map(e => `
            <a class="eef-card" href="${e.url}" target="_blank" rel="noopener">
              <div class="eef-head"><span class="eef-strand">${e.strand}</span><span class="eef-impact">${e.impact}</span></div>
              <div class="eef-action">${e.action}</div>
            </a>`).join("")}
        </div>
      </div>
      <div class="card" style="border-left:5px solid var(--gold)">
        <h3>${st.retention.headline}</h3>
        <ul style="margin-left:18px;font-size:0.86rem;margin-top:10px">${st.retention.points.map(p => `<li style="margin-bottom:8px">${p}</li>`).join("")}</ul>
        <span class="phrase">“We look after our staff so they can look after our pupils.”</span>
      </div>
    </div>
  `));
  const hb = el("st-handbook");
  ASCC.handbook.layers.forEach((l, i) => {
    hb.appendChild(h(`
      <div class="bench-row" style="padding:11px 0">
        <div class="bench-num">${i + 1}</div>
        <div class="bench-body">
          <div class="bench-title" style="font-size:0.92rem">${l[0]} <span style="font-size:0.72rem;font-weight:600;color:var(--gold);text-transform:uppercase;letter-spacing:0.06em">· ${l[1]}</span></div>
          <div class="bench-ev" style="font-size:0.83rem">${l[2]}</div>
        </div>
      </div>`));
  });
  const cyc = el("st-cycle");
  st.cycle.forEach((c, i) => {
    cyc.appendChild(h(`
      <div class="bench-row" style="padding:10px 0">
        <div class="bench-num">${i + 1}</div>
        <div class="bench-body">
          <div class="bench-title" style="font-size:0.9rem">${c[0]}</div>
          <div class="bench-ev" style="font-size:0.82rem">${c[1]}</div>
        </div>
      </div>`));
  });
  makeChart("st-domains", { type: "bar", data: { labels: st.domains.labels, datasets: [
    { label: "Draft focus (self-reflection, %)", data: st.domains.draftPct, backgroundColor: BRAND.purpleFaint, borderRadius: 5 },
    { label: "Final coached target (%)", data: st.domains.finalPct, backgroundColor: BRAND.purple, borderRadius: 5 } ] },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 50, title: { display: true, text: "% of staff" } } } } });
}

/* ================= RESULTS ================= */
function renderResults() {
  const r = ASCC.results;
  el("view-results").appendChild(h(`
    <div class="view-head">
      <h2>Results &amp; Trends</h2>
      <p>${r.resultsNote}</p>
    </div>
    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card"><h3>Attainment 8 vs national</h3><div class="chart-wrap" id="rc-a8"></div></div>
      <div class="card chart-card"><h3>Progress 8 vs national</h3><div class="chart-wrap" id="rc-p8"></div></div>
      <div class="card chart-card"><h3>4+ &amp; 5+ in English &amp; Maths</h3><div class="chart-wrap" id="rc-em"></div>
        <p class="note">4+ E&amp;M has held at 74–75% (national 65%) despite falling KS2 priors – and 2026 is predicted at <strong>82%</strong>, which would be the school's best ever.</p></div>
      <div class="card chart-card"><h3>Disadvantaged Progress 8 vs national disadvantaged</h3><div class="chart-wrap" id="rc-dis"></div>
        <p class="note">${r.gapNote}</p></div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <h3>SEND outcomes – small cohorts, honest picture</h3>
      <div class="chart-wrap" id="rc-sen" style="height:260px"></div>
      <p class="note">${r.senNote}</p>
    </div>
    <div class="card">
      <h3>GCSE 2025 by subject (provisional)</h3>
      <table class="data" id="rc-subjects">
        <tr><th>Subject</th><th>Pupils</th><th>4+ %</th><th>5+ %</th><th>7+ %</th><th>Residual</th></tr>
      </table>
      <p class="note">Standouts: Sports Studies residual +2.35, Food &amp; Nutrition +1.44, Spanish +0.54 (100% 4+ and 5+), RE +0.31. Focus subjects: English Language (−0.54) and Combined Science (−0.42) – both carry named priorities and intervention plans in the SEF.</p>
    </div>
  `));
  const ws = r.wholeSchool;
  makeChart("rc-a8", { type: "bar", data: { labels: ws.map(x => x.year), datasets: [
    { label: "All Saints", data: ws.map(x => x.a8), backgroundColor: BRAND.purple, borderRadius: 6 },
    { label: "National", data: ws.map(x => x.a8Nat), backgroundColor: BRAND.grey, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, scales: { y: { min: 4, title: { display: true, text: "Attainment 8" } } } } });
  makeChart("rc-p8", { type: "line", data: { labels: ws.map(x => x.year), datasets: [
    { label: "All Saints", data: ws.map(x => x.p8), borderColor: BRAND.purple, backgroundColor: BRAND.purple, tension: 0.3, pointRadius: 5 },
    { label: "National", data: ws.map(x => x.p8Nat), borderColor: BRAND.grey, backgroundColor: BRAND.grey, borderDash: [6, 4], tension: 0.3 } ] },
    options: { maintainAspectRatio: false } });
  makeChart("rc-em", { type: "bar", data: { labels: ws.map(x => x.year), datasets: [
    { label: "4+ E&M (ASCC)", data: ws.map(x => x.em4), backgroundColor: BRAND.purple, borderRadius: 6 },
    { label: "4+ E&M (Nat)", data: ws.map(x => x.em4Nat), backgroundColor: BRAND.purpleFaint, borderRadius: 6 },
    { label: "5+ E&M (ASCC)", data: ws.map(x => x.em5), backgroundColor: BRAND.gold, borderRadius: 6 },
    { label: "5+ E&M (Nat)", data: ws.map(x => x.em5Nat), backgroundColor: "#e6d9ab", borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, scales: { y: { max: 100, title: { display: true, text: "%" } } } } });
  const dis = r.disadvantaged;
  makeChart("rc-dis", { type: "bar", data: { labels: dis.map(x => x.year), datasets: [
    { label: "ASCC disadvantaged", data: dis.map(x => x.p8), backgroundColor: BRAND.gold, borderRadius: 6 },
    { label: "National disadvantaged", data: dis.map(x => x.p8Nat), backgroundColor: BRAND.grey, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false } });
  makeChart("rc-sen", { type: "bar", data: { labels: r.sen.map(x => x.year), datasets: [
    { label: "EHCP (E) A8", data: r.sen.map(x => x.e.a8), backgroundColor: BRAND.purple, borderRadius: 6 },
    { label: "SEN Support (K) A8", data: r.sen.map(x => x.k.a8), backgroundColor: BRAND.purpleLight, borderRadius: 6 },
    { label: "No SEN (N) A8", data: r.sen.map(x => x.none.a8), backgroundColor: BRAND.purpleFaint, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, scales: { y: { title: { display: true, text: "Attainment 8" } } } } });
  const tbl = el("rc-subjects");
  r.gcse2025Subjects.forEach(s => {
    const resClass = s[5] >= 0.3 ? "good" : (s[5] <= -0.3 ? "bad" : "");
    tbl.appendChild(h(`<tr><td>${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td><td>${s[3]}</td><td>${s[4]}</td><td class="${resClass}">${s[5] > 0 ? "+" : ""}${s[5].toFixed(2)}</td></tr>`));
  });
}

/* ================= EXTERNAL CASE (IDSR + PP) ================= */
function renderExternal() {
  const x = ASCC.external;
  el("view-external").appendChild(h(`
    <div class="view-head">
      <h2>The official picture – Ofsted's IDSR and the Pupil Premium strategy</h2>
      <p>${x.intro}</p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      ${x.tiles.map(t => `<div class="card stat"><div class="num" style="font-size:1.6rem">${t[0]}</div><div class="lbl">${t[1]}</div></div>`).join("")}
    </div>
    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card">
        <h3>What Ofsted's own system flagged (2024, school vs national)</h3>
        <div class="chart-wrap" id="ex-sig"></div>
        <p class="note">${x.sig.note}</p>
      </div>
      <div class="card chart-card">
        <h3>Where the Pupil Premium money goes – the EEF tiers as a budget</h3>
        <div class="chart-wrap" id="ex-tiers"></div>
        <p class="note">${x.pp.tiers.note}</p>
      </div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <h3>Challenge named → loop closed</h3>
      <p class="sef-headline" style="margin-top:10px">${x.pp.headline}</p>
      <div class="grid cols-2" style="margin-top:12px">
        ${x.pp.loops.map(l => `
          <div style="border-left:4px solid var(--green);padding:2px 0 2px 14px">
            <div style="font-weight:650;color:var(--purple-900);font-size:0.9rem">${l[0]}</div>
            <div style="font-size:0.84rem;margin-top:3px">${l[1]}</div>
          </div>`).join("")}
      </div>
    </div>
    <div class="grid cols-2">
      <div class="card" style="border-left:5px solid var(--gold)">
        <h3>The two flags Ofsted's system raised – both already answered</h3>
        <p style="font-size:0.88rem">${x.pp.honest}</p>
      </div>
      <div class="card" style="border-left:5px solid var(--green)">
        <h3>The triangulation</h3>
        <p style="font-size:0.9rem">${x.triangle}</p>
      </div>
    </div>
  `));
  const labels = x.sig.labels.filter((_, i) => x.sig.school[i] !== null);
  const sch = x.sig.school.filter(v => v !== null);
  const nat = x.sig.national.filter(v => v !== null);
  makeChart("ex-sig", { type: "bar", data: { labels, datasets: [
    { label: "All Saints", data: sch, backgroundColor: BRAND.purple, borderRadius: 5 },
    { label: "National", data: nat, backgroundColor: BRAND.grey, borderRadius: 5 } ] },
    options: { maintainAspectRatio: false, indexAxis: "y", scales: { x: { beginAtZero: true } } } });
  makeChart("ex-tiers", { type: "doughnut", data: { labels: x.pp.tiers.labels, datasets: [
    { label: "£", data: x.pp.tiers.amounts, backgroundColor: [BRAND.purple, BRAND.gold, BRAND.green] } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 10, font: { size: 10 } } } } } });
}

/* ================= YEAR GROUPS ================= */
function renderYears() {
  const y11 = ASCC.y11, y10 = ASCC.y10, ks3 = ASCC.ks3;
  el("view-years").appendChild(h(`
    <div class="view-head">
      <h2>Current Year Groups</h2>
      <p>In-year assessment shows the same pattern at every key stage: gaps identified early, intervention targeted, trajectories rising between assessment points.</p>
    </div>
    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card">
        <h3>Year 11 – mock-to-exam trajectory (Average A8)</h3>
        <div class="chart-wrap" id="yc-y11"></div>
        <p class="note">${y11.trajectory.note}</p>
      </div>
      <div class="card chart-card">
        <h3>Year 11 – attendance is achievement (Average A8 by attendance band)</h3>
        <div class="chart-wrap" id="yc-att"></div>
        <p class="note">${y11.attendanceNote}</p>
      </div>
    </div>
    <div class="grid cols-3" style="margin-bottom:18px">
      <div class="card stat"><div class="num">82%</div><div class="lbl">2026 predicted 4+ English &amp; Maths</div><div class="ctx">Best ever, from KS2 prior of 101.5</div></div>
      <div class="card stat"><div class="num">5.01</div><div class="lbl">2026 predicted Attainment 8</div><div class="ctx neutral">P8 prediction +0.74 (SISRA)</div></div>
      <div class="card stat"><div class="num">48%</div><div class="lbl">Y11 Pupil Premium</div><div class="ctx neutral">EAL 46% · SEN 22% – a high-need cohort</div></div>
    </div>
    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--purple-600)">
      <h3>${ASCC.y11.machinery.headline}</h3>
      <div class="grid cols-2" style="margin-top:12px">
        ${ASCC.y11.machinery.items.map(x => `
          <div style="border-left:4px solid var(--purple-500);padding:2px 0 2px 14px">
            <div style="font-weight:650;color:var(--purple-900);font-size:0.9rem">${x[0]}</div>
            <div style="font-size:0.83rem;margin-top:3px">${x[1]}</div>
          </div>`).join("")}
      </div>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3>Year 10 – Lenten 2026 snapshot</h3>
      <div class="chart-wrap" id="yc-y10" style="height:220px"></div>
      <p class="note">${y10.note}</p>
    </div>
    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--gold)">
      <h3>Primary transition – risk mapped before it arrives</h3>
      <p class="sef-headline" style="margin-top:10px">${ASCC.transition.headline}</p>
      <div class="grid cols-2" style="margin-top:12px">
        <div class="chart-card"><h4 style="margin-top:0">KS4 attendance by feeder primary (8+ pupils)</h4><div class="chart-wrap" id="yc-feeder" style="height:300px"></div>
          <p class="note">${ASCC.transition.note}</p></div>
        <div>
          <h4 style="margin-top:0">What the join tells us</h4>
          <ul style="margin-left:18px;font-size:0.85rem">${ASCC.transition.insights.map(i => `<li style="margin-bottom:8px">${i}</li>`).join("")}</ul>
        </div>
      </div>
    </div>

    <div class="grid cols-2">
      <div class="card chart-card">
        <h3>KS3 – % on/above track in English &amp; Maths</h3>
        <div class="chart-wrap" id="yc-ks3"></div>
        <p class="note">${ks3.emOnTrack.note}</p>
      </div>
      <div class="card">
        <h3>KS3 year-group profiles</h3>
        <table class="data"><tr><th>Year</th><th>Pupils</th><th>PP</th><th>EAL</th><th>SEN</th><th>Attendance</th><th>Avg KS2</th></tr>
        ${ks3.profiles.map(p => `<tr><td>${p.year}</td><td>${p.n}</td><td>${p.pp}</td><td>${p.eal}</td><td>${p.sen}</td><td>${p.att}</td><td>${p.ks2}</td></tr>`).join("")}
        </table>
        <p class="note">Y7 KS2 average of 108 is the strongest intake in years, with 95% attendance – evidence that the school's reputation and transition work are compounding.</p>
      </div>
    </div>
  `));
  makeChart("yc-y11", { type: "line", data: { labels: y11.trajectory.labels, datasets: [
    { label: "Current Y11 (2026)", data: y11.trajectory.thisYear, borderColor: BRAND.purple, backgroundColor: BRAND.purple, tension: 0.3, pointRadius: 5 },
    { label: "Last year's Y11 → GCSE 5.12", data: y11.trajectory.lastYearMocks, borderColor: BRAND.gold, backgroundColor: BRAND.gold, borderDash: [6, 4], tension: 0.3, pointRadius: 5 } ] },
    options: { maintainAspectRatio: false, scales: { y: { min: 3.5, max: 5.5 } } } });
  makeChart("yc-att", { type: "bar", data: { labels: y11.attendanceImpact.map(x => x[0]), datasets: [
    { label: "Average A8", data: y11.attendanceImpact.map(x => x[1]), backgroundColor: [BRAND.red, BRAND.purpleLight, BRAND.green], borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } } });
  makeChart("yc-y10", { type: "bar", data: { labels: ["Lenten exams 2026", "Lenten predictions 2026", "GCSE 2024 (same KS2 profile)"], datasets: [
    { label: "Average A8", data: [y10.lenten.examA8, y10.lenten.predA8, y10.lenten.gcse24A8], backgroundColor: [BRAND.purpleFaint, BRAND.purple, BRAND.gold], borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } } } });
  const tr = ASCC.transition;
  makeChart("yc-feeder", { type: "bar", data: { labels: tr.feeders.map(x => `${x[0]} (${x[1]})`), datasets: [
    { label: "Avg KS4 attendance %", data: tr.feeders.map(x => x[2]),
      backgroundColor: tr.feeders.map(x => x[2] < 88 ? BRAND.amber : BRAND.purple), borderRadius: 5 } ] },
    options: { maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { min: 70, max: 96 } } } });
  makeChart("yc-ks3", { type: "bar", data: { labels: ks3.emOnTrack.labels, datasets: [
    { label: "Michaelmas", data: ks3.emOnTrack.michaelmas, backgroundColor: BRAND.purpleFaint, borderRadius: 6 },
    { label: "Lenten", data: ks3.emOnTrack.lenten, backgroundColor: BRAND.purple, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, scales: { y: { max: 100, title: { display: true, text: "% on/above track (E&M)" } } } } });
}

/* ================= ATTENDANCE ================= */
function renderAttendance() {
  const at = ASCC.attendance;
  el("view-attendance").appendChild(h(`
    <div class="view-head">
      <h2>Attendance</h2>
      <p>Above national, above similar schools, and improving at four times the DfE's required rate – in a top-quintile deprivation context. Attendance and safeguarding run on one machinery, led by the DSL.</p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      <div class="card stat"><div class="num">92.41%</div><div class="lbl">Overall attendance (FFT, to 22 May)</div><div class="ctx">+0.78 vs national · +2.22 vs similar FSM6 schools</div></div>
      <div class="card stat"><div class="num">4×</div><div class="lbl">DfE improvement expectation beaten</div><div class="ctx">2.21% actual vs 0.5% minimum required</div></div>
      <div class="card stat"><div class="num">+9.13</div><div class="lbl">EHCP attendance vs national EHCP</div><div class="ctx">90.03% – the culture works hardest for those who need it most</div></div>
      <div class="card stat"><div class="num">+7.2</div><div class="lbl">Club members vs non-members</div><div class="ctx">Enrichment is the engine – see the Enrichment page</div></div>
    </div>
    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card"><h3>Attendance vs benchmarks (2025/26, FFT to 22 May)</h3><div class="chart-wrap" id="cc-att"></div>
        <p class="note">Pre-pandemic recovery is virtually complete: 92.41% vs 92.6% in 2018/19 – a gap of 0.19 points, ahead of most similar schools.</p></div>
      <div class="card chart-card"><h3>Vulnerable groups vs national equivalents</h3><div class="chart-wrap" id="cc-groups"></div>
        <p class="note">EHCP pupils attend <strong>9.13 points above</strong> the national EHCP figure; FSM6 +1.70. SEN Support (84.44%) is the named gap – targets: ≥87.5% and PA &lt;35% by Jan 2027, every pupil &lt;90% with a named contact and plan.</p></div>
    </div>
    <div class="grid cols-2">
      <div class="card">
        <h3>Known lines to hold</h3>
        <ul style="margin-left:18px;font-size:0.88rem">
          <li style="margin-bottom:8px"><strong>Year 11 attendance (78.6% SIMS in-year; 2.17 below national on FFT):</strong> exam pressure, anxiety and a small number of entrenched cases predating current systems. Response: audit of every incoming Y11 below 90%, Attendance Contracts with every Y10 PA/SA family before September, home visits for every severely absent pupil logged on CPOMs. Counterpoint: 64% of this Y11 improved their attendance vs their own Y10 year – against the national trend.</li>
          <li style="margin-bottom:8px"><strong>Persistent absence (20.9%):</strong> target &lt;20% by Jan 2027 with attendance ambassadors and individual targets set by Oct 2026.</li>
          <li><strong>DfE data discrepancy:</strong> ${at.dfeNote}</li>
        </ul>
      </div>
      <div class="card chart-card"><h3>In-year attendance by year group (SIMS)</h3><div class="chart-wrap" id="cc-byyear"></div>
        <p class="note">SIMS in-year figure (90.03% overall) differs from the FFT/DfE benchmarked 92.41% – known platform discrepancies are documented with an explanation ready for inspectors.</p></div>
    </div>

    <div class="card safeg-card" style="margin-top:18px">
      <h3>Safeguarding – a culture, not a folder</h3>
      <p class="sef-headline" style="margin-top:10px">${ASCC.safeguardingReport.headline}</p>
      <div class="sef-cols">
        <div>
          <h4>Everyone trained, always current</h4>
          <ul style="margin-left:18px;font-size:0.85rem">${ASCC.safeguardingReport.training.map(t => `<li style="margin-bottom:6px">${t}</li>`).join("")}</ul>
        </div>
        <div>
          <h4>What the culture looks like</h4>
          <ul style="margin-left:18px;font-size:0.85rem">${ASCC.safeguardingReport.culture.map(t => `<li style="margin-bottom:6px">${t}</li>`).join("")}</ul>
        </div>
      </div>
      <h4>How safeguarding permeates every part of the school</h4>
      <div class="perm-grid">
        ${ASCC.safeguardingReport.permeates.map(p => `
          <div class="perm-card"><div class="perm-title">${p[0]}</div><div class="perm-text">${p[1]}</div></div>`).join("")}
      </div>
    </div>
  `));
  makeChart("cc-att", { type: "bar", data: { labels: at.bars.map(x => x[0]), datasets: [
    { label: "Attendance %", data: at.bars.map(x => x[1]), backgroundColor: [BRAND.purple, BRAND.grey, BRAND.grey, BRAND.purpleFaint], borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { min: 88, max: 94 } } } });
  makeChart("cc-groups", { type: "bar", data: { labels: at.groups.map(x => x[0]), datasets: [
    { label: "All Saints", data: at.groups.map(x => x[1]), backgroundColor: BRAND.purple, borderRadius: 6 },
    { label: "National equivalent", data: at.groups.map(x => x[2]), backgroundColor: BRAND.grey, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, scales: { y: { min: 75, max: 95 } } } });
  makeChart("cc-byyear", { type: "bar", data: { labels: at.byYearSims.map(x => x[0]), datasets: [
    { label: "Attendance %", data: at.byYearSims.map(x => x[1]), backgroundColor: at.byYearSims.map(x => x[1] < 85 ? BRAND.amber : BRAND.purple), borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 70, max: 100 } } } });
}

/* ================= BEHAVIOUR ================= */
function renderBehaviour() {
  const be = ASCC.behaviour;
  el("view-behaviour").appendChild(h(`
    <div class="view-head">
      <h2>Behaviour</h2>
      <p>${be.fourYear.headline}</p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      ${be.fourYear.keyStats.map(k => `
        <div class="card stat"><div class="num" style="font-size:1.6rem">${k[0]}</div><div class="lbl">${k[1]}</div></div>`).join("")}
    </div>
    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card"><h3>Fixed-term suspensions &amp; pupils suspended, by year</h3><div class="chart-wrap" id="cc-fy-susp"></div>
        <p class="note">319 → 183 → 143: a 43.9% sustained fall from the 2023–24 peak, on course for the lowest full-year total in the dataset.</p></div>
      <div class="card chart-card"><h3>Permanent exclusions vs national average</h3><div class="chart-wrap" id="cc-fy-pex"></div>
        <p class="note">Below the national average since 2024–25; zero this year. Every past decision accounted for below.</p></div>
    </div>

    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--purple-600)">
      <h3>Inside the classroom – the internal behaviour log</h3>
      <p class="sef-headline" style="margin-top:10px">${be.internal.definition}</p>
      <div class="grid cols-4" style="margin:14px 0">
        ${be.internal.keyStats.map(k => `
          <div class="card stat" style="box-shadow:none"><div class="num" style="font-size:1.5rem">${k[0]}</div><div class="lbl">${k[1]}</div></div>`).join("")}
      </div>
      <div class="grid cols-2">
        <div class="chart-card"><h4 style="margin-top:0">Internal suspensions – falling every year for four years</h4><div class="chart-wrap" id="cc-int-total"></div></div>
        <div class="chart-card"><h4 style="margin-top:0">Per pupil on roll – halved while the school grew 41%</h4><div class="chart-wrap" id="cc-int-pp"></div></div>
      </div>
      <div class="sef-cols" style="margin-top:16px">
        <div>
          <h4>Key messages</h4>
          <ul style="margin-left:18px;font-size:0.85rem">${be.internal.messages.map(m => `<li style="margin-bottom:7px">${m}</li>`).join("")}</ul>
        </div>
        <div>
          <h4>Vulnerable groups – addressed openly</h4>
          <p style="font-size:0.85rem">${be.internal.vulnerable}</p>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:18px;border-left:5px solid var(--green)">
      <h3>Off-site direction – how we stopped permanent exclusion</h3>
      <p class="sef-headline" style="margin-top:10px">${be.osd.headline}</p>
      <div class="grid cols-4" style="margin:14px 0">
        ${be.osd.keyStats.map(k => `
          <div class="card stat" style="box-shadow:none"><div class="num" style="font-size:1.5rem">${k[0]}</div><div class="lbl">${k[1]}</div></div>`).join("")}
      </div>
      <div class="grid cols-2">
        <div class="chart-card"><h4 style="margin-top:0">Placements by year group</h4><div class="chart-wrap" id="cc-osd-year"></div>
          <p class="note">${be.osd.byYearNote}</p></div>
        <div class="chart-card"><h4 style="margin-top:0">Placements by term – all pupils vs SEND</h4><div class="chart-wrap" id="cc-osd-term"></div>
          <p class="note">${be.osd.byTermNote}</p></div>
      </div>
      <h4>Why this is a safeguarding-led model</h4>
      <ul style="margin-left:18px;font-size:0.85rem">${be.osd.framing.map(f => `<li style="margin-bottom:7px">${f}</li>`).join("")}</ul>
    </div>

    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card"><h3>Suspension rate per 100 pupils</h3><div class="chart-wrap" id="cc-susp"></div>
        <p class="note">${be.conduct}</p></div>
      <div class="card chart-card"><h3>Year 11 suspensions by half term</h3><div class="chart-wrap" id="cc-y11s"></div>
        <p class="note">${be.y11TrendNote}</p></div>
    </div>

    <div class="card" style="border-left:5px solid var(--gold)">
      <h3>How the system works – and every decision accounted for</h3>
      <div class="sef-cols" style="margin-top:14px">
        <div>
          <h4>How the system works</h4>
          <ul style="margin-left:18px;font-size:0.85rem">${be.fourYear.system.map(s => `<li style="margin-bottom:7px">${s}</li>`).join("")}</ul>
        </div>
        <div>
          <h4>Permanent exclusions – every decision accounted for</h4>
          <table class="prio"><tr><th>Year</th><th>PEX</th><th>Context</th></tr>
            ${be.fourYear.pexStory.map(p => `<tr><td style="white-space:nowrap">${p[0]}</td><td><strong>${p[1]}</strong></td><td style="font-size:0.8rem">${p[2]}</td></tr>`).join("")}
          </table>
        </div>
      </div>
      <h4>The line we hold on disproportionality</h4>
      <p style="font-size:0.87rem">${be.fourYear.honesty}</p>
      <p style="font-size:0.85rem;margin-top:8px">The community feels the difference: 100% of surveyed parents say the school promotes a safe and respectful environment; 91% of the pupil panel agree the school encourages kindness and respect.</p>
      <span class="phrase">“${be.fourYear.phrase}”</span>
    </div>
  `));
  const iv = be.internal;
  makeChart("cc-int-total", { type: "bar", data: { labels: iv.years, datasets: [
    { label: "Internal suspensions", data: iv.total, backgroundColor: BRAND.purple, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  makeChart("cc-int-pp", { type: "line", data: { labels: iv.years, datasets: [
    { label: "Internal suspensions per pupil", data: iv.perPupil, borderColor: BRAND.purple, backgroundColor: BRAND.purple, tension: 0.3, pointRadius: 5, yAxisID: "y" },
    { label: "Pupils on roll", data: iv.roll, borderColor: BRAND.gold, backgroundColor: BRAND.gold, borderDash: [6, 4], tension: 0.3, pointRadius: 4, yAxisID: "y1" } ] },
    options: { maintainAspectRatio: false, scales: {
      y: { title: { display: true, text: "Per pupil" }, min: 0 },
      y1: { position: "right", title: { display: true, text: "Roll" }, grid: { drawOnChartArea: false } } } } });
  makeChart("cc-osd-year", { type: "bar", data: { labels: be.osd.byYear.labels, datasets: [
    { label: "Off-site directions", data: be.osd.byYear.counts,
      backgroundColor: be.osd.byYear.labels.map(l => l === "Year 9" ? BRAND.gold : BRAND.purple), borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  makeChart("cc-osd-term", { type: "line", data: { labels: be.osd.byTerm.labels, datasets: [
    { label: "All placements", data: be.osd.byTerm.counts, borderColor: BRAND.purple, backgroundColor: "rgba(76,35,115,0.10)", fill: true, tension: 0.3, pointRadius: 5 },
    { label: "of which SEND", data: be.osd.byTerm.send, borderColor: BRAND.gold, backgroundColor: BRAND.gold, borderDash: [6, 4], tension: 0.3, pointRadius: 4 } ] },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } });
  makeChart("cc-susp", { type: "bar", data: { labels: ["All Saints", "National"], datasets: [
    { label: "Suspensions per 100 pupils", data: [be.suspensionRate.ascc, be.suspensionRate.national], backgroundColor: [BRAND.purple, BRAND.grey], borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } } });
  makeChart("cc-y11s", { type: "line", data: { labels: be.y11Trend.map(x => x[0]), datasets: [
    { label: "Y11 suspensions", data: be.y11Trend.map(x => x[1]), borderColor: BRAND.purple, backgroundColor: "rgba(76,35,115,0.12)", fill: true, tension: 0.3, pointRadius: 5 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } } });
  const fy = be.fourYear;
  makeChart("cc-fy-susp", { type: "bar", data: { labels: fy.years, datasets: [
    { label: "Suspensions", data: fy.suspensions, backgroundColor: BRAND.purple, borderRadius: 6 },
    { label: "Individual pupils", data: fy.pupils, backgroundColor: BRAND.gold, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } });
  makeChart("cc-fy-pex", { type: "bar", data: { labels: fy.years, datasets: [
    { label: "All Saints PEX", data: fy.pex, backgroundColor: fy.pex.map(v => v === 0 ? BRAND.green : BRAND.purple), borderRadius: 6 },
    { label: "National average", data: fy.pexNational, backgroundColor: BRAND.grey, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } });
}

/* ================= ENRICHMENT ================= */
function renderEnrichment() {
  const en = ASCC.enrichment, c = en.clubs, e8 = en.elev8;
  el("view-enrichment").appendChild(h(`
    <div class="view-head">
      <h2>Enrichment – meeting every DfE benchmark</h2>
      <p>${en.intro} <a href="${en.frameworkUrl}" target="_blank" rel="noopener">DfE Enrichment Benchmarks →</a></p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      <div class="card stat"><div class="num">8 / 8</div><div class="lbl">DfE enrichment benchmarks met</div><div class="ctx">Framework published 15 June 2026 – we already met it</div></div>
      <div class="card stat"><div class="num">${c.uniquePupils}</div><div class="lbl">Pupils in at least one club (${c.pctOfRoll}% of roll)</div><div class="ctx">84% sustained across both halves of the year</div></div>
      <div class="card stat"><div class="num">${c.attendances.toLocaleString()}</div><div class="lbl">Club attendances logged (${c.total} clubs)</div><div class="ctx">Per-half-term rate more than doubled after Elev:8 expansion</div></div>
      <div class="card stat"><div class="num">+7.2</div><div class="lbl">Attendance gap: club members vs non-members</div><div class="ctx">94.5% vs 87.3% · SEN members +12.1 · PP members +9.4</div></div>
    </div>

    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card"><h3>Enrichment is the engine of attendance</h3><div class="chart-wrap" id="en-impact"></div>
        <p class="note">${c.impact.note}</p></div>
      <div class="card chart-card"><h3>% of each year group in at least one club</h3><div class="chart-wrap" id="en-byyear"></div>
        <p class="note">${c.byYear.note}</p></div>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3>The eight benchmarks – evidence against every one</h3>
      <div id="bench-list"></div>
    </div>

    <div class="grid cols-3" style="margin-bottom:18px">
      <div class="card chart-card"><h3>Biggest clubs (summer term)</h3><div class="chart-wrap" id="en-clubs"></div>
        <p class="note">${c.topNote} ${c.breadth}</p></div>
      <div class="card chart-card"><h3>Who enrichment reaches (benchmark 5)</h3><div class="chart-wrap" id="en-parity"></div>
        <p class="note">${c.note}</p></div>
      <div class="card chart-card"><h3>A growing offer – attendances per half term</h3><div class="chart-wrap" id="en-growth"></div>
        <p class="note">${c.growth.note}</p></div>
    </div>

    <div class="card" style="margin-bottom:18px">
      <h3>Coverage of the DfE's five activity categories</h3>
      <table class="data"><tr><th>DfE category</th><th>What it means</th><th>All Saints delivery</th></tr>
        ${en.categories.map(x => `<tr><td style="font-weight:650;white-space:nowrap">${x.cat}</td><td style="font-size:0.8rem">${x.dfe}</td><td style="font-size:0.82rem">${x.ascc}</td></tr>`).join("")}
      </table>
    </div>

    <div class="card elev8-card" style="margin-bottom:18px">
      <div class="elev8-head">
        <h3>Elev:8 – ahead of the curve on the Year 8 dip</h3>
        <span class="elev8-tag">Innovation</span>
      </div>
      <p class="elev8-quote">${e8.tagline}</p>
      <div class="sef-cols">
        <div>
          <h4>The research</h4>
          <p style="font-size:0.87rem">${e8.why}</p>
          <h4>The programme</h4>
          <p style="font-size:0.87rem">${e8.what}</p>
        </div>
        <div>
          <h4>Ahead of the framework</h4>
          <p style="font-size:0.87rem">${e8.aheadOfCurve}</p>
          <h4>Already visible in the data</h4>
          <p style="font-size:0.87rem">${e8.clubsNow}</p>
        </div>
      </div>
    </div>

    <div class="card chart-card">
      <h3>The Year 8 dip – in our own matched-pupil data</h3>
      <div class="chart-wrap" id="en-dip"></div>
      <p class="note">${ASCC.enrichment.y8DipChart.note}</p>
    </div>
  `));

  const bl = el("bench-list");
  en.benchmarks.forEach(b => {
    bl.appendChild(h(`
      <div class="bench-row">
        <div class="bench-num">${b.n}</div>
        <div class="bench-body">
          <div class="bench-title">${b.title} <span class="pill met">${b.status}</span></div>
          <div class="bench-ind">DfE indicator: ${b.indicator}</div>
          <div class="bench-ev">${b.evidence}</div>
        </div>
      </div>`));
  });

  makeChart("en-impact", { type: "bar", data: { labels: c.impact.labels, datasets: [
    { label: "Club members – school attendance %", data: c.impact.members, backgroundColor: BRAND.purple, borderRadius: 6 },
    { label: "Non-members", data: c.impact.nonMembers, backgroundColor: BRAND.grey, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, scales: { y: { min: 75, max: 100 } } } });
  makeChart("en-byyear", { type: "bar", data: { labels: c.byYear.labels, datasets: [
    { label: "% of cohort in at least one club", data: c.byYear.pct,
      backgroundColor: c.byYear.labels.map(l => l === "Year 8" ? BRAND.gold : BRAND.purple), borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { max: 100 } } } });
  makeChart("en-clubs", { type: "bar", data: { labels: c.top.map(x => x[0]), datasets: [
    { label: "Members", data: c.top.map(x => x[1]), backgroundColor: c.top.map(x => x[0].includes("Elev:8") ? BRAND.gold : BRAND.purple), borderRadius: 5 } ] },
    options: { maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } } });
  makeChart("en-parity", { type: "bar", data: { labels: ["Pupil Premium", "SEN"], datasets: [
    { label: "% of school roll", data: [c.ppSchool, c.senSchool], backgroundColor: BRAND.grey, borderRadius: 6 },
    { label: "% of club members", data: [c.ppShare, c.senShare], backgroundColor: BRAND.purple, borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 50 } } } });
  makeChart("en-growth", { type: "bar", data: { labels: c.growth.labels, datasets: [
    { label: "Logged attendances per half term", data: c.growth.perHT, backgroundColor: [BRAND.purpleFaint, BRAND.purple], borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } } });
  const dip = ASCC.enrichment.y8DipChart;
  makeChart("en-dip", { type: "bar", data: { labels: dip.labels, datasets: [
    { label: "Matched attendance change (pts) vs last year", data: dip.deltas, backgroundColor: dip.deltas.map(d => d < -1 ? BRAND.red : (d >= 0 ? BRAND.green : BRAND.purpleLight)), borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } } });
}

/* ================= CAREERS / GATSBY ================= */
function renderCareers() {
  const ca = ASCC.careers;
  el("view-careers").appendChild(h(`
    <div class="view-head">
      <h2>Careers – guidance nobody here has to buy</h2>
      <p>${ca.intro} <a href="https://www.gatsbybenchmarks.org.uk/" target="_blank" rel="noopener">Gatsby Benchmarks →</a></p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      ${ca.tiles.map(t => `<div class="card stat"><div class="num">${t[0]}</div><div class="lbl">${t[1]}</div></div>`).join("")}
    </div>
    <div class="card" style="margin-bottom:18px">
      <h3>What careers looks like for a pupil here</h3>
      <div class="grid cols-2" style="margin-top:10px">
        ${ca.offer.map(o => `
          <div style="border-left:4px solid var(--purple-500);padding:2px 0 2px 14px">
            <div style="font-weight:650;color:var(--purple-900);font-size:0.92rem">${o[0]}</div>
            <div style="font-size:0.85rem;margin-top:3px">${o[1]}</div>
          </div>`).join("")}
      </div>
    </div>
    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card">
        <h3>Compass+ score by benchmark (March 2026)</h3>
        <div class="chart-wrap" id="ca-scores"></div>
        <p class="note">${ca.scoresNote}</p>
      </div>
      <div class="card" style="border-left:5px solid var(--green)">
        <h3>The pupil voice check</h3>
        <p style="font-size:0.88rem">${ca.voiceTie}</p>
        <p style="font-size:0.82rem;color:var(--muted);margin-top:8px">See <a href="#" onclick="gotoView('voice');return false;">Student &amp; Parent Voice</a> for the full Careers Day feedback, and <a href="#" onclick="gotoView('enrichment');return false;">Enrichment</a> for London Leaders.</p>
        <h4>Development plan</h4>
        <p style="font-size:0.83rem">${ca.devplan}</p>
      </div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <h3>The year in careers &amp; personal development – ${ca.events.total} events delivered</h3>
      <p class="sef-headline" style="margin-top:10px">${ca.events.headline}</p>
      <div class="grid cols-2" style="margin-top:12px">
        ${ca.events.highlights.map(x => `
          <div style="border-left:4px solid var(--gold);padding:2px 0 2px 14px">
            <div style="font-weight:650;color:var(--purple-900);font-size:0.9rem">${x[0]}</div>
            <div style="font-size:0.83rem;margin-top:3px">${x[1]}</div>
          </div>`).join("")}
      </div>
      <p class="note">${ca.events.note}</p>
    </div>
    <div class="card">
      <h3>Benchmark by benchmark – the evidence</h3>
      <div id="ca-bench"></div>
    </div>
  `));
  const bl = el("ca-bench");
  ca.benchmarks.forEach(b => {
    bl.appendChild(h(`
      <div class="bench-row">
        <div class="bench-num" style="${b.score === 100 ? "background:linear-gradient(135deg,var(--green),#2a9c66)" : ""}">${b.n}</div>
        <div class="bench-body">
          <div class="bench-title">${b.title} <span class="pill ${b.score === 100 ? "met" : "strong"}">${b.score}%</span></div>
          <div class="bench-ev">${b.evidence}</div>
        </div>
      </div>`));
  });
  makeChart("ca-scores", { type: "bar", data: { labels: ca.scores.labels, datasets: [
    { label: "Compass+ score %", data: ca.scores.pct,
      backgroundColor: ca.scores.pct.map(v => v === 100 ? BRAND.green : BRAND.purple), borderRadius: 6 } ] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } } });
}

/* ================= STUDENT & PARENT VOICE ================= */
function renderVoice() {
  const v = ASCC.voice;
  el("view-voice").appendChild(h(`
    <div class="view-head">
      <h2>Student &amp; Parent Voice</h2>
      <p>${v.intro}</p>
    </div>
    <div class="grid cols-4" style="margin-bottom:18px">
      ${v.parents.headline.map(x => `
        <div class="card stat"><div class="num">${x[0]}</div><div class="lbl">${x[1]}</div></div>`).join("")}
    </div>
    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card chart-card">
        <h3>Parents on the school, theme by theme (n=${v.parents.n})</h3>
        <div class="chart-wrap" id="vc-parents"></div>
        <p class="note">${v.parents.themesNote}</p>
      </div>
      <div class="card">
        <h3>Whole-school event voice</h3>
        ${v.events.map(e => `
          <div style="padding:12px 0;border-bottom:1px solid var(--line)">
            <div style="font-weight:650;color:var(--purple-900)">${e[0]} <span style="font-size:0.75rem;color:var(--muted);font-weight:500">· ${e[1]} responses</span></div>
            <div style="font-size:0.85rem;margin-top:3px">${e[2]}</div>
            <div style="font-size:0.85rem;color:var(--green);font-weight:550;margin-top:2px">${e[3]}</div>
          </div>`).join("")}
        <p class="note">416 pupils responded to Culture Day alone – voice collected at scale, not from a hand-picked panel.</p>
      </div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <h3>In their own words</h3>
      <div class="quote-grid">
        ${v.quotes.map(q => `
          <div class="quote-card">
            <div class="quote-theme">${q.theme}</div>
            <div class="quote-text">“${q.text}”</div>
            <div class="quote-who">– ${q.who}</div>
          </div>`).join("")}
      </div>
    </div>
    <div class="grid cols-2">
      <div class="card">
        <h3>The candid panel – what pupils affirm (n=${v.students.n})</h3>
        ${v.students.positives.map(x => `
          <div style="display:flex;gap:14px;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--line)">
            <span style="font-family:var(--serif);font-size:1.35rem;font-weight:650;color:var(--purple-800);min-width:64px">${x[0]}</span>
            <span style="font-size:0.87rem">${x[1]}</span>
          </div>`).join("")}
      </div>
      <div class="card" style="border-left:5px solid var(--gold)">
        <h3>…and what they told us to improve</h3>
        ${v.students.honest.map(x => `
          <div style="padding:9px 0;border-bottom:1px solid var(--line)">
            <div style="font-size:0.87rem;font-weight:650;color:#7a5c10">${x[0]}</div>
            <div style="font-size:0.82rem;margin-top:3px">${x[1]}</div>
          </div>`).join("")}
        <p class="note">${v.students.honestNote}</p>
      </div>
    </div>
  `));
  makeChart("vc-parents", { type: "bar", data: { labels: v.parents.themes.labels, datasets: [
    { label: "% positive", data: v.parents.themes.pct, backgroundColor: BRAND.purple, borderRadius: 5 } ] },
    options: { maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { min: 80, max: 100 } } } });
}

/* ================= CONNECTIONS GRAPH ================= */
const EDGE_STYLE = {
  drives:    { color: "#4c2373", dash: null,      label: "Drives / feeds" },
  evidences: { color: "#c9a227", dash: "7,5",     label: "Evidences / validates" },
  watches:   { color: "#b3403a", dash: "2,5",     label: "Known risk being managed" },
  underpins: { color: "#1e7d4f", dash: "12,4",    label: "Ethos underpins" },
  leaf:      { color: "#b9b0c4", dash: "1,4",     label: "Expanded data point" }
};
const NODE_STYLE = {
  pillar:  { fill: "#4c2373", stroke: "#2a1245", text: "Evaluation area" },
  driver:  { fill: "#7440ab", stroke: "#4c2373", text: "System / programme" },
  outcome: { fill: "#c9a227", stroke: "#8a6a0d", text: "Signature outcome" },
  risk:    { fill: "#fff", stroke: "#b3403a", text: "Named risk (owned)" }
};

function busy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.label = btn.textContent; btn.textContent = "✦ Thinking…"; btn.disabled = true; }
  else { btn.textContent = label || btn.dataset.label; btn.disabled = false; }
}

function renderBriefings() {
  el("view-briefings").appendChild(h(`
    <div class="view-head">
      <h2>Briefings – one page per audience</h2>
      <p>Aide-memoires for the people who'll be asked about this school: staff, pupils, governors and parents. Pick an audience, then <strong>⤓ Export to PDF</strong> prints that one-pager alone, branded and A4-landscape, ready to photocopy. The pupil and parent pages are deliberately celebratory and honest – nobody is handed a script.</p>
    </div>
    <div class="graph-filters" id="brief-chips">
      ${ASCC.briefings.map((b, i) => `<button data-b="${b.id}" class="${i === 0 ? "on" : ""}">${b.icon} ${b.audience}</button>`).join("")}
      <span style="flex:1"></span>
      <button id="brief-export" class="gf-action">⤓ Export this briefing to PDF</button>
    </div>
    <div id="brief-pages"></div>
  `));
  const pages = el("brief-pages");
  ASCC.briefings.forEach((b, i) => {
    pages.appendChild(h(`
      <div class="card briefing ${i === 0 ? "active" : ""}" id="brief-${b.id}">
        <div class="brief-head">
          <img src="https://lirp.cdn-website.com/b31b4580/dms3rep/multi/opt/All+Saints+Web+Logo+Purple-1920w.png" alt="ASCC">
          <div>
            <div class="brief-title">${b.title}</div>
            <div class="brief-tag">${b.tagline}</div>
          </div>
          <span class="pill exceptional" style="margin-left:auto">${b.audience}</span>
        </div>
        <div class="brief-grid">
          ${b.sections.map(s => `
            <div class="brief-sec">
              <div class="brief-sec-h">${s.h}</div>
              <ul>${s.items.map(x => `<li>${x}</li>`).join("")}</ul>
            </div>`).join("")}
        </div>
        <div class="brief-foot">All Saints Catholic College · Orare, Laborare, Servire · July 2026</div>
      </div>`));
  });
  el("brief-chips").addEventListener("click", e => {
    const b = e.target.closest("button[data-b]"); if (!b) return;
    document.querySelectorAll("#brief-chips button[data-b]").forEach(x => x.classList.toggle("on", x === b));
    document.querySelectorAll(".briefing").forEach(p => p.classList.toggle("active", p.id === "brief-" + b.dataset.b));
    const br = ASCC.briefings.find(x => x.id === b.dataset.b);
    const ph = el("ph-section"); if (ph) ph.textContent = `Briefing – ${br.audience}`;
    document.title = `ASCC Briefing – ${br.audience}`;
  });
  el("brief-export").addEventListener("click", () => window.print());
}

/* ================= SCENARIO LAB ================= */
window.askPortal = function (q) {
  showView("ask");
  const ta = el("ask-text");
  if (ta) { ta.value = q; sendAsk(); }
};
function renderScenarios() {
  const sc = ASCC.scenarios;
  el("view-scenarios").appendChild(h(`
    <div class="view-head">
      <h2>Scenario Lab – evidence-built, boundary-pushing</h2>
      <p>${sc.intro}</p>
    </div>
    <div class="scenario-grid" id="sc-cards"></div>
    <div class="card" style="margin-top:18px;border-left:5px solid var(--purple-600)">
      <h3>Build your own what-if</h3>
      <p style="font-size:0.85rem;color:var(--muted)">Pick a lever, a group and an outcome – the Portal AI will stress-test the scenario against the school's own data and the EEF evidence base: the case for, the risks, what to measure, and whether it clears the bar we set for Elev:8.</p>
      <div class="builder-row">
        <label>Change lever
          <select id="sb-lever">${sc.builder.levers.map(x => `<option>${x}</option>`).join("")}</select>
        </label>
        <label>Target group
          <select id="sb-group">${sc.builder.groups.map(x => `<option>${x}</option>`).join("")}</select>
        </label>
        <label>Outcome to move
          <select id="sb-outcome">${sc.builder.outcomes.map(x => `<option>${x}</option>`).join("")}</select>
        </label>
        <button class="sb-go" id="sb-go">⚡ Stress-test with Portal AI</button>
      </div>
    </div>
  `));
  const wrap = el("sc-cards");
  sc.cards.forEach(c => {
    const card = h(`
      <div class="card scenario-card">
        <div class="scen-tag">${c.tag}</div>
        <h3>${c.title}</h3>
        <p class="scen-hyp">${c.hypothesis}</p>
        <div class="scen-meta"><strong>Evidence base:</strong> ${c.evidence}</div>
        <div class="scen-meta scen-bold"><strong>Where it pushes the boundary:</strong> ${c.boundary}</div>
        <div class="scen-meta"><strong>We would measure:</strong> ${c.measures}</div>
        <button class="scen-test">⚡ Stress-test this scenario</button>
      </div>`).firstElementChild;
    card.querySelector(".scen-test").addEventListener("click", () => {
      askPortal(`Stress-test this innovation scenario for All Saints: "${c.title}". Hypothesis: ${c.hypothesis} Give me: (1) the strongest evidence for it from our own data and the EEF toolkit, (2) the three biggest risks and how we'd mitigate them, (3) exactly what we'd measure and the success thresholds, (4) a verdict – does it clear the bar Elev:8 set? Include a chart if useful.`);
    });
    wrap.appendChild(card);
  });
  el("sb-go").addEventListener("click", () => {
    const lever = el("sb-lever").value, group = el("sb-group").value, outcome = el("sb-outcome").value;
    askPortal(`Scenario Lab what-if: using "${lever}" as the change lever, targeting "${group}", to improve "${outcome}". Design the boldest credible intervention for All Saints: what it looks like in practice, the evidence for it (our own data + EEF), the risks, what we'd measure and the thresholds for scaling or stopping it. Be ambitious but evidence-built – this school runs a 12-hour day and redesigned Year 8, so don't be timid. Include a chart if useful.`);
  });
}

/* ================= GOVERNORS ================= */
function renderGovernors() {
  const g = ASCC.governors;
  el("view-governors").appendChild(h(`
    <div class="view-head">
      <h2>Governors' Challenge</h2>
      <p>${g.intro}</p>
    </div>
    <div id="gov-domains"></div>
    <div class="card" style="border-left:5px solid var(--gold);margin-top:4px">
      <h3>The challenge log – the one gap to close before the call</h3>
      <p style="font-size:0.88rem">${g.challengeNote}</p>
    </div>
  `));
  const wrap = el("gov-domains");
  g.domains.forEach(d => {
    const dom = h(`
      <div class="card" style="margin-bottom:18px">
        <h3>${d.icon} ${d.name}</h3>
        <div class="gov-list"></div>
      </div>`).firstElementChild;
    const list = dom.querySelector(".gov-list");
    d.questions.forEach(x => {
      const row = h(`
        <div class="gov-q">
          <div class="gov-question">“${x.q}”</div>
          <div class="gov-strong"><strong>A strong answer sounds like:</strong> ${x.strong}</div>
          <div class="gov-actions">
            <button class="gov-look">📄 See the evidence – ${x.look[1]}</button>
            <button class="gov-rehearse">✦ Rehearse with Portal AI</button>
          </div>
        </div>`).firstElementChild;
      row.querySelector(".gov-look").addEventListener("click", () => gotoView(x.look[0]));
      row.querySelector(".gov-rehearse").addEventListener("click", () => {
        askPortal(`A governor asks: "${x.q}" – give me the strongest evidenced answer, with exact figures, the honest caveats, and the follow-up question a sharp governor would ask next (with its answer).`);
      });
      list.appendChild(row);
    });
    wrap.appendChild(dom);
  });
}

/* ================= FRAMEWORK ================= */
function renderFramework() {
  const f = ASCC.framework;
  const scaleColors = ["#c9a227", "#4c2373", "#7440ab", "#b07f10", "#b3403a"];
  el("view-framework").appendChild(h(`
    <div class="view-head">
      <h2>The Renewed Ofsted Framework</h2>
      <p>${f.summary}</p>
    </div>
    <div class="grid cols-2">
      <div class="card">
        <h3>The five-point scale</h3>
        ${f.scale.map((s, i) => `
          <div class="scale-row">
            <div class="scale-num" style="background:${scaleColors[i]}">${5 - i}</div>
            <div><div class="t">${s[0]}</div><div class="d">${s[1]}</div></div>
          </div>`).join("")}
      </div>
      <div class="card">
        <h3>Evaluation areas on the report card</h3>
        <ul style="margin-left:18px;font-size:0.9rem">${f.areas.map(a => `<li style="margin-bottom:8px">${a}</li>`).join("")}</ul>
        <h4>Inclusion runs through everything</h4>
        <p style="font-size:0.88rem">${f.inclusion}</p>
        <h4>How the inspection runs</h4>
        <p style="font-size:0.88rem">${f.process}</p>
      </div>
    </div>
    <div class="card" style="margin-top:18px">
      <h3>Our self-evaluation against the framework</h3>
      <table class="data">
        <tr><th>Evaluation area</th><th>Self-assessment</th><th>One-line case</th></tr>
        ${ASCC.sef.map(a => `<tr><td><strong>${a.area}</strong></td><td><span class="pill ${pillClass(a.grade)}">${a.grade}</span></td><td style="font-size:0.82rem">${a.headline.split("–")[0].split(".")[0]}.</td></tr>`).join("")}
      </table>
    </div>
  `));
}

/* ================= MEDIA ================= */
function renderMedia() {
  const v = el("view-media");
  const total = ASCC.media.reduce((n, g) => n + g.items.length, 0);
  v.appendChild(h(`
    <div class="view-head">
      <h2>An innovator with a national platform</h2>
      <p>${total} pieces of national, international, sector and faith-press coverage. All Saints is not just a strong school – it is a school that shapes national policy and practice: the extended enrichment day, the phone-free culture, staff-wellbeing innovation, SEND inclusion, and the Headteacher's role as Schools Policy and Delivery Adviser to the Secretary of State, and the Headteachers' Roundtable co-chairmanship.</p>
    </div>
    <div id="media-groups"></div>
  `));
  const wrap = el("media-groups");
  ASCC.media.forEach(g => {
    const grp = h(`
      <div class="media-group">
        <h3>${g.icon} ${g.group}</h3>
        <div class="count">${g.items.length} item${g.items.length > 1 ? "s" : ""}</div>
        <div class="media-grid">
          ${g.items.map(i => `
            <a class="media-card" href="${i[2]}" target="_blank" rel="noopener">
              <div class="outlet">${i[0]}</div>
              <div class="headline">${i[1]}</div>
            </a>`).join("")}
        </div>
      </div>`);
    wrap.appendChild(grp);
  });
}

/* ================= ASK ================= */
const askHistory = [];
function renderAsk() {
  el("view-ask").appendChild(h(`
    <div class="view-head">
      <h2>✦ Ask the Portal</h2>
      <p>Interrogate the school's data in plain English. Answers are grounded in the school’s evidence and the renewed framework. Choose your examiner: the <b>Critical friend</b> finds the holes before an inspector does; the <b>Advocate</b> rehearses the strongest evidenced case. Ask for a chart and you’ll get one.</p>
      <div class="ask-stance"><button class="stance-btn on" data-stance="critical">Critical friend</button><button class="stance-btn" data-stance="advocate">Advocate</button></div>
    </div>
    <div class="ask-layout">
      <div class="ask-panel">
        <div class="ask-messages" id="ask-messages">
          <div class="msg ai">
            <div class="who">Portal AI</div>
            <div class="bubble"><p>I hold the full July 2026 SEF, three years of results, current mock and KS3 data, attendance and behaviour analysis, and the renewed Ofsted framework. Ask me anything – a killer statistic, a line to take, a chart for a meeting, or a rehearsal answer to a hard inspector question.</p></div>
          </div>
        </div>
        <div class="ask-status" id="ask-status"></div>
        <div class="ask-input">
          <textarea id="ask-text" placeholder="e.g. Make the case that our behaviour is Exceptional…" rows="1"></textarea>
          <button id="ask-send">Ask</button>
        </div>
      </div>
      <div class="ask-side">
        <div class="card">
          <h3>Try asking…</h3>
          <div id="ask-suggs"></div>
        </div>
        <div class="card">
          <h3>How it works</h3>
          <p style="font-size:0.8rem;color:var(--muted)">Questions are answered by Claude via a secure Netlify function – the API key never reaches the browser. Responses can include charts, tables and toolkit references. Always verify precise figures against the SEF before quoting to inspectors.</p>
        </div>
      </div>
    </div>
  `));
  const suggWrap = el("ask-suggs");
  ASCC.askSuggestions.forEach(s => {
    const b = h(`<button class="sugg">${s}</button>`).firstElementChild;
    b.addEventListener("click", () => { el("ask-text").value = s; sendAsk(); });
    suggWrap.appendChild(b);
  });
  el("ask-send").addEventListener("click", sendAsk);
  el("ask-text").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAsk(); }
  });
}

async function sendAsk() {
  const ta = el("ask-text"), btn = el("ask-send"), msgs = el("ask-messages");
  const q = ta.value.trim();
  if (!q || btn.disabled) return;
  ta.value = "";
  msgs.appendChild(h(`<div class="msg user"><div class="who">You</div><div class="bubble">${escapeHtml(q)}</div></div>`));
  const typing = h(`<div class="msg ai"><div class="who">Portal AI</div><div class="bubble typing"><span></span><span></span><span></span></div></div>`).firstElementChild;
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;
  btn.disabled = true;
  el("ask-status").textContent = "Thinking…";
  try {
    const res = await fetch("/.netlify/functions/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, history: askHistory.slice(-6), stance: askStance })
    });
    if (!res.ok) {
      let errMsg;
      try { errMsg = (await res.json()).error; } catch { errMsg = await res.text().catch(() => ""); }
      throw new Error(res.status === 404
        ? "The Ask function isn't available. If you're viewing this locally, deploy to Netlify (with ANTHROPIC_API_KEY set) to enable Ask."
        : `Service error (${res.status}): ${(errMsg || "").slice(0, 200)}`);
    }
    let answer = "";
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      // non-streaming fallback
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      answer = data.answer || "";
      typing.remove();
    } else {
      // streamed plain text – render live as it arrives
      const live = h(`<div class="msg ai"><div class="who">Portal AI</div><div class="bubble"></div></div>`).firstElementChild;
      const liveBubble = live.querySelector(".bubble");
      typing.replaceWith(live);
      el("ask-status").textContent = "Answering…";
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let lastPaint = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += dec.decode(value, { stream: true });
        const now = Date.now();
        if (now - lastPaint > 120) {           // throttle repaints
          lastPaint = now;
          // hide (possibly incomplete) chart blocks during streaming
          const visible = answer.replace(/```chart[\s\S]*?(```|$)/g, "\n*📊 building chart…*\n");
          liveBubble.innerHTML = DOMPurify.sanitize(marked.parse(visible));
          msgs.scrollTop = msgs.scrollHeight;
        }
      }
      live.remove();
      if (!answer.trim()) throw new Error("Empty response from the service – try again.");
    }
    askHistory.push({ role: "user", content: q }, { role: "assistant", content: answer });
    renderAiMessage(msgs, answer);
  } catch (err) {
    typing.remove();
    msgs.appendChild(h(`<div class="msg ai"><div class="who">Portal AI</div><div class="bubble"><p><strong>Couldn't answer:</strong> ${escapeHtml(err.message)}</p></div></div>`));
  }
  btn.disabled = false;
  el("ask-status").textContent = "";
  msgs.scrollTop = msgs.scrollHeight;
}

function renderAiMessage(msgs, text) {
  // Split out ```chart blocks
  const parts = text.split(/```chart\s*([\s\S]*?)```/g);
  const container = h(`<div class="msg ai"><div class="who">Portal AI</div><div class="bubble"></div></div>`).firstElementChild;
  const bubble = container.querySelector(".bubble");
  parts.forEach((part, i) => {
    if (i % 2 === 0) {
      if (part.trim()) {
        const div = document.createElement("div");
        div.innerHTML = DOMPurify.sanitize(marked.parse(part));
        bubble.appendChild(div);
      }
    } else {
      try {
        const spec = JSON.parse(part);
        const cid = "aichart-" + (++chartIdSeq);
        bubble.appendChild(h(`<div class="ai-chart">${spec.title ? `<h3 style="font-size:0.9rem;margin-bottom:8px">${escapeHtml(spec.title)}</h3>` : ""}<div class="cwrap" id="${cid}"></div></div>`));
        setTimeout(() => makeChart(cid, {
          type: spec.type || "bar",
          data: spec.data,
          options: Object.assign({ maintainAspectRatio: false }, spec.options || {})
        }), 0);
      } catch (e) {
        const pre = document.createElement("pre");
        pre.textContent = part;
        bubble.appendChild(pre);
      }
    }
  });
  msgs.appendChild(container);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------------- Render map ---------------- */
const RENDER = {
  dashboard: renderDashboard, sef: renderSef, foundations: renderFoundations, pshe: renderPshe, send: renderSend, staff: renderStaff, results: renderResults,
  years: renderYears, attendance: renderAttendance, behaviour: renderBehaviour, external: renderExternal, enrichment: renderEnrichment,
  careers: renderCareers, voice: renderVoice, library: renderLibrary,
  briefings: renderBriefings, scenarios: renderScenarios, governors: renderGovernors, framework: renderFramework,
  media: renderMedia, ask: renderAsk
};



/* ================= BRIDGE: Lens → Orbit ================= */
const BRIDGE_ID = SCHOOL_MODE === "ascc" ? "ascc" : SCHOOL_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-");
async function buildBridge() {
  const out = { school: SCHOOL_NAME, id: BRIDGE_ID, mode: SCHOOL_MODE, updated: new Date().toISOString(),
                priorities: [], strengths: [], metrics: {}, atlas: null, library: libLoad().map(x => ({ name: x.name, label: x.label })) };
  if (SCHOOL_MODE === "ascc" && typeof ASCC !== "undefined") {
    if (Array.isArray(ASCC.sef)) {
      out.sef = ASCC.sef.map(s => ({ area: s.area, grade: s.grade, headline: s.headline,
        development: s.development, priorities: s.priorities }));
      out.priorities = ASCC.sef.map(s => ({ area: s.area, title: s.area,
        items: (s.priorities || []).map(p => Array.isArray(p) ? p[0] : (typeof p === "string" ? p : (p.text || ""))).filter(Boolean) }));
    }
    try { const rs = await fetch("/data/atlas-context-ascc.json"); if (rs.ok) out.atlas = await rs.json(); } catch {}
  }
  try { localStorage.setItem("asi-lens-bridge:" + BRIDGE_ID, JSON.stringify(out)); } catch {}
  return out;
}
function injectAtlasStrip(atlas) {
  const el = document.getElementById("view-dashboard");
  if (!el || !atlas || el.querySelector(".atlas-strip")) return;
  const s = atlas.school, n = atlas.national;
  const d = document.createElement("div");
  d.className = "atlas-strip";
  d.innerHTML = `<span class="as-brand">The national picture <b>· from Atlas</b></span>
    <span class="as-chip">Attainment 8 <b>${s.a8}</b> vs <b>${n.a8Median}</b> national median</span>
    <span class="as-chip">Disadvantaged A8 <b>${s.a8Disadv}</b></span>
    <span class="as-chip">FSM <b>${s.fsmPct}%</b> vs <b>${n.fsmMedian}%</b> median</span>
    <span class="as-chip">Progress 8 <b>+${s.p8Prev}</b> last published</span>`;
  el.prepend(d);
}
let __atlasCtx = null;

/* ================= LIBRARY – EVIDENCE VAULT ================= */
const LIB_KEY = "lens-lib-" + (SCHOOL_MODE === "ascc" ? "ascc" : SCHOOL_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
const libUrls = {};
function libLoad() { try { return JSON.parse(localStorage.getItem(LIB_KEY)) || []; } catch { return []; } }
function libSave(items) { try { localStorage.setItem(LIB_KEY, JSON.stringify(items)); } catch {} }
function renderLibrary() {
  const el = document.getElementById("view-library");
  const LABELS = ["Self-evaluation (SEF)", "Results & assessment", "IDSR / DfE reports", "Attendance & behaviour", "SEND & inclusion", "Curriculum & policies", "Student & parent voice", "Governance", "Other evidence"];
  function draw() {
    const items = libLoad();
    el.innerHTML = "";
    el.appendChild(h(`
      <div class="card" style="max-width:920px">
        <h2>Library – the evidence vault</h2>
        <p class="muted">Everything the school uploads lives here, labelled and ready to power the dashboards and Ask. <b>The covenant:</b> your Library belongs to your school. It is never published, never ranked, never shared, and never seen by the Institute without permission.</p>
        <div class="lib-add">
          <input type="file" id="lib-file" multiple>
          <select id="lib-label">${LABELS.map(l => `<option>${l}</option>`).join("")}</select>
          <button class="btn" id="lib-btn">Add to Library</button>
        </div>
        <table class="lib-table"><thead><tr><th>Document</th><th>Label</th><th>Size</th><th>Added</th><th></th></tr></thead>
        <tbody>${items.length ? items.map((it, i) => `<tr>
          <td>${libUrls[it.name] ? `<a href="${libUrls[it.name]}" target="_blank" rel="noopener">${escapeHtml(it.name)}</a>` : escapeHtml(it.name)}</td>
          <td>${escapeHtml(it.label)}</td><td>${(it.size / 1024).toFixed(0)} KB</td>
          <td>${it.date}</td><td><button class="lib-x" data-i="${i}">×</button></td></tr>`).join("")
          : `<tr><td colspan="5" class="muted">Nothing here yet. The Library fills as you add your school’s evidence.</td></tr>`}</tbody></table>
        <p class="muted" style="font-size:.78rem;margin-top:10px">In this demonstration, the catalogue is kept on this device. In the deployed Fellowship, files are stored in your school’s private vault, one folder per school.</p>
      </div>`));
    el.querySelector("#lib-btn").addEventListener("click", () => {
      const inp = el.querySelector("#lib-file"), label = el.querySelector("#lib-label").value;
      const items = libLoad();
      [...inp.files].forEach(f => {
        libUrls[f.name] = URL.createObjectURL(f);
        items.unshift({ name: f.name, label, size: f.size, date: new Date().toLocaleDateString("en-GB") });
      });
      if (inp.files.length) { libSave(items); draw(); }
    });
    el.querySelectorAll(".lib-x").forEach(b => b.addEventListener("click", () => {
      const items = libLoad(); items.splice(+b.dataset.i, 1); libSave(items); draw();
    }));
  }
  draw();
}
function renderOnboard() {
  const el = document.getElementById("view-dashboard");
  el.innerHTML = "";
  el.appendChild(h(`
    <div class="card" style="max-width:820px">
      <h2>Welcome to Lens, ${escapeHtml(SCHOOL_NAME)}</h2>
      <p>Lens is your school, examined properly: strengths made visible, weaknesses put to you as questions before anyone else asks them. Your Lens is empty because it has no evidence yet.</p>
      <p><b>Start in the Library.</b> Upload your self-evaluation, results, IDSR, attendance and voice evidence, and the rooms of this portal light up as your data arrives. The Framework and Ask are open to you now.</p>
      <p class="muted"><b>The covenant:</b> everything you place in Lens belongs to your school alone.</p>
      <p><button class="btn" onclick="gotoView('library')">Open the Library →</button></p>
    </div>`));
}
if (SCHOOL_MODE !== "ascc") RENDER.dashboard = renderOnboard;
const __dash = RENDER.dashboard;
RENDER.dashboard = function () { __dash(); if (SCHOOL_MODE === "ascc") injectAtlasStrip(__atlasCtx); };

/* Auto-unlock for the current browser session (runs after all declarations) */
unlock();

})();
