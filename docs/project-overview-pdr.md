# Joyhomes CRM - Project Overview

## Summary

Full-stack CRM system for Joyhomes real estate company covering:
- Customer management (CRM)
- Inventory management (Bảng hàng)
- Sales & Booking tracking
- Real-time chat
- Financial reporting
- Task management
- AI-powered recommendations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| Auth | Better Auth |
| State | TanStack Query + Zustand |
| Real-time | Socket.io |

## Project Structure

```
joyhomes-crm/
├── prisma/
│   ├── schema.prisma
│   └── database-seed-script.ts
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, register, forgot-password
│   │   ├── (dashboard)/      # Protected dashboard pages
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── auth/             # Auth-related components
│   │   ├── customers/        # Customer management
│   │   ├── inventory/        # Property inventory
│   │   ├── bookings/         # Booking management
│   │   ├── tasks/            # Task management
│   │   ├── events/           # Event management
│   │   └── layouts/          # Layout components
│   ├── lib/
│   │   ├── auth.ts           # Better Auth config
│   │   ├── auth-client.ts    # Client-side auth
│   │   ├── db.ts             # Prisma client
│   │   └── validators/       # Zod schemas
│   ├── services/             # Business logic
│   └── hooks/                # Custom hooks
└── public/
```

## Current Status

### Completed Phases
- [x] Phase 01: Project Setup
- [x] Phase 02: Database Design
- [x] Phase 03: Authentication & Authorization
- [x] Phase 04: CRM Module
- [x] Phase 05: Inventory Module
- [x] Phase 06: Sales & Booking
- [x] Phase 07: Chat System
- [x] Phase 08: Reporting Dashboard
- [x] Phase 09: Task Management
- [x] Phase 10: AI & Automation

### Recent Updates (2026-02-08)
- Security hardening: 16 vulnerabilities fixed (IDOR, CSRF, rate limiting, file upload)
- Code quality: ownership checks, role-scoped queries, permission helpers
- Inventory management: property CRUD, filtering, bulk import, project CRUD
- Dashboard UI: enhanced charts, KPI cards, sidebar navigation, CSS refinements

### Previous Fixes (2026-02-07)
- Login authentication (scrypt hash format)
- Customers API validation
- Settings page
- Avatar image
- Events/Tasks creation pages
- Task status enum mismatch

## Running the Project

```bash
cd joyhomes-crm
npm install
npm run db:seed    # Seed demo data
npm run dev        # Start dev server at http://localhost:3000
```

## Key Features

1. **Authentication**: Better Auth with RBAC (6 roles)
2. **Customer Management**: Full CRM with contacts, notes, reminders
3. **Inventory**: Property listings with status tracking
4. **Bookings**: Sales workflow with deposit tracking
5. **Chat**: Real-time messaging between users
6. **Reports**: Dashboard with charts and analytics
7. **Tasks**: Assignment and deadline management
8. **Events**: Event scheduling with attendee tracking
