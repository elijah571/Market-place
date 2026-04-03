#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/app"
BACKEND_DIR="${APP_DIR}/Backend"

PORT="${PORT:-8080}"
BACKEND_PORT="${BACKEND_PORT:-6000}"
MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/marketplace}"
REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
REDIS_ENABLED="${REDIS_ENABLED:-true}"
REDIS_REQUIRED="${REDIS_REQUIRED:-false}"
NODE_ENV="${NODE_ENV:-production}"

mkdir -p /data/db

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${REDIS_PID:-}" ]]; then
    kill "${REDIS_PID}" 2>/dev/null || true
  fi
  if [[ -n "${MONGO_PID:-}" ]]; then
    kill "${MONGO_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT TERM INT

mongod --dbpath /data/db --bind_ip 127.0.0.1 --logpath /var/log/mongodb.log --logappend &
MONGO_PID=$!

redis-server --appendonly yes --bind 127.0.0.1 --port 6379 &
REDIS_PID=$!

(
  export PORT="${BACKEND_PORT}"
  export MONGO_URI
  export REDIS_URL
  export REDIS_ENABLED
  export REDIS_REQUIRED
  export NODE_ENV
  cd "${BACKEND_DIR}"
  node src/server.js
) &
BACKEND_PID=$!

exec nginx -g "daemon off;"
