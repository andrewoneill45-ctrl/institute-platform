/* One copy of England, shared by every room.
   The schools dataset is ~26 MB parsed (about 4 MB over the wire), and it used
   to be fetched and re-parsed by Home and by Atlas on every visit. Now it is
   fetched once per session, parsed once, and handed to whichever instrument
   asks; the loader can watch it arrive, so a slow connection reads as progress,
   never as a hang. */
let promise = null;
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

async function load() {
  tell({ phase: "downloading", received: 0 });
  const ofstedP = fetch("/data/ofsted.json").then((r) => r.json()).catch(() => ({}));
  const res = await fetch("/data/schools.json");
  if (!res.ok) throw new Error("schools.json came back " + res.status);
  let raw;
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
    raw = JSON.parse(new TextDecoder().decode(buf));
  } else {
    raw = await res.json();
  }
  const ofsted = await ofstedP;
  tell({ phase: "ready" });
  return { raw, ofsted };
}

export function getDataset() {
  if (!promise) {
    promise = load().catch((e) => {
      promise = null; /* a failed load can be retried */
      tell({ phase: "failed" });
      throw e;
    });
  }
  return promise;
}
