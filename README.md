# Uzair Tuition Classes - Learning Management System (LMS)

## 🚀 Overview

Uzair Tuition Classes LMS is a production-ready coaching institute management platform designed to manage students, teachers, courses, batches, quizzes, class schedules, and leads.

The platform consists of:

- Public Landing Website
- Student Portal
- Teacher Portal
- Admin Portal

The goal is to provide a complete digital platform for coaching institutes while maintaining a scalable architecture that can grow from 100 students to thousands of users.

---

# 🎯 Business Flow

```text
Visitor
   |
   v
Landing Page
   |
   v
Submit Callback Request
   |
   v
Lead Stored In Database
   |
   v
Admin Reviews Lead
   |
   v
Admin Calls Student
   |
   v
Offline Payment (MVP)
   |
   v
Admin Creates Student Account
   |
   v
Student Receives Credentials
   |
   v
Student Login
   |
   v
Courses / Classes / Quizzes / Notes
```

---

# 👥 User Roles

## Public User

No authentication required.

### Features

- View Landing Page
- View Available Courses
- View Upcoming Batches
- Submit Callback Request
- View Contact Details
- View Testimonials

---

## Student

### Dashboard

- View enrolled courses
- View upcoming classes
- View announcements
- View recent quiz scores
- View learning progress

### Courses

- Access course details
- View learning materials
- Download notes
- Access class links

### Quizzes

- Attempt quizzes
- View scores
- View quiz history

### Profile

- Update profile
- Change password

---

## Teacher

### Dashboard

- View assigned courses
- View assigned batches
- Student overview

### Course Management

- Upload notes
- Manage learning materials

### Class Management

- Create class sessions
- Add meeting links
- Update schedules

### Quiz Management

- Create quizzes
- Create questions
- Publish quizzes
- View student results

### Announcements

- Publish announcements

---

## Admin

### Dashboard

- Total Students
- Total Teachers
- Total Courses
- Total Batches
- Total Leads

### Lead Management

- View inquiries
- Update lead status
- Track conversions

### User Management

- Create students
- Create teachers
- Manage users

### Course Management

- Create courses
- Update courses
- Archive courses

### Batch Management

- Create batches
- Assign teachers
- Assign students

### Payment Management

- Track offline payments
- Update payment status

### Platform Management

- Manage announcements
- Manage homepage content

---

# 🌐 Landing Page Features

## Home

- Hero Section
- About Us
- Why Choose Us
- Testimonials
- Contact Section

## Courses

Display all active courses.

Examples:

- Java Full Stack
- Spring Boot
- React Development
- DSA
- System Design

## Upcoming Batches

Display:

- Batch Name
- Start Date
- Duration
- Timing
- Faculty

## Callback Form

Fields:

- Name
- Email
- Phone
- Course Interested
- Message

---

# 📚 Course Management

## Course

Fields:

- Title
- Description
- Duration
- Thumbnail
- Status

## Learning Materials

- PDFs
- PPTs
- Notes
- Reference Documents

Stored in AWS S3.

---

# 🎓 Batch Management

Fields:

- Batch Name
- Course
- Teacher
- Start Date
- End Date
- Timings
- Status

---

# 📅 Class Session Management

Teacher/Admin can create class sessions.

Example:

- Java Collections
- Date & Time
- Google Meet Link

Students can join classes using provided links.

Supported Links:

- Google Meet
- Zoom
- Microsoft Teams

---

# 📝 Quiz System

## Quiz Features

### Teacher

Can:

- Create Quiz
- Add Questions
- Publish Quiz
- View Results

### Student

Can:

- Attempt Quiz
- Submit Quiz
- View Score

### Question Types

#### Single Choice (MCQ)

Example:

Which language runs on JVM?

- Java
- Python
- JavaScript
- Go

#### Multiple Choice

Select Spring Modules:

- Spring MVC
- Spring Security
- Hibernate
- React

#### True / False

Redis is a relational database.

---

# 📢 Announcement System

Admin and Teachers can publish announcements.

Examples:

- Tomorrow's class moved to 8 PM.
- Quiz scheduled on Saturday.

Students see announcements on dashboard.

---

# 💳 Payment Module (MVP)

Initial version uses manual payment tracking.

Payment Status:

- Pending
- Paid

Future:

- Razorpay Integration
- Online Payments
- Invoices

---

# 🔐 Authentication & Authorization

## Authentication

