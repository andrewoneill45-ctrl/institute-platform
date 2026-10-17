/* check.mjs — the tripwire. Asks the EES API whether any watched dataset
 * has published a new version since the manifest last saw it, without
 * downloading anything. Run nightly; its output lands in the Action's
 * run summary so a December KS2 release (or a February KS4 revision)
 * announces itself the morning it happens.
 */
import { readManifest, writeManifest, fetchJson, EES_API, log } from "./lib.mjs";

export async function checkOne(src, { fetchJsonFn = fetchJson } = {}) {
  if (!src.apiDataSetId) return { key: src.key, status: "no-api-id", moved: false };
  const meta = await fetchJsonFn(`${EES_API}/data-sets/${src.apiDataSetId}`);
  const version = meta?.latestVersion?.version ?? meta?.version ?? null;
  const published = meta?.latestVersion?.published ?? meta?.published ?? null;
  const seen = src.lastVersion;
  const moved = version != null && String(version) !== String(seen);
  return { key: src.key, status: "ok", version, published, seen, moved };
}

export async function run({ fetchJsonFn = fetchJson, write = true } = {}) {
  const m = readManifest();
  const results = [];
  for (const src of m.sources.filter((s) => s.route === "api")) {
    try {
      const r = await checkOne(src, { fetchJsonFn });
      results.push(r);
      if (r.moved) log("check", `MOVED — ${src.key}: version ${r.seen ?? "none"} → ${r.version} (published ${r.published})`);
      else log("check", `${src.key}: ${r.status === "no-api-id" ? "no API id yet" : `still ${r.version ?? "unpublished"}`}`);
    } catch (e) {
      results.push({ key: src.key, status: "error", error: e.message, moved: false });
      log("check", `${src.key}: ${e.message}`);
    }
  }
  const moved = results.filter((r) => r.moved);
  if (moved.length && write) {
    for (const r of moved) {
      const src = m.sources.find((s) => s.key === r.key);
      src.lastVersion = String(r.version);
    }
    writeManifest(m);
  }
  return { results, moved };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().then(({ moved }) => {
    if (moved.length) {
      console.log(`::notice title=New DfE data::${moved.map((r) => r.key).join(", ")} moved — see run log`);
    }
  }).catch((e) => { console.error(e); process.exit(1); });
}
