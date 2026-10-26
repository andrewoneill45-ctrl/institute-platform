/* The reading desk, stage one: get the words and the tables out of any file,
   on the member's own device. Nothing here talks to a server. Pages (or
   sections, or slides) are kept, because every citation must be able to
   point at its place in the original. */
import { parseCSV } from "../../member/constellation/model.js";

export const MAX_BYTES = 25 * 1024 * 1024;
const extOf = (name) => (String(name).match(/\.([a-z0-9]+)$/i) || [, ""])[1].toLowerCase();

let xlsxP = null;
export function loadXLSX() {
  if (typeof window !== "undefined" && window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxP) return xlsxP;
  xlsxP = new Promise((res, rej) => {
    const sc = document.createElement("script");
    sc.src = "/lens/js/vendor-xlsx.js?v=7";
    sc.onload = () => res(window.XLSX);
    sc.onerror = () => { xlsxP = null; rej(new Error("the Excel reader failed to load")); };
    document.head.appendChild(sc);
  });
  return xlsxP;
}

/* split long text into citeable sections at paragraph boundaries */
export function sectionise(text, size = 2600) {
  const paras = String(text || "").split(/\n{2,}|\r\n\r\n/).map((p) => p.trim()).filter(Boolean);
  const out = [];
  let cur = "";
  for (const p of paras) {
    if (cur && cur.length + p.length > size) { out.push(cur); cur = ""; }
    cur += (cur ? "\n\n" : "") + p;
  }
  if (cur) out.push(cur);
  return out.map((t, i) => ({ n: i + 1, text: t }));
}

/* a table is worth keeping when it has a header and some body */
const keepTable = (rows) => rows && rows.length >= 2 && rows[0].filter((c) => String(c).trim()).length >= 2;
/* the header row may sit below a title block: take the first row that looks like headers */
export function findHeaderRow(aoa, max = 8) {
  /* a row that names the UPN column is the header row, whatever sits above it */
  for (let i = 0; i < Math.min(max, aoa.length); i++) if ((aoa[i] || []).some((c) => /^upn$/i.test(String(c).trim()))) return i;
  for (let i = 0; i < Math.min(max, aoa.length); i++) {
    const r = aoa[i] || [];
    const filled = r.filter((c) => String(c).trim()).length;
    const next = aoa[i + 1] || [];
    if (filled >= 2 && filled >= Math.max(2, next.filter((c) => String(c).trim()).length * 0.6)) return i;
  }
  return 0;
}

async function readXlsx(buf) {
  const XLSX = await loadXLSX();
  const wb = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: false });
  const tables = [];
  for (const sn of wb.SheetNames) {
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: "", raw: false })
      .map((r) => r.map((c) => String(c ?? "")));
    const h = findHeaderRow(aoa);
    const rows = aoa.slice(h).filter((r) => r.some((c) => c.trim()));
    if (keepTable(rows)) tables.push({ name: sn, rows, skipped: h });
  }
  return tables;
}

async function readDocx(buf) {
  const mod = await import("mammoth");
  const mammoth = mod.default || mod;
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const lines = [], tables = [];
  doc.body.firstChild.childNodes.forEach((node) => {
    const tag = (node.nodeName || "").toLowerCase();
    if (tag === "table") {
      const rows = [...node.querySelectorAll("tr")].map((tr) => [...tr.querySelectorAll("td,th")].map((td) => td.textContent.trim().replace(/\s+/g, " ")));
      if (keepTable(rows)) tables.push({ name: `Table ${tables.length + 1}`, rows, skipped: 0 });
      rows.forEach((r) => lines.push(r.join(" | ")));
      lines.push("");
    } else {
      const t = (node.textContent || "").trim();
      if (t) { lines.push(/^h[1-6]$/.test(tag) ? `\n${t}\n` : t); lines.push(""); }
    }
  });
  const text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { text, tables, pages: sectionise(text), unit: "section" };
}

