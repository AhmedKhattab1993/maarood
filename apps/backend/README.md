# Maarood Backend

NestJS + TypeScript + Drizzle + PostgreSQL, deployed to Google Cloud Run.

Shared canonical schema lives in [`packages/schema`](../../packages/schema) and is consumed by both this backend and the future scraper package — the contract for ingestion and the API cannot drift.

## Environment setup

Secrets live in **`~/.maarood.env`** (user-level, outside the repo) — mirroring the `theultimate-core` convention. No `.env` files are committed.

Create `~/.maarood.env` with at least:

```
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://user:password@host:5432/maarood
GCS_BUCKET_NAME=maarood-media
```

Precedence (low → high): code defaults → `~/.maarood.env` → process env. The Zod schema in `src/config/env.schema.ts` validates everything at boot and **fails fast** on misconfiguration.

Naming: `UPPER_SNAKE_CASE`; project keys are prefixed where domain-specific. Secrets end in `_API_KEY` / `_SECRET` / `_TOKEN`.

## Local development

```bash
# from repo root
npm install
npm run dev          # NestJS watch mode
npm run typecheck
npm run lint
```

`GET /health` returns `{ "status": "ok" }`; `GET /health?deep=true` also pings the DB with `SELECT 1`.

## Database

```bash
# generate migrations from the Drizzle schema
npm run db:generate --workspace @maarood/schema

# apply migrations (requires DATABASE_URL)
npm run db:migrate --workspace @maarood/schema
```

## Deploy to Cloud Run

Build and deploy the image (the Dockerfile builds the monorepo and runs this backend):

```bash
gcloud run deploy maarood-backend \
  --source . \
  --region run-tp4e2mii3a \
  --port 8080 \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=maarood-database-url:latest
```

Use Secret Manager (`--set-secrets`) for `DATABASE_URL` and any API keys — never deploy secrets via `--set-env-vars`. Project keys not required for the MVP (e.g. `GCS_BUCKET_NAME`) are optional in the schema.
