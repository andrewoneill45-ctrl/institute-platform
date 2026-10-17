/* refresh.mjs — the nightly conductor. What the GitHub Action actually runs.
 *
 *   node data/pipeline/refresh.mjs            # everything
 *   node data/pipeline/refresh.mjs check      # tripwire only
 *   node data/pipeline/refresh.mjs attendance # one step
 *
 * Steps never throw the whole run down: each reports, the summary at the
 * end says what moved, and validate.mjs gates the commit.
 */
import { run as check } from "./check.mjs";
import { run as attendance } from "./pull-attendance.mjs";
import { run as gias } from "./pull-gias.mjs";
import { validate } from "./validate.mjs";
import { log } from "./lib.mjs";

const STEPS = {
  check: async () => { const { moved } = await check(); return { moved: moved.length > 0, detail: moved.map((r) => r.key).join(", ") || "nothing new" }; },
  attendance: async () => { const r = await attendance(); return { moved: r.changed, detail: r.changed ? `pulse.json → version ${r.version}` : "unchanged" }; },
  gias: async () => { const r = await gias(); return { moved: r.changed, detail: `${r.establishments} establishments, ${r.changes} URN changes` }; },
};

const asked = process.argv.slice(2);
const names = asked.length ? asked : Object.keys(STEPS);

let anythingMoved = false;
const summary = [];
for (const name of names) {
  const step = STEPS[name];
  if (!step) { console.error(`No step "${name}" — have: ${Object.keys(STEPS).join(", ")}`); process.exit(2); }
  try {
    const r = await step();
    anythingMoved = anythingMoved || r.moved;
    summary.push(`${name}: ${r.detail}`);
  } catch (e) {
    summary.push(`${name}: FAILED — ${e.message}`);
    log(name, `failed: ${e.message}`);
  }
}

const { problems, warn } = validate();
for (const w of warn) summary.push(`warn: ${w}`);
console.log("\n== refresh summary ==");
for (const s of summary) console.log("  " + s);

if (problems.length) {
  for (const p of problems) console.error("VALIDATE FAIL — " + p);
  process.exit(1); /* a failed gate must fail the Action so nothing bad commits */
}
console.log(anythingMoved ? "Data moved — workflow will commit." : "Nothing changed tonight.");
