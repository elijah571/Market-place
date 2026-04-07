# Marketplace Deployment Guide

This repository is ready to run as two separate apps:

- `Frontend/`: Vite + React storefront/admin UI
- `Backend/`: Express API

## Recommended split

- Deploy the backend as its own web service.
- Deploy the frontend as its own static site.
- Point the frontend at the backend with `VITE_API_BASE_URL`.
- Point the backend back at the frontend with `FRONTEND_URL`.

This repo now includes a Render blueprint in [render.yaml](/home/elijah/projects/Market-place/render.yaml) that defines both services independently, so frontend-only changes do not force backend rebuilds and backend-only changes do not force frontend rebuilds.

## Environment wiring

Frontend:

- `VITE_API_BASE_URL=https://your-backend-domain`
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_...`

Backend:

- `MONGO_URI=...`
- `FRONTEND_URL=https://your-frontend-domain`
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=none`
- `JWT_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- payment and email provider secrets as needed

Notes:

- Do not include `/api` or `/api/v1` in `VITE_API_BASE_URL`. The frontend app appends `/api/v1` automatically.
- `FRONTEND_URL` can contain multiple comma-separated origins if you need more than one allowed frontend.
- `FRONTEND_URL` also supports `*` wildcards for preview domains, for example `https://market-place-*.vercel.app,https://your-production-domain.vercel.app`.
- If you are not provisioning Redis yet, keep `REDIS_ENABLED=false`.

## Render deployment

1. Create the backend service from [render.yaml](/home/elijah/projects/Market-place/render.yaml).
2. Create the frontend service from the same blueprint.
3. Set the backend `FRONTEND_URL` to your deployed frontend URL.
4. Set the frontend `VITE_API_BASE_URL` to your deployed backend URL.
5. If you use Flutterwave, set `FLUTTERWAVE_REDIRECT_URL` to `https://your-frontend-domain/payment-success`.
6. To seed production products, set backend `SEED_PRODUCT_OWNER_EMAIL` and run `npm run seed:products` from the Render backend shell as a one-off command.

## Vercel frontend + Render backend

If you prefer Vercel for the frontend, keep using [Frontend/vercel.json](/home/elijah/projects/Market-place/Frontend/vercel.json) and set:

- Vercel frontend env: `VITE_API_BASE_URL=https://your-backend-domain`
- Render backend env: `FRONTEND_URL=https://your-vercel-domain`
- Render backend env: `COOKIE_SECURE=true`
- Render backend env: `COOKIE_SAME_SITE=none`

## Local development

- Frontend local dev can continue using `VITE_BASE_API=http://localhost:6000`.
- Backend local dev can continue using `FRONTEND_URL=http://localhost:5173`.
- Docker Compose still works for the bundled local stack; these deployment changes do not remove that path.
