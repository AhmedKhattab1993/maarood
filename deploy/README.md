# Production Deployment

Minimal, manual deployment of the Maarood backend + scraper to GCP with **Neon** as the production Postgres database. No CI/CD, no Terraform — explicit `gcloud` commands via `deploy.sh`.

## Architecture

```
                     ┌───────────────────────┐
                     │  Cloud Scheduler      │  every 6h (UTC)
                     │  maarood-crawl-       │ ─────────────┐
                     │  scheduler            │              │
                     └───────────────────────┘              ▼
   users ────HTTPS──▶┌───────────────────────┐     ┌────────────────────┐
                     │  Cloud Run SERVICE    │     │  Cloud Run JOB     │
                     │  maarood-backend      │     │  maarood-scraper   │
                     │  (/v1, /admin, /health)│     │  (run-all.js)      │
                     └──────────┬────────────┘     └─────────┬──────────┘
                                │                            │
                                ▼                            ▼
                          ┌──────────────────────────────────────┐
                          │  Neon Postgres  (eu-central-1)        │
                          │  DATABASE_URL  ←  Secret Manager      │
                          └──────────────────────────────────────┘
```

| Resource | Purpose |
|---|---|
| `maarood-backend` (Cloud Run service) | Public API + admin + health; always-on |
| `maarood-scraper` (Cloud Run job) | Runs `run-all` on invocation, crawls due merchants, exits |
| `maarood-crawl-scheduler` (Cloud Scheduler) | Triggers the scraper every 6 hours |
| Neon project | Production Postgres |
| `maarood-database-url`, `maarood-admin-token` (Secret Manager) | Secrets consumed by both containers |

**Regions (defaults):** GCP `europe-west1` (Belgium, closest to Egypt); Neon `eu-central-1` (Frankfurt, closest to europe-west1).

---

## Prerequisites (one-time)

1. **GCP project with billing enabled**, and the `gcloud` CLI installed and authenticated:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. **Neon project** — create at [neon.tech](https://neon.tech), region `AWS eu-central-1 (Frankfurt)`. Copy the connection string; ensure it ends with `?sslmode=require`. This is your `DATABASE_URL`.
3. **Generate an admin token** (≥ 16 chars), e.g.:
   ```bash
   openssl rand -base64 32
   ```
4. **Add the deployment env vars** to `~/.maarood.env` (the deploy script reads these):
   ```
   PROJECT_ID=your-gcp-project-id
   DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/maarood?sslmode=require
   ADMIN_TOKEN=<the generated token>
   REGION=europe-west1            # optional; default europe-west1
   SCHEDULE="0 */6 * * *"         # optional; default every 6h
   ```

---

## First deployment

Run from the **repo root**.

```bash
# 1. One-time: enable APIs, create secrets in Secret Manager.
./deploy/deploy.sh setup

# 2. Apply the schema to the production Neon DB (manual migrate-once).
#    Uses the DATABASE_URL from your env.
DATABASE_URL="$DATABASE_URL" npm run db:migrate

# 3. Seed the initial merchants into production.
DATABASE_URL="$DATABASE_URL" npm run seed

# 4. Deploy both containers.
./deploy/deploy.sh backend
./deploy/deploy.sh scraper

# 5. One-time: create the recurring crawl scheduler + grant invoker IAM.
./deploy/deploy.sh scheduler
```

Or all at once after prerequisites:
```bash
./deploy/deploy.sh all
```

---

## Smoke test (against the live URL)

Capture the backend URL from the `backend` step output, then:

```bash
BASE_URL=https://maarood-backend-xxxx-de.a.run.app
ADMIN_TOKEN=...   # from ~/.maarood.env

# 1. Health (deep = confirms DB connectivity Cloud Run → Neon)
curl -fsS "$BASE_URL/health?deep=true"        # → {"status":"ok"}

# 2. Public API returns real data
curl -fsS "$BASE_URL/v1/brands" | head         # → NAS Trends + Antikka

# 3. Admin is gated
curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/admin/merchants"           # → 401
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/admin/merchants"                                                  # → 200

# 4. Trigger the scraper job manually and verify it ran.
gcloud run jobs execute maarood-scraper --region europe-west1
# after it finishes:
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/admin/health/ingestion"
# → freshness[].state == "fresh", recentFailures == []
```

---

## Updating

- **Code change → redeploy one or both:**
  ```bash
  ./deploy/deploy.sh backend    # backend code changed
  ./deploy/deploy.sh scraper    # scraper code changed
  ```
- **Schema change → migrate, then redeploy:**
  ```bash
  DATABASE_URL="$DATABASE_URL" npm run db:migrate   # apply to Neon
  ./deploy/deploy.sh backend                         # if backend needs the new schema
  ```
  Migrations are run manually against Neon (no auto-migration in the container — see KISS).

---

## What's intentionally NOT here (YAGNI)

- **CI/CD** — manual `deploy.sh` is enough for an MVP.
- **Custom domain** — the `*.run.app` HTTPS URL is sufficient for now.
- **Terraform / IaC** — explicit `gcloud` commands are easier to reason about at this scale.
- **Auto-migrations** — manual migrate-once avoids running migrations on every revision.
- **Synthetic monitoring / alerting** — `/admin/health/ingestion` is the surface; a future alerter can poll it.

When real traffic or team size justifies these, add them then — not before.
