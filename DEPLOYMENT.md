# ARCHÉON Design Studio — Production Deployment Guide

## 1. Quick Start with Docker Compose

Deploy the complete ARCHÉON multi-container architecture (PostgreSQL 16, Spring Boot 3.4 Backend, and Next.js Frontend) in a single command.

### Prerequisites
- Docker Engine 24.0+ and Docker Compose v2.20+
- Port `3000` (Frontend), `8080` (Backend REST API), and `5432` (PostgreSQL) available.

### Step 1: Environment Setup
```bash
cp .env.production.example .env
# Edit .env with your production database credentials and JWT secret
```

### Step 2: Build and Run Containers
```bash
docker compose up --build -d
```

### Step 3: Verify Container Health
```bash
docker compose ps
```
All three containers should report `Up` and `healthy`:
- `archeon-postgres` (healthy on port 5432)
- `archeon-backend` (running on port 8080)
- `archeon-frontend` (running on port 3000)

### Step 4: Access the Applications
- **Public Showcase & Client/Vendor Portals:** `http://localhost:3000`
- **Admin Studio Management:** `http://localhost:3000/admin`
- **Backend Health Check & Swagger/API:** `http://localhost:8080/api/health`

---

## 2. Manual Host Deployment (Bare Metal / VM)

### Backend (Spring Boot 3.4 / Java 21)
```bash
cd backend
mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Frontend (Next.js 16)
```bash
cd frontend
npm ci
npm run build
npm run start
```
