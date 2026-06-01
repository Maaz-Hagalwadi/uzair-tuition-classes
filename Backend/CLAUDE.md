# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run

# Run tests
mvn test

# Run a single test class
mvn test -Dtest=UserServiceTest

# Skip tests during build
mvn clean install -DskipTests
```

Local dev requires PostgreSQL and Redis running. Use Docker Compose:

```bash
docker-compose up -d postgres redis
```

## Architecture

Java 21 + Spring Boot 3 backend for **Uzair Tuition Classes LMS** — a coaching institute management platform with Student, Teacher, and Admin portals plus a public landing page.

**Infrastructure:** PostgreSQL (primary DB via Spring Data JPA + Flyway) · Redis (token store, blacklist, cache, rate limiting) · AWS S3 (all file storage — never PostgreSQL BLOBs)

**Package layout** — domain-per-package under `com.uzairtuition`:

```
auth/           JWT issuance, refresh, logout
user/           User CRUD, profile management
lead/           Callback form submissions, lead status tracking
course/         Course + CourseMaterial (S3 URLs)
batch/          Batch + BatchStudent join
classsession/   Class sessions with meeting links (Meet/Zoom/Teams)
quiz/           Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer
announcement/   Announcements published by Admin/Teacher
payment/        Offline payment tracking (Pending / Paid)
common/         Shared DTOs, base entities
config/         Spring beans, S3 client, Redis config
security/       JWT filter, SecurityConfig, UserDetailsService
exception/      Global exception handler (@ControllerAdvice)
util/           Helpers (date, string, etc.)
```

## Authentication & Authorization

- **Access token**: short-lived JWT in `Authorization: Bearer <token>` header
- **Refresh token**: stored in Redis; used at `/auth/refresh` to issue new access tokens
- **Logout**: adds JWT to Redis blacklist (checked on every request)
- **Roles**: `ADMIN`, `TEACHER`, `STUDENT` — enforced via Spring Security method/URL rules
- **Passwords**: BCrypt hashing only

## Database

Flyway migrations live in `src/main/resources/db/migration/`. Naming convention:

```
V1__create_users.sql
V2__create_roles.sql
V3__create_courses.sql
...
```

Key table groups:
- **Auth**: `users`, `roles`, `user_roles`, `refresh_tokens`
- **Content**: `courses`, `course_materials`, `batches`, `batch_students`, `class_sessions`
- **Quiz**: `quizzes`, `quiz_questions`, `quiz_options`, `quiz_attempts`, `quiz_answers`
- **Ops**: `leads`, `announcements`, `payments`

## Key Constraints

- **Never store files in PostgreSQL.** All PDFs, notes, images, and thumbnails go to AWS S3; store only the S3 URL in the DB.
- **Redis is required** for refresh tokens and JWT blacklisting — the auth flow will not work without it.
- API response time target: < 500ms; add Redis caching for frequently read data (course lists, batch details).
- Roles are seeded via Flyway, not created at runtime.
