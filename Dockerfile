FROM node:20-bookworm-slim AS backend-deps
WORKDIR /app/Backend
COPY Backend/package*.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app/Frontend
ARG VITE_API_BASE_URL=/api
ARG VITE_STRIPE_PUBLISHABLE_KEY=
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend ./
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}
RUN npm run build

FROM mongo:7

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    nginx \
    redis-server \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Backend ./Backend
COPY --from=backend-deps /app/Backend/node_modules ./Backend/node_modules
COPY --from=frontend-build /app/Frontend/dist /usr/share/nginx/html
COPY infra/nginx/single-container.conf /etc/nginx/conf.d/default.conf
COPY scripts/entrypoint.fullstack.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
  && rm -f /etc/nginx/sites-enabled/default

ENV PORT=8080
ENV BACKEND_PORT=6000
ENV NODE_ENV=production
ENV MONGO_URI=mongodb://127.0.0.1:27017/marketplace
ENV REDIS_URL=redis://127.0.0.1:6379
ENV REDIS_ENABLED=true
ENV REDIS_REQUIRED=false

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
