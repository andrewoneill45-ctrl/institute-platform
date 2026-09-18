# Deploying The All Saints Institute

Three services, in this order: Supabase (the memory), Netlify (the house), the domain (the address).

## 1 · Supabase, about ten minutes
1. Create a project at supabase.com (region: London).
2. SQL editor → paste and run the whole of `supabase/schema.sql`. This creates profiles,
   orbit_plans and lens_files with row-level security, and the trigger that gives every
   new account its profile.
3. Storage → Create bucket → name `lens`, **private**. The policy in the schema confines
   every account to its own folder.
4. Authentication → Providers → Email: on. For a smooth first demo you may turn OFF
   "Confirm email"; turn it back on before real schools arrive.
5. Project settings → API: copy the Project URL and the anon public key.

## 2 · Netlify, about ten minutes
1. Push this folder to a GitHub repository (private is fine) and "Add new site → Import".
   The included `netlify.toml` already knows the build command, the publish directory,
   the SPA redirect and the functions directory.
2. Site settings → Environment variables:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon key
   - `VITE_MAPBOX_TOKEN` = your Mapbox token (Atlas)
   - `ANTHROPIC_API_KEY` = your Anthropic key (Ask, in Lens)
3. Deploy. The site builds in about two minutes.

With the two Supabase variables present the platform leaves demo mode by itself:
sign-in becomes real, "Request membership" creates accounts, and Orbit plans and
Library catalogues follow the account across machines. Remove the variables and it
falls back to the demo accounts. Nothing else changes.

## 3 · The domain
Netlify → Domain management → add your domain, then set the two DNS records it shows
you at your registrar. Certificates are automatic.

## Local development
`apps/platform/.env` may carry the same four variables (the VITE_ ones reach the
browser; the Anthropic key is only ever read by the serverless function). Without
them: demo accounts, local Library, Ask explains itself instead of answering.

Demo accounts while demo mode lasts: andrew@allsaints.co.uk and head@stmarys.demo,
password institute26.
