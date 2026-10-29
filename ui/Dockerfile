# syntax=docker/dockerfile:1

# --- Build: type-check and bundle with Vite ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Vite bakes VITE_* variables in at build time, so they are build arguments.
# The API URL must be reachable from the user's browser (not the Docker network name).
ARG VITE_BACKEND_URL=http://localhost:5000/api
ARG VITE_MAPS_API_KEY=
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_MAPS_API_KEY=$VITE_MAPS_API_KEY
RUN npm run build

# --- Runtime: static files served by nginx ---
FROM nginx:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
