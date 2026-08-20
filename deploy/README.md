# Production Deployment

Maarood production runs entirely on **Vercel + Neon Postgres** — no containers,
no Dockerfiles, no queues to operate:

| Tier | Vercel project | Runtime |
|---|---|---|
| Web + crawl workflow host | `maarood-web` (Root Directory `apps/web`) | Next.js 14 (`withWorkflow`) |
| Public + admin API | `maarood-backend` (Root Directory `apps/backend`) | NestJS, zero-config detected as a Node.js server function |
| Database | Neon `eu-central-1` (Frankfurt) | Postgres (unchanged) |

**Crawling** runs as a **Vercel Workflow** (`apps/web/workflows/crawl.ts`):
Vercel Cron (`apps/web/vercel.json`) calls `GET /api/cron/crawl` every 6h →
`start(crawlAll)` → one durable, retried step per due merchant. Run duration is
unbounded; steps survive deploys and crashes; per-run/per-step observability is
in the Vercel dashboard (project → Observability → Workflows).

## Architecture

```
                    ┌──────────────────────────────┐
                    │ Vercel Cron (apps/web)       │ every 6h (UTC)
                    │ GET /api/cron/crawl          │──────┐
                    └──────────────────────────────┘      │ Bearer CRON_SECRET
                                                          ▼
   users ──HTTPS──▶┌──────────────────────────────────────────────────┐
                    │ maarood-web (Next.js, fra1)                      │
                    │  UI  +  workflow: crawlAll ── step per merchant  │
                    └───────────────────────┬──────────────────────────┘
                                            │
                    ┌───────────────────────▼──────────────────────────┐
                    │ maarood-backend (NestJS function)                │
                    │  /v1  /admin  /health                             │
                    └───────────────────────┬──────────────────────────┘
                                            │
                                            ▼
                                   ┌───────────────────┐
                                   │ Neon Postgres      │
                                   │ eu-central-1       │
                                   └───────────────────┘
```

Why this shape (see `06_TECHNICAL_ARCHITECTURE.md` for the full rationale):

- **No Docker anywhere.** Vercel runs the NestJS app as a Node.js server
  function (zero-config `src/main.ts` detection) and the crawler as workflow
  steps — both Fluid compute, both scale to zero.
- **Crawl scaling is unbounded.** One step per merchant (each ≤ the function
  duration limit) with automatic retries; the workflow itself has no duration
  limit, so merchant count can grow without rearchitecting.
- **Overlap-safe.** The per-merchant due-logic skips merchants whose last crawl
  is fresh; upserts are idempotent. A manual trigger while a scheduled run is
  active is harmless.

---

## Prerequisites (one-time)

