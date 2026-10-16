# The School Vault: data protection position

*The All Saints Institute platform · Constellation · October 2026*

## What changed

Until now Constellation held pupil data on the member's device only; nothing left the browser. With the School Vault, the parsed results (pupil roll, evidence scores, the ledger of uploads) are stored as one document per school in the platform's database (Supabase), so that verified members of the same school share one view. Raw uploaded files are still read and parsed on the device and are never transmitted; what the vault holds is the derived state, which remains personal data because it includes pupil names, UPNs, year groups and attainment context.

## Roles

- **The school** is the data controller: it decides to use the vault and for what purpose (monitoring progress and engagement of its own pupils, a core educational task).
- **The Institute platform** is a processor acting on the school's instruction.
- **Supabase** is a sub-processor providing hosted storage (encrypted in transit and at rest). Confirm the project is hosted in an EU/UK region in the Supabase dashboard (Project Settings → General); if not, migrate before onboarding further schools.

## Safeguards in the design

1. **Verified membership, never self-declared.** Sign-up lets anyone type any school name; the vault ignores it. Access is granted only by a `school_members` row, written solely from the admin dashboard. Row-level security means a school's vault is invisible, not merely forbidden, to everyone else.
2. **Parsing stays on the device.** Source files (MIS exports) are never uploaded; only the derived state is stored.
3. **Least data.** The vault holds what Constellation needs to draw: names, UPN, year, scores, context flags. No addresses, no dates of birth beyond what a school chose to include in an upload's parsed fields, no free-text records.
4. **Erasure in one act.** "Start the school again" clears the school's vault for every member; removing a member's `school_members` row ends their access instantly; deleting the `vault_states` row is complete erasure.
5. **Accountability.** Each vault write records who and when (`updated_by`, `updated_at`), and the in-app ledger names every file that shaped the state.

## What the school should do

- **Privacy notice:** add a line to the school's privacy notice, e.g. "We use the All Saints Institute platform to analyse pupil attainment and engagement data. Data is processed in the browser and stored securely in a private area accessible only to authorised staff of this school."
- **DPIA:** complete a short data protection impact assessment before rolling out beyond the pilot (the processing is systematic monitoring of children's data, so a DPIA is the defensible course). This document supplies most of its content.
- **Access reviews:** the membership list *is* the access control; review it each term and when staff leave.
- **Credentials:** accounts are personal, never shared; passwords changed on first sign-in.

## Known limits, stated honestly

- The vault document is not end-to-end encrypted: platform administrators with database access could technically read it. Mitigation today is access discipline and Supabase's at-rest encryption; column-level or client-side encryption is a candidate hardening step before scale.
- Last write wins on simultaneous edits (the app detects the collision and shows the newer copy rather than silently overwriting).
- No audit log of reads, only of writes.

*Next hardening steps, in order of value: pseudonymised-at-rest names resolved on device; per-school retention policy with automatic ledger expiry; read auditing.*
