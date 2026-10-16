"""Builds public/data/dynamic.json for the Dynamic Schools view on Insights.

The measure (from the original school-profile RISE mode):
  across = the trend in Attainment 8 per year: a least-squares line through every year in YEARS,
           now 2019 (pre-pandemic) and 2024, 2025, 2026 (2025/26 provisional). A fitted line uses every
           year, unlike averaging the steps, which only ever compares the first year with the last.
  up     = Progress 8, latest published (2024: none was published for 2024/25 or 2025/26)

Attainment 8 history lives in data/ks4-a8-history.json, because schools.json only carries
the latest two years (attainment8, a8_prev). Each run refreshes the two latest years in that
file from schools.json, so when the next year rolls in, the year that rolls out is kept.
To roll forward: add the new year to YEARS (2019 stays as the pre-pandemic anchor).
Top right of both axes is a Dynamic School.

Only Dynamic Schools are written with names. Every other school is written as an
unnamed point (quadrant, position, location) so the public page cannot single anyone out.

Run from the repo root:  python3 data/build-dynamic.py
"""
import json, statistics as st, bisect, os

SRC = "apps/platform/public/data/schools.json"
HIST = "data/ks4-a8-history.json"
OUT = "apps/platform/public/data/dynamic.json"
YEARS = ["2019", "2024", "2025", "2026"]   # oldest to latest; the last two must be schools.json's a8_prev and attainment8
LABEL = {"2019": "2018/19", "2024": "2023/24", "2025": "2024/25 revised", "2026": "2025/26 provisional"}
d = json.load(open(SRC))

hist = json.load(open(HIST))
H = hist["years"]
for r in d:  # keep the history file current with the dataset's two latest years
    h = H.setdefault(r["urn"], {})
    if r.get("a8_prev") is not None: h[YEARS[-2]] = r["a8_prev"]
    if r.get("attainment8") is not None: h[YEARS[-1]] = r["attainment8"]
json.dump(hist, open(HIST, "w"), separators=(",", ":"))

for r in d:
    h = H.get(r["urn"], {})
    r["_a"] = [h.get(y) for y in YEARS]
rows = [r for r in d if None not in r["_a"] and all(r.get(k) is not None for k in ("p8_prev", "latitude", "longitude"))]
for r in rows:
    ys = [int(y) for y in YEARS]; my = sum(ys) / len(ys); ma = sum(r["_a"]) / len(ys)
    r["_x"] = sum((y - my) * (a - ma) for y, a in zip(ys, r["_a"])) / sum((y - my) ** 2 for y in ys)
    r["_y"] = r["p8_prev"]
    r["_q"] = "R" if r["_x"] > 0 and r["_y"] > 0 else "S" if r["_y"] > 0 else "I" if r["_x"] > 0 else "D"

sdx = st.pstdev(r["_x"] for r in rows); sdy = st.pstdev(r["_y"] for r in rows)
for r in rows: r["_m"] = r["_x"] / sdx + r["_y"] / sdy
ms = sorted(r["_m"] for r in rows)
for r in rows: r["_pct"] = round(100 * bisect.bisect_left(ms, r["_m"]) / (len(ms) - 1))

def absq(vals, p):
    s = sorted(abs(v) for v in vals); return s[int(p * (len(s) - 1))]
import math
xmax = math.ceil(absq([r["_x"] for r in rows], .99) * 2) / 2; ymax = math.ceil(absq([r["_y"] for r in rows], .99) * 2) / 2

dyn = sorted([r for r in rows if r["_q"] == "R"], key=lambda r: -r["_m"])
rd = lambda v, n=1: None if v is None else round(v, n)
D = [[r["urn"], r["name"], r.get("la"), r.get("region"), r.get("trust"), r.get("type"),
      rd(r.get("ks4_fsm_pct") or r.get("fsm_pct")), *r["_a"], r["p8_prev"], round(r["_x"], 3),
      r.get("basics_94"), rd(r.get("abs_overall_pct")), rd(r.get("susp_rate")), rd(r.get("sen_ehcp_ws_pct")),
      r.get("ofsted"), round(r["latitude"], 4), round(r["longitude"], 4), r["_pct"], r.get("pupils")] for r in dyn]
O = [[r["_q"], round(r["_x"], 2), round(r["_y"], 2), round(r["latitude"], 3), round(r["longitude"], 3),
      rd(r.get("ks4_fsm_pct") or r.get("fsm_pct"), 0)] for r in rows if r["_q"] != "R"]

regs = {}
for r in rows:
    if r.get("region"): regs.setdefault(r["region"], []).append(r["_q"])
REG = sorted([[k, len(v), round(v.count("R") / len(v), 3), round(v.count("D") / len(v), 3)] for k, v in regs.items()], key=lambda x: -x[2])

seen, BG = set(), []
for r in d:
    if r.get("latitude") and r.get("longitude"):
        k = (round((r["longitude"] + 6) * 1000), round((r["latitude"] - 49.8) * 1000))
        if k not in seen: seen.add(k); BG += k

med = lambda k: st.median(r[k] for r in rows)
meta = {"n": len(rows), "sdx": round(sdx, 4), "sdy": round(sdy, 4), "xmax": xmax, "ymax": ymax,
        "years": YEARS, "med": {"a": [st.median(r["_a"][i] for r in rows) for i in range(len(YEARS))], "x": round(st.median(r["_x"] for r in rows), 3)},
        "counts": {q: sum(1 for r in rows if r["_q"] == q) for q in "RSID"}, "regs": REG,
        "fields": ["urn", "name", "la", "region", "trust", "type", "fsm"] + ["a" + y for y in YEARS] + ["p8", "x", "b94", "abs", "susp", "ehcp", "ofsted", "lat", "lon", "pct", "pupils"],
        "vintage": "Attainment 8 " + ", ".join(LABEL[y] for y in YEARS) + "; Progress 8 2023/24, the latest published; census January 2026"}
json.dump({"meta": meta, "D": D, "O": O, "BG": BG}, open(OUT, "w"), separators=(",", ":"))
print(OUT, os.path.getsize(OUT), meta["counts"], meta["xmax"], meta["ymax"])
