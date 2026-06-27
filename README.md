# CreativeFlow AI

> Enterprise Creative Operations Platform — AI-powered request management, role-based workflows, and team collaboration.

![Stack](https://img.shields.io/badge/backend-NestJS%2010-red?logo=nestjs)
![Stack](https://img.shields.io/badge/frontend-Next.js%2015-black?logo=next.js)
![Stack](https://img.shields.io/badge/database-PostgreSQL-blue?logo=postgresql)
![Stack](https://img.shields.io/badge/AI-Gemini%201.5-orange?logo=google)
![License](https://img.shields.io/badge/license-UNLICENSED-gray)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Roles & Permissions](#roles--permissions)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone & Install](#1-clone--install)
  - [2. Configure Environment](#2-configure-environment)
  - [3. Database Setup](#3-database-setup)
  - [4. Seed Demo Data](#4-seed-demo-data)
  - [5. Run the Apps](#5-run-the-apps)
- [API Reference](#api-reference)
- [Frontend Pages](#frontend-pages)
- [AI Features](#ai-features)
- [Demo Credentials](#demo-credentials)

---

## Overview

CreativeFlow AI is a full-stack platform that streamlines creative operations inside a company. Teams submit **creative requests** (banners, social media posts, videos, email campaigns, etc.), which are enriched by AI, assigned to designers, tracked through a multi-stage workflow, and delivered with asset versioning and review.

**Key capabilities:**

- Role-based access control across 5 distinct roles
- AI-powered request enrichment via Google Gemini (summary, acceptance criteria, type/priority classification)
- Multi-stage request lifecycle with audit-logged status transitions
- Asset upload, versioning, and review workflow
- Real-time comment threads with mentions
- Organisation-scoped multi-tenancy
- JWT authentication with silent refresh-token rotation

---

## Architecture

```
creativeflow-ai/
├── apps/
│   ├── api/      ← NestJS REST API  (port 4000)
│   └── web/      ← Next.js 15 frontend (port 3000)
```

```
Browser → Next.js (3000) → NestJS API (4000) → PostgreSQL
                                              → Redis (sessions / cache)
                                              → Google Gemini (AI)
                                              → Local disk / GCS (assets)
```

---

## Tech Stack

### Backend (`apps/api`)

| Layer | Technology |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL 15+ |
| Cache / Queue | Redis 7 |
| Auth | JWT (access + refresh) via Passport |
| AI | Google Gemini 1.5 Flash |
| Validation | class-validator + class-transformer |
| Docs | Swagger / OpenAPI (auto-generated) |
| Rate limiting | @nestjs/throttler |
| Security | Helmet, CORS |
| Logging | Winston + nest-winston |

### Frontend (`apps/web`)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + custom design tokens |
| UI Components | Radix UI primitives (shadcn/ui pattern) |
| State | Zustand (auth store, persisted) |
| Data Fetching | TanStack React Query v5 |
| HTTP Client | Axios (with interceptors + token refresh) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Notifications | Sonner |

---

## Roles & Permissions

| Role | Description | Key Capabilities |
|---|---|---|
| `SUPER_ADMIN` | Platform-level admin | Full access to all orgs |
| `ORG_ADMIN` | Organisation admin | Manage users, projects, all requests |
| `CREATIVE_MANAGER` | Creative team lead | Manage projects, assign designers, review requests |
| `DESIGNER` | Creative professional | View projects, work on assigned requests, upload assets |
| `REQUESTER` | Business stakeholder | Create and track their own requests |

Navigation and UI actions are **dynamically gated** per role — sections unavailable to a role are hidden entirely.

---

## Project Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma        # Database models & enums
│   └── seed.ts              # Demo data seeder
├── src/
│   ├── common/              # Guards, decorators, interceptors, filters
│   │   ├── decorators/      # @CurrentUser, @Roles, @Public
│   │   ├── guards/          # JwtAuthGuard, RolesGuard
│   │   └── filters/        # GlobalExceptionFilter
│   ├── config/              # App config + env validation
│   ├── prisma/              # PrismaService & PrismaModule
│   └── modules/
│       ├── auth/            # Register, login, refresh, logout
│       ├── users/           # User CRUD, org member management
│       ├── organizations/   # Org settings
│       ├── projects/        # Project CRUD
│       ├── requests/        # Creative request lifecycle + transitions
│       ├── comments/        # Threaded comments with mentions
│       ├── assets/          # Asset upload, versioning, review
│       ├── workflows/       # Workflow templates
│       ├── ai/              # Gemini enrichment, content generation, asset tagging
│       ├── storage/         # Local / GCS storage abstraction
│       └── health/          # Health check endpoint

apps/web/
├── src/
│   ├── app/
│   │   ├── login/           # Sign-in page (split hero layout)
│   │   ├── register/        # Sign-up page (creates org + admin)
│   │   └── dashboard/
│   │       ├── layout.tsx   # AuthGuard + Sidebar + Topbar shell
│   │       ├── page.tsx     # Overview — stats, recent requests
│   │       ├── requests/    # Request list, new request form, detail view
│   │       ├── projects/    # Project grid + create modal
│   │       ├── team/        # Team member table + invite modal
│   │       └── settings/    # Profile, org info, permissions matrix
│   ├── components/
│   │   ├── sidebar.tsx      # Role-filtered nav, glass panel
│   │   ├── topbar.tsx       # Breadcrumb, role chip, user dropdown
│   │   ├── auth-guard.tsx   # Client-side route protection
│   │   ├── providers.tsx    # React Query + Toaster
│   │   └── ui/              # Radix-based primitives (Button, Card, Input…)
│   ├── lib/
│   │   ├── api.ts           # Axios instance + token refresh interceptor
│   │   ├── types.ts         # TypeScript types mirroring API shapes
│   │   └── labels.ts        # Display labels, colour maps, formatters
│   └── store/
│       └── auth.ts          # Zustand auth store (persisted to localStorage)
```

---

## Prerequisites

Make sure these are installed and running before you start:

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ | Use [nvm](https://github.com/nvm-sh/nvm) |
| npm | 10+ | Comes with Node 20 |
| PostgreSQL | 15+ | Must be running locally |
| Redis | 7+ | Must be running locally |
| Google Gemini API key | — | Optional — falls back to heuristics without it |

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Jino-X/creativeflow-ai.git
cd creativeflow-ai

# Install API dependencies
cd apps/api && npm install

# Install frontend dependencies
cd ../web && npm install
```

### 2. Configure Environment

**Backend** — copy and edit:

```bash
cd apps/api
cp .env.example .env
```

Open `apps/api/.env` and fill in your values:

```env
# Database — must match your local PostgreSQL setup
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/creativeflow?schema=public"

# Redis
REDIS_URL=redis://localhost:6379

# JWT secrets — change these to long random strings in production
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Optional — Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

**Frontend** — create `apps/web/.env`:

```bash
cd apps/web
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1" > .env
```

### 3. Database Setup

```bash
cd apps/api

# Create the database (if it doesn't exist yet)
createdb creativeflow

# Run all migrations
npm run prisma:migrate
```

### 4. Seed Demo Data

This creates a demo organisation with 5 users (one per role), 2 projects, and sample creative requests:

```bash
cd apps/api
npm run db:seed
```

### 5. Run the Apps

Open **two terminals**:

```bash
# Terminal 1 — API
cd apps/api
npm run start:dev
# → http://localhost:4000/api/v1
# → Swagger docs: http://localhost:4000/api/docs
```

```bash
# Terminal 2 — Frontend
cd apps/web
npm run dev
# → http://localhost:3000
```

---

## API Reference

Swagger UI is automatically served at:

```
http://localhost:4000/api/docs
```

### Core Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create org + admin user |
| POST | `/auth/login` | Public | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh token | Rotate tokens |
| POST | `/auth/logout` | Bearer | Invalidate refresh token |
| GET | `/users` | Admin / Manager | List org members |
| POST | `/users` | Admin | Invite a new user |
| GET | `/projects` | All roles | List projects in org |
| POST | `/projects` | Admin / Manager | Create project |
| GET | `/requests` | All roles | List requests (filterable) |
| POST | `/requests` | All roles | Create a new request |
| GET | `/requests/:id` | All roles | Get request detail |
| PATCH | `/requests/:id` | All roles | Update request fields |
| POST | `/requests/:id/transition` | All roles | Move request to new status |
| POST | `/ai/requests/:id/enrich` | All roles | AI-enrich request (Gemini) |
| GET | `/ai/status` | Public | Check AI engine status |
| POST | `/ai/generate` | All roles | Free-form AI content generation |
| GET | `/health` | Public | Health check |

### Request Status Flow

```
DRAFT → SUBMITTED → ASSIGNED → IN_PROGRESS → REVIEW → APPROVED → COMPLETED
                                                     ↓
                                           CHANGES_REQUESTED → IN_PROGRESS
                                                     ↓
                                                CANCELLED
```

---

## Frontend Pages

| Route | Page | Role Access |
|---|---|---|
| `/login` | Sign-in | Public |
| `/register` | Create workspace | Public |
| `/dashboard` | Overview + stats | All |
| `/dashboard/requests` | Request list with filters | All |
| `/dashboard/requests/new` | New request form | All |
| `/dashboard/requests/:id` | Request detail, comments, assets, AI | All |
| `/dashboard/projects` | Project grid | Admin, Manager, Designer |
| `/dashboard/team` | Team member management | Admin, Manager |
| `/dashboard/settings` | Profile + permissions matrix | All |

---

## AI Features

CreativeFlow AI integrates **Google Gemini 1.5 Flash** for:

| Feature | Endpoint | Description |
|---|---|---|
| **Request Enrichment** | `POST /ai/requests/:id/enrich` | Generates a plain-language summary, acceptance criteria, and classifies type + priority with a confidence score |
| **Content Generation** | `POST /ai/generate` | Free-form prompt → generated creative copy |
| **Asset Tagging** | `POST /ai/assets/:id/tag` | Auto-tags uploaded assets with descriptive labels |

If `GEMINI_API_KEY` is not set, all AI endpoints fall back to **heuristic mode** — they still return valid responses based on keyword analysis, so the app is fully functional without an API key.

---

## Demo Credentials

After running the seed script (`npm run db:seed`), log in with:

| Email | Password | Role |
|---|---|---|
| `admin@acme.test` | `Password123!` | Org Admin |
| `manager@acme.test` | `Password123!` | Creative Manager |
| `designer@acme.test` | `Password123!` | Designer |
| `requester@acme.test` | `Password123!` | Requester |

> All demo users belong to the **Acme Corp** organisation.

---

## Available Scripts

### Backend (`apps/api`)

```bash
npm run start:dev       # Development with hot reload
npm run build           # Compile TypeScript → dist/
npm run start:prod      # Run compiled build
npm run test            # Unit tests (Jest)
npm run test:e2e        # End-to-end tests
npm run test:cov        # Coverage report
npm run prisma:migrate  # Run pending migrations
npm run prisma:studio   # Open Prisma Studio (DB GUI)
npm run db:seed         # Seed demo data
```

### Frontend (`apps/web`)

```bash
npm run dev             # Development server (port 3000)
npm run build           # Production build
npm run start           # Serve production build
npm run typecheck       # TypeScript check (no emit)
npm run lint            # ESLint
```

---

## License

Private / Unlicensed. All rights reserved.
