# ArcheOn Design Studio

Full-stack architectural studio showcase, client/vendor collaboration portal, and studio operations platform built with **Next.js 16**, **React 19**, **Three.js**, and **Spring Boot 3 (Java 21)**.

[![CI/CD Pipeline](https://github.com/AmeyaG07/Archeon/actions/workflows/ci.yml/badge.svg)](https://github.com/AmeyaG07/Archeon/actions/workflows/ci.yml)

---

## Overview

ArcheOn Design Studio provides four integrated experiences in a single unified platform:

1. **Public Architectural Showcase (`/`, `/preloader`)**
   - Opening studio emblem preloader (`/preloader` or first-visit session intro on `/`)
   - Scroll-optimized full-viewport architectural hero, expertise disciplines, interactive portfolio split-view modals, 3D Global Atelier globe (`Three.js`), and consultation lead capture (`POST /api/leads`)
2. **Studio Administration Portal (`/admin`)**
   - Operations overview, project lifecycle management (Planning → In Progress → On Hold → Completed, phases & milestones), client/vendor directories, invoice & approval workflows, cash settlements, revenue ledger, team RBAC, CMS website project & studio profile editor, and audit logs
3. **Client Portal (`/client`)**
   - Assigned project tracking, deliverables & document downloads (`/client/documents`), invoices & bills (`/client/invoices`), notifications (`/client/notifications`), support tickets, and profile settings
4. **Vendor Portal (`/vendor`)**
   - Assigned site/project tasks (`/vendor/projects`), invoice submission & tracking (`/vendor/invoices`), cash settlements, notifications (`/vendor/notifications`), support, and profile settings

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | Next.js 16 (App Router, Standalone Output), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Three.js / `@react-three/fiber`, Lenis |
| **Backend** | Spring Boot 3, Java 21, Spring Security (Stateless JWT + RBAC), Spring Data JPA, Flyway |
| **Database** | PostgreSQL 16 (Production) / H2 in PostgreSQL compatibility mode (Local Dev) |
| **Container & CI/CD** | Docker, Docker Compose, GitHub Actions (`ci.yml`, `release.yml`), GitHub Container Registry (`ghcr.io`) |

---

## Project Structure

```text
Archeon/
├── src/                        # Next.js 16 frontend application (App Router)
│   ├── app/                    # Public routes, /preloader, /login, /admin, /vendor, /client
│   ├── components/             # UI, 3D canvas, homepage sections, and portal workspaces
│   ├── config/                 # Studio portfolio & service configuration
│   ├── lib/                    # API client & helpers
│   └── providers/              # Auth, Audio, Motion, and Toast providers
├── public/                     # Static brand assets, 3D textures, and showcase media
├── backend/                    # Spring Boot 3 (Java 21) REST API & Flyway migrations
├── docs/reports/               # Historical QA, mobile acceptance, and audit reports
├── .github/workflows/          # CI validation and tagged Release/GHCR publishing
├── Dockerfile                  # Production standalone Next.js container
├── docker-compose.yml          # Full-stack PostgreSQL + Backend + Frontend orchestration
└── .env.production.example     # Production environment variable template
```

---

## Quick Start (Local Development)

### Prerequisites
- **Node.js 20+** and **npm**
- **Java 21 (JDK)** and **Maven 3.9+**

### 1. Start the Backend (Port `8080`)
```bash
mvn -f backend/pom.xml spring-boot:run
```
By default, local development uses an in-memory H2 database in PostgreSQL mode (`MODE=PostgreSQL`) with Flyway migrations and seeded demo accounts.

### 2. Start the Frontend (Port `3000`)
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Next.js automatically proxies `/api/*` requests to `INTERNAL_BACKEND_URL` (defaults to `http://localhost:8080`).

### Verification Commands
```bash
npx tsc --noEmit    # TypeScript static typecheck
npm run lint        # ESLint check
npm run build       # Production standalone Next.js build
```

---

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Docker Compose, GHCR container images, and bare-metal deployment instructions.

```bash
cp .env.production.example .env
# Populate strong secrets and your production domain in .env
docker compose up --build -d
```

---

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Docker Compose, environment variables, and host deployment
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Development workflow, code standards, and PR checks
- [SECURITY.md](./SECURITY.md) — Security architecture and vulnerability reporting
- [CHANGELOG.md](./CHANGELOG.md) — Release history and notable changes
- [docs/reports/](./docs/reports/) — Archived QA and mobile acceptance reports

---

## License

Licensed under the [MIT License](./LICENSE).
