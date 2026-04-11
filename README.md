# Marketplace

Full-stack e-commerce marketplace built as two deployable applications:

- `Frontend/`: Vite + React single-page app for the storefront, customer account area, and admin dashboard
- `Backend/`: Express + MongoDB API for catalog, auth, cart, orders, payments, promotions, and analytics

This repository also includes Docker, Nginx, and Render/Vercel deployment configuration so the project can run locally, as split services, or as a bundled containerized stack.

## What This Project Does

The app supports the full shopping lifecycle:

- browse featured, trending, and top-rated products
- search, filter, sort, and paginate the catalog
- view product details, variants, recommendations, and reviews
- sign up, verify email, log in, refresh sessions, and reset passwords
- manage profile, avatar, saved addresses, wishlist, and recently viewed products
- add items to a guest cart, merge into an account cart after login, and keep cart state synced with the server
- apply promo codes, complete checkout, initialize payment, and verify payment results
- place and track orders
- manage products, orders, users, reviews, abandoned carts, and store analytics as an admin

## Architecture Overview

```text
React SPA (Vite)
  -> Axios client with token refresh and credentials
  -> Express API (/api/v1)
      -> Controllers / services / repositories
      -> MongoDB (users, products, carts, orders, transactions)
      -> Redis (optional caching and cache-tag invalidation)
      -> Cloudinary (product and avatar uploads)
      -> SMTP/Nodemailer (verification + reset emails)
      -> Payment providers (Stripe, Paystack, Flutterwave)
```

### High-level responsibilities

- Frontend handles routing, UI state, protected pages, cart persistence, checkout UX, and admin screens.
- Backend exposes the commerce API, validates requests, enforces auth/roles, calculates cart and order totals, tracks inventory-sensitive flows, and coordinates payments.
- MongoDB is the primary source of truth.
- Redis is optional and used for cache acceleration only. The API still works when Redis is disabled.
- Nginx is used in containerized deployments to serve the frontend and reverse proxy API traffic.

## Repository Structure

```text
.
├── Backend/
│   ├── src/
│   │   ├── config/          # database bootstrap
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── middleware/      # auth, validation, csrf, upload, errors
│   │   ├── models/          # Mongoose models
│   │   ├── repositories/    # query aggregation helpers
│   │   ├── routes/          # API route modules
│   │   ├── services/        # commerce, catalog, admin, payment logic
│   │   ├── utils/           # tokens, cache, logger, mail, cloudinary, helpers
│   │   └── validation/      # Zod request schemas
│   ├── scripts/             # seed utilities
│   └── tests/               # node:test coverage for core business rules
├── Frontend/
│   ├── src/
│   │   ├── app/             # bootstrap, Redux store, QueryClient
│   │   ├── components/      # shared UI and route guards
│   │   ├── features/        # Redux slices and cart/catalog logic
│   │   ├── layouts/         # storefront, account, admin shells
│   │   ├── pages/           # page-level routes
│   │   ├── services/        # frontend API wrappers
│   │   └── utils/           # api client, formatters, helpers
├── infra/nginx/             # reverse-proxy setup for compose/single image
├── scripts/                 # full-stack container entrypoints
├── docker-compose.yml       # local multi-container stack
├── render.yaml              # Render blueprint for split deployment
└── Dockerfile               # single-image full-stack build
```

## Frontend Architecture

### Routing and layouts

The client is organized around three layout shells:

- `StorefrontLayout`: public shopping pages like home, catalog, product details, cart, checkout, payment, and payment success
- `AccountLayout`: authenticated customer pages like profile, orders, saved products, and account settings
- `AdminLayout`: admin-only pages for analytics, products, orders, users, roles, and reviews

Route protection is handled with:

- `UserRoute` for signed-in customer pages
- `AdminRoute` for admin-only pages

### State management

The frontend uses a hybrid state approach:

- Redux Toolkit for app/session workflows:
  - `productSlice`
  - `userSlice`
  - `cartSlice`
  - `orderSlice`
  - `paymentSlice`
- React Query for read-heavy catalog data:
  - home collections
  - catalog metadata
  - product recommendations

### API integration

`Frontend/src/utils/apiClient.js` centralizes API behavior:

- normalizes the backend base URL
- sends cookies with every request
- stores the short-lived access token in local storage for bearer-auth retries
- automatically calls `/users/refresh-token` on `401`
- replays the failed request after a successful refresh

### Cart behavior

The cart supports both guest and authenticated flows:

- guest cart state is persisted locally
- after login, guest cart items can be merged into the server cart
- authenticated carts can be synced back to `/cart/me`
- shipping info and promo state are persisted
- server-calculated totals and cart issues are surfaced back to the UI

## Backend Architecture

### Express app composition

