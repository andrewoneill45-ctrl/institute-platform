"""Post-16: the 16 to 18 performance tables, school and college level.

Source: DfE, "16 to 19 performance" on Explore Education Statistics
(publication 3f3a66ec-5777-42ee-b427-8102a14ce0c5). Institution-level files
are downloadable data sets (not yet in the EES API), fetched with
  https://content.explore-education-statistics.service.gov.uk/api/data-set-files/{id}/download

Inputs (one directory, names as saved by the fetch):
  2024-25-performance.csv                       headline measures, 2021/22 to 2024/25
  2024-25-qualification_and_subject_value_added.csv
  2023-24-Schools_and_colleges_qualification_and_subject_value_added.csv
  2024-25-subject_entries_and_grades.csv
  2023-24-Schools_and_colleges_subject_entries_and_grades.csv
  2024-25-national_performance.csv               England and LA benchmarks
  2024-25-national_comparator_subject_entries_and_grades.csv
  2023-24-national_comparator_subject_entries_and_grades.csv
  2024-25-institution_information.csv

Output: apps/platform/public/data/post16.json, loaded only when a report or
a school page needs post-16 figures.

Honesty notes carried into the file:
  * L3 value added was not published for 2021/22 or 2022/23: those students'
    GCSEs were centre- and teacher-assessed grades, so there is no KS4
    baseline. VA (headline and subject) exists for 2023/24 and 2024/25 only.
  * Suppressed ("c"), not applicable ("z") and low-count values become null.

Usage: python3 post16-build.py <dir-of-csvs> [out.json]
"""
import csv, json, os, re, sys
from collections import defaultdict

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "../../apps/platform/public/data/post16.json")
YEARS = ["202122", "202223", "202324", "202425"]
COH = {"A level": "A", "Academic": "AC", "Applied general": "AG", "Tech level": "TL", "Technical certificate": "TC"}
BAND = {"Well below average": -2, "Below average": -1, "Average": 0, "Above average": 1, "Well above average": 2}


def f(path):
    return os.path.join(SRC, path)


def num(v, dp=2):
    v = (v or "").strip()
    if not re.fullmatch(r"-?\d+(\.\d+)?", v):
        return None
    x = float(v)
    return int(x) if dp == 0 else round(x, dp)


def grade(v):
    v = (v or "").strip()
    return v if v and v not in ("z", "c", "x", "low", ":") else None


def skey(name):
    """one key for a subject whatever the year's spelling: 'Accounting / Finance' = 'Accounting and Finance'"""
    s = name.lower().replace("&", " and ").replace("/", " and ")
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


subjects, sidx = [], {}
# the same A level under the names different tables give it
ALIAS = {
    "Computer Studies / Computing": "Computer Science",
    "Art & Design (Fine Art)": "Fine Art", "Art & Design (Photography)": "Photography",
    "Art & Design (Textiles)": "Textiles", "Art & Design (3d Studies)": "3D Studies",
    "Art & Design (Graphics)": "Graphics", "Art & Design (Critical Studies)": "Critical Studies",
    "Business Studies:Single": "Business Studies",
    "D&T Product Design": "Design and Technology (Product Design)",
    "D&T Engineering": "Design and Technology (Engineering)",
    "D&T Textiles Technology": "Design and Technology (Textiles Technology)",
}
ALIAS_K = {}


ALIAS_K.update({skey(k): v for k, v in ALIAS.items()})


def sub(name):
    name = ALIAS_K.get(skey(name), name.strip())
    k = skey(name)
    if k not in sidx:
        sidx[k] = len(subjects)
        subjects.append(name)
    else:
        # the newest spelling wins for display
        if name != subjects[sidx[k]] and "/" in subjects[sidx[k]]:
            subjects[sidx[k]] = name
    return sidx[k]


schools = defaultdict(lambda: {"y": {}})

