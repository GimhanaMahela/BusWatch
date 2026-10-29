# syntax=docker/dockerfile:1
# Build from the repo root: docker build -f api/Dockerfile .

# --- Build: compile TypeScript ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY api ./api
RUN npm run build:api

# --- Runtime: API runtime dependencies + compiled JS only ---
# UI libraries are devDependencies (bundled by Vite), so --omit=dev leaves them out.
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/api/dist ./api/dist
USER node
EXPOSE 5000
CMD ["node", "api/dist/server.js"]
