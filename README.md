# tracc

Mill traceability app for Molino Rossetto. React + Vite SPA backed by
Supabase (Auth, Postgres, RLS). Deployed as a static site to GitHub Pages
on every push to `main`, served from the `/tracc/` subpath.

## Stack

- Vite 4 + React 19 + React Router 6 + TanStack Query
- Supabase client-only — no backend service in this repo

## Develop

```bash
cp .env.example .env.local        # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm ci
npm run dev                       # http://localhost:5173/tracc/
```

The dev base path is `/`; the production build uses `/tracc/` (see
[`vite.config.js`](vite.config.js)) so links resolve under
`https://<user>.github.io/tracc/`.

## Deploy

Push to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. `npm ci` → `npm run lint` → `npm run build`
2. Publish `dist/` to GitHub Pages.

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Project anon / publishable key |

Set in repo Settings → Secrets and variables → Actions. **Service role keys
must never be added here** — they would be baked into the public JS bundle.
