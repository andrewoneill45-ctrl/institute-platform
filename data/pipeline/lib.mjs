/* Shared plumbing for the refresh pipeline.
 *
 * Everything here is pure or filesystem-only except fetchJson/fetchText,
 * so the whole pipeline can be battery-tested offline with fixtures —
 * which matters, because the only place this code meets the live DfE
 * API is a GitHub Actions runner.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const MANIFEST = path.join(ROOT, "data", "sources.json");
export const PUBLIC_MANIFEST = path.join(ROOT, "apps", "platform", "public", "data", "sources.json");

export const EES_API = "https://api.education.gov.uk/statistics/v1";

export function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
}

export function writeManifest(m) {
  m.updated = new Date().toISOString().slice(0, 10);
  const text = JSON.stringify(m, null, 2) + "\n";
  fs.writeFileSync(MANIFEST, text);
  fs.mkdirSync(path.dirname(PUBLIC_MANIFEST), { recursive: true });
  fs.writeFileSync(PUBLIC_MANIFEST, text);
}

export function source(m, key) {
  const s = m.sources.find((x) => x.key === key);
  if (!s) throw new Error(`No source "${key}" in the manifest`);
  return s;
}

/* Write a JSON output only when its content actually changed, so the
 * workflow's commit-if-changed step stays honest. Returns true on change. */
export function writeIfChanged(file, data) {
  const next = typeof data === "string" ? data : JSON.stringify(data) + "\n";
  const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (prev === next) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next);
  return true;
}

export async function fetchJson(url, opts = {}) {
  const r = await fetch(url, { headers: { accept: "application/json" }, ...opts });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`);
  return r.json();
}

export async function fetchText(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`);
  return r.text();
}

/* Minimal CSV parser: quoted fields, embedded commas and newlines.
 * Returns an array of row arrays; header handling is the caller's. */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

/* Turn parsed CSV rows + header into objects keyed by lowercased header. */
export function csvObjects(rows) {
  const head = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

export function log(step, msg) {
  console.log(`[refresh:${step}] ${msg}`);
}