1. **Neon project** — [neon.tech](https://neon.tech), region `AWS eu-central-1 (Frankfurt)`. Connection string ending with `?sslmode=require` = `DATABASE_URL`. (Existing project carries over unchanged.)
2. **Vercel Pro** team (cron on sub-6h schedules, fluid compute, 800s step durations).
3. Local `~/.maarood.env` still holds the same keys for local dev.

## Backend project (`maarood-backend`)

1. Vercel dashboard → **Add New → Project** → import this repo.
2. **Root Directory:** `apps/backend` (Vercel auto-detects NestJS via `src/main.ts`; no build overrides needed).
3. **Function region: Frankfurt (fra1).**
4. Environment variables (Production + Preview):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Neon connection string (`?sslmode=require`) |
   | `ADMIN_TOKEN` | strong secret (≥ 16 chars), same as `~/.maarood.env` |
   | `CORS_ORIGIN` | `https://<web-domain>` |
   | `NODE_ENV` | `production` |

## Web project (`maarood-web`)

1. If the web project already exists (it does), just update **Root Directory:** stays `apps/web`.
2. **Function region: Frankfurt (fra1)** (also brings crawl steps next to Neon).
3. Environment variables — add to the existing set:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | same Neon connection string (crawl workflow reads it) |
   | `CRON_SECRET` | strong secret (≥ 16 chars) — Vercel sends it as `Authorization: Bearer` when invoking the cron path |

   The cron schedule lives in `apps/web/vercel.json` (`0 */6 * * *` → `/api/cron/crawl`) and is created automatically on deploy.

## First deployment

```bash
# 1. Apply the schema to the production Neon DB (manual migrate-once).
DATABASE_URL="$DATABASE_URL" npm run db:migrate

# 2. Seed the initial merchants into production.
DATABASE_URL="$DATABASE_URL" npm run seed

# 3. Deploy both projects: git push to main (Vercel builds each project from its Root Directory).
```

## Smoke test

```bash
WEB_URL=https://maarood-web.vercel.app        # web project URL
API_URL=https://maarood-backend.vercel.app    # backend project URL
ADMIN_TOKEN=...                                # from ~/.maarood.env
CRON_SECRET=...                                # web project env

# 1. Backend health (deep = confirms service → Neon connectivity)
curl -fsS "$API_URL/health?deep=true"                     # → {"status":"ok"}

# 2. Public API returns real data
curl -fsS "$API_URL/v1/brands" | head

# 3. Admin is gated
curl -s -o /dev/null -w "%{http_code}\n" "$API_URL/admin/merchants"            # → 401
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_URL/admin/merchants"                                                   # → 200

# 4. Trigger the crawl workflow manually (responds immediately with a run id)
curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$WEB_URL/api/cron/crawl"
# → {"started":true,"runId":"wrun_..."}

# 5. Watch the run: dashboard → maarood-web → Observability → Workflows
#    (or locally after `vercel link`: npx workflow inspect runs --backend vercel)

# 6. Verify freshness on the API
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$API_URL/admin/health/ingestion"
# → freshness[].state == "fresh", recentFailures == []
```

---

## Updating

- **Any code change** → `git push` to `main`; both projects build and deploy independently from their Root Directories.
- **Schema change** → migrate first, then deploy:
  ```bash
  DATABASE_URL="$DATABASE_URL" npm run db:migrate
  ```

## Operating notes

- **Workflow runs:** dashboard → `maarood-web` → Observability → Workflows (per-step status, retries, logs).
- **Cron history:** dashboard → `maarood-web` → Cron Jobs.
- **Failed merchants** never block the batch: the workflow records the failure and continues; `crawl_runs` + `/admin/review-queue` carry the detail.
- **Manual single-merchant crawl** (bypasses due-logic): `DATABASE_URL=... npm run scrape -- <slug>` locally.
- **Cloudflare note:** connectors fetch via `curl` when the binary exists (local/Docker) and fall back to Node `fetch` in the workflow sandbox (verified working for all current merchants). If a future store sanitizes Node-fetch responses from Vercel IPs, fall back to `npm run scrape` locally for that store and revisit.

## Local development

Everything still runs locally with no Vercel account:

```bash
npm run db:up && npm run db:migrate
npm run dev --workspace @maarood/backend   # API on :8080
npm run dev --workspace @maarood/web       # web + workflow routes on :3000
DATABASE_URL=... CRON_SECRET=... npm run build --workspace @maarood/web && \
  (cd apps/web && npx next start)          # then curl /api/cron/crawl to run the real workflow
npx workflow inspect runs                  # local workflow runs (Local World)
npm run scrape:all                          # plain CLI crawl, no workflow
```

---

## GCP teardown (post-migration)

Delete the previous Cloud Run deployment once the Vercel setup is verified:

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud scheduler jobs delete maarood-crawl-scheduler --region europe-west1
gcloud run services delete maarood-backend --region europe-west1
gcloud run jobs delete maarood-scraper --region europe-west1
gcloud secrets delete maarood-database-url
gcloud secrets delete maarood-admin-token
gcloud projects delete YOUR_PROJECT_ID   # optional, final
```

---

## What's intentionally NOT here (YAGNI)

- **CI/CD pipelines** — git-push deploys are enough for an MVP.
- **Custom API domain** — the `*.vercel.app` URL is sufficient for now.
- **Terraform / IaC** — two Vercel projects + env vars + one `vercel.json`.
- **Auto-migrations** — manual migrate-once.
- **Dedicated crawler project** — the workflow lives in the web project; split it into its own service only if team size or deploy cadence demands it.
- **Queues (QStash / pg-boss)** — Vercel Workflows already provides durable, retried execution.

When real traffic or team size justifies these, add them then — not before.
