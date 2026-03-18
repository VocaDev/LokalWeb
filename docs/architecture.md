# LokalWeb — Architecture Documentation

**Author:** Gentian Voca  
**Project:** LokalWeb — Multi-Tenant Website-as-a-Service (WaaS)  
**Stack:** Next.js 14 (App Router) · Supabase (PostgreSQL + Auth + Storage) · Vercel · TypeScript · Tailwind CSS · shadcn/ui

---

## 1. Overview

LokalWeb is a multi-tenant SaaS platform that allows small businesses in Kosovo to create and manage professional websites without any technical knowledge. The platform targets service-based businesses — barbershops, restaurants, clinics, and beauty salons.

Each registered business automatically receives:

- A fully functional public website at a unique subdomain (e.g. `barbershop.lokalweb.com`)
- A private dashboard to manage their profile, services, hours, gallery, and bookings
- An online booking system that customers can use directly from their public website

The architecture is designed around three core principles: **tenant isolation**, **separation of concerns**, and **scalability**.

---

## 2. Project Layers

The project is organized into four distinct layers. Each layer has a single, clearly defined responsibility and does not reach into the concerns of another layer.

---

### Layer 1 — Routing & Pages (`/app`)

**Responsibility:** Define the URL structure and render the correct page for each route.

This layer uses Next.js 14 App Router conventions. Every folder inside `/app` maps directly to a URL. This layer does not contain business logic or database queries — it composes components and delegates data operations to the data access layer.

| Route                              | Purpose                                               |
| ---------------------------------- | ----------------------------------------------------- |
| `/app/page.tsx`                    | Public landing page                                   |
| `/app/layout.tsx`                  | Root layout — fonts, providers                        |
| `/app/not-found.tsx`               | 404 fallback                                          |
| `/app/register/page.tsx`           | Multi-step business registration form                 |
| `/app/register/success/page.tsx`   | Post-registration confirmation screen                 |
| `/app/dashboard/layout.tsx`        | Dashboard shell with sidebar navigation               |
| `/app/dashboard/page.tsx`          | Overview and stats                                    |
| `/app/dashboard/bookings/page.tsx` | Booking management — confirm, cancel, complete        |
| `/app/dashboard/services/page.tsx` | Service and pricing CRUD                              |
| `/app/dashboard/hours/page.tsx`    | Business hours configuration                          |
| `/app/dashboard/gallery/page.tsx`  | Image gallery management                              |
| `/app/dashboard/profile/page.tsx`  | Business profile editor                               |
| `/app/[subdomain]/page.tsx`        | Dynamic public business website — resolved per tenant |

---

### Layer 2 — UI Components (`/src/components`)

**Responsibility:** Render the visual interface. Components are reusable and have no knowledge of where their data comes from.

This layer contains all React components — dashboard panels, public site sections, forms, navigation, cards, and shared UI primitives. Primitive components (buttons, inputs, dialogs, badges) are provided by **shadcn/ui**, built on top of **Radix UI** for accessibility.

Components receive data as props or via custom hooks. They never call Supabase directly.

---

### Layer 3 — Data Access (`/src/lib`)

**Responsibility:** All communication with Supabase. This is the only layer that knows the database exists.

This layer has three parts:

#### 3a. TypeScript Type Definitions (`/src/lib/types.ts`)

Defines the shape of every entity in the system using TypeScript interfaces:

```
Business        — the core tenant entity
Service         — a service offered by a business
BusinessHours   — opening hours per day of week (0=Sunday to 6=Saturday)
Booking         — a customer appointment
SocialLinks     — instagram, facebook, whatsapp links
IndustryType    — 'barbershop' | 'restaurant' | 'clinic' | 'beauty-salon'
```

All other layers import from this file. It is the single source of truth for data shapes across the entire codebase.

#### 3b. Data Operations (`/src/lib/store.ts`)

Contains all functions that read from and write to Supabase. Organized by entity:

**Repository Pattern**

`store.ts` is the repository layer of LokalWeb. It implements the Repository Pattern by providing a consistent CRUD contract across all four entities — without any UI component or page ever touching Supabase directly. The pattern is implemented as standalone async functions rather than classes, which is the idiomatic approach in modern TypeScript and React architecture. The contract across all entities is:

