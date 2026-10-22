/* The dataset split: schools.json (the master, ~37 MB) becomes two served
   files so the first screen never waits for the whole filing cabinet.

     schools-core.json   - one slim row per school: identity, place, size,
                           context and the headline measures the first screens
                           draw (the Atlas map, Prizm's picker, home tiles).
     schools-detail.json - everything else, keyed by URN, fetched in the
                           background and merged into the same row objects.

   Run at build time (the platform's prebuild script); the outputs are
   generated, not committed. The master stays the single source of truth that
   every data merge writes to. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(HERE, "../../apps/platform/public/data");
const SRC = path.join(DATA, "schools.json");

/* what the first screens need before anything else arrives */
export const CORE_FIELDS = [
  "urn", "name", "la", "region", "town", "pcon", "trust",
  "phase", "type", "gender", "religiousCharacter", "sixth_form",
  "latitude", "longitude", "pupils",
  "edu_fsm_pct", "fsm_pct",
  "attainment8", "basics_95", "ks2_rwm_exp",
  "sen_all_pct", "sen_ehcp_pct", "sen_support_pct",
];

export function split(schools) {
  const coreSet = new Set(CORE_FIELDS);
  const core = [];
  const detail = {};
  for (const s of schools) {
    const c = {};
    let d = null;
    for (const [k, v] of Object.entries(s)) {
      if (v == null) continue;
      if (coreSet.has(k)) c[k] = v;
      else { (d = d || {})[k] = v; }
    }
    core.push(c);
    if (d && s.urn != null) detail[String(s.urn)] = d;
  }
  return { core, detail };
}

/* run directly: read the master, write the two served files */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const schools = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const { core, detail } = split(schools);
  const coreS = JSON.stringify(core), detailS = JSON.stringify(detail);
  fs.writeFileSync(path.join(DATA, "schools-core.json"), coreS);
  fs.writeFileSync(path.join(DATA, "schools-detail.json"), detailS);
  const mb = (s) => (s.length / 1048576).toFixed(1) + " MB";
  console.log(`split: ${schools.length.toLocaleString("en-GB")} schools → core ${mb(coreS)} + detail ${mb(detailS)} (master ${mb(fs.readFileSync(SRC, "utf8"))})`);
}
