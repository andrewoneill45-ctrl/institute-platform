# The data service

One supply feeds everything: Atlas, the Index, Insights, the State of the System.

Source of truth: the `school-profile` repository's `public/schools.json`
(26,553 schools), built by its merge scripts and enriched with the January 2026
SEN census. The Institute refresh cycle follows the DfE publication calendar:

- October: provisional KS4 / KS2 results
- January: census day (rolls, FSM, SEN)
- February: revised results
- June: SEN2 (EHC plans)

Each refresh: run the merge scripts against the new DfE downloads, stamp the
vintage, publish one dataset. Every figure the platform shows carries its vintage.
