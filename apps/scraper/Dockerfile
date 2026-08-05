# Scraper Cloud Run JOB image.
# A Cloud Run Job runs to completion and exits (not an always-on service).
# Entrypoint is run-all: crawl every active merchant whose frequency has elapsed.
#
# Build from the repo ROOT:
#   gcloud run jobs deploy maarood-scraper --source . --region europe-west1 ...
# Note: Cloud Run uses the directory of the Dockerfile as the build context, so
# this Dockerfile must be selected explicitly with --dockerfile=apps/scraper/Dockerfile
# when deploying via the root context. See deploy/deploy.sh.

# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/schema/package.json ./packages/schema/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/scraper/package.json ./apps/scraper/package.json
RUN npm install --workspaces --include-workspace-root

COPY tsconfig.base.json ./
COPY packages/schema ./packages/schema
COPY apps/scraper ./apps/scraper
RUN npm run build --workspace @maarood/schema
RUN npm run build --workspace @maarood/scraper

RUN npm prune --omit=dev

# ---- runtime ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/schema/dist ./packages/schema/dist
COPY --from=build /app/packages/schema/package.json ./packages/schema/package.json
COPY --from=build /app/apps/scraper/dist ./apps/scraper/dist
COPY --from=build /app/apps/scraper/package.json ./apps/scraper/package.json
COPY --from=build /app/package.json ./package.json

# Cloud Run Jobs: the command runs once per execution and exits.
CMD ["node", "apps/scraper/dist/run-all.js"]