let pdfP = null;
async function pdfjs() {
  if (!pdfP) pdfP = (async () => {
    const lib = await import("pdfjs-dist/build/pdf.mjs");
    const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    lib.GlobalWorkerOptions.workerSrc = worker;
    return lib;
  })();
  return pdfP;
}
async function readPdf(buf) {
  const lib = await pdfjs();
  const pdf = await lib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
  const pages = [];
  for (let n = 1; n <= Math.min(pdf.numPages, 200); n++) {
    const page = await pdf.getPage(n);
    const tc = await page.getTextContent();
    let t = "";
    for (const it of tc.items) { t += it.str; t += it.hasEOL ? "\n" : " "; }
    pages.push({ n, text: t.replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim() });
  }
  const chars = pages.reduce((a, p) => a + p.text.length, 0);
  const scanned = pdf.numPages > 0 && chars < 40 * pdf.numPages;
  return { pages, text: pages.map((p) => p.text).join("\n\n"), scanned, totalPages: pdf.numPages, unit: "page" };
}

async function readPptx(buf) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buf);
  const slides = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => +a.match(/(\d+)\.xml$/)[1] - +b.match(/(\d+)\.xml$/)[1]);
  const pages = [];
  for (const f of slides) {
    const xml = await zip.file(f).async("string");
    const paras = xml.split(/<\/a:p>/).map((p) => (p.match(/<a:t>([^<]*)<\/a:t>/g) || []).map((m) => m.replace(/<\/?a:t>/g, "")).join("")).filter((s) => s.trim());
    const t = paras.join("\n").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    pages.push({ n: pages.length + 1, text: t.trim() });
  }
  return { pages, text: pages.map((p) => p.text).join("\n\n"), unit: "slide" };
}

/* the one entry point: a File in, a reading out */
export async function extract(file) {
  const ext = extOf(file.name);
  const base = { name: file.name, ext, size: file.size, type: file.type || "" };
  if (file.size > MAX_BYTES) return { ...base, kind: "unsupported", note: `larger than ${MAX_BYTES / 1048576} MB` };
  try {
    if (["csv", "tsv", "txt", "md"].includes(ext)) {
      const raw = String(await file.text()).replace(/^﻿/, "");
      if (ext === "csv" || ext === "tsv") {
        const rows = (ext === "tsv" ? raw.split(/\r?\n/).map((l) => l.split("\t")) : parseCSV(raw)).filter((r) => r.some((c) => String(c).trim()));
        const h = findHeaderRow(rows);
        return { ...base, kind: "table", tables: [{ name: file.name.replace(/\.[^.]+$/, ""), rows: rows.slice(h), skipped: h }], raw };
      }
      return { ...base, kind: "document", pages: sectionise(raw), text: raw, unit: "section" };
    }
    if (["xlsx", "xls", "xlsm"].includes(ext)) {
      const tables = await readXlsx(await file.arrayBuffer());
      return tables.length ? { ...base, kind: "table", tables } : { ...base, kind: "unsupported", note: "no readable sheet" };
    }
    if (ext === "docx") {
      const d = await readDocx(await file.arrayBuffer());
      return { ...base, kind: d.text ? "document" : "unsupported", ...d, note: d.text ? undefined : "the document holds no text" };
    }
    if (ext === "pdf") {
      const d = await readPdf(await file.arrayBuffer());
      return { ...base, kind: d.scanned ? "scan" : "document", ...d, note: d.scanned ? "a scanned PDF: its pages are pictures, not text" : undefined };
    }
    if (ext === "pptx") {
      const d = await readPptx(await file.arrayBuffer());
      return { ...base, kind: d.text ? "document" : "unsupported", ...d };
    }
    if (["png", "jpg", "jpeg", "heic", "webp"].includes(ext)) return { ...base, kind: "scan", note: "a photograph or scan" };
    if (["doc", "ppt"].includes(ext)) return { ...base, kind: "unsupported", note: `the old .${ext} format: save it as .${ext}x and add it again` };
    return { ...base, kind: "unsupported", note: `.${ext || "?"} files are not read yet` };
  } catch (e) {
    return { ...base, kind: "unsupported", note: "could not be opened: " + String((e && e.message) || e).slice(0, 120) };
  }
}
