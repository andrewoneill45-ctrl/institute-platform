/* validate.mjs — the gate. Nothing the pipeline writes ships unless the
 * published data still passes these checks. Run after any pull and before
 * the workflow commits; also runnable locally at any time:
 *
 *   node data/pipeline/validate.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, readManifest } from "./lib.mjs";

const DATA = path.join(ROOT, "apps", "platform", "public", "data");

export function validate() {
  const problems = [];
  const warn = [];

  /* schools.json — the spine. */
  const schoolsFile = path.join(DATA, "schools.json");
  if (!fs.existsSync(schoolsFile)) problems.push("schools.json is missing");
  else {
    const schools = JSON.parse(fs.readFileSync(schoolsFile, "utf8"));
    if (!Array.isArray(schools) || schools.length < 5000) problems.push(`schools.json has ${schools?.length ?? 0} rows — expected 5,000+`);
    const urns = new Set();
    let dupes = 0, a8 = 0;
    for (const s of schools) {
      const u = String(s.urn ?? "");
      if (urns.has(u)) dupes++;
      urns.add(u);
      if (s.attainment8 != null && Number.isFinite(parseFloat(s.attainment8))) a8++;
    }
    if (dupes) problems.push(`schools.json carries ${dupes} duplicate URNs`);
    if (a8 < 2500) problems.push(`only ${a8} schools carry an Attainment 8 figure — expected 3,000+`);
    const ascc = schools.find((s) => String(s.urn) === "100503");
    if (!ascc) problems.push("URN 100503 (All Saints Catholic College) is missing from schools.json");
  }

  /* ofsted.json — the join Prizm depends on. */
  const ofstedFile = path.join(DATA, "ofsted.json");
  if (!fs.existsSync(ofstedFile)) warn.push("ofsted.json is missing — Prizm's ofsted block will show 'Not yet inspected' everywhere");
  else {
    const of = JSON.parse(fs.readFileSync(ofstedFile, "utf8"));
    const n = Object.keys(of).length;
    if (n < 10000) warn.push(`ofsted.json covers ${n} URNs — looks thin`);
  }

  /* pulse.json — optional until the first attendance pull. */
  const pulseFile = path.join(DATA, "pulse.json");
  if (fs.existsSync(pulseFile)) {
    const p = JSON.parse(fs.readFileSync(pulseFile, "utf8"));
    if (!Array.isArray(p.rows) || !p.rows.length) problems.push("pulse.json exists but carries no rows");
    else if (!p.rows.some((r) => r.level === "national")) problems.push("pulse.json has no national row");
  }

  /* The manifest and its published copy must agree. */
  const m = readManifest();
  const pub = path.join(DATA, "sources.json");
  if (fs.existsSync(pub)) {
    const p = JSON.parse(fs.readFileSync(pub, "utf8"));
    if (JSON.stringify(p.sources.map((s) => s.key)) !== JSON.stringify(m.sources.map((s) => s.key)))
      problems.push("public sources.json disagrees with data/sources.json");
  }
  for (const s of m.sources) {
    if (!s.key || !s.name || !s.route) problems.push(`manifest entry missing key/name/route: ${JSON.stringify(s).slice(0, 60)}`);
  }

  return { problems, warn };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { problems, warn } = validate();
  for (const w of warn) console.log("warn —", w);
  if (problems.length) {
    for (const p of problems) console.error("FAIL —", p);
    process.exit(1);
  }
  console.log(`VALIDATE: data estate sound (${warn.length} warnings)`);
}