- `getAll` → `getBusinesses()`, `getServices(businessId)`, `getBookings(businessId)`, `getBusinessHours(businessId)`
- `getById` → `getBusinessBySubdomain(subdomain)`, `getCurrentBusiness()`
- `add` → `registerBusiness()`, `addBooking()`, `addGalleryImage()`
- `save / update` → `saveBusiness()`, `updateService()`, `saveBusinessHours()`
- `delete` → `deleteService()`, `removeGalleryImage()`

This abstraction means the rest of the application is completely decoupled from the database. If Supabase were replaced with a different backend tomorrow, only this file would change.

**Business operations:**

- `getBusinesses()` — fetch all businesses
- `saveBusiness(business)` — upsert a business record
- `getBusinessBySubdomain(subdomain)` — fetch one tenant by subdomain (used by public pages)
- `getCurrentBusiness()` — fetch the logged-in owner's business using localStorage session
- `setCurrentBusiness(id)` — persist the current business ID to localStorage

**Service operations:**

- `getServices(businessId)` — fetch all services for a tenant
- `updateService(businessId, service)` — upsert a service
- `deleteService(businessId, serviceId)` — delete a service by ID

**Business hours operations:**

- `getBusinessHours(businessId)` — fetch hours, seeding 7 default rows if none exist
- `saveBusinessHours(hours[])` — upsert all 7 rows at once

**Booking operations:**

- `getBookings(businessId)` — fetch all bookings for a tenant
- `addBooking(businessId, booking)` — insert a new booking with status `pending`

**Gallery operations:**

- `addGalleryImage(businessId, imageUrl)` — append a URL to the gallery array
- `removeGalleryImage(businessId, imageUrl)` — remove a URL from the gallery array

**Registration:**

- `registerBusiness(data)` — atomic registration flow that inserts the business, seeds 3 default services, seeds 5 mock bookings, and seeds 7 default business hours rows in a single coordinated operation

**camelCase ↔ snake_case mapping:**

TypeScript uses camelCase (`logoUrl`, `accentColor`, `businessId`) while PostgreSQL uses snake_case (`logo_url`, `accent_color`, `business_id`). Two private helper functions handle the conversion:

- `toSnakeBusiness(b)` — converts a `Business` object to a database row
- `fromSnakeBusiness(row)` — converts a database row to a `Business` object

This mapping is invisible to every other layer.

#### 3c. Supabase Clients (`/src/lib/supabase/`)

Three separate Supabase client files are required because Next.js runs code in different environments:

| File            | Used in                            | Reason                                                    |
| --------------- | ---------------------------------- | --------------------------------------------------------- |
| `client.ts`     | Client Components (`'use client'`) | Runs in the browser, reads cookies client-side            |
| `server.ts`     | Server Components, Route Handlers  | Runs on the server, reads cookies via `next/headers`      |
| `middleware.ts` | `middleware.ts` at root            | Runs at the edge, reads/writes cookies on the raw request |

All three connect to the same Supabase project. The distinction is purely about execution environment.

---

### Layer 4 — Cross-Cutting Concerns (`/middleware.ts`, `/src/hooks`)

**Responsibility:** Logic that applies across the entire application — tenant resolution and shared stateful behaviour.

#### `middleware.ts` (root level)

This is the most architecturally significant file in the project. It runs on every single request, before any page renders.

What it does:

1. Reads the `host` header from the incoming request
2. Extracts the subdomain (e.g. `barbershop` from `barbershop.lokalweb.com`)
3. Detects whether the request is for the main domain or localhost (no rewrite needed)
4. If a subdomain is detected, rewrites the request path to `/{subdomain}` so the `[subdomain]` dynamic route handles it
5. Refreshes the Supabase session cookie on every request to keep auth alive

```
Request: barbershop.lokalweb.com
    ↓
middleware.ts — reads host header, extracts 'barbershop'
    ↓
Rewrites internally to: /barbershop
    ↓
app/[subdomain]/page.tsx — calls getBusinessBySubdomain('barbershop')
    ↓
store.ts — queries Supabase, RLS enforces tenant isolation
    ↓
Public website renders with correct tenant data
```

#### `/src/hooks`

