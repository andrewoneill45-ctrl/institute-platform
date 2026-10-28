"""Demand and capacity: who parents choose, and who has room.

Sources (DfE, Explore Education Statistics):
  * Primary and secondary school applications and offers, 2026/27 release.
    The school-level time series lives in the release's supporting files
    (AppsandOffers_<year>_SchoolLevel<date>.csv), fetched with
      https://content.explore-education-statistics.service.gov.uk/api/releases/{releaseVersionId}/files
    2014/15 to 2026/27, one row per school per year of entry.
  * School capacity, 2024/25 release: "Capacity - school" (places and pupils on
    roll, 2009/10 onwards), "Sixth form capacity - school", "Specialist provision
    capacity in mainstream schools - school", and "Estimates of future school
    place demand" (planning-area forecasts to 2031/32).

Output: apps/platform/public/data/places.json, loaded only when a demand or
capacity question is asked, or a school page opens.

Usage: python3 places-build.py <dir> [flows.json] [out.json]
  <dir> holds: AppsandOffers_*_SchoolLevel*.csv, cap-school.csv, sf-school.csv,
  spec-mainstream.csv, demand-forecast.csv
"""
import csv, glob, json, os, re, sys

SRC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
FLOWS = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "../../apps/platform/public/data/flows.json")
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, "../../apps/platform/public/data/places.json")
FIRST = "201415"


def num(v):
    v = (v or "").strip()
    if not re.fullmatch(r"-?\d+(\.\d+)?", v):
        return None
    x = float(v)
    return int(x) if x.is_integer() else round(x, 1)


def rows(name):
    path = name if os.path.isabs(name) else os.path.join(SRC, name)
    with open(path, newline="", encoding="utf-8-sig") as fh:
        yield from csv.DictReader(fh)


S = {}
def school(u):
    return S.setdefault(u, {})


# ── demand: applications and offers, 2014/15 to the latest intake ──
apps_file = sorted(glob.glob(os.path.join(SRC, "**", "AppsandOffers_*SchoolLevel*.csv"), recursive=True))[-1]
years_a = set()
for r in rows(apps_file):
    u = r["school_urn"].strip()
    if not u.isdigit():
        continue
    ph = "S" if r["school_phase"] == "Secondary" else "P"
    tp = r["time_period"]
    rec = [num(r["total_number_places_offered"]), num(r["times_put_as_any_preferred_school"]), num(r["times_put_as_1st_preference"]),
           num(r["number_1st_preference_offers"]), num(r["all_applications_from_another_LA"])]
    if rec[0] is None and rec[2] is None:
        continue
    s = school(u)
    s.setdefault("n", r["school_name"])
    s.setdefault("la", r["la_name"])
    if r.get("entry_year") == "9":
        s["e9"] = 1  # a 14-19 intake (UTC, studio school): compare with care
    s.setdefault("a" + ph, {})[tp] = rec
    years_a.add(tp)

# ── capacity: places against pupils on roll ──
years_c = set()
for r in rows("cap-school.csv"):
    if r["geographic_level"] != "School" or r["time_period"] < FIRST:
        continue
    u = r["school_urn"].strip()
    if not u.isdigit():
        continue
    places, roll = num(r["school_places"]), num(r["pupils_on_roll_count"])
    if places is None and roll is None:
        continue
    s = school(u)
    s.setdefault("n", r["school_name"])
    s.setdefault("la", r["la_name"])
    s.setdefault("c", {})[r["time_period"]] = [places, roll]
    years_c.add(r["time_period"])
    if r["time_period"] == max(years_c | {r["time_period"]}):
        pa = r.get("secondary_planning_area_code") if r["education_phase"] != "Primary" else r.get("primary_planning_area_code")
        if pa and pa not in ("z", "x"):
            s["pa"] = pa

for r in rows("sf-school.csv"):
    u = r["school_urn"].strip()
    if u.isdigit() and r["time_period"] == max(years_c):
        school(u)["sf"] = [num(r["sixth_form_places"]), num(r["sixth_form_pupils_on_roll_count"])]

for r in rows("spec-mainstream.csv"):
    u = r["school_urn"].strip()
    if u.isdigit() and r["time_period"] == max(years_c):
        unit, rp = num(r["send_unit_capacity_count"]), num(r["resourced_provision_capacity_count"])
        if (unit or 0) + (rp or 0) > 0:
            school(u)["sp"] = [unit or 0, rp or 0]

# ── the planning areas' forecasts: pupils expected against places, to 2031/32 ──
PA = {}
for r in rows("demand-forecast.csv"):
    if r["geographic_level"] != "Planning area" or r["nc_year_group"] not in ("Primary total", "Secondary total"):
        continue
    code = r["planning_area_code"]
    p = PA.setdefault(code, {"n": r["planning_area_name"], "la": r["la_name"], "ph": "S" if r["education_phase"] == "Secondary" else "P", "f": {}})
    p["f"][r["time_period"]] = [num(r["pupil_forecast"]), num(r["estimated_capacity"]), num(r["la_planned_places"]), num(r["additional_need_minus_spare_places"])]
used = {s.get("pa") for s in S.values()}
PA = {k: v for k, v in PA.items() if k in used and v["f"]}

# academisation: the same school under a new URN keeps one history
chains = {}
try:
    chains = json.load(open(FLOWS)).get("chains", {})
except Exception:
    pass

out = {
    "vintage": "DfE applications and offers 2026/27 (school level, 2014/15 to 2026/27); school capacity 2024/25 (places and rolls 2014/15 to 2024/25, planning-area forecasts to 2031/32)",
    "source": ["https://explore-education-statistics.service.gov.uk/find-statistics/primary-and-secondary-school-applications-and-offers",
               "https://explore-education-statistics.service.gov.uk/find-statistics/school-capacity"],
    "appYears": sorted(years_a),
    "capYears": sorted(years_c),
    "cols": {"a": ["placesOffered", "anyPreference", "firstPreference", "firstPreferenceOffers", "fromAnotherLa"], "c": ["places", "onRoll"],
             "sf": ["sixthFormPlaces", "sixthFormOnRoll"], "sp": ["senUnitPlaces", "resourcedProvisionPlaces"],
             "paf": ["pupilForecast", "estimatedCapacity", "laPlannedPlaces", "additionalNeedMinusSpare"]},
    "chains": chains,
    "pa": PA,
    "s": S,
}
txt = json.dumps(out, separators=(",", ":"))
open(OUT, "w").write(txt)
print(f"places: {len(S)} schools, apps {min(years_a)}-{max(years_a)}, capacity {min(years_c)}-{max(years_c)}, {len(PA)} planning areas, {len(txt)/1048576:.1f} MB -> {OUT}")