`Backend/src/app.js` wires the API with:

- `helmet` for secure headers
- `compression`
- `cookie-parser`
- `morgan` + structured logging
- `cors` using configured frontend origins
- JSON/urlencoded body parsing
- payload sanitization to block unsafe Mongo-style keys
- CSRF-style origin enforcement for cookie-authenticated unsafe requests
- route-specific rate limits for auth and payment endpoints
- health and readiness endpoints

### API route modules

Mounted under `/api/v1`:

- product routes for catalog, home collections, metadata, reviews, recommendations, and admin product CRUD
- user routes for auth, session refresh, profile, addresses, wishlist, and recently viewed items
- cart routes for current cart fetch, sync, merge, and abandoned cart reporting
- order routes for order creation, customer order history, admin order management, and status updates
- payment routes for initialization, verification, and transaction history
- promotion routes for active promo codes and code validation
- admin routes for dashboard analytics

### Layering

The backend is structured as:

- routes: map HTTP endpoints to controllers
- controllers: request/response coordination
- services: business rules and orchestration
- repositories: query-heavy data access helpers
- models: MongoDB persistence layer

This keeps HTTP concerns separate from commerce logic like cart normalization, inventory checks, payment verification, and dashboard aggregation.

## Core Domain Models

### User

Stores:

- profile fields and avatar
- role (`user` or `admin`)
- verification and password reset tokens
- refresh token hash and token versioning
- addresses
- wishlist product references
- recently viewed history

### Product

Stores:

- catalog basics: name, description, category, subcategory, brand, tags, slug
- pricing and stock
- gallery images
- variants with color, size, stock, SKU, price delta, attributes, and image
- reviews, ratings, and view count

### Cart

Stores:

- active cart per user
- normalized line items
- shipping info
- promo code
- computed pricing summary
- validation issues like removed products, missing variants, or stock problems
- conversion state once turned into an order

### Order

Stores:

- shipping snapshot
- purchased items and selected variants
- payment info and provider reference
- order state (`PendingPayment`, `Processing`, `Shipped`, `Delivered`, `Cancelled`)
- pricing totals
- promo usage
- timeline entries for order and payment state transitions

### Transaction

Stores:

- gateway (`stripe`, `paystack`, `flutterwave`)
- provider reference
- payment status
- idempotency key
- provider payload
- verification attempts
- linked cart and linked order

## Important Functional Flows

### 1. Authentication and session flow

- user signs up with optional avatar upload
- backend hashes password, stores verification token, and sends email
- after verification, login issues:
  - HTTP-only access and refresh cookies
  - access token in the response body for the SPA
- protected API calls use bearer token and cookies
- expired access tokens are refreshed automatically through `/users/refresh-token`
- logout revokes the stored refresh token hash and bumps token version

### 2. Catalog and discovery flow

- homepage loads cached home collections from `/products/home`
- catalog pages use `/products` with search, filters, sorting, and pagination
- metadata for categories and price ranges comes from `/products/meta`
- product detail fetch increments view count server-side
- recommendation queries derive related products from category/subcategory similarity
- authenticated viewers can track and later fetch recently viewed items

### 3. Cart and checkout flow

- line items are normalized server-side against the live product catalog
- variant selection is validated
- quantities are capped to available stock
- tax, shipping, discount, and total are recalculated on the server
- invalid promo codes and stock issues are attached to the cart as actionable issues
- guest carts can be merged into the authenticated cart after login

### 4. Payment flow

Payments are provider-driven but normalized behind a shared payment service.

- frontend calls `/payments/initialize`
- backend rebuilds the cart snapshot, validates shipping data, and creates an idempotent transaction
- provider-specific initialization is delegated to Stripe, Paystack, or Flutterwave
- frontend completes the provider flow
- frontend calls `/payments/verify`
- backend verifies directly with the provider and updates:
  - transaction status
  - linked order payment state
  - timeline entries

The current implementation is designed to work without depending on payment webhooks for the main checkout success path.

### 5. Order lifecycle

- orders are created from a validated cart/order snapshot
- inventory is reserved before order creation
- successful payments move orders from `PendingPayment` to `Processing`
- admin can move orders through `Shipped` and `Delivered`
- refunds mark the payment as refunded and can cancel the order
- order history is available to the customer, and a broader view is available to admins

### 6. Admin operations

Admins can:

- create, update, and delete products
- upload product and variant imagery
- review catalog performance and low-stock signals
- inspect users and update roles/profile data
- review order pipeline and payment state
- inspect abandoned carts
- access dashboard analytics including:
  - users, products, orders, revenue, discounts, average order value
  - order status and payment status breakdowns
  - category breakdowns
  - sales trend chart data
  - recent users, orders, products
  - top viewed and top selling products