# ── headline measures, four years ──
with open(f("2024-25-performance.csv"), newline="") as fh:
    for r in csv.DictReader(fh):
        tp, coh = r["time_period"], COH.get(r["exam_cohort"])
        if not coh or tp not in YEARS:
            continue
        urn = r["school_urn"].strip()
        if not urn:
            continue
        s = schools[urn]
        s["n"] = r["school_name"]
        s["la"] = r["la_name"]
        st = r["disadvantage_status"]
        # the cohort's own count: end1618_student_count is the institution's whole 16-18 cohort
        n = num(r["aps_per_entry_student_count"], 0)
        if st == "Total":
            if not n:
                continue
            row = [n, num(r["aps_per_entry"]), grade(r["aps_per_entry_grade"]), num(r["value_added"]), num(r["value_added_lower_ci"]), num(r["value_added_upper_ci"]), BAND.get(r["progress_banding"]), num(r["retained_percent"], 1)]
            if coh == "A":
                row += [num(r["best_three_alevels_aps"]), grade(r["best_three_alevels_grade"]), num(r["aab_percent"], 1)]
            if coh == "AC":
                row += [num(r["level_3_maths_percent"], 1)] if r.get("level_3_maths_percent") is not None else []
            s["y"].setdefault(tp, {})[coh] = row
        elif coh in ("A", "AC") and st in ("Disadvantaged", "Not disadvantaged"):
            aps = num(r["aps_per_entry"])
            if aps is None:
                continue
            d = s["y"].setdefault(tp, {}).setdefault("D" + coh, [None, None, None, None])
            i = 0 if st == "Disadvantaged" else 1
            d[i], d[i + 2] = aps, n

# drop institutions with no post-16 cohort at all
for u in [u for u, s in schools.items() if not any(s["y"].values())]:
    del schools[u]

# ── institution type, for colleges that are not in the schools dataset ──
with open(f("2024-25-institution_information.csv"), newline="") as fh:
    for r in csv.DictReader(fh):
        u = r["school_urn"].strip()
        if u in schools:
            schools[u]["t"] = r["establishment_type"]
            if r.get("religious_denomination") and r["religious_denomination"] not in ("None", "Does not apply", "z"):
                schools[u]["rel"] = r["religious_denomination"]

# ── A level subject value added, 2023/24 and 2024/25 ──
def subject_va(path, tp, qual_col, subj_col, lo_col, hi_col, n_col):
    with open(f(path), newline="") as fh:
        for r in csv.DictReader(fh):
            if r[qual_col] != "GCE A level" or r[subj_col].strip() == "All subjects":
                continue
            u = r["school_urn"].strip()
            if u not in schools:
                continue
            va = num(r["value_added"])
            if va is None:
                continue
            schools[u].setdefault("va", {}).setdefault(tp, []).append([sub(r[subj_col]), va, num(r[lo_col]), num(r[hi_col]), num(r[n_col], 0)])


subject_va("2024-25-qualification_and_subject_value_added.csv", "202425", "qualification_detailed", "subject", "value_added_lower_ci", "value_added_upper_ci", "entries_count")
subject_va("2023-24-Schools_and_colleges_qualification_and_subject_value_added.csv", "202324", "qualification_type", "subject_name", "lci", "uci", "number_of_entries")

# ── A level subject grades: entries and the share at A*-A and A*-B ──
def tally(path, qual_col, grade_col, n_col, tp, national=False):
    acc = defaultdict(lambda: defaultdict(lambda: [0, 0, 0, 0, False]))  # total, A*, A, B, suppressed
    with open(f(path), newline="") as fh:
        for r in csv.DictReader(fh):
            if r.get("exam_cohort") != "A level" or r[qual_col] != "GCE A level" or r["subject"] == "All subjects":
                continue
            u = "ENG" if national else r["school_urn"].strip()
            if not national and u not in schools:
                continue
            g, v = r[grade_col].strip(), r[n_col].strip()
            cell = acc[u][sub(r["subject"])]
            n = num(v, 0)
            if g in ("Total", "Total exam entries"):
                if n is None:
                    cell[4] = True
                else:
                    cell[0] = n
            elif g in ("*", "A*", "A", "B"):
                if n is None:
                    cell[4] = True
                else:
                    cell[{"*": 1, "A*": 1, "A": 2, "B": 3}[g]] += n
            elif g == "Suppressed":
                cell[4] = True
    out = {}
    for u, subs in acc.items():
        rows = []
        for si, (tot, s, a, b, supp) in subs.items():
            if not tot:
                continue
            if supp:
                rows.append([si, tot, None, None])
            else:
                rows.append([si, tot, round(100 * (s + a) / tot, 1), round(100 * (s + a + b) / tot, 1)])
        out[u] = rows
    return out


