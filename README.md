# Matic — E-Commerce Backend (EWA408510 Final Project)

A modern, production-style **E-Commerce REST API** for a Rwandan online business.
Customers can browse products, manage a shopping cart, check out, and pay; admins
manage the catalog and view a sales analytics dashboard.

> **Stack:** Node.js · TypeScript · Express · Prisma ORM · PostgreSQL · JWT · Swagger (OpenAPI) · Docker · GitHub Actions CI/CD

---

## ✨ Features

### Core requirements
| Area | What's implemented |
|------|--------------------|
| **Product management** | Listing, details, categories, search, price filters, sorting, pagination |
| **Shopping cart** | Add / update / remove items, live totals, stock validation |
| **Checkout** | Customer details, order summary, atomic order creation, confirmation |
| **Database** | PostgreSQL via Prisma — products, customers, orders, payments |
| **Auth & roles** | JWT access/refresh tokens, bcrypt hashing, `CUSTOMER` / `ADMIN` RBAC |
| **API docs** | Interactive Swagger UI at `/docs` |
| **Containerization** | Multi-stage `Dockerfile` + `docker-compose` (API + Postgres) |
| **CI/CD** | GitHub Actions: install → migrate → build → test → docker build → deploy |

### 🚀 Innovation features (bonus)
- **Payments** — Mobile Money (MTN MoMo) + Stripe card + Cash-on-Delivery, behind a
  gateway abstraction with a built-in **mock gateway** so the full flow works without external accounts.
- **AI-style recommendation engine** — "customers also viewed" (collaborative),
  "related products" (content-based), "trending now" (popularity), and a personalized
  "for you" feed — all explainable, no external ML service required.
- **Analytics dashboard** (admin) — revenue, orders, customers, average order value,
  orders-by-status, payments-by-method, low-stock alerts, daily sales time series, best-sellers.
- **Advanced security** — Helmet, CORS allow-list, global rate limiting, input
  validation with Zod, soft-deletes to protect order history.

---

## 🏗️ Architecture

```
Client ──HTTP──> Express App
                  ├── Security middleware (helmet, cors, rate-limit)
                  ├── Routes (/api/v1/...)
                  │     └── Module = routes → controller → service → Prisma
                  ├── Swagger UI (/docs)
                  └── Central error handler
                          │
                          ▼
                    Prisma Client ──> PostgreSQL
```

Each domain lives in `src/modules/<name>/` with a clear separation:
`*.routes.ts` (HTTP + Swagger docs) → `*.controller.ts` (request/response) →
`*.service.ts` (business logic + Prisma) → `*.validation.ts` (Zod schemas).

---

## 📦 Project structure

```
.
├── prisma/
│   ├── schema.prisma        # Database models
│   └── seed.ts              # Demo data (admin, customer, categories, products)
├── src/
│   ├── config/              # env + swagger config
│   ├── lib/                 # Prisma client singleton
│   ├── middleware/          # auth, validation, error handling
│   ├── utils/               # jwt, password, slug, ApiError, asyncHandler
│   ├── modules/
│   │   ├── auth/            # register, login, refresh, profile
│   │   ├── categories/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/         # checkout + order management
│   │   ├── payments/       # payment gateway abstraction
│   │   ├── recommendations/# AI-style engine
│   │   └── analytics/      # admin dashboard
│   ├── routes/             # route aggregator
│   ├── app.ts              # Express app factory
│   └── server.ts           # bootstrap + graceful shutdown
├── tests/                   # Jest + Supertest smoke tests
├── .github/workflows/ci.yml # CI/CD pipeline
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## 🚀 Getting started

### Option A — Docker (recommended, one command)

```bash
cp .env.example .env          # optional; compose has sensible defaults
docker compose up --build      # starts Postgres + API, runs migrations
docker compose exec api npm run db:seed   # load demo data
```

- API:     http://localhost:4000
- Swagger:  http://localhost:4000/docs

### Option B — Local development

Requires Node.js 20+ and a running PostgreSQL.

```bash
npm install
cp .env.example .env           # then edit DATABASE_URL to point at your Postgres
npm run prisma:generate
npm run prisma:migrate         # creates tables (dev migration)
npm run db:seed                # load demo data
npm run dev                    # start with hot reload
```

---

## 🔑 Demo accounts (created by the seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@matic.rw` | `Admin@12345` |
| Customer | `customer@matic.rw` | `Customer@123` |

In Swagger UI, click **Authorize** and paste the `accessToken` returned by `/auth/login`.

---

## 🧭 API overview (base path `/api/v1`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | public | Register a customer |
| POST | `/auth/login` | public | Login → tokens |
| POST | `/auth/refresh` | public | Refresh access token |
| GET  | `/auth/me` | auth | Current profile |
| GET  | `/categories` | public | List categories |
| POST/PUT/DELETE | `/categories/...` | admin | Manage categories |
| GET  | `/products` | public | Search / filter / paginate |
| GET  | `/products/:id` | public | Product details (tracks view) |
| POST/PUT/DELETE | `/products/...` | admin | Manage products |
| GET  | `/cart` | auth | View cart with totals |
| POST | `/cart/items` | auth | Add item |
| PUT/DELETE | `/cart/items/:productId` | auth | Update / remove item |
| POST | `/orders/checkout` | auth | Place an order |
| GET  | `/orders/my` | auth | My orders |
| GET  | `/orders` | admin | All orders |
| PATCH| `/orders/:id/status` | admin | Update status |
| GET  | `/recommendations/trending` | public | Trending products |
| GET  | `/recommendations/also-viewed/:id` | public | Collaborative recs |
| GET  | `/recommendations/for-you` | auth | Personalized feed |
| GET  | `/analytics/dashboard` | admin | KPIs |
| GET  | `/analytics/sales` | admin | Daily sales series |
| GET  | `/analytics/top-products` | admin | Best-sellers |

Full request/response schemas live in **Swagger** at `/docs`.

---

## 🧪 Testing

```bash
npm test
```

Smoke tests (Jest + Supertest) cover routing, the validation layer, and the error envelope.

---

## 🔄 CI/CD pipeline

On every push / PR to `main`, **GitHub Actions** (`.github/workflows/ci.yml`):
1. Spins up a PostgreSQL service container.
2. Installs dependencies (`npm ci`).
3. Generates the Prisma client and applies migrations.
4. Builds the TypeScript and runs tests.
5. Builds the Docker image.
6. On push to `main`, triggers deployment via the `RENDER_DEPLOY_HOOK` secret (skipped if unset).

---

## ☁️ Deployment notes

Deploy anywhere that runs Docker or Node + Postgres (Render, Railway, Fly.io, a VPS):
1. Provision a PostgreSQL database; set `DATABASE_URL`.
2. Set the JWT secrets and admin variables.
3. Run `npx prisma migrate deploy` then `npm run db:seed` once.
4. Start with `npm start` (or use the Docker image).

---

## 🧱 Database models (Prisma)

`User`, `Category`, `Product`, `Cart`, `CartItem`, `Order`, `OrderItem`,
`Payment`, `ProductView` — see [`prisma/schema.prisma`](prisma/schema.prisma).

---

## 📄 License

MIT — built for the EWA408510 E-Commerce & Web Application final project.
# ecommerce-backend
