# syntax=docker/dockerfile:1
# Build from the repo root: docker build -f ui/Dockerfile .

# --- Build: type-check and bundle with Vite ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY ui ./ui

# Vite bakes VITE_* variables in at build time. Empty VITE_BACKEND_URL = same-origin /api,
# which nginx below forwards to the API container.
ARG VITE_BACKEND_URL=
ARG VITE_MAPS_API_KEY=
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_MAPS_API_KEY=$VITE_MAPS_API_KEY
RUN npm run build:ui

# --- Runtime: static files + /api reverse proxy via nginx ---
FROM nginx:1.29-alpine AS runtime
COPY ui/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/ui/dist /usr/share/nginx/html
# Where nginx forwards /api (the API service name in docker-compose)
ENV API_UPSTREAM=http://api:5000
EXPOSE 80
