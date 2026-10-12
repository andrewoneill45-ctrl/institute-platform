"""Builds public/data/dynamic.json for the Dynamic Schools view on Insights.

The measure (from the original school-profile RISE mode):
  across = the average of the two step changes in Attainment 8, 2019 to 2024 and 2024 to 2025
  up     = Progress 8, latest published (2024)
Top right of both axes is a Dynamic School.

Only Dynamic Schools are written with names. Every other school is written as an
unnamed point (quadrant, position, location) so the public page cannot single anyone out.

Run from the repo root:  python3 data/build-dynamic.py
"""
import json, statistics as st, bisect, os

SRC = "apps/platform/public/data/schools.json"
OUT = "apps/platform/public/data/dynamic.json"
d = json.load(open(SRC))

rows = [r for r in d if all(r.get(k) is not None for k in ("attainment8", "a8_prev", "a8_2019", "p8_prev", "latitude", "longitude"))]
for r in rows:
    r["_x"] = ((r["a8_prev"] - r["a8_2019"]) + (r["attainment8"] - r["a8_prev"])) / 2
    r["_y"] = r["p8_prev"]
    r["_q"] = "R" if r["_x"] > 0 and r["_y"] > 0 else "S" if r["_y"] > 0 else "I" if r["_x"] > 0 else "D"

sdx = st.pstdev(r["_x"] for r in rows); sdy = st.pstdev(r["_y"] for r in rows)
for r in rows: r["_m"] = r["_x"] / sdx + r["_y"] / sdy
ms = sorted(r["_m"] for r in rows)
for r in rows: r["_pct"] = round(100 * bisect.bisect_left(ms, r["_m"]) / (len(ms) - 1))

def absq(vals, p):
    s = sorted(abs(v) for v in vals); return s[int(p * (len(s) - 1))]
import math
xmax = math.ceil(absq([r["_x"] for r in rows], .99)); ymax = math.ceil(absq([r["_y"] for r in rows], .99) * 2) / 2

dyn = sorted([r for r in rows if r["_q"] == "R"], key=lambda r: -r["_m"])
rd = lambda v, n=1: None if v is None else round(v, n)
D = [[r["urn"], r["name"], r.get("la"), r.get("region"), r.get("trust"), r.get("type"),
      rd(r.get("ks4_fsm_pct") or r.get("fsm_pct")), r["a8_2019"], r["a8_prev"], r["attainment8"], r["p8_prev"],
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
        "med": {"a19": med("a8_2019"), "a24": med("a8_prev"), "a25": med("attainment8"), "x": round(st.median(r["_x"] for r in rows), 2)},
        "counts": {q: sum(1 for r in rows if r["_q"] == q) for q in "RSID"}, "regs": REG,
        "fields": ["urn", "name", "la", "region", "trust", "type", "fsm", "a19", "a24", "a25", "p8", "b94", "abs", "susp", "ehcp", "ofsted", "lat", "lon", "pct", "pupils"],
        "vintage": "KS4 2019 final, 2024 revised, 2025 provisional; Progress 8 2024; census January 2026"}
json.dump({"meta": meta, "D": D, "O": O, "BG": BG}, open(OUT, "w"), separators=(",", ":"))
print(OUT, os.path.getsize(OUT), meta["counts"], meta["xmax"], meta["ymax"])
