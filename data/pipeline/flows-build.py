#!/usr/bin/env python3
"""Build flows.json: per-school NC-year rolls 2015/16-2025/26 + exclusions + trust-by-year."""
import csv, json, re, sys, io

BASE = "/home/claude/eesdata"
YEARS = ["201516","201617","201718","201819","201920","202021","202122","202223","202324","202425","202526"]
FILES = [
    ("201516", f"{BASE}/2015-16/SFR20_2016_Schools_NCYear_UD.csv"),
    ("201617", f"{BASE}/2016-17/SFR28_2017_Schools_NCYear_UD.csv"),
    ("201718", f"{BASE}/2017-18/Schools_Pupils_and_their_Characteristics_2018_Schools_NCYear_UD.csv"),
    ("201819", f"{BASE}/2018-19/Schools_Pupils_and_their_Characteristics_2019_pupil_characteristics_UD.csv"),
    ("201920", f"{BASE}/2019-20/spc_school_level_underlying_data.csv"),
    ("202021", f"{BASE}/2020-21/spc_school_level_underlying_data_220216.csv"),
    ("202122", f"{BASE}/2021-22/spc_school_level_underlying_data_20230302.csv"),
    ("202223", f"{BASE}/2022-23/spc_school_level_underlying_data_23112023.csv"),
    ("202324", f"{BASE}/2023-24/spc_school_level_underlying_data.csv"),
    ("202425", f"{BASE}/2024-25/spc_school_level_underlying_data_2025.csv"),
    ("202526", f"{BASE}/supporting-files/spc_school_level_underlying_data_2026.csv"),
]
YG_RE = re.compile(r"(part|full)[ \-]?time\s+(girls|boys|female|male)\s+(nursery\s?[12]|reception|year\s?group\s?(\d{1,2}|not\s?followed))\s*$", re.I)

def openc(path):
    for enc in ("utf-8-sig", "cp1252"):
        try:
            with io.open(path, encoding=enc, newline="") as f:
                return list(csv.reader(f))
        except UnicodeDecodeError:
            continue
    raise RuntimeError("encoding " + path)

def num(v):
    v = (v or "").strip().replace(",", "")
    if not v or v in ("x","z","c",":","..",".","s","low","-"): return 0
    try: return int(float(v))
    except ValueError: return 0

def find(h, *pats):
    for i, c in enumerate(h):
        cc = (c or "").strip().lower()
        for p in pats:
            if re.fullmatch(p, cc): return i
    return None

schools = {}   # urn -> record
laestabByYear = {}  # year -> {laestab: urn}

for year, path in FILES:
    rows = openc(path)
    h = rows[0]
    yi = YEARS.index(year)
    iu = find(h, r"urn")
    ile = find(h, r"laestab", r"la ?estab")
    inm = find(h, r"school ?name", r"estab(lishment)? ?name")
    iph = find(h, r"phase-?type grouping", r"phase ?of ?education", r"phase")
    itr = find(h, r"trust", r"trust ?name", r"academy ?trust ?name")
    # year-group columns
    cols = []  # (idx, bucket)
    for i, c in enumerate(h):
        m = YG_RE.search((c or "").strip())
        if not m: continue
        b = m.group(3).lower().replace(" ", "")
        if b.startswith("nursery") or "not" in b: continue
        bucket = 0 if b == "reception" else int(m.group(4))
        if 1 <= bucket <= 14 or bucket == 0:
            cols.append((i, bucket))
    n = 0
    for r in rows[1:]:
        if iu is None or iu >= len(r): continue
        urn = (r[iu] or "").strip()
        if not urn.isdigit(): continue
        counts = [0]*15
        for i, b in cols:
            if i < len(r): counts[b] += num(r[i])
        if sum(counts) == 0: continue
        rec = schools.setdefault(urn, {"y": {}, "x": {}, "t": {}})
        rec["y"][str(yi)] = counts
        if inm is not None and inm < len(r) and (r[inm] or "").strip(): rec["n"] = r[inm].strip()
        if iph is not None and iph < len(r) and (r[iph] or "").strip(): rec["ph"] = r[iph].strip()
        if itr is not None and itr < len(r) and (r[itr] or "").strip() and r[itr].strip().lower() not in ("not applicable","x","z"):
            rec.setdefault("tn", {})[str(yi)] = r[itr].strip()
        if ile is not None and ile < len(r) and (r[ile] or "").strip():
            le = r[ile].strip()
            rec["le"] = le
            laestabByYear.setdefault(yi, {})[le] = urn
        n += 1
    print(f"{year}: {n} schools, {len(cols)} yeargroup cols", file=sys.stderr)

# exclusions + trust per year
rows = openc(f"{BASE}/excl/exc_school.csv")
h = rows[0]
ix = {k: find(h, p) for k, p in {
    "tp": r"time_period", "urn": r"school_urn", "tn": r"trust_name", "hc": r"headcount",
    "pe": r"perm_excl", "su": r"suspension", "le": r"school_laestab", "phase": r"education_phase"}.items()}
def numx(v):
    v = (v or "").strip().replace(",", "")
    if not v or v in ("x","z","c",":",".."): return -1
    try: return int(float(v))
    except ValueError: return -1
nx = 0
for r in rows[1:]:
    tp = (r[ix["tp"]] or "").strip()
    if tp not in YEARS: continue
    urn = (r[ix["urn"]] or "").strip()
    if not urn.isdigit(): continue
    yi = YEARS.index(tp)
    rec = schools.setdefault(urn, {"y": {}, "x": {}, "t": {}})
    rec["x"][str(yi)] = [numx(r[ix["hc"]]), numx(r[ix["su"]]), numx(r[ix["pe"]])]
    tn = (r[ix["tn"]] or "").strip()
    if tn and tn.lower() not in ("not applicable", "x", "z", ""):
        rec.setdefault("tn", {})[str(yi)] = tn
    if not rec.get("le") and ix["le"] is not None:
        le = (r[ix["le"]] or "").strip()
        if le: rec["le"] = le
    nx += 1
print(f"exclusions rows used: {nx}", file=sys.stderr)

# trust name table
tnames, tidx = [], {}
for rec in schools.values():
    for yi, tn in (rec.pop("tn", {}) or {}).items():
        if tn not in tidx:
            tidx[tn] = len(tnames); tnames.append(tn)
        rec["t"][yi] = tidx[tn]

# URN chains via LAESTAB continuity: old urn vanished, same laestab reappears under a new urn
chains = {}
for yi in range(len(YEARS) - 1):
    cur, nxt = laestabByYear.get(yi, {}), laestabByYear.get(yi + 1, {})
    for le, urn in cur.items():
        u2 = nxt.get(le)
        if u2 and u2 != urn:
            later = schools.get(urn, {}).get("y", {})
            if not any(int(k) > yi for k in later): chains[urn] = u2
print(f"chains: {len(chains)}", file=sys.stderr)

out = {"years": YEARS, "trusts": tnames, "chains": chains, "schools": schools}
dst = "/home/claude/institute/apps/platform/public/data/flows.json"
with open(dst, "w") as f:
    json.dump(out, f, separators=(",", ":"))
import os
print(f"schools: {len(schools)}, trusts: {len(tnames)}, size: {os.path.getsize(dst)/1e6:.1f} MB", file=sys.stderr)
