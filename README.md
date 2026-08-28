# DeepSync — Video Production Crew Scheduling

A clean, mobile-first web app for managing video production staff schedules. Producers create shoots and assign crew; staff log in and see only their own assignments.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS + shadcn/ui**, **Prisma + PostgreSQL**, and **Auth.js (NextAuth v5)**.

## Features

- **Roles** — Admins/Producers get full access; staff only see their own assignments.
- **Team management** — admins create/edit/remove accounts, change roles, and reset passwords from the Team page.
- **Production roles** — editable crew roles (Director, DP, Gaffer, etc.) managed from Team & roles.
- **Admin dashboard**
  - Month & week calendar of all shoots
  - List view (default) grouped by day with upcoming/past filtering
  - Create / edit / delete shoots (title, client, date, call/wrap time, location, notes, status)
  - Assign crew to roles with **double-booking detection** — live warnings when picking a person, when editing shoot times, a conflict count on the dashboard, and banners on affected shoots (with an "assign anyway" override)
  - Quick filters: person, role, status, and free-text search
  - Availability highlight — pick a crew member and see their booked days on the calendar
- **Staff view**
  - "My Schedule" with a clean list of upcoming assignments (date, call time, shoot, role, location, notes)
  - Toggle between list and a month calendar
  - Confirm / mark-unavailable on their own assignments
- **Design** — Linear/Notion-style UI, dark mode, mobile-first, Geist type.

## Getting started (local)

Prereqs: Node 20+, Docker (for Postgres) or a hosted Postgres URL.

```bash
npm install

# 1. Start Postgres (or set DATABASE_URL to your own Postgres — see .env.example)
docker compose up -d

# 2. Run migrations & seed demo data
npx prisma migrate dev
npx prisma db seed        # or: npm run db:seed

npm run dev               # http://localhost:3100
```

`DATABASE_URL` and `AUTH_SECRET` are read from `.env` — copy `.env.example` to `.env` and fill them in. Generate `AUTH_SECRET` with `openssl rand -base64 32` or `npx auth secret`.

### Demo accounts (password `password123`)

| Role  | Email                 |
| ----- | --------------------- |
| Admin | `admin@deepsync.pro`  |
| Staff | `alex@deepsync.pro`   |
| Staff | `jordan@deepsync.pro` |

Seed creates 14 production roles, 9 users, and 7 shoots across the next two weeks (including an overlapping pair to demo double-booking).

## Deploying to Vercel

1. **Create a Postgres database** — Vercel Postgres, Neon, or Supabase. Copy its connection string.
2. **Push the repo to GitHub** and import it in Vercel.
3. **Set environment variables** in Vercel → Settings → Environment Variables:
   - `DATABASE_URL` — your Postgres connection string (`postgresql://…?sslmode=require`)
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_URL` — `https://your-app.vercel.app` (optional when `trustHost` is enabled, but recommended for custom domains)
4. **Deploy** — Vercel runs `npm run vercel-build` (`prisma generate && prisma migrate deploy && next build`) via `vercel.json`.
5. **Seed (once)** — after the first deploy, run against the production DB:
   ```bash
   DATABASE_URL="your-production-url" npx prisma db seed
   ```

Local SQLite (`file:./dev.db`) from earlier versions will no longer work — the schema now targets PostgreSQL. Delete `prisma/dev.db` if present.

## Project structure

```
src/
  app/
    (auth)/login, register     # auth pages
    api/auth/[...nextauth]     # Auth.js handlers
    actions/                   # server actions (auth, shoots, assignments, roles, users)
    dashboard/                 # admin: calendar/list, new shoot, shoot detail, team
    schedule/                  # staff: my schedule
  components/                  # UI + feature components
  lib/                         # db, auth, conflicts, calendar, utils, mappers
  proxy.ts                     # route protection + role redirects (Next 16 proxy)
prisma/
  schema.prisma                # User, ProductionRole, Shoot, Assignment (PostgreSQL)
  migrations/                  # SQL migrations (applied via `prisma migrate deploy`)
docker-compose.yml             # local Postgres for development
```

## Notes

- Password hashing uses `bcryptjs` (pure JS, no native build step).
- Sessions use Auth.js's JWT strategy, so route protection in `proxy.ts` runs at the edge.
- `npm run lint` and `npx tsc --noEmit` should pass clean.
- `vercel.json` sets the build command to `npm run vercel-build` so migrations run automatically on each deploy.