Custom React hooks that encapsulate shared client-side state and side effects, keeping component files clean and logic reusable.

---

## 3. Multi-Tenancy Architecture

Multi-tenancy is the most critical design decision in LokalWeb. Multiple businesses share the same database, the same application, and the same infrastructure — but each tenant's data is completely isolated.

### Tenant identification

Every table (`businesses`, `services`, `business_hours`, `bookings`) has a `business_id` foreign key that ties every record to a specific tenant. A booking for barbershop A and a booking for restaurant B sit in the same `bookings` table, distinguished only by their `business_id`.

### Tenant isolation — Row Level Security (RLS)

Data isolation is enforced at the **database engine level** using Supabase Row Level Security. RLS policies on each table ensure queries only return rows matching the authenticated tenant's ID. This isolation exists independently of the application — even if there were a bug in `store.ts`, the database would not return another tenant's data.

### Subdomain routing

True subdomain routing is handled by `middleware.ts`. When `barbershop.lokalweb.com` receives a request, the middleware reads the hostname, extracts `barbershop`, and rewrites the request before any page code runs. The `app/[subdomain]/page.tsx` route then uses the subdomain to fetch the correct tenant from Supabase.

---

## 4. Database Schema

Four tables, each with `business_id` as the tenant isolation key:

```
businesses
  id uuid PK
  name text
  subdomain text UNIQUE
  industry text ('barbershop' | 'restaurant' | 'clinic' | 'beauty-salon')
  phone text
  address text
  description text
  logo_url text
  accent_color text
  social_links jsonb  { instagram, facebook, whatsapp }
  gallery_images text[]
  created_at timestamptz

services
  id uuid PK
  business_id uuid FK → businesses.id (CASCADE DELETE)
  name text
  description text
  price numeric
  duration_minutes integer
  created_at timestamptz

business_hours
  id uuid PK
  business_id uuid FK → businesses.id (CASCADE DELETE)
  day_of_week integer  (0=Sunday … 6=Saturday)
  is_open boolean
  open_time time
  close_time time

bookings
  id uuid PK
  business_id uuid FK → businesses.id (CASCADE DELETE)
  service_id uuid FK → services.id
  customer_name text
  customer_phone text
  appointment_at timestamptz
  status text  ('pending' | 'confirmed' | 'cancelled' | 'completed')
  created_at timestamptz
```

All foreign key relationships use `CASCADE DELETE` — deleting a business automatically removes all its services, hours, and bookings.

---

## 5. Technology Decisions

### Why Next.js 14 (App Router) instead of Vite + React?

The project was originally prototyped with Vite + React Router and migrated to Next.js early in development. The reason is fundamental: **subdomains are a server-level concern, and Vite has no server.**

With Vite, the app is a static bundle. Every subdomain (`barbershop.lokalweb.com`, `pizza.lokalweb.com`) loads the exact same `index.html`. The browser has no way to know which tenant to show until React boots, reads `window.location.hostname`, and makes a Supabase request. This causes a loading flash, is bad for SEO, and makes wildcard DNS configuration fragile on static hosts.

With Next.js, `middleware.ts` runs at the edge before any HTML is sent to the browser. The server resolves the tenant on the first request. Vercel also natively supports wildcard domains (`*.lokalweb.com`) with a single configuration entry — no custom server setup required.

### Why Supabase?

- **PostgreSQL with Row Level Security** — tenant isolation enforced at the database engine level, not the application level
- **Built-in Auth** — handles email/password sessions, OAuth (Google), and JWT tokens, integrated with Next.js via `@supabase/ssr`
- **Built-in Storage** — handles image uploads for logos and gallery photos without a separate service
- **Realtime** — available for future features like live booking notifications without additional infrastructure

### Why Vercel?

- Built by the same team as Next.js — deep integration out of the box
- Native wildcard domain support (`*.lokalweb.com`) configurable in one click
- Edge middleware runs globally close to users, minimising latency on tenant resolution
- Automatic preview deployments on every git push

---

## 6. SOLID Principles Applied

### Single Responsibility Principle (SRP)

Every file and every layer has exactly one reason to change:

- `types.ts` changes only if the data model changes
- `store.ts` changes only if database operations change
- `middleware.ts` changes only if subdomain routing or auth logic changes
- Component files change only if the UI changes
- Page files change only if URL structure changes

