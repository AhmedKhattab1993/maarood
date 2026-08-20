# Production Deployment

Maarood production runs entirely on **Vercel + Neon Postgres**:

- **Web** (Next.js) — Vercel project, already deployed.
- **Backend** (NestJS API + in-process crawler) — Vercel project built from `Dockerfile.vercel` (Vercel Services).
- **Crawl schedule** — Vercel Cron (`vercel.json`, every 6h) calling `GET /admin/crawl` on the backend.
- **Database** — Neon Postgres `eu-central-1` (Frankfurt), unchanged.

No CI/CD, no Terraform — deploys are `git push` (or `vercel deploy`).

## Architecture

```
                     ┌────────────────────────────┐
                     │  Vercel Cron               │  every 6h (UTC)
                     │  vercel.json: /admin/crawl │ ─────────────┐
                     └────────────────────────────┘              │ GET + Bearer CRON_SECRET
                                                                 ▼
   users ───HTTPS──▶┌────────────────────────────────────────────────┐
                     │  Vercel Service  (Dockerfile.vercel)           │
                     │  maarood-backend                                │
                     │  /v1  /admin  /health   + in-process crawler   │
                     │  (advisory-lock guarded, resumable)            │
                     └───────────────────────┬────────────────────────┘
                                             │
                                             ▼
                                   ┌───────────────────┐
                                   │  Neon Postgres     │
                                   │  eu-central-1      │
                                   └───────────────────┘
```

The crawl runs **inside the backend request** (Vercel's Fluid instances pause
after a request completes, so it cannot safely run in the background). A
Postgres advisory lock prevents overlapping runs; a soft 700s deadline stops
before the 800s function limit and leaves unvisited merchants due, so the next
run resumes them.

| Resource | Purpose |
|---|---|
| Vercel project `maarood-web` | Next.js frontend (Root Directory `apps/web`) |
| Vercel project `maarood-backend` | Container service (Root Directory **repo root** — the Dockerfile needs the whole monorepo) |
| `vercel.json` (repo root) | Cron schedule — read by the backend project |
| Neon project | Production Postgres |
| Env vars (Vercel, backend project) | `DATABASE_URL`, `ADMIN_TOKEN`, `CRON_SECRET`, `CORS_ORIGIN` |

---

## Prerequisites (one-time)

1. **Neon project** — [neon.tech](https://neon.tech), region `AWS eu-central-1 (Frankfurt)`. Connection string ending with `?sslmode=require` = `DATABASE_URL`. (Existing project carries over unchanged.)
2. **Vercel Pro** for the team (Services + sub-day cron schedules require Pro).
3. Local `~/.maarood.env` still holds the same keys for local dev:
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/maarood?sslmode=require
   ADMIN_TOKEN=<strong secret, >= 16 chars>
   ```

## Create the backend Vercel project (once)

1. Vercel dashboard → **Add New → Project** → import this repo.
2. Configure:
   - **Root Directory:** repo root (leave `/`) — `Dockerfile.vercel` must see the whole monorepo.
   - Framework preset: **Docker** (detected via `Dockerfile.vercel`).
   - **Region: Frankfurt (fra1)** — same metro as Neon.
   - Production branch: `main`.
3. Environment variables (Production, and Preview as needed):
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Neon connection string (`?sslmode=require`) |
   | `ADMIN_TOKEN` | same value as `~/.maarood.env` |
   | `CRON_SECRET` | **must equal `ADMIN_TOKEN`** — Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`, and the guard compares it to `ADMIN_TOKEN` |
   | `CORS_ORIGIN` | `https://<your-web-domain>` (the web project's URL) |
   | `NODE_ENV` | `production` |
4. Deploy. The web project is unaffected (its Root Directory is `apps/web`, so it ignores the root `vercel.json`).

> Keep the **web project's** Root Directory at `apps/web`. The root `vercel.json` (cron) must belong to the backend project only.

## First deployment

```bash
# 1. Apply the schema to the production Neon DB (manual migrate-once).
DATABASE_URL="$DATABASE_URL" npm run db:migrate

# 2. Seed the initial merchants into production.
DATABASE_URL="$DATABASE_URL" npm run seed

# 3. Deploy the backend: git push to main (or `vercel deploy --prod`).
```

The cron job is created automatically from `vercel.json` on the next deploy.

## Smoke test (against the live URL)

```bash
BASE_URL=https://maarood-backend-xxxx.vercel.app   # from the dashboard
ADMIN_TOKEN=...                                     # from ~/.maarood.env

# 1. Health (deep = confirms DB connectivity service → Neon)
curl -fsS "$BASE_URL/health?deep=true"          # → {"status":"ok"}

# 2. Public API returns real data
curl -fsS "$BASE_URL/v1/brands" | head

# 3. Admin is gated
curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/admin/merchants"           # → 401
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/admin/merchants"                                                  # → 200

# 4. Trigger a crawl manually (responds when the batch/deadline finishes).
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/admin/crawl"
# → {"started":true,"summary":{"crawled":2,"skipped":0,"failed":0,"completed":true}}

# 5. Verify freshness.
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/admin/health/ingestion"
# → freshness[].state == "fresh", recentFailures == []
```

---

## Updating

- **Any code change** → `git push` to `main`; Vercel builds and deploys.
- **Schema change** → migrate first, then deploy:
  ```bash
  DATABASE_URL="$DATABASE_URL" npm run db:migrate
  ```
  Migrations run manually against Neon (no auto-migration in the container — KISS).

## Operating notes

- **Cron history:** Vercel dashboard → backend project → **Cron Jobs** (last runs, duration, status).
- **Crawl logs:** project Logs — `CrawlService` logs start, per-merchant progress, and the final summary.
- **Overlap protection:** a second `/admin/crawl` while one is running returns
  `{"started":false,"reason":"crawl_already_running"}` — safe to retrigger anytime.
- **Killed mid-crawl** (deploy/instance restart): the advisory lock dies with
  the session; unvisited merchants remain due and the next run resumes them.
- **Manual single-merchant crawl** (bypassing due-logic): `npm run scrape -- <slug>` locally against production `DATABASE_URL`.

---

## GCP teardown (post-migration)

The previous deployment (Cloud Run + Scheduler + Secret Manager) can be deleted
once the Vercel service is verified:

```bash
gcloud config set project YOUR_PROJECT_ID

# 1. Stop the recurring crawl trigger.
gcloud scheduler jobs delete maarood-crawl-scheduler --region europe-west1

# 2. Delete the containers.
gcloud run services delete maarood-backend --region europe-west1
gcloud run jobs delete maarood-scraper --region europe-west1

# 3. Delete the secrets (values now live in Vercel env vars).
gcloud secrets delete maarood-database-url
gcloud secrets delete maarood-admin-token

# 4. Optional: remove container images and fully delete the project.
gcloud artifacts repositories list   # delete the Cloud Run deploy repo if billed
gcloud projects delete YOUR_PROJECT_ID
```

---

## What's intentionally NOT here (YAGNI)

- **CI/CD pipelines** — git-push deploys are enough for an MVP.
- **Custom domain for the API** — the `*.vercel.app` URL is sufficient for now.
- **Terraform / IaC** — one `Dockerfile.vercel` + one `vercel.json` + dashboard env vars.
- **Auto-migrations** — manual migrate-once avoids running migrations on every deploy.
- **Queues (QStash/pg-boss)** — the cron + advisory-lock + due-logic batch covers current needs.

When real traffic or team size justifies these, add them then — not before.
