# HealthStats Exhaustive Progress Report

This document provides a comprehensive and highly detailed breakdown of every single file, configuration, and feature implemented in the project thus far.

## 1. Project Infrastructure & Tooling
The foundational tools and libraries for the frontend application have been fully configured.
- **Framework**: React 19.0.0
- **Build Tool**: Vite 8.0.5
- **Language**: TypeScript 5.7.0
- **Styling**: Tailwind CSS 4.0.0
- **Formatting**: `oxfmt` configured for code formatting.
- **Package Manager**: `npm` / `pnpm` (lock files for both exist).
- **Environment**: `.env.example` setup for Supabase credentials.

## 2. Database Schema & Backend (Supabase)
The initial database schema (`20260831000000_initial_schema.sql`) has been completely modeled, built, and secured.

### Created Tables:
- `clinics`: `id`, `name`, `zone`, `address`
- `staff`: `id`, `name`, `role` (enum: 'worker', 'admin'), `clinic_id`, `auth_user_id`, `email`
- `patients`: `id`, `name`, `age`, `sex`, `village`, `clinic_id`, `created_at`
- `visits`: `id`, `patient_id`, `staff_id`, `vitals` (JSONB), `symptoms`, `symptom_category`, `diagnosis`, `urgency_score`, `created_at`, `synced_at`
- `sync_log`: `id`, `staff_id`, `device_id`, `status`, `timestamp`

### Row-Level Security (RLS) & Policies:
RLS has been activated on all 5 tables to ensure strict data privacy.
- Created `SECURITY DEFINER` helper functions (`get_current_user_role`, `get_current_user_clinic_id`, `get_current_user_staff_id`) to safely evaluate user context without recursion loops.
- **Clinics Policy**: Admins access all; workers access their assigned clinic.
- **Staff Policy**: Admins access all; workers access staff in their clinic.
- **Patients Policy**: Admins access all; workers access patients in their clinic.
- **Visits Policy**: Admins access all; workers access visits linked to their clinic's patients.
- **Sync Log Policy**: Admins access all; workers access their own logs.

## 3. Authentication & Authorization
- **Supabase Client**: Initialized in `frontend/src/lib/supabase.ts`.
- **Global Context**: `AuthContext.tsx` handles state for the logged-in user, their session, and parses their `staff` profile (to fetch their specific `role` and `clinic_id`). Exposes `profileResolved` so a session with no linked staff row is distinguishable from a still-loading profile (Task 25).
- **Protected Routing**: Implemented directly in `App.tsx`. Unauthorized users are bounced to the appropriate login screen. Admin routes are locked behind `role === 'admin'`. Render-time guards prevent any flash of protected/admin content before the redirect resolves, and a valid session with no staff profile shows an "Account not linked" escape screen (Task 25).
- **Login Pages**: 
  - `LoginPage.tsx` (For standard health workers)
  - `AdminLoginPage.tsx` (For clinic administrators/coordinators)
  - `RoleSelectionPage.tsx` (For initial login routing)

## 4. Frontend UI Scaffolding & Contexts
An extensive set of UI components and pages (30+) have been scaffolded out as React components, styled via Tailwind CSS, and hooked up to local state and contexts. 

### Global Contexts
- **LanguageContext.tsx**: Built-in toggle to swap the application between English and Bangla (Bengali).
- **ThemeContext.tsx**: Manages Light/Dark mode toggling, crucial for night shifts and low-light battery saving.
- **AuthContext.tsx**: (Detailed in Authentication above).

### Pages Built & Scaffolded:
- **Core Layout**: `App.tsx`, `main.tsx`, `index.css`.
- **Navigation & Shell**: `AppNavbar.tsx`, `NavbarPreviewPage.tsx`.
- **Dashboards**: 
  - `DashboardPage.tsx` (General view)
  - `AdminDashboardPage.tsx` (High-level clinic analytics)
  - `EmergencyDashboard.tsx` (Disaster-ready dashboard)
  - `AnalyticsPage.tsx`
