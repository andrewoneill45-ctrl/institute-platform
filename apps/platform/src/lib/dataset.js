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
