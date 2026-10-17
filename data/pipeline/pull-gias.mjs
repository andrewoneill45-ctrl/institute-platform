/* pull-gias.mjs — the register.
 *
 * GIAS publishes the whole schools register daily as one CSV. The refresh
 * uses it for two things:
 *   1. a working registry copy (data/registry/gias-latest.csv, git-ignored
 *      by size — only the derived diff is committed), and
 *   2. a URN-change watchlist: schools in our schools.json whose URN has
 *      closed with a successor (academy conversions), so the next
 *      performance merge can stitch old and new URNs together.
 *
 * The diff is small and IS committed: data/registry/urn-changes.json.
 */
import path from "node:path";
import fs from "node:fs";
import { ROOT, readManifest, writeManifest, source, fetchText, parseCsv, csvObjects, writeIfChanged, log } from "./lib.mjs";

export const REGISTRY_DIR = path.join(ROOT, "data", "registry");
export const CHANGES_OUT = path.join(REGISTRY_DIR, "urn-changes.json");
const SCHOOLS_JSON = path.join(ROOT, "apps", "platform", "public", "data", "schools.json");

export function giasUrl(date = new Date()) {
  const m = readManifest();
  const pattern = source(m, "gias").downloadPattern;
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  return pattern.replace("{YYYYMMDD}", ymd);
}

/* Pure: given GIAS rows (objects) and the set of URNs we publish, return
 * the watchlist of our schools that have closed with a successor. */
export function urnChanges(giasRows, ourUrns) {
  const ours = new Set(Array.from(ourUrns, String));
  return giasRows
    .filter((r) => ours.has(String(r.urn)) && /closed/i.test(r["establishmentstatus (name)"] ?? r.status ?? ""))
    .map((r) => ({
      urn: String(r.urn),
      name: r.establishmentname ?? r.name ?? null,
      closed: r.closedate ?? null,
      successor: r["links.urn"] ?? r.successor_urn ?? null,
      reason: r["reasonestablishmentclosed (name)"] ?? null,
    }));
}

export async function run({ fetchTextFn = fetchText, date = new Date() } = {}) {
  const url = giasUrl(date);
  let csv;
  try {
    csv = await fetchTextFn(url);
  } catch (e) {
    /* GIAS publishes in the early morning; yesterday's file is the fallback. */
    const y = new Date(date.getTime() - 86400e3);
    log("gias", `today's file not there (${e.message}); trying yesterday`);
    csv = await fetchTextFn(giasUrl(y));
  }

  fs.mkdirSync(REGISTRY_DIR, { recursive: true });
  fs.writeFileSync(path.join(REGISTRY_DIR, "gias-latest.csv"), csv);

  const rows = csvObjects(parseCsv(csv));
  const our = JSON.parse(fs.readFileSync(SCHOOLS_JSON, "utf8")).map((s) => s.urn);
  const changes = urnChanges(rows, our);
  const changed = writeIfChanged(CHANGES_OUT, { checked: new Date().toISOString().slice(0, 10), changes });

  const m = readManifest();
  const src = source(m, "gias");
  src.lastPulled = new Date().toISOString().slice(0, 10);
  src.lastVersion = `daily file, ${rows.length} establishments`;
  writeManifest(m);

  log("gias", `${rows.length} establishments; ${changes.length} of our URNs closed with successors`);
  if (changes.length) {
    console.log(`::warning title=URN changes::${changes.length} published schools have closed URNs — see data/registry/urn-changes.json`);
  }
  return { establishments: rows.length, changes: changes.length, changed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { console.error(e); process.exit(1); });
}