## Caching Strategy

Redis is optional. When enabled, the backend caches GET responses for hot paths such as:

- catalog pages
- homepage collections
- product detail and recommendations
- customer cart, profile, wishlist, recently viewed, and orders
- transaction history
- admin dashboard and admin list views

The cache layer uses tag-based invalidation so writes can clear only the affected surfaces, for example product, user, cart, order, and dashboard data.

## Security and Reliability Notes

The backend includes:

- role-based authorization
- token version checks to invalidate stale sessions
- refresh token hashing in storage
- CORS allow-listing with support for multiple frontend origins and wildcard preview domains
- origin validation for cookie-authenticated unsafe requests
- request payload sanitization against unsafe keys
- rate limiting on auth and payment routes
- health and readiness probes for deployment platforms
- graceful shutdown for HTTP, MongoDB, and Redis connections

## Local Development

### Option 1: Run with Docker Compose

This is the easiest full-stack local setup.

```bash
docker compose up --build
```

Services started:

- `mongodb`
- `redis`
- `backend` on internal port `6000`
- `frontend` served by Nginx
- `nginx` exposed on `http://localhost:8080`

Optional Stripe CLI forwarding is available with the `stripe` profile.

### Option 2: Run frontend and backend separately

Backend:

```bash
cd Backend
npm ci
npm run dev
```

Frontend:

```bash
cd Frontend
npm ci
npm run dev
```

Default local expectations:

- backend: `http://localhost:6000`
- frontend: `http://localhost:5173`
- Vite proxies `/api` requests to the backend in development

## Environment Variables

### Frontend

Use `Frontend/.env.example` as the base:

- `VITE_BASE_API=http://localhost:6000`
- `VITE_API_BASE_URL=https://your-backend-domain`
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_...`

Notes:

- Do not include `/api` or `/api/v1` in `VITE_API_BASE_URL`.
- The frontend client appends `/api/v1` automatically.

### Backend

Use `Backend/.env.example` as the base. Key groups:

- database: `MONGO_URI`, pool and timeout settings
- auth: `JWT_SECRET`, `JWT_REFRESH_SECRET`, token expiries, cookie settings
- frontend integration: `FRONTEND_URL`, `TRUST_PROXY_HOPS`
- email: `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- media: `CLOUDINARY_NAME`, `CLOUDINARY_API`, `CLOUDINARY_SECRET`
- payments:
  - `STRIPE_SECRET_KEY`
  - `PAYSTACK_SECRET_KEY`
  - `FLUTTERWAVE_SECRET_KEY`
  - redirect and retry/verification settings
- cache: `REDIS_URL`, `REDIS_ENABLED`, `REDIS_REQUIRED`
- seeding: `SEED_PRODUCT_OWNER_EMAIL`, `SEED_PRODUCT_COUNT`

Important production settings for split frontend/backend deployments:

- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=none`
- `FRONTEND_URL=https://your-frontend-domain`

`FRONTEND_URL` can also contain:

- multiple comma-separated origins
- wildcard preview origins such as `https://market-place-*.vercel.app`

## Deployment Paths

### Recommended: split deployment

Deploy the backend and frontend independently:

- backend as a Node web service
- frontend as a static site

This repo already includes:

- [`render.yaml`](./render.yaml) for split Render deployment
- [`Frontend/vercel.json`](./Frontend/vercel.json) for SPA rewrites on Vercel

Why split deployment:

- frontend-only changes do not rebuild the backend
- backend-only changes do not rebuild the frontend
- each service can scale and fail independently

### Bundled container path

The root [`Dockerfile`](./Dockerfile) builds a single image that bundles:

- MongoDB
- Redis
- the Express backend
- the built frontend
- Nginx

This is useful for simplified self-hosted or demo-style deployments, but the split architecture is cleaner for production.

For split deployments, wire the apps like this:

- frontend `VITE_API_BASE_URL` -> backend origin
- backend `FRONTEND_URL` -> frontend origin

## Scripts and Utilities

Backend:

- `npm start`
- `npm run dev`
- `npm test`
- `npm run seed:products`

Frontend:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Tests

Backend tests use Node's built-in test runner and currently cover business-critical areas such as:

- cart item merging
- abandoned cart detection
- promotion resolution
- order/payment state synchronization
- payment helper logic
- frontend origin validation

Run them with:

```bash
cd Backend
npm test
```

## Project Summary

This project is a modern marketplace platform with:

- a React storefront and admin experience
- an Express commerce API
- MongoDB persistence
- optional Redis caching
- multi-provider payment support
- image uploads, email workflows, promotions, analytics, and deployment tooling

It is already structured like a real production app: split by frontend/backend concerns, layered internally on the server, and ready for local containerized development or separate cloud deployment.
