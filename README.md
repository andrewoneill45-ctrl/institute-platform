# The All Saints Institute · platform

One codebase, one identity, three instruments: Atlas (see), Lens (know), Orbit (act).

## Structure
- `packages/design-system` — tokens, the quatrefoil, the wordmark, shared primitives
- `apps/platform` — the site, sign-in, and the member area with the three instruments
- `supabase/schema.sql` — accounts and storage, row-level security throughout
- `data/` — the single data supply and its refresh calendar

## Run it
    npm install
    npm run dev

Runs in demo mode out of the box (any sign-in works; Orbit saves locally).

## Go live
1. Create a project at supabase.com; run `supabase/schema.sql` in the SQL editor;
   create a private storage bucket named `lens`.
2. In `apps/platform`, copy `.env.example` to `.env` and add your keys.
3. Push to GitHub; connect the repo to Netlify (settings are in `netlify.toml`).
4. For Lens’s Ask: add `ANTHROPIC_API_KEY` in Netlify’s environment variables. Ask stays politely disabled until then.

## Phases
1. This skeleton ✓  2. Atlas port  3. Membership live  4. Lens  5. Orbit wired to both  6. Front site full build
