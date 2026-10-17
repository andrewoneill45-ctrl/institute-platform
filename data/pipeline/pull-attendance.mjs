/* pull-attendance.mjs — the fortnightly national pulse.
 *
 * "Pupil attendance in schools" is national/regional/LA-level (never
 * school-level), so it feeds a small public/data/pulse.json — the
 * national weather Prizm and the position papers can cite — and leaves
 * schools.json alone.
 *
 * The catalogue id is stable; the API dataset id is resolved at run time
 * so a reissue doesn't break the pipeline.
 */
import path from "node:path";
import { ROOT, readManifest, writeManifest, source, fetchJson, writeIfChanged, EES_API, log } from "./lib.mjs";

export const PULSE_OUT = path.join(ROOT, "apps", "platform", "public", "data", "pulse.json");

/* Shape the API's latest national + regional rows into the pulse file.
 * Pure: takes already-fetched result rows, returns the JSON we publish. */
export function shapePulse(rows, meta = {}) {
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
  const keep = rows
    .map((r) => {
      const level = (r.geographic_level ?? r.geographicLevel ?? "").toLowerCase();
      const name = r.region_name || r.la_name || (level === "national" ? "England" : null);
      return {
        level,
        name,
        week: r.time_period ?? r.week_commencing ?? r.attendance_date ?? null,
        phase: r.education_phase ?? r.phase ?? "Total",
        abs: num(r.overall_absence_perc ?? r.absence_rate ?? r.overall_absence_rate),
        auth: num(r.authorised_absence_perc ?? r.authorised_absence_rate),
        unauth: num(r.unauthorised_absence_perc ?? r.unauthorised_absence_rate),
      };
    })
    .filter((r) => (r.level === "national" || r.level === "regional") && r.abs != null);
  return {
    source: "DfE, Pupil attendance in schools (fortnightly)",
    version: meta.version ?? null,
    published: meta.published ?? null,
    rows: keep,
  };
}

export async function run({ fetchJsonFn = fetchJson } = {}) {
  const m = readManifest();
  const src = source(m, "attendance-pulse");

  /* Resolve the API dataset id from the catalogue entry if we don't hold one. */
  let id = src.apiDataSetId;
  if (!id) {
    const list = await fetchJsonFn(`${EES_API}/publications/${src.catalogueId}/data-sets?page=1&pageSize=5`);
    id = list?.results?.[0]?.id ?? null;
    if (!id) throw new Error("Could not resolve an API dataset id for attendance-pulse");
    src.apiDataSetId = id;
    log("attendance", `resolved apiDataSetId ${id}`);
  }

  const meta = await fetchJsonFn(`${EES_API}/data-sets/${id}`);
  const version = meta?.latestVersion?.version ?? meta?.version ?? null;
  if (version != null && String(version) === String(src.lastVersion)) {
    log("attendance", `still version ${version} — nothing to do`);
    return { changed: false, version };
  }

  /* Query the latest national + regional rows. The EES query endpoint
   * pages; the pulse needs only the most recent periods, so one page
   * of recent data is enough. */
  const q = await fetchJsonFn(`${EES_API}/data-sets/${id}/query?page=1&pageSize=1000`, { method: "GET" });
  const rows = q?.results ?? [];
  const pulse = shapePulse(rows.map(flattenEesRow), { version, published: meta?.latestVersion?.published ?? null });
  const changed = writeIfChanged(PULSE_OUT, pulse);
  if (changed) {
    src.lastVersion = version != null ? String(version) : src.lastVersion;
    src.lastPulled = new Date().toISOString().slice(0, 10);
    writeManifest(m);
    log("attendance", `pulse.json refreshed — ${pulse.rows.length} rows, version ${version}`);
  } else {
    log("attendance", "fetched, but content identical — no write");
  }
  return { changed, version, rows: pulse.rows.length };
}

/* EES query results nest values under filters/locations/values maps;
 * flatten the common shapes into one flat object for shapePulse. Pure. */
export function flattenEesRow(r) {
  if (!r || typeof r !== "object") return {};
  const flat = { ...r };
  for (const k of ["values", "filters", "locations", "timePeriod"]) {
    const v = r[k];
    if (v && typeof v === "object") Object.assign(flat, v);
  }
  if (r.geographicLevel) flat.geographic_level = r.geographicLevel;
  return flat;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => { console.error(e); process.exit(1); });
}
