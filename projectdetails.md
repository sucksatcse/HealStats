# HealthStats — PROJECT CONTEXT (Single Source of Truth)

> **MANDATORY for every AI agent (Copilot, Claude, Antigravity, etc.) and every human:**
>
> 1. **READ this file completely BEFORE implementing anything.**
> 2. **UPDATE this file AFTER every merged change** (status board row + changelog entry).
> 3. Never violate the Architecture Rules below.

Last updated: 2026-09-03 · Current phase: **Initial UI Scaffolding & Backend Setup Complete. Moving towards Data Wiring and Offline Sync functionality.**

---

## 1. Project Snapshot

- **Product:** HealthStats — Offline-first Electronic Health Record (EHR) system built for rural clinics in Bangladesh.
- **Core loop:** Health worker registers patient offline → Performs AI-assisted triage → Doctor reviews records → Data auto-syncs to central DB when connection returns.
- **Stack:** React 19 · Vite 8 · TypeScript 5.7 · Tailwind CSS 4.0 · Supabase (PostgreSQL + Auth).
- **Key Constraints:** Must work fully offline with background sync, must support Bangla & English natively, must have a low-light Dark Mode.
- **Full context:** Refer to `FEATURES.md` and `PROGRESS.md` for historical roadmaps.

## 2. Repository State

| Area | State |
| --- | --- |
| **Frontend Scaffold** | ✅ Complete. React 19 + Vite + Tailwind configured and building cleanly. `oxfmt` configured. |
| **Database Schema** | ✅ Initialized. `20260831000000_initial_schema.sql` creates `clinics`, `staff`, `patients`, `visits`, and `sync_log`. |
| **Security & Auth** | ✅ RLS enabled on all tables via security definer functions. Supabase email/password auth implemented (`AuthContext.tsx`). |
| **Client UI & Design** | ✅ 30+ pages scaffolded. Bilingual (`LanguageContext`) and Dark Mode (`ThemeContext`) integrated globally. |
| **Data Fetching (CRUD)**| ⚠️ Pending. Forms like `NewPatientPage` are static and need wiring to Supabase APIs. |
| **Offline Engine** | ❌ Not Started. Needs IndexedDB/Dexie.js integration, background sync queue, and service workers. |
| **AI / OCR** | ❌ Not Started. Triage scoring algorithms and physical record OCR pipeline missing. |

## 3. Feature Status Board

Statuses: `NOT STARTED` → `IN PROGRESS` → `MVP DONE` → `DONE`

| ID | Feature | Status | Notes |
| --- | --- | --- | --- |
| **F1** | Platform Foundation & Scaffold | DONE | Vite + React + Tailwind setup. CI/CD not yet configured. |
| **F2** | Database & Authentication | DONE | Supabase schema, RLS policies, AuthContext, role-based routing all active. |
| **F3** | UI Shell & Contexts | DONE | AppNavbar, Language (Bangla/EN), Theme (Light/Dark) fully built. |
| **F4** | Role-Based Dashboards | MVP DONE | Views for Admin, Emergency, and Worker created, but data is static. |
| **F5** | Patient Records & Clinical Forms | IN PROGRESS | NewPatientPage wired to Supabase. Patient detail view supports dynamic ID routing. Needs VitalsPage wiring. |
| **F6** | Offline-First Engine | NOT STARTED | Core requirement. Needs Dexie.js for local storage and `navigator.onLine` sync queues. |
| **F7** | AI Triage & OCR | NOT STARTED | Requires ML model choice and Google Vision/Tesseract integration. |
| **F8** | Emergency / Disaster Mode | MVP DONE | UI exists (`EmergencyDashboard.tsx`), needs live external alerts feed. |
| **F9** | Progressive Web App (PWA) | NOT STARTED | Missing `manifest.json` and install prompts. |

## 4. Architecture Rules (NEVER violate)

1. **Security First**: All database access must go through Supabase with Row-Level Security (RLS) enabled. Never fetch sensitive patient data without verifying the clinic assignment.
2. **Offline Resilience**: Never assume an active internet connection. All data writes must eventually go through a local queue (once F6 is built) that pushes to Supabase only when online.
3. **Role Segregation**: Route protection must occur at the React Router level (`App.tsx`) *and* at the Database level (RLS). A user tampering with frontend roles must still be blocked by Supabase.
4. **Bilingual Requirement**: No hardcoded English strings in primary clinical views. Use `LanguageContext` for translations.
5. **No Direct DOM Manipulation**: Use React state and contexts exclusively. No `innerHTML` or `document.getElementById` unless absolutely necessary for 3rd party library wrappers.

## 5. Conventions Quick Reference

- **Styling**: Tailwind CSS v4 utility classes exclusively. No custom CSS unless strictly required in `index.css`.
- **Database Tables**: Pluralized, snake_case (`patients`, `visits`, `sync_log`).
- **React Components**: PascalCase (`NewPatientPage.tsx`, `AppNavbar.tsx`).
- **Formatting**: Rely on `oxfmt` for codebase formatting.
- **Environment**: Secrets (like Supabase Anon Key) belong in `.env` and are strictly prefixed with `VITE_`.

## 6. Database Registry (Supabase)

- **clinics**: Physical locations (`id`, `name`, `zone`, `address`).
- **staff**: App users mapped to Supabase Auth (`id`, `name`, `role`, `clinic_id`, `auth_user_id`).
- **patients**: Beneficiaries assigned to clinics (`id`, `name`, `age`, `sex`, `village`, `clinic_id`).
- **visits**: Medical records & triage scores (`id`, `patient_id`, `staff_id`, `vitals`, `symptoms`, `diagnosis`, `urgency_score`, `synced_at`).
- **sync_log**: Audit trail for offline sync events (`id`, `staff_id`, `status`).

## 7. Decisions Log (append-only)

| ID | Date | Decision | Why |
| --- | --- | --- | --- |
| D-001 | 2026-08-31 | Stack: React 19 + Vite 8 + Tailwind 4 + Supabase. | Modern, highly performant frontend combined with a backend that provides built-in Auth, real-time sync, and PostgreSQL RLS. |
| D-002 | 2026-08-31 | Security Definer Functions for RLS. | Avoids infinite recursion when evaluating staff roles and clinic IDs against the `staff` table during policy checks. |
| D-003 | 2026-09-01 | UI Before Logic. | 30+ pages were scaffolded out statically first to ensure UX flows (especially Emergency Mode) felt correct before wiring complex DB logic. |
| D-004 | 2026-09-03 | Comprehensive Progress Tracking. | `PROGRESS.md` and this `projectdetails.md` established as SSOTs (Single Sources of Truth) to guide remaining backend wiring and offline capabilities. |
| D-005 | 2026-09-03 | Implemented Task 4: Patient CRUD (Create). | Wired `NewPatientPage.tsx` to insert into Supabase `patients` table using authenticated worker's `clinic_id`. Modified `DashboardPage.tsx` state to handle post-registration redirect passing `patientId` down to `PatientDetailPage`. |