- JWT Access Token
- Refresh Token

## Authorization

Role Based Access Control (RBAC)

Roles:

- ADMIN
- TEACHER
- STUDENT

---

# 🛠 Tech Stack

## Frontend

### Core

- React 19
- TypeScript

### UI

- Tailwind CSS
- Shadcn UI

### Routing

- React Router

### API

- Axios
- TanStack Query

### State Management

- Zustand

---

## Backend

### Core

- Java 21
- Spring Boot 3

### Modules

- Spring Web
- Spring Security
- Spring Data JPA
- Spring Validation
- Spring Actuator

---

## Database

- PostgreSQL

### Migration Tool

- Flyway

Migration Naming:

```text
V1__create_users.sql
V2__create_roles.sql
V3__create_courses.sql
V4__create_batches.sql
V5__create_quizzes.sql
```

---

## Cache

- Redis

### Redis Use Cases

- Refresh Tokens
- JWT Blacklisting
- Frequently Used Data
- Rate Limiting

---

## Storage

### AWS S3

Used For:

- Notes
- PDFs
- Images
- Course Thumbnails

Do NOT store files inside PostgreSQL.

---

## Containerization

- Docker
- Docker Compose

Services:

- Frontend
- Backend
- PostgreSQL
- Redis

---

# ☁️ AWS Infrastructure

## Frontend

- S3 Static Hosting
- CloudFront CDN

## Backend

- AWS ECS (Preferred)

Alternative:

- AWS EC2

## Database

- AWS RDS PostgreSQL

## Cache

- AWS ElastiCache Redis

## Storage

- AWS S3

---

# 🏗 System Architecture

```text
                    Users
                      |
                      v
                React Frontend
                      |
                      v
              Spring Boot API
                      |
      --------------------------------
      |                              |
      v                              v
 PostgreSQL                      Redis
      |
      v
    Flyway

                      |
                      v
                    AWS S3
```

---

# 🗃 Database Tables

## Authentication

- users
- roles
- user_roles
- refresh_tokens

## Leads

- leads

## Courses

- courses
- course_materials

## Batches

- batches
- batch_students

## Classes

- class_sessions

## Quiz

- quizzes
- quiz_questions
- quiz_options
- quiz_attempts
- quiz_answers

## Announcements

- announcements

## Payments

- payments

---

# 📂 Backend Structure

```text
src/main/java/com/uzairtuition

├── auth
├── user
├── lead
├── course
├── batch
├── classsession
├── quiz
├── announcement
├── payment
├── common
├── config
├── security
├── exception
└── util
```

---

# 📂 Frontend Structure

```text
src

├── pages
├── layouts
├── routes
├── components
├── features
├── hooks
├── services
├── store
├── utils
├── types
└── assets
```

---

# 🔒 Security

## Password Security

- BCrypt Password Hashing

## API Security

- JWT Authentication
- Role-Based Authorization
- Request Validation
- Rate Limiting

## Infrastructure Security

- HTTPS
- Secure Headers
- CORS Configuration
- Environment Variables

---

# 📈 Non-Functional Requirements

## Performance

- API Response Time < 500ms
- Redis Caching
- Proper Database Indexing

## Scalability

- Support 100+ active students initially
- Easy horizontal scaling

## Maintainability

- Modular Architecture
- Clean Code
- SOLID Principles

## Availability

- Target 99% uptime

---

# 🚀 MVP Scope

## Included

✅ Landing Page

✅ Callback Form

✅ Lead Management

✅ Authentication

✅ Student Portal

✅ Teacher Portal

✅ Admin Portal

✅ Course Management

✅ Batch Management

✅ Class Link Management

✅ Notes Upload

✅ Quiz System

✅ Announcements

✅ Dummy Payment Tracking

---

## Future Enhancements

- Attendance Management
- Assignment Management
- Online Exams
- Razorpay Integration
- Email Notifications
- WhatsApp Notifications
- Mobile App
- AI Quiz Generator
- AI Doubt Solver
- Parent Portal
- Analytics Dashboard

---

# 🎯 Initial Target

- 100 Active Students
- 10 Teachers
- Multiple Courses
- Multiple Batches
- Dockerized Deployment
- AWS Ready
- Production Grade Security

---

## Project Name

**Uzair Tuition Classes LMS**

A scalable Learning Management System built using React, Spring Boot, PostgreSQL, Redis, Flyway, Docker, and AWS.
