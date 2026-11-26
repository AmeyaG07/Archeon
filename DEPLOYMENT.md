# ArcheOn Design Studio — Production Deployment Guide

## 1. Quick Start with Docker Compose

Deploy the full stack (PostgreSQL 16, Spring Boot Backend, and Next.js 16 Standalone Frontend) in one command.

### Prerequisites
- Docker Engine 24.0+ and Docker Compose v2.20+
- Ports `3000` (Frontend), `8080` (Backend API), and `5432` (PostgreSQL) available (or terminated behind a reverse proxy such as Nginx / Caddy / Cloudflare)

### Step 1: Configure Production Environment
```bash
cp .env.production.example .env
```
Update `.env` with strong production values before starting:
- `POSTGRES_PASSWORD` & `SPRING_DATASOURCE_PASSWORD`
- `APP_JWT_SECRET` (Base64-encoded 256-bit HMAC key)
- `APP_ENCRYPTION_SECRET` (Base64-encoded AES key)
- `APP_CORS_ALLOWED_ORIGINS` (comma-separated origins, e.g. `https://archeonstudio.com,https://www.archeonstudio.com`)
- `APP_PORTAL_BASE_URL` (e.g. `https://archeonstudio.com`)

### Step 2: Build and Start Containers
```bash
docker compose up --build -d
```

### Step 3: Verify Container Health
```bash
docker compose ps
```
All three services should report `Up` / `healthy`:
- `archeon-postgres` (PostgreSQL 16 on port `5432`)
- `archeon-backend` (Spring Boot API on port `8080`)
- `archeon-frontend` (Next.js standalone server on port `3000`)

---

## 2. Container Registry & Releases (GitHub Actions)

Tagged releases (`v*.*.*`) automatically trigger [.github/workflows/release.yml](./.github/workflows/release.yml) to:
1. Build and push `ghcr.io/<owner>/archeon-backend:<tag>` and `ghcr.io/<owner>/archeon-frontend:<tag>`
2. Publish a GitHub Release with auto-generated release notes

To cut a release:
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 3. Manual Host Deployment (Bare Metal / VM)

### Backend (Spring Boot / Java 21)
```bash
cd backend
mvn clean package -DskipTests -B
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Frontend (Next.js 16 Standalone)
Run from the repository root (not `./frontend`):
```bash
npm ci
npm run build
npm run start
```
Set `INTERNAL_BACKEND_URL` (for example `http://127.0.0.1:8080`) so Next.js `/api/*` rewrites reach the Spring Boot backend.
