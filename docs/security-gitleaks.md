# Gitleaks Historical Findings

Last local check: 2026-05-25 with `gitleaks git --redact`.

The repository still contains historical secret-shaped findings. No secret values
are recorded here, and this pass does not rewrite git history.

| Rule | Path | Line | Commit |
| --- | --- | ---: | --- |
| jwt | `check-database.js` | 4 | `a68bd5574a49` |
| jwt | `src/services/supabase/client.js` | 7 | `a68bd5574a49` |
| jwt | `.env.example` | 6 | `74c230e18a68` |
| jwt | `src/services/supabase/client.js` | 7 | `9309162bfd35` |
| jwt | `src/services/supabase/client.js` | 5 | `73add7d3c546` |
| jwt | `seed-sample-data.js` | 14 | `abf7b9b82560` |
| jwt | `check-database.js` | 4 | `04bac58c16ac` |
| jwt | `src/services/supabase/client.js` | 5 | `04bac58c16ac` |
| generic-api-key | `.vite/deps/chunk-5CESIVO2.js` | 2596 | `c0422cd3ea9d` |
| generic-api-key | `.vite/deps/chunk-5CESIVO2.js.map` | 4 | `c0422cd3ea9d` |

Follow-up outside git:

- Rotate or verify the historical Supabase anon/public keys in the Supabase
  dashboard/project settings.
- Keep history rewrite out of this pass unless explicitly approved.
- CI now scans a tracked-file snapshot with redacted Gitleaks output so ignored
  local files such as `.env` and `dist/` do not affect the workflow.