No file bleeds into another's responsibility. A UI change never touches `store.ts`. A database schema change never touches a component.

### Open/Closed Principle (OCP)

The `[subdomain]` dynamic route is open for extension — any new business automatically gets a public website simply by registering. No existing routing code needs to change to support a new tenant. New industry templates can also be added without modifying the data layer or routing.

### Dependency Inversion Principle (DIP)

UI components and pages depend on abstractions (functions exported from `store.ts`), not on Supabase directly. No component file imports from `@supabase/supabase-js`. If the database were replaced tomorrow, only `src/lib/store.ts` and `src/lib/supabase/` would need to change — every component, page, and hook would remain untouched.

### Don't Repeat Yourself (DRY)

The `toSnakeBusiness()` and `fromSnakeBusiness()` helper functions centralise the camelCase ↔ snake_case mapping in one place. Every function in `store.ts` that reads or writes a business record goes through these helpers — the mapping logic is never duplicated.

---

## 7. Registration Flow — How a New Tenant is Created

The `registerBusiness()` function in `store.ts` performs a coordinated multi-step operation:

1. Generates a new UUID for the business
2. Inserts the business record into `businesses`
3. Inserts 3 default service templates into `services`
4. Inserts 5 mock bookings into `bookings` (so the dashboard is not empty on first login)
5. Inserts 7 default business hours rows into `business_hours` (Mon–Fri open, Sat–Sun closed)
6. Saves the new business ID to `localStorage` so `getCurrentBusiness()` can identify the owner

If any step fails, Supabase throws an error and the registration is aborted.

---

## 8. Data Flow Example — Customer Books an Appointment

1. Customer visits `barbershop.lokalweb.com`
2. `middleware.ts` intercepts the request, extracts `barbershop`, rewrites to `/barbershop`
3. `app/[subdomain]/page.tsx` calls `getBusinessBySubdomain('barbershop')` from `store.ts`
4. `store.ts` queries Supabase — `.eq('subdomain', 'barbershop')` — RLS ensures only this tenant's data is returned
5. `fromSnakeBusiness()` converts the database row to a typed `Business` object
6. The page renders with the correct tenant's data — name, services, hours, gallery, contact info
7. Customer selects a service, picks a time slot, enters their name and phone number
8. Component calls `addBooking(businessId, bookingData)` from `store.ts`
9. `store.ts` inserts the booking into `bookings` with `status: 'pending'` and the correct `business_id`
10. RLS validates the insert — booking is saved
11. Business owner opens their dashboard — the new booking appears under "Pending"

---

## 9. Folder Structure

```
Lokal_Web/
├── app/                              # Layer 1: Routing & Pages
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   ├── not-found.tsx                 # 404
│   ├── register/
│   │   ├── page.tsx                  # Registration form
│   │   └── success/page.tsx          # Post-registration screen
│   ├── dashboard/
│   │   ├── layout.tsx                # Dashboard shell + sidebar
│   │   ├── page.tsx                  # Overview
│   │   ├── bookings/page.tsx         # Booking management
│   │   ├── services/page.tsx         # Service CRUD
│   │   ├── hours/page.tsx            # Business hours
│   │   ├── gallery/page.tsx          # Image gallery
│   │   └── profile/page.tsx          # Profile editor
│   └── [subdomain]/page.tsx          # Public tenant website
│
├── src/
│   ├── components/                   # Layer 2: UI Components
│   ├── hooks/                        # Layer 4: Custom React hooks
│   └── lib/                          # Layer 3: Data Access
│       ├── types.ts                  # TypeScript interfaces for all entities
│       ├── store.ts                  # All Supabase data operations
│       └── supabase/
│           ├── client.ts             # Browser Supabase client
│           ├── server.ts             # Server Supabase client
│           └── middleware.ts         # Middleware Supabase client
│
├── middleware.ts                     # Layer 4: Subdomain routing + auth session
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── .env.local                        # Secrets (not committed)
├── .env.example                      # Environment variable template
└── docs/
    ├── architecture.md               # This document
    └── class-diagram.md              # UML class diagram
```

---

_Last updated: March 2026 — Gentian Voca, Software Engineering Year 2_
