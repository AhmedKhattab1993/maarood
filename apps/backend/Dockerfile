# Backend Cloud Run service image.
# Build from the repo ROOT so the workspace build can see all packages:
#   gcloud run deploy maarood-backend --source . --region europe-west1 ...
# (Cloud Run uses the directory of the Dockerfile as the build context. Because
# this Dockerfile lives at apps/backend/Dockerfile, we reference paths relative
# to the repo root via the build context that gcloud/Cloud Build provides.)

# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Install workspace manifests first for better layer caching.
COPY package.json package-lock.json* ./
COPY packages/schema/package.json ./packages/schema/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/scraper/package.json ./apps/scraper/package.json
RUN npm install --workspaces --include-workspace-root

# Copy sources and compile both shared schema and this backend.
COPY tsconfig.base.json ./
COPY packages/schema ./packages/schema
COPY apps/backend ./apps/backend
RUN npm run build --workspace @maarood/schema
RUN npm run build --workspace @maarood/backend

# Prune devDependencies for the runtime image.
RUN npm prune --omit=dev

# ---- runtime ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/schema/dist ./packages/schema/dist
COPY --from=build /app/packages/schema/package.json ./packages/schema/package.json
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/package.json ./package.json

# Cloud Run injects PORT; the app reads it from env at boot.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "apps/backend/dist/main.js"]
