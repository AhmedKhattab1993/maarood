#!/usr/bin/env bash
#
# Maarood production deployment script.
#
# Deploys the backend (Cloud Run service) and scraper (Cloud Run job) to GCP,
# wired to a Neon Postgres DB and Cloud Scheduler. Run from the repo root.
#
# Usage:
#   ./deploy/deploy.sh setup       # one-time: enable APIs, create secrets
#   ./deploy/deploy.sh backend     # build + deploy the backend service
#   ./deploy/deploy.sh scraper     # build + deploy the scraper job
#   ./deploy/deploy.sh scheduler   # one-time: create the crawl scheduler
#   ./deploy/deploy.sh all         # setup + backend + scraper + scheduler
#
# Required env (read automatically from ~/.maarood.env — your single source of truth):
#   PROJECT_ID   — your GCP project id
#   DATABASE_URL — Neon connection string (postgres://..., include ?sslmode=require)
#   ADMIN_TOKEN  — strong secret (>= 16 chars) for /admin/*
#
# Optional env (defaults shown):
#   REGION=europe-west1
#   SCHEDULE="0 */6 * * *"        # every 6 hours (UTC)
#
# This script is intentionally explicit and idempotent — no Terraform, no magic.
# Process env (if any) takes precedence over the file, same as the app loaders.

set -euo pipefail

# Auto-source ~/.maarood.env so this script reads from the same single file the
# app does. Inline `KEY=value` in the shell still overrides the file.
MAAROOD_ENV="${MAAROOD_ENV:-$HOME/.maarood.env}"
if [[ -f "$MAAROOD_ENV" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$MAAROOD_ENV"
  set +a
fi

REGION="${REGION:-europe-west1}"
SCHEDULE="${SCHEDULE:-0 */6 * * *}"
BACKEND_SERVICE="maarood-backend"
SCRAPER_JOB="maarood-scraper"
SCHEDULER_JOB="maarood-crawl-scheduler"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "ERROR: $name is not set. Add it to $MAAROOD_ENV (~/.maarood.env)." >&2
    exit 1
  fi
}

preflight() {
  require_env PROJECT_ID
  require_env DATABASE_URL
  require_env ADMIN_TOKEN
  echo ">> Using project=$PROJECT_ID region=$REGION schedule='$SCHEDULE'"
}

enable_apis() {
  echo ">> Enabling required APIs..."
  gcloud services enable --project "$PROJECT_ID" \
    run.googleapis.com \
    cloudscheduler.googleapis.com \
    secretmanager.googleapis.com \
    cloudbuild.googleapis.com
}

create_secret() {
  local name="$1"
  local value="$2"
  # Idempotent: create if missing, update otherwise.
  if gcloud secrets describe "$name" --project "$PROJECT_ID" >/dev/null 2>&1; then
    echo ">> Secret $name exists — updating."
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file - --project "$PROJECT_ID"
  else
    echo ">> Creating secret $name."
    printf '%s' "$value" | gcloud secrets create "$name" --data-file - --project "$PROJECT_ID"
  fi
}

setup() {
  preflight
  enable_apis
  create_secret "maarood-database-url" "$DATABASE_URL"
  create_secret "maarood-admin-token" "$ADMIN_TOKEN"
  echo ">> Setup complete."
}

deploy_backend() {
  preflight
  echo ">> Deploying backend service ($BACKEND_SERVICE)..."
  # Build from the repo ROOT (Dockerfile is there; TARGET defaults to backend).
  gcloud run deploy "$BACKEND_SERVICE" \
    --project "$PROJECT_ID" \
    --source . \
    --region "$REGION" \
    --port 8080 \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production,TARGET=backend,CORS_ORIGIN=*" \
    --set-secrets "DATABASE_URL=maarood-database-url:latest,ADMIN_TOKEN=maarood-admin-token:latest"
  echo ">> Backend deployed. URL:"
  gcloud run services describe "$BACKEND_SERVICE" --project "$PROJECT_ID" --region "$REGION" \
    --format 'value(status.url)'
}

deploy_scraper() {
  preflight
  echo ">> Deploying scraper job ($SCRAPER_JOB)..."
  # Build from the repo ROOT. TARGET is a RUNTIME env var (the Dockerfile CMD
  # picks the scraper entrypoint from it); gcloud run jobs deploy has no
  # --build-env-vars support, so target selection happens at runtime, not build.
  gcloud run jobs deploy "$SCRAPER_JOB" \
    --project "$PROJECT_ID" \
    --source . \
    --region "$REGION" \
    --task-timeout 30m \
    --set-env-vars "NODE_ENV=production,TARGET=scraper" \
    --set-secrets "DATABASE_URL=maarood-database-url:latest"
  echo ">> Scraper job deployed. Run manually:"
  echo "   gcloud run jobs execute $SCRAPER_JOB --project $PROJECT_ID --region $REGION"
}

create_scheduler() {
  preflight
  echo ">> Creating/updating Cloud Scheduler ($SCHEDULER_JOB)..."
  # Dedicated invoker SA. New GCP projects ship without the App Engine default
  # SA, so we create a project-local SA and grant it roles/run.invoker on the job.
  local invoker_sa="maarood-scheduler@${PROJECT_ID}.iam.gserviceaccount.com"
  if ! gcloud iam service-accounts describe "$invoker_sa" --project "$PROJECT_ID" >/dev/null 2>&1; then
    echo ">> Creating invoker service account: $invoker_sa"
    gcloud iam service-accounts create maarood-scheduler \
      --project "$PROJECT_ID" --display-name "Maarood scheduler invoker"
  fi
  # Grant run.invoker on the scraper job (idempotent — re-applying is a no-op).
  gcloud run jobs add-iam-policy-binding "$SCRAPER_JOB" \
    --project "$PROJECT_ID" --region "$REGION" \
    --member "serviceAccount:$invoker_sa" --role roles/run.invoker >/dev/null

  # Cloud Scheduler triggers the job via the run execute endpoint.
  local job_endpoint
  job_endpoint="https://$REGION-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$PROJECT_ID/jobs/$SCRAPER_JOB:run"
  # Idempotent: delete then recreate (simplest way to update schedule/target).
  if gcloud scheduler jobs describe "$SCHEDULER_JOB" --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
    echo ">> Scheduler exists — deleting to recreate."
    gcloud scheduler jobs delete "$SCHEDULER_JOB" --location "$REGION" --project "$PROJECT_ID" --quiet || true
  fi
  gcloud scheduler jobs create http "$SCHEDULER_JOB" \
    --project "$PROJECT_ID" \
    --location "$REGION" \
    --schedule "$SCHEDULE" \
    --time-zone "Etc/UTC" \
    --http-method POST \
    --uri "$job_endpoint" \
    --oauth-service-account-email "$invoker_sa" \
    --oauth-token-scope "https://www.googleapis.com/auth/cloud-platform"
  echo ">> Scheduler created with schedule '$SCHEDULE' invoking $invoker_sa."
}

main() {
  local cmd="${1:-}"
  case "$cmd" in
    setup)     setup ;;
    backend)   deploy_backend ;;
    scraper)   deploy_scraper ;;
    scheduler) create_scheduler ;;
    all)       setup; deploy_backend; deploy_scraper; create_scheduler ;;
    *)
      echo "Usage: $0 {setup|backend|scraper|scheduler|all}"
      exit 1
      ;;
  esac
}

main "$@"
