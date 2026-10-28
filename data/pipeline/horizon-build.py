"""Two small files behind the twins and Horizon.

intake.json  (public: Prizm's twins)
  urn -> [ks2Scaled, disadvantagedPct, ealPct, endKs4Pupils]
  KS2 scaled score is the 2023/24 GCSE cohort's, the last cohort with KS2
  tests (none were sat in 2020 or 2021): a measure of the intake, not of
  this year's pupils. Disadvantage and EAL are the 2025/26 KS4 cohort's.

send.json  (Horizon only)
  las[la] = { ehcp: {year: plans}, special: [places, onRoll], specFc: {year: [primary, secondary, total]} }
  EHC plans as at January 2019 to 2026; special school capacity 2024/25;
  authorities' own forecasts of pupils in specialist provision to 2031/32.

Sources: DfE EES "Key stage 4 performance" 2025/26 institution files,
"Education, health and care plans" 2026, "School capacity" 2024/25.
Usage: python3 horizon-build.py <dir> <out-dir>
"""
import csv, json, os, re, sys
from collections import defaultdict

SRC, OUT = sys.argv[1], sys.argv[2]


def num(v):
    v = (v or "").strip()
    return float(v) if re.fullmatch(r"-?\d+(\.\d+)?", v) else None


def rows(n):
    with open(os.path.join(SRC, n), newline="", encoding="utf-8-sig") as fh:
        yield from csv.DictReader(fh)


intake = defaultdict(lambda: [None, None, None, None])
for r in rows("ks4-info.csv"):
    u = r["school_urn"].strip()
    if not u.isdigit():
        continue
    if r["time_period"] == "202324":
        intake[u][0] = num(r["ks2_scaledscore_average"])
    if r["time_period"] == "202526":
        n = num(r["endks4_pupil_count"])
        intake[u][3] = int(n) if n is not None else None
for r in rows("ks4-perf.csv"):
    if r["time_period"] != "202526":
        continue
    u = r["school_urn"].strip()
    if not u.isdigit():
        continue
    if r["breakdown"] == "Disadvantaged":
        intake[u][1] = num(r["pupil_percent"])
    elif r["breakdown"] == "Known or believed to be other than English":
        intake[u][2] = num(r["pupil_percent"])
intake = {u: v for u, v in intake.items() if any(x is not None for x in v[:3])}
json.dump({"vintage": "KS2 scaled score of the 2023/24 GCSE cohort (the last with KS2 tests); disadvantage and EAL of the 2025/26 KS4 cohort", "cols": ["ks2", "disadvPct", "ealPct", "ks4Pupils"], "s": intake},
          open(os.path.join(OUT, "intake.json"), "w"), separators=(",", ":"))

las = defaultdict(lambda: {"ehcp": {}, "specFc": {}})
nat = {"ehcp": {}, "specFc": {}}
for r in rows("ehcp-legacy.csv"):
    if r["breakdown_topic"] != "All EHC plans":
        continue
    v = num(r["ehcplans"])
    if v is None:
        continue
    yr = r["time_period"]
    if r["geographic_level"] == "National":
        nat["ehcp"][yr] = int(v)
    elif r["geographic_level"] == "Local authority":
        las[r["la_name"]]["ehcp"][yr] = int(v)
SPEC_LATEST = max(r["time_period"] for r in rows("special-cap-la.csv"))
for r in rows("special-cap-la.csv"):
    if r["education_phase"] != "Total" or r["time_period"] != SPEC_LATEST:
        continue
    rec = [num(r["school_places"]), num(r["pupils_on_roll_count"])]
    if r["geographic_level"] == "National":
        nat["special"] = rec
    elif r["geographic_level"] == "Local authority":
        las[r["la_name"]]["special"] = rec
PH = {"Primary": 0, "Secondary": 1, "Total": 2}
for r in rows("spec-forecast.csv"):
    v = num(r["pupil_forecast_and_202425_actuals"])
    ph = PH.get(r["education_phase"])
    if v is None or ph is None:
        continue
    tgt = nat if r["geographic_level"] == "National" else las[r["la_name"]] if r["geographic_level"] == "Local authority" else None
    if tgt is None:
        continue
    tgt["specFc"].setdefault(r["time_period"], [None, None, None])[ph] = int(v)
json.dump({"vintage": "EHC plans as at January 2019 to 2026 (DfE, June 2026); special school capacity 2024/25; authority forecasts of pupils in specialist provision to 2031/32 (school capacity 2024/25)",
           "nat": nat, "las": las}, open(os.path.join(OUT, "send.json"), "w"), separators=(",", ":"))
print(f"intake: {len(intake)} schools; send: {len(las)} authorities, EHC years {sorted(nat['ehcp'])}, forecast years {sorted(nat['specFc'])}")
