# syntax=docker/dockerfile:1
# Build from the repo root: docker build -f ui/Dockerfile .

# --- Build: type-check and bundle with Next.js (standalone server output) ---
FROM node:24-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY ui ./ui

# Next bakes NEXT_PUBLIC_* variables and the /api rewrite target in at build time.
# Empty NEXT_PUBLIC_API_URL = same-origin /api, which Next forwards to API_UPSTREAM.
ARG NEXT_PUBLIC_API_URL=
ARG NEXT_PUBLIC_MAPS_API_KEY=
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ARG API_UPSTREAM=http://api:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_MAPS_API_KEY=$NEXT_PUBLIC_MAPS_API_KEY \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    API_UPSTREAM=$API_UPSTREAM
RUN npm run build:ui

# --- Runtime: the self-contained Next server only ---
FROM node:24-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/ui/.next/standalone ./
COPY --from=build --chown=node:node /app/ui/.next/static ./ui/.next/static
COPY --from=build --chown=node:node /app/ui/public ./ui/public
USER node
EXPOSE 3000
CMD ["node", "ui/server.js"]