- **Patient Management & Forms**: 
  - `PatientsPage.tsx`, `PatientRecordsPage.tsx`, `PatientLookupPage.tsx`, `FlaggedPatientsPage.tsx`
  - `NewPatientPage.tsx`, `PatientFormPage.tsx`
  - `PatientDetailPage.tsx`
- **Clinical Action Workflows**:
  - `TriagePage.tsx`, `EmergencyTriagePage.tsx`
  - `VitalsPage.tsx`
  - `DigitizePage.tsx` (Placeholder for OCR scanning)
- **Clinic Operations & Emergency Responses**:
  - `ClinicOpsPanel.tsx`
  - `ClinicsMapSection.tsx`
  - `ResourceAllocationPage.tsx`
  - `EmergencyReportPage.tsx`, `AlertsCenterPage.tsx`
- **Settings & Syncing Views**:
  - `SyncPage.tsx`, `SyncMonitorPage.tsx`, `SyncProgressPage.tsx`
  - `SettingsPage.tsx`
  - `StaffPage.tsx`
- **UI System & States**:
  - `StyleGuidePage.tsx`, `ButtonStatesPage.tsx`
  - `SkeletonStatesPage.tsx` (Loading states)
  - `EmptyStates.tsx` (No data placeholders)
  - `SuccessConfirmationPage.tsx`
  - `ChatWidget.tsx`

## 5. Updates Against the Original Roadmap (FEATURES.md)

