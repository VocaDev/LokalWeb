# LokalWeb

**Website-as-a-Service for small businesses in Kosovo.**

LokalWeb is a multi-tenant SaaS platform that allows small businesses — barbershops, restaurants, beauty salons, clinics — to get a professional website and online booking system up and running in minutes, without any technical knowledge or expensive custom development.

---

## The Problem

Most small businesses in Kosovo rely entirely on social media for their online presence. This limits them in three key ways: they cannot manage bookings efficiently, they cannot present structured service and pricing information, and they lack a professional digital identity separate from platforms they do not own or control.

## The Solution

LokalWeb gives every registered business a fully functional website hosted at a unique subdomain (`business.lokalweb.com`), a dashboard to manage their content, and an optional booking system that lets customers schedule appointments online — all from one centralized platform.

---

## Features

### Core (MVP)

- **Multi-tenant architecture** — each business gets isolated data and its own website instance
- **Automatic website generation** — a fully functional public site is created on registration
- **Industry-specific templates** — tailored layouts for barbershops, restaurants, clinics, and beauty salons
- **Business owner dashboard** — manage all website content without any technical skills
- **Business profile management** — name, description, address, phone, logo, social links
- **Service and pricing management** — add services with price, duration, and description
- **Business hours configuration** — define opening hours used by the booking system
- **Online booking system** — customers select a service, pick a time slot, and confirm their appointment
- **Appointment management** — owners can view, confirm, cancel, and complete bookings
- **Image gallery** — upload and display photos of the business and services
- **Customer contact integration** — click-to-call, WhatsApp links, email contact
- **Google Maps integration** — embedded map on every business website
- **Responsive design** — all websites work on mobile, tablet, and desktop
- **Authentication and role-based access control** — business owners see only their own data
- **Super admin panel** — platform-level management of all registered businesses

### Planned (Future)

- Custom domain support (`www.mybusiness.com`)
- SMS and WhatsApp booking notifications
- Multi-staff management and scheduling
- Analytics dashboard (visitors, popular services, booking trends)
- Subscription and payment management
- Mobile app for business owners
- Advanced template customization
- Customer review and rating system
- Multi-language support (Albanian, English, Serbian)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Hosting | Vercel |

---

## Architecture

LokalWeb uses a **shared database, single schema** multi-tenancy model. Every table includes a `business_id` foreign key that ties records to a specific tenant. Supabase Row Level Security (RLS) policies enforce data isolation at the database level — a business owner can never read or write another business's data.

Subdomain routing is handled by Next.js middleware, which reads the incoming hostname, extracts the subdomain, and injects the tenant context into every request.

### Database Schema (Core Tables)

```
businesses      id, name, subdomain, owner_id, industry, description, phone, address, logo_url
profiles        id, user_id, role (owner | admin), business_id
services        id, business_id, name, description, price, duration_minutes
business_hours  id, business_id, day_of_week, open_time, close_time
bookings        id, business_id, service_id, customer_name, customer_phone, appointment_at, status
```

### User Roles

- **Customer** (anonymous) — visits public business websites, makes bookings
- **Business Owner** — manages their own business data and bookings via dashboard
- **Super Admin** — manages the entire platform, all businesses, and system settings

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login and registration pages
│   ├── (dashboard)/      # Business owner dashboard
│   ├── (public)/         # Public-facing business websites
│   └── layout.tsx
├── components/           # Shared UI components
├── lib/
│   └── supabase/         # Supabase client configuration
└── types/                # TypeScript type definitions
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))
- A Vercel account for deployment ([vercel.com](https://vercel.com))

### Local Development

1. Clone the repository

```bash
git clone https://github.com/VocaDev/LokalWeb.git
cd LokalWeb
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables — create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## User Flows

### Business Owner
Registration → auto-generated website + subdomain → dashboard → edit profile, manage services, configure hours, upload images, manage bookings

### Customer
Visit `business.lokalweb.com` → browse services → pick time slot → enter details → booking confirmed

### Super Admin
Admin login → view all registered businesses → activate or suspend accounts → manage platform settings

---

## Development Roadmap

This project is being built over 13 weeks as part of a Software Engineering university course.

| Week | Milestone |
|---|---|
| 1–2 | Requirements, architecture design, database schema |
| 3–4 | Project setup, Supabase integration, authentication |
| 5–6 | Multi-tenancy, subdomain routing, middleware |
| 7–8 | Business dashboard — profile, services, hours |
| 9–10 | Booking system — public flow and owner management |
| 11 | Image gallery, contact integration, Maps |
| 12 | Super admin panel |
| 13 | Testing, polish, deployment |

---

## Author

Built by **VocaDev** as a university Software Engineering project — with the goal of making it a real product for the Kosovo market.

---

## License

This project is currently unlicensed. All rights reserved.
