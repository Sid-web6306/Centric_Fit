# Centric Fit

A multi-tenant SaaS platform for gym and fitness studio management — India-first, mobile-first, PWA-ready.

**Domain:** `centric.fit` | **Stack:** Next.js 16 + Supabase + Razorpay + MSG91

---

## Quick Start

```bash
# Requires pnpm (not npm or yarn)
pnpm install
cp .env.example .env.local   # Fill in required values
pnpm dev
```

See [`docs/ONBOARDING.md`](docs/ONBOARDING.md) for full setup instructions.

---

## Core Features

- **Multi-tenant authentication** — email OTP (via MSG91) + Google OAuth; each gym's data isolated via Supabase RLS
- **Member management** — CRUD, CSV bulk import, status tracking, payment history
- **Attendance tracking** — session-based check-in/check-out for members and staff
- **Analytics dashboard** — growth, revenue, retention, and activity charts
- **RBAC** — 4 roles: Owner, Manager, Trainer, Member with 17 granular permissions
- **Subscription billing** — 14-day free trial; Starter / Professional / Enterprise via Razorpay
- **Invitation system** — email delivery via MSG91 with token-based acceptance
- **Member portal** — PWA, mobile-first self-service view for members
- **Real-time sync** — Supabase Realtime for live attendance and data updates

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | TailwindCSS v4 + shadcn/ui + Radix UI |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Forms | React Hook Form + Zod |
| Database / Auth | Supabase (PostgreSQL 15, RLS, Realtime, Storage) |
| Payments | Razorpay (INR subscriptions + webhooks) |
| Email / SMS | MSG91 (templates + OTP) |
| Error monitoring | Sentry |
| Rate limiting | Upstash Redis |
| Analytics | PostHog + Vercel Analytics |
| Package manager | pnpm |
| Deployment | Vercel |

---

## Commands

```bash
pnpm dev              # Start development server (clears cache)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint
pnpm test             # Unit tests (vitest)
pnpm test:coverage    # Coverage report
pnpm e2e              # Playwright E2E tests
pnpm e2e:ui           # Playwright with interactive UI

pnpm db:push:dev      # Apply DB migrations to dev environment
pnpm db:push:prod     # Apply DB migrations to prod environment
pnpm types:supabase   # Regenerate TypeScript types from Supabase schema
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`architecture.md`](architecture.md) | Complete system architecture |
| [`docs/README.md`](docs/README.md) | Documentation index |
| [`docs/ONBOARDING.md`](docs/ONBOARDING.md) | Developer setup guide |
| [`docs/API.md`](docs/API.md) | API route reference |
| [`docs/TECHNICAL_DEBT.md`](docs/TECHNICAL_DEBT.md) | Known issues and deferred work |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Product + engineering roadmap |
| [`docs/OPERATIONS.md`](docs/OPERATIONS.md) | Production operations runbook |
| [`.env.example`](.env.example) | All required environment variables |

---

## Two Environments

| | Dev | Prod |
|-|-----|------|
| Supabase Project ID | `sbwzxwludgylvpkurnsh` | `azrwcplkjgthawocfcwr` |
| Region | us-east-2 | ap-south-1 (Mumbai) |
| Vercel | Preview | Production |

---

## Build Status

- Build: passing
- TypeScript: passing (strict mode)
- Unit tests: 9/9 passing (vitest)
- Lint: passing (ESLint 9 + eslint-config-next@16)