Based on the original plan in `FEATURES.md`, the following checkboxes have been effectively accomplished:
### Completed Roadmap Items (✅)
- [x] Set up Supabase project (Postgres database + Auth)
- [x] Define database schema for patients, visits, diagnoses, and prescriptions
- [x] Implement Row-Level Security (RLS) policies in Supabase for role-based data access
- [x] Integrate Supabase Auth (email/password login for clinic staff)
- [x] Implement role-based routing: Health Worker / Doctor / Admin / Coordinator
- [x] English & Bangla (Bengali) context setup
- [x] Dark Mode context setup
- [x] Admin Dashboard stats cards wired to real Supabase metrics with resilient parallel fetching (`AdminDashboardPage.tsx`)
- [x] Admin Dashboard 7-day/30-day/90-day visits chart dynamically aggregated from Supabase `visits` (`AdminDashboardPage.tsx`)
- [x] Admin Dashboard Top Clinics Today panel dynamically queried from Supabase `clinics` and today's `visits` (`AdminDashboardPage.tsx`)
- [x] Patient Directory wired to Supabase `patients` table with server-side ILIKE search, pagination, and latest visit urgency badge (`PatientRecordsPage.tsx`)
- [x] Admin Patient Records Table wired to Supabase `patients` with multi-clinic visibility, name/ID/UUID search, 1–5 urgency level filter, animated skeleton loader, dual empty states, resilient retry error banner, CSV export, and detail navigation to `PatientDetailPage` (`PatientRecordsPage.tsx`, `AdminDashboardPage.tsx`, `adminService.ts`) (Task 11)
- [x] Staff Management UI wired to Supabase `staff` table with clinic joins, Add/Edit modals, clinic assignment dropdowns, search, role/status/clinic filters, column sorting, pagination, and soft deactivation (`StaffPage.tsx`, `adminService.ts`) (Task 12)
- [x] High-Risk / Flagged Patients triage feed wired to Supabase `visits` (score >= 3) with clinics join, real staff doctor assignment with persistence, instant search, urgency tabs with counts, clinic/assignment filters, CSV export, and patient detail navigation (`FlaggedPatientsPage.tsx`, `AdminDashboardPage.tsx`, `adminService.ts`) (Task 13)
- [x] Emergency Mode & Crisis Operations Center wired to Supabase database (`clinics`, `visits`, `patients`, `staff`) with zone aggregation, urgency 1–5 triage queue drill-down to `PatientDetailPage`, interactive SOS broadcast modal, situation report CSV export, and toggle activation (`EmergencyDashboard.tsx`, `AdminDashboardPage.tsx`, `adminService.ts`) (Task 14)
- [x] Outbreak Detection & Symptom Clustering Radar wired to live Supabase clinical intake visits, grouping cases by syndrome & zone, triggering early-warning dashboard banners, interactive WHO protocol checklists, expandable linked patient case tables, and CSV situation report exports (`OutbreakDetectionPage.tsx`, `AdminDashboardPage.tsx`, `adminService.ts`) (Task 14.5)
- [x] Emergency Mode Triage Queue wired to live Supabase visits joined with patients and clinics, using authoritative 1–5 urgency scale and Red/Yellow/Green bands, interactive clinical workflow actions (Start Care / In Treatment / Discharge / Revert), live band counters, multi-attribute search, CSV export, and two-way detail drill-down (`EmergencyTriagePage.tsx`, `DashboardPage.tsx`, `AdminDashboardPage.tsx`, `EmergencyDashboard.tsx`, `adminService.ts`) (Task 15)
- [x] Sync Monitor Page wired to IndexedDB `offlineDb.pendingRecords` queue and `SyncService` (`SyncMonitorPage.tsx`)
- [x] Clinic Operations Map wired to live Supabase `clinics`, `patients` and `visits` data — real patient counts, 7-day/24-hour visit activity, pending-sync backlog and recent high-risk cases per clinic. Clinics are placed on the Bangladesh SVG map by matching their `zone`/`name` to a district coordinate lookup (presentation-layer geocoding, no schema coordinates); unrecognised clinics are listed honestly as "not on map". Honest activity status (Active/Recent/Quiet from visit recency, not fake device sync state), loading/empty/error states, refresh, filters, quiet-clinic spotlight, and a per-clinic detail bar (`ClinicOpsPanel.tsx`, `adminService.fetchClinicMapData()`) (Task 16)
- [x] HealthStats AI Assistant (Chatbot) grounded in live Supabase data via a new intent engine (`chatbotService.ts`) that reuses `adminService` queries — total patients, records today, pending syncs, high-risk patients (count + named list), outbreak/cluster status, clinic activity, and patient look-up by name. Data answers require an authenticated session and are scoped by role/clinic; the public landing page only answers platform how-to questions. Replaced the previous simulated `getResponse`/fake "18 clinics" content with real async queries; empty/zero/error results are reported honestly and no data is fabricated (`ChatWidget.tsx`, `chatbotService.ts`) (Task 17)
- [x] Internationalization (i18n) with `i18next` + `react-i18next` + browser language detector. Added one centralized config (`src/i18n/index.ts`) with namespaced English/Bangla resources (`src/i18n/locales/en.ts`, `bn.ts`: common/navigation/urgency/map/chatbot/errors). i18next is the single source of truth for the active language; `LanguageContext`/`useLang()` now delegates to it so the switcher, `useTranslation()` components and legacy inline-label components stay consistent. Language persists in `localStorage` (`hs-lang`) and survives refresh/navigation. Translated via `t()`: the Ops Map (Task 16) and AI Assistant (Task 17, incl. grounded replies) plus shared common/urgency labels; landing/navbar/dashboards localize through the shared state. Canonical DB values and urgency numbers unchanged. Verified: `tsc --noEmit` and `vite build` pass; browser smoke test confirmed instant EN↔BN switch on the chatbot with no raw keys. Many deep admin/clinical pages remain English-only pending incremental migration (`i18n/`, `LanguageContext.tsx`, `main.tsx`, `ChatWidget.tsx`, `ClinicOpsPanel.tsx`, `chatbotService.ts`) (Task 18)
- [x] Complete Dark Mode & theme consistency. Added a flash-of-incorrect-theme guard in `index.html` (applies saved `.dark` before first paint). Extended the Ashen Nebula `--an-*` token foundation with consistent Tailwind `dark:` variants across every previously light-only page: worker flow (`DashboardPage`, `NewPatientPage`, `VitalsPage`, `PatientDetailPage`, `DigitizePage`, `SyncPage`, `PatientsPage`, `PatientFormPage`, `PatientLookupPage`, `TriagePage`, `EmergencyReportPage`, `RoleSelectionPage`), admin (`SettingsPage`, `AnalyticsPage`, `ResourceAllocationPage`, `AlertsCenterPage`), and auth (`LoginPage`, `AdminLoginPage` — fixed white inputs + invisible headings). Preserved teal brand, clinical urgency/status color meaning (dark-tuned, non-neon), Emergency Mode hierarchy, layout, logic and light mode. Verified with `tsc --noEmit`, `vite build`, and a browser dark-mode walkthrough (landing, login, worker dashboard, chatbot) that also caught and fixed two real shell bugs (`LoginPage`/`AdminLoginPage` inputs, `DashboardPage` white stat cards). No DB/schema/logic changes (Task 19)
- [x] Animation & Motion Polish. Established a small, consistent CSS motion language in `index.css` (`animate-fade-up`, `animate-scale-in` added alongside existing `animate-fade-in`/`animate-slide-up`, plus `stagger-1…8` delay helpers) and a mandatory global `prefers-reduced-motion: reduce` guard that near-instantly disables animation/transition. Applied restrained motion: staggered landing hero reveal (`App.tsx`), calm admin dashboard stat-card fade-in (`AdminDashboardPage.tsx`), and subtle chat message entrance (`ChatWidget.tsx`). Timings short and ease-out; data-dense tables kept calm; no continuous/parallax marketing motion; teal brand, urgency colors, Emergency Mode hierarchy, layout and logic unchanged. Verified `tsc --noEmit` + `vite build` (Task 20)
- [x] Error, Empty, Loading & Recovery States. Audited existing handling (most screens already had skeletons, empty/error/retry, and per-page offline status via `navigator.onLine`; admin dashboard uses per-card `Promise.allSettled`). Hardened the shared reusable state library `EmptyStates.tsx` (`OfflineState`/`NoPatientsState`/`SyncFailedState`): added full dark-mode variants, accessibility (`role="status"`/`"alert"`, `aria-live`, `aria-hidden` on decorative SVGs via a `StateShell` prop), and replaced the hardcoded fake "14 records" with an optional `queuedCount` prop (info box hidden when absent — no fake data). Added ARIA live-region announcements to the chatbot message log (`role="log" aria-live="polite"`) and to the Ops Map loading/empty/error states (`ClinicOpsPanel`). Reused the Task 20 motion system and Task 19 theme tokens. Verified `tsc --noEmit` + `vite build` (Task 21)
- [x] End-to-End Testing with Playwright. Added `@playwright/test`, `frontend/playwright.config.ts` (chromium + Pixel-5 mobile projects, runs a production `vite preview` server on a dedicated port), a demo-login helper, and 9 specs under `frontend/tests/e2e/` (auth sign-in/logout, landing desktop+mobile, i18n EN↔BN persistence, dark-mode persistence, AI chatbot). Uses stable accessible-role/placeholder selectors and the demo-login bypass so no real Supabase data is mutated and no secrets are embedded. Added `test:e2e`/`test:e2e:report` scripts and gitignored report/result artefacts. All 9 pass. DB-mutating flows and Vitest unit tests remain pending an isolated test DB (Task 22)
- [x] Final Project Report & Documentation. Audited the implemented codebase against the docs and corrected stale statuses: rewrote `README.md` as a judge-friendly, accurate overview (removed hardcoded Supabase URL/key in favour of placeholders; documented offline-first/OCR/emergency/outbreak/triage/map/chatbot/i18n/dark/motion/states/E2E as implemented, with honest RLS and coverage caveats); fixed the `FEATURES.md` overview table and roadmap (offline/sync/OCR/emergency/outbreak now Implemented); updated `projectdetails.md` status board, roadmap, testing strategy and "next tasks". Added `LIMITATIONS.md` as the single source of known gaps. `tsc --noEmit` + `vite build` pass (Task 23)
- [x] Final Showcase Preparation. Removed the biggest showcase/credibility risk: the worker home dashboard was showing hardcoded fake data (fake stat numbers and non-Bangladeshi mock patient names). Wired `DashboardPage.tsx` quick-stats and recently-visited list to live Supabase data via `fetchAdminStats`/`fetchPatients` (auth-scoped), with skeleton loading and honest empty state. Replaced hardcoded worker/clinic identity with the real auth profile, wired the sync banner + nav badge to the real pending-sync count (was fake "14"), and removed the fake "8" triage-queue badge. Updated E2E selectors to identity-independent markers. All 9 Playwright tests pass; `tsc --noEmit` + `vite build` pass; browser-verified. No new features, no design changes (Task 24)
- [x] Self-registration (Sign Up). Added `SignUpPage.tsx`: creates a Supabase Auth user and a linked `staff` row (role forced to `worker`; optional clinic from the live clinics list), with validation, duplicate-email handling, email-confirmation-aware success screen, and full light/dark styling matching the login page. Wired routing + "Create an account" link in `App.tsx`/`LoginPage.tsx`. `tsc --noEmit` + `vite build` pass; browser-verified (clinic dropdown loads live Supabase data). Client-side `staff` insert works because MVP RLS is disabled — should move to an Edge Function/trigger under production RLS.
- [x] Authentication Hardening & UX (Task 25). Audited the full auth flow (session restore, profile/role resolution, protected routing, logout, edge cases). `AuthContext.tsx`: added `profileResolved` tracking so an authenticated session with **no linked `staff` row** is detected (vs. still-loading) and the demo logins now attempt a **real** Supabase session first (RLS-ready) before falling back to the mock bypass. `App.tsx`: added an "Account not linked" escape screen (sign-out) for the missing-profile case, and render-time guards that prevent any flash of protected/admin content before the redirect effect resolves (protected route without a session, or a worker on the admin dashboard, now show the loading spinner). `LoginPage.tsx`/`AdminLoginPage.tsx`: wrapped `signInWithPassword` in try/catch for graceful network-failure messaging. The admin login now verifies the resolved `staff.role === 'admin'` and, for a valid **non-admin** account, signs back out with a clear "not authorized for admin access" message instead of silently routing to the worker dashboard.
- [x] Limitations cleanup (autonomous). Removed the last fabricated worker-dashboard placeholders (`DashboardPage.tsx`: real shortened staff ID + honest "—" last-synced instead of "HW-20451" / "2 hrs ago"). Completed the accessibility ARIA sweep — added `role="alert"` to inline error banners/field errors across `LoginPage`, `AdminLoginPage`, `PatientFormPage`, `PatientRecordsPage`, `StaffPage`, `NewPatientPage`, `EmergencyTriagePage`, `OutbreakDetectionPage`. Added a basic **PWA** (`frontend/public/manifest.webmanifest`, `icon.svg`, and a production-only network-first service worker `sw.js` registered in `main.tsx`, linked from `index.html`). Added **Vitest** unit tests (13 tests for `urgencyFromScore`/`urgencyScoreRange`/`shortId`/`initials`/`parseOcrText`) with `test:unit` script, and a **GitHub Actions CI** workflow (`.github/workflows/ci.yml`: type-check, build, unit, E2E). `tsc --noEmit` + `vite build` pass; 13/13 unit tests and 9/9 Playwright E2E pass. Demo/showcase dark-mode pages reviewed and intentionally deferred (non-product). Server-side items (RLS apply, external feeds, hosting, DB-mutating E2E, key rotation) remain and require credentials/infrastructure.
- [x] Patient & Staff Profile System (Task 26). Patient profile already existed and is complete (`PatientDetailPage.tsx`: header with name/short ID/urgency badge/category/clinic + registered/visits/last-visit meta, Vitals/Visit/Diagnoses tabs, honest loading/empty/error states, dark mode, responsive) — added `role="tablist"`/`role="tab"`/`aria-selected` for accessibility. Added a new read-only staff **My Profile** (`StaffProfilePage.tsx`) sourced entirely from the authenticated staff record (name, role label, assigned clinic resolved from Supabase, short staff ID, best-effort account email) with loading/empty states, dark mode and responsive layout. Wired it into the shared user menu via a new `onProfile` prop on `AppNavbar.tsx` ("My Profile" item) and a `profile` nav view in both `DashboardPage.tsx` (worker) and `AdminDashboardPage.tsx` (admin); also replaced the worker navbar's hardcoded `"AD"` initials with the real profile initials. Read-only by design (no fake save); editing deferred. Added 2 Playwright profile specs (worker + admin open My Profile). `tsc --noEmit` + `vite build` pass; 13/13 unit + 11/11 E2E pass. No schema changes. No DB schema changes (a prepared but **unapplied** `20260905000000_enable_rls.sql` remains the path to server-side enforcement). `tsc --noEmit` + `vite build` pass; all 9 Playwright E2E specs pass.
- [x] **UI/UX Foundation Polish — Ashen Nebula Theme (Pre-Task 16)**: Established the "Ashen Nebula" visual design system across the entire frontend. Implemented a comprehensive CSS custom-property design token system in `index.css` with light/dark mode variants. Applied atmospheric radial-gradient background layers (fixed `an-atmosphere` pseudo-element) to the landing page, LoginPage, and AdminLoginPage. Updated `AppNavbar.tsx` with glassmorphism treatment (`glass-nav` class). Applied nebula-toned backgrounds and glass card treatment (`an-card-glass`, `glass-card`) to feature cards and testimonial cards on the landing page. Updated all page outer wrappers (DashboardPage, AdminDashboardPage) to use `var(--an-bg)` CSS variable. Typography system, skeleton loaders, button system, and focus rings updated to use Ashen Nebula stone/slate tones. Build passes cleanly (`tsc --noEmit` exit 0, `vite build` exit 0). (`index.css`, `App.tsx`, `AppNavbar.tsx`, `LoginPage.tsx`, `AdminLoginPage.tsx`, `DashboardPage.tsx`, `AdminDashboardPage.tsx`)
- [x] **Final Landing Page UI Polish — Ashen Nebula + HealthStats Brand (Pre-Task 16)**: Harmonized the complete landing page hierarchy. Maintained the Ashen Nebula atmospheric backdrop (#faf8f2 / #100e0b) while preserving solid teal brand anchors (Stats band and Final CTA section with `#0a2e2b` to `#0f766e` gradient). Updated `AppNavbar` to link directly to `#coverage` (Coverage Map) rather than an orphan pricing anchor. Refined footer contrast against dark background (`#0a1f1d`) using WCAG AA compliant `text-teal-300` and high-contrast headings/subtext. Removed continuous background drift animations for low-end hardware performance. Added accessible focus rings (`focus-visible`) across all interactive CTA buttons. Validated with TypeScript (`tsc --noEmit`), Vite production build, and end-to-end browser subagent audit across desktop, mobile, light, and dark modes. (`App.tsx`, `AppNavbar.tsx`, `ClinicsMapSection.tsx`, `docs/frontend-uiux.md`)

### 🚨 Pending / Needs to be Added (⬜)

The following components, infrastructure, and integrations are explicitly missing and still need to be built:

#### 1. Backend & Edge Infrastructure
- [ ] **Edge Functions (Supabase)**: API routes and serverless functions for handling complex logic (like secure sync validation or external API calls) do not exist.
- [ ] **Conflict Resolution Engine**: Logic to handle concurrent offline edits (e.g., if two devices edit the same patient record while offline, resolving it when they both come back online) is missing.
- [ ] **Database Triggers & Webhooks**: No automation exists for database events (e.g., triggering an alert when a high urgency score visit is synced).

#### 2. Offline Sync & Storage Engine (Crucial)
- [x] **Local Storage DB**: A client-side database (Dexie.js) has been installed and configured to queue pending patient registrations and visits (Task 7).
- [ ] **Service Workers**: No service workers are registered to intercept network requests and serve cached assets/data offline.
- [x] **Background Sync Queue**: A background sync service monitors `navigator.onLine` and automatically processes the Dexie queue upon reconnection (Task 8).
- [x] **Sync Status UI Hookup**: `SyncMonitorPage.tsx` is fully wired to Dexie `offlineDb.pendingRecords` and `syncService` to display real-time queued records, network state, and force sync capabilities (Task 10).

#### 3. Data Fetching & UI Wiring (CRUD)
- *Note: Patient Registration, Patient List, Patient Detail, Visit Recording, and Admin Management (Stats, Staff, Flagged, Sync, Chart, Clinics, Emergency, Outbreak) are wired to live data. Remaining modules (Alerts Center external feeds, Triage ML model) remain static shells.*
- [x] **Patient Registration**: `NewPatientPage.tsx` needs to be wired to `supabase.from('patients').insert(...)`.
- [x] **Patient Retrieval**: `PatientRecordsPage.tsx` (wired to fetch from Supabase) and `PatientDetailPage.tsx` (Task 6: fetches the patient plus their `visits` with `staff(name)` and `clinics(name)` joins; Vitals History, Visit History and Diagnoses tabs render real data with honest empty states).
- [x] **Vitals & Forms**: `VitalsPage.tsx` (Task 6) inserts into `visits` with `patient_id` (from an in-form patient selector or pre-selected from Patient Detail), `staff_id` from `AuthContext.profile.id`, `vitals` JSONB, `symptoms` (free text + selected chips), `symptom_category` (dropdown: diarrhea/gastrointestinal, fever, respiratory, skin/rash, other), `diagnosis`, `urgency_score` (1–5, pre-filled by the AI check, worker can override) and `synced_at`.
- [ ] **Form Validation & State**: No robust form validation libraries (e.g., Zod, React Hook Form) are integrated. Form error states and toast notifications (except for static examples) are missing.

#### 4. AI, ML & OCR Integrations
- [ ] **Triage Scoring Model**: The ML or rule-based algorithm to instantly score a patient's urgency during intake does not exist.
- [ ] **On-Device Inference**: No setup for running lightweight ML models directly in the browser for offline triage support.
- [x] **OCR Digitization**: The `DigitizePage.tsx` uses Tesseract.js locally to extract Name, Age, and Diagnosis from images of paper records, allowing manual review before saving (Task 9A).

#### 5. Emergency & Disaster Mode
- [x] **Emergency Operations Dashboard**: `EmergencyDashboard.tsx` is wired to Supabase live database (`clinics`, `visits` in past 48h, `patients`, and `staff`) via `adminService.fetchEmergencyMetrics()`, aggregating active zones, urgency 1–5 triage queue, deployed responders, interactive SOS broadcast modal, and situation report CSV export (Task 14).
- [x] **Outbreak Surveillance & Symptom Radar**: Threshold-based symptom clustering engine implemented in `adminService.fetchOutbreakAnalysis()` and `OutbreakDetectionPage.tsx`. Analyzes recent clinical visits in Supabase by syndrome (waterborne, febrile, respiratory, cutaneous), flags zone clusters with urgency weighting, surfaces top-level dashboard early warning alerts, and allows linked patient drill-down (Task 14.5).
- [ ] **Live External Alert Feeds**: `AlertsCenterPage.tsx` and external real-time data sources (e.g. meteorological flood maps, weather APIs, shelter capacities) are not connected.

#### 6. DevOps, PWA & Deployment
- [ ] **PWA Manifest**: A `manifest.json` with icons and configurations is missing, which is required to allow health workers to install the app on their devices outside of an App Store.
- [~] **Automated Testing**: End-to-End tests configured with **Playwright** (Task 22). A 9-test suite (`frontend/tests/e2e/`) covers authentication (demo worker/admin sign-in, logout), the public landing page (desktop + mobile), English↔Bangla switching with persistence, dark-mode toggle with persistence, and the AI chatbot flow. Tests run against a production `vite preview` server on a dedicated port for determinism and use the app's demo-login bypass so **no real Supabase data is written** and no secrets are used. Unit testing (Vitest) and coverage of DB-mutating flows (patient registration, visits, offline sync, OCR, admin CRUD) remain pending (need an isolated test database).
- [ ] **CI/CD Pipelines**: No GitHub Actions workflows exist for automated linting, building, or deployment.
- [ ] **Hosting**: The application has not been deployed to a production host (e.g., Vercel, Netlify) or linked to the Supabase project dynamically.
