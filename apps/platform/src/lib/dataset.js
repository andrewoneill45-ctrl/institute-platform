/* One copy of England, shared by every room — now in two servings.

   The dataset used to be one ~36 MB file that every room waited for in full.
   It is now split at build time (data/pipeline/split.mjs):

     schools-core.json   (~11 MB parsed, ~1.6 MB over the wire) — identity,
                         place, size and the headline measures: enough for the
                         Atlas map, Prizm's picker and the first tiles.
     schools-detail.json (the rest, keyed by URN) — fetched in the background
                         and merged into the SAME row objects, so anything
                         holding a reference sees the fields appear.

   getDatasetCore() resolves when the core is parsed: the door opens.
   getDataset()     resolves when the detail is merged: every figure present.
   Both hand back the same { raw, ofsted } and the same row identities. */
let corePromise = null;
let fullPromise = null;
const listeners = new Set();
let snap = { received: 0, phase: "idle" };

export function datasetProgress(fn) {
  listeners.add(fn);
  try { fn(snap); } catch { /* listener's problem */ }
  return () => listeners.delete(fn);
}
const tell = (patch) => {
  snap = { ...snap, ...patch };
  listeners.forEach((f) => { try { f(snap); } catch { /* listener's problem */ } });
};

const V = () => (typeof __ASI_BUILD__ !== "undefined" ? "?v=" + __ASI_BUILD__ : "");

async function fetchStreamed(path) {
  const res = await fetch(path + V());
  if (!res.ok) throw new Error(path + " came back " + res.status);
  if (res.body && res.body.getReader) {
    const reader = res.body.getReader();
    const parts = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      received += value.byteLength;
      tell({ received });
    }
    tell({ phase: "parsing" });
    const buf = new Uint8Array(parts.reduce((a, p) => a + p.byteLength, 0));
    let o = 0;
    parts.forEach((p) => { buf.set(p, o); o += p.byteLength; });
    return JSON.parse(new TextDecoder().decode(buf));
  }
  return res.json();
}

async function loadCore() {
  tell({ phase: "downloading", received: 0 });
  const ofstedP = fetch("/data/ofsted.json" + V()).then((r) => r.json()).catch(() => ({}));
  const raw = await fetchStreamed("/data/schools-core.json");
  const ofsted = await ofstedP;
  tell({ phase: "ready-core" });
  return { raw, ofsted };
}

async function loadFull() {
  const { raw, ofsted } = await getDatasetCore();
  tell({ phase: "enriching" });
  const detail = await fetch("/data/schools-detail.json" + V()).then((r) => {
    if (!r.ok) throw new Error("schools-detail.json came back " + r.status);
    return r.json();
  });
  for (const s of raw) {
    const d = detail[String(s.urn)];
    if (d) Object.assign(s, d);
  }
  tell({ phase: "ready" });
  return { raw, ofsted };
}

export function getDatasetCore() {
  if (!corePromise) {
    corePromise = loadCore().catch((e) => {
      corePromise = null; /* a failed load can be retried */
      tell({ phase: "failed" });
      throw e;
    });
  }
  return corePromise;
}

/* the early-years layer (authority level): small, cached, shared */
let earlyPromise = null;
export function getEarly() {
  if (!earlyPromise) earlyPromise = fetch("/data/early.json" + V()).then((r) => r.json()).catch(() => ({}));
  return earlyPromise;
}

/* the cohort-flow layer: eleven January censuses of year-group rolls plus the
   exclusions series, per school. Heavy, so fetched only when a flow is asked for. */
/* post-16: the 16 to 18 performance tables (2021/22 to 2024/25), headline
   measures, L3 value added and A level subjects for every school sixth form
   and college. Fetched only when a sixth form is in question. */
/* demand and places: applications and offers 2014/15 to 2026/27, capacity
   returns and planning-area forecasts. Fetched when asked for, or when a
   school page opens. */
/* the twins' intake measures: KS2 prior attainment of the 2024 GCSE cohort,
   disadvantage and EAL of the 2026 one. Small; fetched with the dataset. */
let intakePromise = null;
export function getIntake() {
  if (!intakePromise) intakePromise = fetch("/data/intake.json" + V()).then((r) => r.json()).catch(() => { intakePromise = null; return null; });
  return intakePromise;
}

let placesPromise = null;
export function getPlaces() {
  if (!placesPromise) placesPromise = fetch("/data/places.json" + V()).then((r) => r.json()).catch(() => { placesPromise = null; return null; });
  return placesPromise;
}

let post16Promise = null;
export function getPost16() {
  if (!post16Promise) post16Promise = fetch("/data/post16.json" + V()).then((r) => r.json()).catch(() => { post16Promise = null; return null; });
  return post16Promise;
}

let flowsPromise = null;
export function getFlows() {
  if (!flowsPromise) flowsPromise = fetch("/data/flows.json" + V()).then((r) => r.json()).catch(() => ({}));
  return flowsPromise;
}

export function getDataset() {
  if (!fullPromise) {
    fullPromise = loadFull().catch((e) => {
      fullPromise = null;
      tell({ phase: "failed" });
      throw e;
    });
  }
  return fullPromise;
}

/* the ledger: every school's finance return since 2016/17 (CFR and AAR),
   in £ thousands. Fetched only when Forecast opens. */
let financePromise = null;
export function getFinance() {
  if (!financePromise) financePromise = fetch("/data/finance.json" + V()).then((r) => r.json()).catch(() => { financePromise = null; return null; });
  return financePromise;
}