for tp, path, qc, gc, nc in [
    ("202425", "2024-25-subject_entries_and_grades.csv", "qualification_detailed", "grade", "entries_count"),
    ("202324", "2023-24-Schools_and_colleges_subject_entries_and_grades.csv", "qualification", "grade_total_entries", "number_of_exams"),
]:
    for u, rows in tally(path, qc, gc, nc, tp).items():
        schools[u].setdefault("gr", {})[tp] = rows

nat_sub = {}
for tp, path, qc, gc, nc in [
    ("202425", "2024-25-national_comparator_subject_entries_and_grades.csv", "qualification_detailed", "grade", "entries_count"),
    ("202324", "2023-24-national_comparator_subject_entries_and_grades.csv", "qualification", "grade_total_entries", "number_of_exams"),
]:
    nat_sub[tp] = tally(path, qc, gc, nc, tp, national=True).get("ENG", [])

# ── England and authority benchmarks ──
nat, las = {}, defaultdict(dict)
with open(f("2024-25-national_performance.csv"), newline="") as fh:
    for r in csv.DictReader(fh):
        if r["establishment_type"] != "All state-funded schools and colleges":
            continue
        coh = COH.get(r["exam_cohort"])
        tp = r["time_period"]
        if not coh or tp not in YEARS:
            continue
        st = r["disadvantage_status"]
        tgt = nat.setdefault(tp, {}) if r["geographic_level"] == "National" else las[r["la_name"]].setdefault(tp, {}) if r["geographic_level"] == "Local authority" else None
        if tgt is None:
            continue
        n = num(r["aps_per_entry_student_count"], 0)
        if st == "Total":
            row = [n, num(r["aps_per_entry"]), grade(r["aps_per_entry_grade"]), num(r["value_added"]), None, None, None, num(r["retained_percent"], 1)]
            if coh == "A":
                row += [num(r["best_three_alevels_aps"]), grade(r["best_three_alevels_grade"]), num(r["aab_percent"], 1)]
            tgt[coh] = row
        elif coh in ("A", "AC") and st in ("Disadvantaged", "Not disadvantaged"):
            d = tgt.setdefault("D" + coh, [None, None, None, None])
            i = 0 if st == "Disadvantaged" else 1
            d[i], d[i + 2] = num(r["aps_per_entry"]), n

out = {
    "vintage": "16 to 19 performance, 2024/25 final (DfE, published 23 April 2026); subject tables 2023/24 and 2024/25",
    "source": "https://explore-education-statistics.service.gov.uk/find-statistics/16-to-19-performance",
    "years": YEARS,
    "vaYears": ["202324", "202425"],
    "cols": {
        "A": ["students", "aps", "apsGrade", "va", "vaLo", "vaHi", "band", "retained", "best3aps", "best3grade", "aab"],
        "AC": ["students", "aps", "apsGrade", "va", "vaLo", "vaHi", "band", "retained", "l3maths"],
        "AG": ["students", "aps", "apsGrade", "va", "vaLo", "vaHi", "band", "retained"],
        "TL": ["students", "aps", "apsGrade", "va", "vaLo", "vaHi", "band", "retained"],
        "TC": ["students", "aps", "apsGrade", "va", "vaLo", "vaHi", "band", "retained"],
        "DA": ["disadvAps", "otherAps", "disadvN", "otherN"],
        "va": ["subject", "va", "lo", "hi", "entries"],
        "gr": ["subject", "entries", "pctAstarA", "pctAstarB"],
    },
    "subjects": subjects,
    "nat": nat,
    "natSub": nat_sub,
    "las": las,
    "s": schools,
}
s = json.dumps(out, separators=(",", ":"))
open(OUT, "w").write(s)
va_n = {tp: sum(1 for x in schools.values() if tp in x.get("va", {})) for tp in ("202324", "202425")}
print(f"post16: {len(schools)} institutions, {len(subjects)} A level subjects, subject VA {va_n}, {len(s)/1048576:.1f} MB -> {OUT}")
