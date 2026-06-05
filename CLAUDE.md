# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Uzair Tuition Classes LMS** — a coaching institute management platform with Student, Teacher, and Admin portals plus a public landing page.

## Commands

### Backend (Spring Boot — run from `Backend/`)

```bash
docker-compose up -d          # Start PostgreSQL (5433), Redis (6380), Mailpit (SMTP 1026, UI 8026)
mvn spring-boot:run           # Start API server on :8080
mvn clean install             # Full build
mvn clean install -DskipTests # Build without tests
mvn test                      # Run all tests
mvn test -Dtest=ClassName     # Run a single test class
```

### Frontend (React — run from `Frontend/`)

```bash
npm install
npm run dev     # Vite dev server on :5173 (proxies /api → http://localhost:8080)
npm run build   # TypeScript compile + Vite production build
npm run lint    # ESLint
npm run preview # Preview production build locally
```

## Architecture

```
Frontend (React 19 + Vite)  :5173
        ↓  /api proxy
Backend (Spring Boot 3)      :8080
        ├─→ PostgreSQL :5433   (primary data, Flyway-managed schema)
        ├─→ Redis      :6380   (JWT refresh tokens, blacklist, cache)
        ├─→ AWS S3             (all file storage — PDFs, images, thumbnails)
        └─→ Mailpit    :1026   (SMTP in dev; web UI at :8026)
```

### Backend

Java 21 + Spring Boot 3.3.5. See `Backend/CLAUDE.md` for the full package layout, auth flow, and database constraints.

Key points:
- Domain-per-package under `com.uzairtuition` (auth, user, course, batch, quiz, payment, etc.)
- JWT access tokens + Redis-backed refresh tokens; logout blacklists the JWT in Redis
- Flyway controls all schema changes — `spring.jpa.ddl-auto: none`
- Roles (`ADMIN`, `TEACHER`, `STUDENT`) are seeded by Flyway, never created at runtime
- All files go to S3; only the S3 URL is stored in PostgreSQL

### Frontend

React 19 + TypeScript, Vite, Tailwind CSS 4, TanStack Query v5, Zustand, React Router v7.

```
src/
  pages/        Student / Teacher / Admin portals + auth pages + LandingPage
  components/   landing/  (Hero, Navbar, FeaturedCourses, UpcomingBatches, …)
  App.tsx        Route definitions
  main.tsx       React entry point
```

State management split: TanStack Query for server state, Zustand for client/UI state. Axios used for all HTTP calls; the Vite dev proxy rewrites `/api/*` to `http://localhost:8080/*` so no CORS config is needed in development.

## Environment Variables

Backend reads these from the environment (defaults in `application.yml` are for Docker Compose dev setup):

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5433/uzair_lms` | PostgreSQL JDBC URL |
| `DB_USERNAME` | `utc` | DB user |
| `DB_PASSWORD` | `admin1234` | DB password |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6380` | Redis port |
| `JWT_SECRET` | *(required)* | HMAC secret for JWT signing |
| `AWS_*` | — | AWS credentials for S3 |

Mailpit is automatically used for dev email (SMTP on `localhost:1026`).
