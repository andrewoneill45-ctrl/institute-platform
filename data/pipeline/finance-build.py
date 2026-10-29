#!/usr/bin/env python3
"""Forecast's ledger: every school's finance return, year by year.

Reads the DfE's CFR workbooks (LA-maintained schools) and AAR downloads
(academies) from a folder, harmonises the headline lines across the years
the headers drifted, keeps only full-year (12-month) returns, and writes
apps/platform/public/data/finance.json keyed by URN.

    python3 finance-build.py /path/to/raw apps/platform/public/data/finance.json

Figures are whole pounds in the source (AAR rounded to £1,000 at source);
here they are stored in £ thousands (integers) to keep the file small.
"""
import glob, json, re, sys, os
import openpyxl

RAW, OUT = sys.argv[1], sys.argv[2]

# the lines of the ledger, in the order they are stored per year
FIELDS = ["inc", "exp", "grant", "self", "teach", "supply", "edsup", "admin", "staff", "prem", "energy", "cater", "edsupplies", "prof", "bal", "res", "pupils", "teachers", "fsm", "p16"]
# header matching: (candidates, pick) where pick is 'first' or 'last'
MATCH = {
    "inc":        (["total income"], "last"),
    "exp":        (["total expenditure"], "last"),
    "grant":      (["grant funding", "total grant funding"], "last"),
    "self":       (["self generated funding", "total self generated funding"], "last"),
    "teach":      (["teaching staff"], "first"),
    "supply":     (["supply staff"], "last"),
    "edsup":      (["education support staff"], "first"),
    "admin":      (["administrative and clerical staff"], "first"),
    "staff":      (["staff total", "total staff costs"], "last"),
    "prem":       (["premises:", "premises costs", "premises"], "last"),
    "energy":     (["energy"], "first"),
    "cater":      (["catering exp"], "last"),
    "edsupplies": (["educational supplies", "total costs of educational supplies"], "last"),
    "prof":       (["brought in professional", "costs of brought in professional"], "last"),
    "bal":        (["in-year balance", "in year balance"], "last"),
    "res":        (["revenue reserve"], "first"),
    "pupils":     (["no pupils", "number of pupils in academy", "full time equivalent number of pupils in scho", "number of pupils (fte)"], "first"),
    "teachers":   (["no teachers", "fte number of teachers", "number of teachers"], "first"),
    "fsm":        (["eligible for fsm"], "first"),
    "p16":        (["no of pupils in 6th form", "number of pupils in 6th form"], "first"),
    "urn":        (["urn"], "first"),
    "period":     (["period covered", "estimated number of months"], "first"),
    "phase":      (["overall phase"], "first"),
    "name":       (["school name"], "first"),
    "trust":      (["trust or company name", "company name"], "first"),
}
EXCLUDE = {"prem": ["premises staff"], "energy": [], "teach": ["non teaching"], "res": ["share of", "distributed"]}

def norm(s):
    return re.sub(r"\s+", " ", str(s or "").replace("\n", " ")).strip().lower()

def find_cols(header):
    h = [norm(x) for x in header]
    cols = {}
    for k, (cands, pick) in MATCH.items():
        hits = []
        for i, x in enumerate(h):
            if k == "urn" and x != "urn":
                continue
            if any(c in x for c in cands) and not any(e in x for e in EXCLUDE.get(k, [])):
                hits.append(i)
        if hits:
            cols[k] = hits[0] if pick == "first" else hits[-1]
    return cols

def year_of(fname):
    m = re.search(r"(20\d\d)-(\d\d)", fname)
    if m:
        return m.group(1) + m.group(2)
    m = re.search(r"SFR(\d+)_(20\d\d)", fname)   # SFR27_2016 is 2014/15; SFR32_2017 is 2015/16
    if m:
        y = int(m.group(2)) - 2
        return f"{y}{str(y + 1)[2:]}"
    return None

def num(v):
    if v is None or v == "":
        return None
    try:
        f = float(str(v).replace(",", ""))
    except ValueError:
        return None
    return f

ledger = {}      # urn -> {year: [fields]}
meta = {}        # urn -> {name, phase, trust?}
years = set()
report = []

for f in sorted(glob.glob(os.path.join(RAW, "*.xlsx"))):
    base = os.path.basename(f)
    y = year_of(base)
    src = "A" if base.upper().startswith(("AAR", "SFR")) else "C"
    if not y:
        continue
    wb = openpyxl.load_workbook(f, read_only=True)
    sheet = next((ws for ws in wb.worksheets if ws.max_row > 1000), None)
    if sheet is None:
        report.append(f"{base}: no data sheet"); continue
    rows = sheet.iter_rows(values_only=True)
    header, hi = None, -1
    for i, r in enumerate(rows):
        if any(norm(c) == "urn" for c in r):
            header, hi = list(r), i
            break
        if i > 8:
            break
    if header is None:
        report.append(f"{base}: no header"); continue
    cols = find_cols(header)
    missing = [k for k in FIELDS if k not in cols]
    n, kept = 0, 0
    for r in rows:
        urn = r[cols["urn"]] if "urn" in cols else None
        try:
            urn = int(float(urn))
        except (TypeError, ValueError):
            continue
        n += 1
        if "period" in cols:
            p = num(r[cols["period"]])
            if p is not None and p < 12:
                continue
        rec = []
        for k in FIELDS:
            v = num(r[cols[k]]) if k in cols else None
            if v is None:
                rec.append(None)
            elif k in ("pupils", "teachers", "fsm", "p16"):
                rec.append(round(v, 1))
            else:
                rec.append(int(round(v / 1000.0)))
        if rec[0] is None and rec[1] is None:
            continue
        if "bal" not in cols and rec[0] is not None and rec[1] is not None:
            rec[FIELDS.index("bal")] = rec[0] - rec[1]
        rec.append(src)
        ledger.setdefault(str(urn), {})[y] = rec
        m = meta.setdefault(str(urn), {})
        if "name" in cols and r[cols["name"]]:
            m["n"] = str(r[cols["name"]]).strip()
        if "phase" in cols and r[cols["phase"]]:
            m["ph"] = str(r[cols["phase"]]).strip()
        if "trust" in cols and r[cols["trust"]] and src == "A":
            m["t"] = str(r[cols["trust"]]).strip()
        kept += 1
    years.add(y)
    report.append(f"{base}: {y} {src} rows {n} kept {kept} missing {missing}")

for line in report:
    print(line)

out = {
    "vintage": "DfE consistent financial reporting (CFR, LA-maintained) and academies accounting returns (AAR), " + ", ".join(sorted(years)[:1]) + " to " + ", ".join(sorted(years)[-1:]) + "; full-year returns only; £ thousands",
    "fields": FIELDS + ["src"],
    "years": sorted(years),
    "s": {u: {"m": meta.get(u, {}), "y": ys} for u, ys in ledger.items()},
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as fh:
    json.dump(out, fh, separators=(",", ":"))
print("schools", len(ledger), "years", sorted(years), "->", OUT, round(os.path.getsize(OUT) / 1e6, 1), "MB")
