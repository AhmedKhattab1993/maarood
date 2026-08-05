# Single Dockerfile for BOTH deployables (backend service + scraper job).
# The build context is the REPO ROOT, so all workspace packages are in scope:
#   gcloud run deploy      maarood-backend  --source .                          # backend (default TARGET)
#   gcloud run jobs deploy maarood-scraper --source .                          # scraper (TARGET=scraper set at runtime)
# Cloud Run with --source always builds <source-dir>/Dockerfile (this file) and
# does not expose a Dockerfile --target flag. Both apps are therefore compiled
# into one image, and the TARGET RUNTIME env var selects which entrypoint runs.

# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Install workspace manifests first for better layer caching.
COPY package.json package-lock.json* ./
COPY packages/schema/package.json ./packages/schema/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/scraper/package.json ./apps/scraper/package.json
RUN npm install --workspaces --include-workspace-root

# Compile shared schema first (backend & scraper both import it), then both apps.
COPY tsconfig.base.json ./
COPY packages/schema ./packages/schema
RUN npm run build --workspace @maarood/schema

COPY apps/backend ./apps/backend
COPY apps/scraper ./apps/scraper
RUN npm run build --workspace @maarood/backend \
 && npm run build --workspace @maarood/scraper

# Prune devDependencies for the runtime image.
RUN npm prune --omit=dev

# ---- runtime (single stage; TARGET picks the entrypoint) ----
FROM node:20-bookworm-slim AS runtime
# TARGET is a RUNTIME env var set by deploy.sh (default: backend).
ENV NODE_ENV=production
ENV TARGET=backend
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/schema/dist ./packages/schema/dist
COPY --from=build /app/packages/schema/package.json ./packages/schema/package.json
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/scraper/dist ./apps/scraper/dist
COPY --from=build /app/apps/scraper/package.json ./apps/scraper/package.json

# Cloud Run service: PORT is injected; the backend reads it at boot.
ENV PORT=8080
EXPOSE 8080

# TARGET selects the entrypoint: scraper runs once per job execution and exits,
# backend is the always-on service.
CMD ["sh", "-c", "if [ \"$TARGET\" = scraper ]; then exec node apps/scraper/dist/run-all.js; else exec node apps/backend/dist/main.js; fi"]
