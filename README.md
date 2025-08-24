# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/cf3d6b2f-f24a-4482-9fd8-783b9241f729

## PIM Hostel Management (pim-hostel)

This repository contains a small hostel/fee/student management admin UI built with React + TypeScript and Supabase as the backend (Postgres + Auth). It's intended for managing students, rooms, fees, colleges/departments and user accounts for a college hostel system.

This README documents how to run the project locally and describes the code layout and the database schema used by the app.

## Quick start (development)

Prerequisites:

- Node.js (recommended via nvm)
- npm or bun (project uses Vite)
- A Supabase project (for the database & auth)

1) Clone and install

```powershell
git clone <YOUR_REPO_URL>
cd pim-hostel
npm install
```

2) Configure environment variables

Create a `.env` (or set environment variables) with at least the frontend keys:

- `VITE_SUPABASE_URL` — Your Supabase project URL (e.g. https://xxxxx.supabase.co)
- `VITE_SUPABASE_ANON_KEY` — The anon/publishable key for client usage

Do NOT put your `SERVICE_ROLE` key in frontend code. Admin operations require a server-side service key — see "Admin / Auth" below.

3) Run dev server

```powershell
npm run dev
```

4) Build / Preview

```powershell
npm run build
npm run preview
```

## Tech stack

- Vite + React + TypeScript
- shadcn/ui (Radix + React) for UI primitives
- Tailwind CSS
- Supabase (Postgres + Auth)
- react-hook-form + zod for forms
- @tanstack/react-query for data fetching/cache

## Project file structure (important files)

Top-level:

- `package.json`, `vite.config.ts`, `tsconfig.json`
- `public/` — static assets
- `src/` — application source code
- `supabase/migrations/` — SQL migrations used to create/alter DB tables

Key `src/` subfolders and files:

- `src/main.tsx`, `src/App.tsx` — app entry and routing
- `src/integrations/supabase/client.ts` — Supabase client wrapper (uses publishable key)
- `src/pages/` — app pages (Dashboard, Students, Rooms, Fees, Settings, NotFound, etc.)
	- `src/pages/Students.tsx` — student listing, filters, CSV export
	- `src/pages/Rooms.tsx` — room list, CRUD
	- `src/pages/Fees.tsx` — fee records and exports
	- `src/pages/Settings.tsx` — settings page (contains `AccountsManager`)
- `src/components/` — UI components and dialogs
	- `AddStudentDialog.tsx`, `EditStudentDialog.tsx` — add/edit student forms
	- `AccountsManager.tsx` — accounts management UI (calls auth admin or falls back)
	- `CollegeDepartmentManager.tsx` — manage colleges & departments
	- `CollegeSelect.tsx` — select control for colleges
	- `RoomManager.tsx` (exists but Rooms page now contains CRUD)
	- `ui/` — shadcn UI wrappers (select, dialog, table, etc.)

If you open the project in an editor you will see many components under `src/components/ui/` which are small wrappers around Radix components.

## Database schema

The database schema is defined by the SQL files under `supabase/migrations/`. The main tables used by the application are:

- `departments`
	- `id` UUID PRIMARY KEY (gen_random_uuid())
	- `name` TEXT UNIQUE
	- `code` TEXT UNIQUE
	- `created_at` TIMESTAMP

- `students`
	- `id` UUID PRIMARY KEY
	- `student_id` TEXT UNIQUE (human-friendly student id e.g. STU0001)
	- `name` TEXT
	- `email` TEXT UNIQUE (nullable)
	- `phone` TEXT (nullable)
	- `parent_name` TEXT (nullable)
	- `parent_phone` TEXT (nullable)
	- `address` TEXT (nullable)
	- `department_id` UUID REFERENCES `departments(id)`
	- `year` INTEGER (1..4)
	- `room_number` TEXT (nullable) — references `rooms.room_number` logically (not FK)
	- `college` TEXT (student's college name)
	- `admission_date` DATE
	- `status` TEXT (enum: `active`, `inactive`, `graduated`)
	- `created_at`, `updated_at` TIMESTAMPS

- `fees`
	- `id` UUID PRIMARY KEY
	- `student_id` UUID REFERENCES `students(id)` ON DELETE CASCADE
	- `academic_year` TEXT (e.g. `2024-25`)
	- `fee_year` / `semester` TEXT (migration renamed `semester` -> `fee_year`)
	- `amount` DECIMAL
	- `paid_amount` DECIMAL (default 0)
	- `due_date` DATE
	- `payment_date` DATE (nullable)
	- `status` TEXT (enum: `pending`, `partial`, `paid`, `overdue`)
	- `payment_method` TEXT (e.g. `cash`, `upi`, `bank_transfer`)
	- `transaction_id`, `remarks` TEXT
	- `created_at`, `updated_at`

- `rooms`
	- `id` UUID PRIMARY KEY
	- `room_number` TEXT UNIQUE
	- `capacity` INTEGER (default 3)
	- `floor_number` INTEGER
	- `room_type` TEXT (e.g. `standard`, `deluxe`)
	- `amenities` TEXT[]
	- `status` TEXT (enum: `available`, `occupied`, `maintenance`, `blocked`)
	- `created_at`, `updated_at`

- `colleges`
	- `id` UUID PRIMARY KEY
	- `name` TEXT UNIQUE
	- `code` TEXT UNIQUE
	- `address`, `phone`, `email` TEXT (optional)
	- `created_at`, `updated_at`

Notes:
- Row level security (RLS) is enabled in migrations for these tables and permissive policies were created (for development). Harden policies before production.
- Some relationships are accessed via Supabase `select` with joins, e.g. `students` -> `departments` and `fees` -> `students`.

## Auth & Accounts (important)

- The frontend uses `src/integrations/supabase/client.ts` which is initialized with the publishable anon key and is safe to use in the browser.
- Supabase Auth admin endpoints (listing/creating/updating/deleting users under `/auth/v1/admin`) require the `SERVICE_ROLE` key and must be called from a secure server environment. The frontend must NOT include that key.
- `src/components/AccountsManager.tsx` contains logic to call admin endpoints when available; if admin is not available the component now falls back to showing registered emails from the `students` table. To fully manage auth users you should create a server endpoint (Supabase Edge Function or other) that performs admin operations using the service role key.

## Migrations

- Migrations are stored under `supabase/migrations/` and include table creation and ALTER statements used to evolve the schema. Review those files for exact column definitions and constraints.

## Useful queries and examples

- Fetch active students with department and fee summary (used in UI):

```js
supabase.from('students').select(`*, departments(name), fees(status, paid_amount, amount)`).eq('status','active')
```

- Fetch fee records with joined student info:

```js
supabase.from('fees').select(`*, students(id,student_id,name,gender,phone,room_number,year,departments(name))`).eq('academic_year','2024-25')
```

## Contributing

- Code style: TypeScript + Prettier (project provides config)
- Tests: small manual smoke tests; add unit tests where you modify logic.

## Next steps / recommended improvements

- Move any admin auth calls to a server-side endpoint using SUPABASE_SERVICE_ROLE_KEY (Edge Function recommended).
- Harden RLS policies before production.
- Add migrations for any schema changes and keep them in `supabase/migrations/`.
- Consider DB triggers to maintain room occupancy/state instead of doing it only from the client.

---

If you want I can scaffold a secure Edge Function and wire `AccountsManager` to it so the app can list and manage real auth users from Supabase Auth; tell me whether you deploy to Supabase functions or another serverless platform and I'll add the code.
