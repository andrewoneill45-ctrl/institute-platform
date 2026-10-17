# The refresh pipeline

How the Institute's evidence estate stays current.

## The idea

The Claude workspace that builds this platform cannot reach the DfE —
its network is allowlisted to package registries and GitHub. A GitHub
Actions runner **can**. So the pipeline lives in the repo, runs nightly
on CI (`.github/workflows/refresh.yml`), and commits data changes like
any other contributor; Netlify deploys the commit automatically.

`data/sources.json` is the single manifest: every feed, its route, its
cadence, and when it last moved. A copy ships to
`apps/platform/public/data/sources.json` so the site itself can show
provenance for every figure.

## The steps

| step | script | what it does |
| --- | --- | --- |
| check | `check.mjs` | Tripwire. Asks the EES API whether any watched dataset has a new version — flags the December 2026 KS2 school-level release and the February KS4 revision the morning they land. |
| attendance | `pull-attendance.mjs` | Pulls the fortnightly "Pupil attendance in schools" feed (national/regional/LA only — **never** school-level) into `public/data/pulse.json`. |
| gias | `pull-gias.mjs` | Downloads the daily GIAS register, writes a working copy, and commits `data/registry/urn-changes.json`: our published schools whose URN has closed with a successor (academy conversions), so the next performance merge can stitch URNs together. |
| validate | `validate.mjs` | The gate. Row counts, duplicate URNs, A8 coverage, URN 100503 present, pulse shape, manifest agreement. A failure fails the Action and nothing commits. |

`refresh.mjs` runs them in order and prints a summary. Run one step
locally (fixtures only — the live API is unreachable from the
workspace): `node data/pipeline/refresh.mjs check`.

## Routes that stay manual (for now)

- **KS4 school-level** — release zip, not in the EES API. Pulled by hand
  when a vintage lands; next movement February 2027 (2025/26 revised).
- **Ofsted MI** — monthly ODS on gov.uk, no API.

When either becomes API-addressable, add the `apiDataSetId` to the
manifest and the tripwire starts watching it with no code change.

## Testing

`validate.mjs` runs anywhere. The pull scripts keep their network calls
behind injectable `fetchJsonFn`/`fetchTextFn` parameters, and their
shaping functions (`shapePulse`, `urnChanges`, `flattenEesRow`) are
pure — the battery at the scratchpad exercises them on fixtures. First
live run happens on CI: trigger it by hand from the Actions tab and
read the run summary.
