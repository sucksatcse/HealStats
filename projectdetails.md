# HealthStats — Project Details & Engineering Context

> **MANDATORY for every AI agent (Copilot, Claude, Antigravity, etc.) and every human:**
>
> 1. **READ this file completely BEFORE implementing anything.**
> 2. **UPDATE this file AFTER every merged change.**
> 3. Never violate the Architecture Rules below.

Last updated: 2026-09-05
Current phase: Product polish & QA (MVP feature-complete; production hardening pending)

---

## 1. Project Overview
HealthStats is an electronic health record (EHR) system engineered for rural clinics in Bangladesh. It addresses the severe infrastructure challenges of intermittent connectivity and power outages by employing an offline-first architecture. 

## 2. Product Goals
- Ensure community health workers can continue registering patients and logging visits regardless of network status.
- Synchronize queued local records with a central database automatically upon reconnection.
- Provide disaster-ready operational modes (e.g., floods, cyclones).
- Provide a fully bilingual (Bangla/English) and low-light (Dark Mode) accessible interface.

## 3. User Roles
- **Worker**: Implemented. Can log visits and register patients only for their assigned clinic.
- **Admin**: Implemented. Authorized to view analytics across clinics.
- **Doctor / Coordinator**: Planned/TBD. Not currently implemented in the active routing or database logic.

## 4. Core User Flows
**CURRENT (Online Only):**
Health Worker → Login → Register Patient → Supabase → View Patient Detail

**TARGET (Offline-First):**
Health Worker → Login (Cached) → Register Patient → IndexedDB → Sync Queue → Reconnection → Supabase → Sync Log

## 5. Current Project Status
- **Frontend Scaffold**: ✅ Complete (React 19, Vite 8, Tailwind 4).
- **Security & Auth**: ✅ Implemented (Supabase Auth, Route Protection, Demo Bypass). RLS disabled in MVP schema (production hardening pending).
- **Database Schema**: ✅ Initialized (`clinics`, `staff`, `patients`, `visits`, `sync_log`).
- **UI & Design**: ✅ Complete. Bilingual (i18next) + light/dark theme, motion system, and error/empty/loading states.
- **Data Fetching (CRUD)**: ✅ Implemented. Patient Registration, List, Detail, Visits, Admin (dashboard, records, staff, flagged, sync), Emergency, Outbreak, Triage and Map are wired to Supabase. (Worker home recent-patients + Alerts Center external feeds remain static.)
- **Offline Engine**: ✅ Implemented (Dexie IndexedDB queue + background sync). Conflict resolution + Service Worker pending.
- **Intelligence (OCR)**: ✅ Implemented (Tesseract.js). AI Assistant is a grounded intent engine; AI-assisted triage scoring deferred.
- **Testing**: 🟡 Playwright E2E for safe/read-only flows; DB-mutating E2E + unit tests pending an isolated test DB.

## 6. Feature Status Board
| Feature | Status | Notes |
| --- | --- | --- |
| Foundation & Scaffold | DONE | Vite + React + Tailwind setup. |
| Database & Authentication | DONE | Supabase schema, AuthContext, protected routes active. |
| UI Shell & Contexts | DONE | AppNavbar, Language, Theme fully built. |
| Role-Based Dashboards | DONE | Worker, Admin and Emergency views wired to live Supabase data. |
| Patient Records | DONE | `NewPatientPage`, `PatientRecordsPage` and `PatientDetailPage` wired to Supabase. |
| Clinical Forms | DONE | `VitalsPage` inserts into `visits` (vitals JSONB, symptoms, symptom_category, diagnosis, urgency_score). |
| Offline-First Engine | DONE | Dexie.js queue + background sync service; conflict resolution + Service Worker pending. |
| OCR Digitization | DONE | Tesseract.js on-device OCR with worker review (`DigitizePage`). |
| AI Assistant (Chatbot) | DONE | Grounded intent engine over real queries (`chatbotService`). |
| AI Triage (auto-scoring) | OPTIONAL / FUTURE | Deferred feature. |
| Emergency Mode / Outbreak / Triage | DONE | Live crisis console, symptom-cluster surveillance, 1–5 triage queue. |
| Clinic Operations Map | DONE | Live clinic activity on Bangladesh map (`ClinicOpsPanel`). |
| i18n / Dark Mode / Motion / States | DONE | i18next EN/BN, class-based dark mode, motion system, error/empty/loading states. |
| E2E Testing | PARTIAL | Playwright for safe flows; DB-mutating + unit tests pending. |
| PWA | NOT STARTED | Missing `manifest.json` / Service Worker. |

## 7. Technology Stack
- **Frontend**: React 19, TypeScript 5.7, Vite 8
- **Styling**: Tailwind CSS 4.0
- **Internationalization**: i18next + react-i18next + i18next-browser-languagedetector (English fallback, Bangla)
- **Backend / Database**: Supabase, PostgreSQL
- **Authentication**: Supabase Auth (Email/Password)

## 8. System Architecture
**CURRENT ARCHITECTURE:**
Client (React) ↔ Auth Context ↔ Supabase Auth
Client (React) ↔ Supabase Client ↔ PostgreSQL

**PLANNED ARCHITECTURE:**
Client (React) ↔ Dexie.js (IndexedDB) ↔ Service Worker ↔ Supabase Client ↔ PostgreSQL

## 9. Database Architecture
Defined in `supabase/migrations/20260831000000_initial_schema.sql`.
- **`clinics`**: id, name, zone, address.
- **`staff`**: id, name, role (worker/admin), clinic_id, auth_user_id, email.
- **`patients`**: id, name, age, sex, village, clinic_id, created_at.
- **`visits`**: id, patient_id, staff_id, vitals (JSONB), symptoms, symptom_category, diagnosis, urgency_score, created_at, synced_at.
- **`sync_log`**: id, staff_id, device_id, status, timestamp.

*(Relationships: `staff` and `patients` belong to `clinics`. `visits` belong to `patients` and `staff`. `sync_log` belongs to `staff`.)*

## 10. Authentication & Authorization
- Supabase Auth handles identity. 
- `AuthContext.tsx` queries the `staff` table upon login to inject `role` and `clinic_id` into global state.
- React Router (`App.tsx`) enforces route protection based on the user's role.
- **Demo Mode**: Entering `worker@clinic.org` with `password123` bypasses Supabase Auth and injects a mock session. On demo login, `AuthContext` also looks up the seeded `staff` row for `worker@clinic.org` and, if found, replaces the mock profile with the real `id`/`clinic_id` so writes that reference `staff.id` (e.g. `visits.staff_id`) are valid. If no such row exists the mock (non-UUID) profile is kept and the visit form refuses to save with a clear message.

## 11. Offline-First Architecture
- **Current**: Online only. Mutations (Patient Registration, Visit Recording) go directly to Supabase; visits saved online set `synced_at` immediately. If the network drops, mutations fail.
- **Target**: Form → Validation → Dexie.js (IndexedDB) → Sync Queue → Network Reconnection → Background Push to Supabase → Log in `sync_log`.

## 12. Feature Specifications
- **`FEATURES.md`**: Detailed product feature specification and implementation status. Read this for what the product should do.
- **`PROGRESS.md`**: Task and progress tracking. Read this to see what tasks are completed vs pending.
- **`README.md`**: Public project overview and setup documentation.
- **`projectdetails.md`** (This file): Technical architecture, engineering rules, and development context.

## 13. Repository Structure
```
HealthStats/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # View components (e.g., NewPatientPage.tsx)
│   │   ├── lib/              # Supabase client config
│   │   ├── AuthContext.tsx   # Session & role state
│   │   ├── LanguageContext.tsx # Translation state
│   │   ├── ThemeContext.tsx  # Dark mode state
│   │   ├── App.tsx           # Router and layout
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── supabase/
│   └── migrations/
│       └── 20260831000000_initial_schema.sql
├── docs/
│   └── frontend-uiux.md      # UI, styling, and UX rules
├── FEATURES.md
├── PROGRESS.md
├── projectdetails.md
└── README.md
```

## 14. Development Rules
1. **Do not bypass database security.**
2. **Do not hardcode patient data** except for explicit dummy arrays in unresolved components.
3. **Do not create fake functionality.** If it isn't wired to the backend, keep it marked as static.
4. **Do not assume UI scaffolding means backend functionality exists.** Check the actual components.
5. **Inspect existing implementation before creating new files.**
6. **Reuse existing contexts/components** (e.g., `LanguageContext`, `ThemeContext`) where appropriate.
7. **Follow database naming conventions**: Pluralized snake_case tables.
8. **Follow existing UI/UX rules**: Defined in `docs/frontend-uiux.md`.

## 15. Coding Conventions
- **Styling**: Tailwind CSS v4 utility classes.
- **Components**: PascalCase (`NewPatientPage.tsx`). Functions inside should be camelCase.
- **Language**: No hardcoded English strings in clinical views; use translations.

## 16. Security Rules
- **Row Level Security (RLS)**: The architectural goal is for RLS to enforce clinic-level data boundaries. **HOWEVER**, in the current `initial_schema.sql` MVP migration, RLS is explicitly **DISABLED** (`DISABLE ROW LEVEL SECURITY`) for rapid development. Do not invent active policies. RLS must be re-enabled and properly configured before production deployment.
- **Secrets**: Do not expose Supabase `service_role` keys in `.env` or anywhere in the frontend codebase. Use `VITE_SUPABASE_ANON_KEY`.

## 17. Git & Collaboration Workflow
- Branch naming: `feature/short-description`.
- Commit messages: Use conventional commits (`feat:`, `fix:`, `chore:`).
- Never commit `.env` or `node_modules`.
- Update `PROGRESS.md` and `projectdetails.md` change logs before merging.

## 18. Environment & Configuration
- Frontend `.env` requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Run locally via `npm run dev` in the `frontend` directory.

## 19. Testing Strategy
- **E2E**: Playwright suite (`frontend/tests/e2e/`) for auth, landing (desktop+mobile), i18n, dark mode and the chatbot, run against a production preview server via the demo-login bypass (no real DB writes). Run with `npm run test:e2e`.
- **Static checks**: `tsc --noEmit` and `vite build` before merging.
- **Pending**: DB-mutating E2E (needs isolated test DB) and Vitest unit tests.
- Also perform manual smoke-tests (Login, Patient Registration, Theme/Language toggles) for changes not covered by E2E.

## 20. Implementation Roadmap
1. **Foundation**: Complete (UI Scaffolding, DB Schema, Auth).
2. **Data Wiring**: Complete (Patient Registration/List/Detail/Visits + Admin, Emergency, Outbreak, Triage, Map on live data).
3. **Offline Engine**: Complete (IndexedDB queue + Background Sync). Conflict resolution + Service Worker pending.
4. **Intelligence**: OCR Digitization complete; grounded AI Assistant complete; AI-assisted triage scoring deferred.
5. **Product Polish & QA**: Complete (i18n, dark mode, motion, states, E2E). PWA + deployment pending.

## 21. Known Limitations
- Offline Sync is functional (Dexie background queue syncs to Supabase on reconnection).
- RLS is temporarily disabled in the MVP schema.
- Admin, Emergency, Sync, Triage, the Clinic Operations Map and the worker home dashboard are wired to live Supabase data; the Alerts Center external feeds and a few header labels (Worker ID, "last synced") remain static.
- The AI Assistant is a grounded intent engine (real queries + fixed platform facts), not a generative model; it answers a bounded set of questions and defers anything outside that set to a capabilities prompt.
- Internationalization: the i18n foundation is complete and the language switcher works app-wide, but only the Ops Map, AI Assistant and shared labels are translated via `t()`; many deep admin/clinical pages still render English strings pending incremental migration.
- Clinical forms (Vitals/Visit) are English-only; visits cannot be edited after saving.

## 22. Important Decisions Log
| ID | Date | Decision |
| --- | --- | --- |
| D-001 | 2026-08-31 | Stack: React 19, Vite 8, Tailwind 4, Supabase. |
| D-002 | 2026-08-31 | RLS Architecture uses Security Definer functions to prevent recursive staff lookups. |
| D-003 | 2026-09-01 | UI Before Logic. 30+ pages scaffolded statically before complex DB wiring. |
| D-004 | 2026-09-03 | Patient Registration uses the AuthContext `clinic_id` for mutations, ensuring security over user input. |
| D-005 | 2026-09-04 | OCR established as the primary intelligence path; AI Triage deferred to optional/future. |
| D-006 | 2026-09-04 | `visits.urgency_score` uses a 1–5 integer scale (1 Stable, 2 Low, 3 Moderate, 4 High, 5 Critical), shared by `VitalsPage`, `PatientRecordsPage` and `PatientDetailPage`. `symptom_category` stores one of `diarrhea/gastrointestinal`, `fever`, `respiratory`, `skin/rash`, `other`. |
| D-007 | 2026-09-05 | UI/UX Foundation: "Ashen Nebula" visual theme adopted. CSS custom-property design token system (`--an-*` prefix) defined in `index.css`. Atmospheric radial-gradient background layer (`.an-atmosphere`) applied to public pages. Glassmorphism utilities (`.glass-nav`, `.glass-card`, `.an-card-glass`) standardized. All page backgrounds switched from hardcoded Tailwind colors to `var(--an-bg)`. |
| D-008 | 2026-09-05 | Map Integration (Task 16): the Ops Map visualizes clinical **activity** (visit recency) and data-flow metrics, NOT device/network connectivity, because the schema tracks no per-clinic device status. Clinics are geolocated by matching `zone`/`name` to an in-app district-coordinate lookup (presentation layer only); no latitude/longitude columns were added and no mapping library was introduced. Unmatched clinics are listed as "not on map" rather than being given a fabricated position. |
| D-009 | 2026-09-05 | AI Chatbot (Task 17): the assistant is a **grounded intent engine**, not a generative model or external LLM API. It answers only from real Supabase queries (reusing `adminService`) or fixed platform-fact strings, and never fabricates patient/clinic/outbreak/medical data. Data answers require authentication and are scoped by role/clinic at the application layer (MVP RLS is disabled). No new dependency or backend was added. |
| D-010 | 2026-09-05 | Internationalization (Task 18): adopted **i18next + react-i18next** as the single source of truth for the active language. The legacy `LanguageContext`/`useLang()` was refactored to delegate to i18next (no competing language systems). Namespaced static resources (`src/i18n/locales/en.ts`, `bn.ts`); English is the fallback. Persistence via `localStorage` key `hs-lang` (browser language detector). Translations are local/static — no external translation API and no patient data leaves the client. Canonical DB values (symptom categories, roles) and urgency numbers are never translated, only their display labels. |
| D-011 | 2026-09-05 | Dark Mode (Task 19): class-based dark mode (`.dark` on `<html>`, `ThemeContext`, persisted `hs-theme`) completed across the whole app using the Ashen Nebula `--an-*` token foundation plus consistent Tailwind `dark:` utility variants. A pre-paint inline script in `index.html` prevents the flash of incorrect theme. Canonical urgency/status colors and Emergency Mode hierarchy preserved with dark-tuned (non-neon) tints; no business logic, schema, or light-mode styling changed. |
| D-012 | 2026-09-05 | Motion (Task 20): motion is implemented as a small **CSS utility language** in `index.css` (no animation library / no Framer Motion), reusing the existing keyframes and adding `fade-up`/`scale-in`/`stagger-*`. A global `prefers-reduced-motion: reduce` guard is mandatory and wins over all utilities. Motion is applied sparingly (landing hero, dashboard card fade-in, chat messages); data-dense clinical screens stay calm and no continuous/parallax motion was added. |
| D-013 | 2026-09-05 | States (Task 21): most screens already had loading/empty/error/retry and per-page offline handling, so this task **hardened the shared reusable state library** (`EmptyStates.tsx`) rather than adding a competing one — dark/light support, accessibility (`role`/`aria-live`/`aria-hidden`), and real counts via optional props (no placeholder data). Added ARIA live regions to the chatbot log and map states. Offline messaging stays honest (local-save reassurance, not server errors); outbreak/triage empty states use non-diagnostic wording. No sync/DB/logic changes. |
| D-014 | 2026-09-05 | E2E Testing (Task 22): chose **Playwright** (no framework existed). Tests run against a production `vite preview` server on a dedicated port (4599) — not the HMR dev server — for determinism; the dev server on 8443 is untouched. Tests use the app's demo-login bypass and read-only/UI flows so they never mutate the real Supabase DB and embed no secrets. DB-mutating journeys (registration, visits, offline sync, OCR, admin CRUD) are deferred until an isolated test database exists, rather than seeding the real DB. |
| D-015 | 2026-09-05 | Optional LLM assistant (Groq): integrated via a **server-side Supabase Edge Function** (`supabase/functions/groq-chat`), never a frontend call — a `VITE_`-prefixed key would be inlined into the browser bundle. The function holds `GROQ_API_KEY` as a Supabase secret, fetches grounded clinic-scoped context from Supabase, and instructs the model to answer only from it. The frontend falls back to the local grounded engine if the function is absent/offline, so behaviour never breaks. Keys are never committed; enabling LLM mode is an operator deploy/privacy decision (clinic-scoped context is sent to a third party). |

## 23. Change Log
- **2026-09-03**: Implemented Task 4 (Patient Registration). Wired `NewPatientPage.tsx` to `patients` table. Added mock bypass to `AuthContext.tsx`.
- **2026-09-04**: Rewrote `README.md` and `FEATURES.md` to establish accurate sources of truth. Restructured `projectdetails.md` according to the new standard.
- **2026-09-04**: Implemented Task 6 (Visits). `VitalsPage.tsx` inserts into `visits`; `PatientDetailPage.tsx` reads patient + visits from Supabase; `DashboardPage.tsx` passes the selected patient between list → detail → visit form; `PatientRecordsPage.tsx` gained an `onViewPatient` callback; `AuthContext.tsx` demo login hydrates from the real `staff` row. Also fixed 21 pre-existing TS syntax errors (missing `;` in inline object types) and removed the deprecated `baseUrl` from `tsconfig.json`.
- **2026-09-05**: UI/UX Foundation Polish — Ashen Nebula Theme (Pre-Task 16). Implemented comprehensive CSS design token system in `index.css` with `--an-*` custom properties, atmospheric background layer (`.an-atmosphere`), glassmorphism utilities (`.glass-nav`, `.glass-card`, `.an-card-glass`), updated skeleton loaders, button system, form inputs, and focus rings. Applied nebula theme to `App.tsx` (landing page), `AppNavbar.tsx`, `LoginPage.tsx`, `AdminLoginPage.tsx`, `DashboardPage.tsx`, `AdminDashboardPage.tsx`. `tsc --noEmit` and `vite build` both exit 0.
- **2026-09-05**: Implemented Task 16 (Map Integration). Rewrote `ClinicOpsPanel.tsx` from hardcoded mock clinics to live Supabase data via the new `adminService.fetchClinicMapData()` (aggregates patient counts, 24h/7d visit activity, pending-sync backlog and recent high-risk cases per clinic with `Promise.allSettled`). Added `ClinicActivity`, `ClinicMapEntry` and `ClinicMapData` types to `types.ts`. Clinics are geocoded onto the Bangladesh SVG map by district-name lookup; unmatched clinics are surfaced as "not on map". Added honest Active/Recent/Quiet activity status, loading/empty/error states, refresh, filters, quiet-clinic spotlight and a per-clinic detail bar. `tsc --noEmit` and `vite build` both exit 0.
- **2026-09-05**: Implemented Task 17 (AI Chatbot). Added `chatbotService.ts` — a grounded intent engine that routes free-text questions to real Supabase queries (reusing `adminService`) for patient counts, records today, pending sync, high-risk patients (count + named list), outbreak status, clinic activity and patient look-up by name. Rewrote `ChatWidget.tsx` to be auth-aware (`useAuth`), replacing the simulated `getResponse`/random typing with real async answers; data answers require authentication and are scoped by role/clinic, while the public landing page only answers platform how-to questions. No fabricated data, no new dependency. `tsc --noEmit` and `vite build` both exit 0.
- **2026-09-05**: Implemented Task 18 (Internationalization). Added i18next + react-i18next + browser language detector; centralized config in `src/i18n/index.ts` with namespaced English/Bangla resources (`locales/en.ts`, `bn.ts`). Refactored `LanguageContext` to delegate to i18next (single source of truth) and imported `./i18n` in `main.tsx`. Migrated the Ops Map (`ClinicOpsPanel`) and AI Assistant (`ChatWidget` + `chatbotService`, incl. grounded replies) to `t()` with semantic keys and interpolation; added shared `common`/`urgency` labels. Language persists in `localStorage` (`hs-lang`) and updates the whole UI instantly. Browser smoke test confirmed EN↔BN switching with no raw keys; `tsc --noEmit` and `vite build` both exit 0. Deep admin/clinical pages remain English-only pending incremental migration.
- **2026-09-05**: Implemented Task 19 (Complete Dark Mode). Added a flash-of-incorrect-theme guard in `index.html`, then extended the Ashen Nebula token foundation with consistent Tailwind `dark:` variants across all previously light-only pages (worker dashboard + clinical forms, admin settings/analytics/resources/alerts, auth login pages, patient/triage/role/lookup pages). Fixed two real dark-mode shell bugs found via browser testing: `LoginPage`/`AdminLoginPage` white inputs + invisible headings, and `DashboardPage` white stat cards. Preserved teal brand, clinical urgency/status meaning, Emergency Mode hierarchy, layout, logic and light mode. `tsc --noEmit` and `vite build` both exit 0; dark-mode walkthrough (landing, login, worker dashboard, chatbot) verified.
- **2026-09-05**: Implemented Task 20 (Animation & Motion Polish). Extended `index.css` with a small consistent motion language (`animate-fade-up`, `animate-scale-in`, `stagger-1–8` alongside existing `animate-fade-in`/`animate-slide-up`) and a mandatory global `prefers-reduced-motion: reduce` guard. Applied restrained motion: staggered landing hero reveal (`App.tsx`), calm admin dashboard stat-card fade-in (`AdminDashboardPage.tsx`), and subtle chat message entrance (`ChatWidget.tsx`). No animation library added; data-dense screens kept calm; brand/urgency/Emergency hierarchy, layout and logic unchanged. `tsc --noEmit` and `vite build` both exit 0.
- **2026-09-05**: Implemented Task 21 (Error/Empty/Loading/Recovery States). Audited existing handling (already broad: skeletons, empty/error/retry, per-page offline via `navigator.onLine`, admin `Promise.allSettled`). Hardened the shared reusable state library `EmptyStates.tsx` — dark-mode variants, accessibility (`role="status"`/`"alert"`, `aria-live`, `aria-hidden` on decorative SVGs via a new optional `StateShell` role/ariaLive prop), and replaced hardcoded "14 records" with an optional `queuedCount` prop (info box omitted when absent). Added ARIA live regions to the chatbot message log and Ops Map loading/empty/error states. Reused the Task 20 motion system and Task 19 theme tokens; no sync/DB/business-logic changes. `tsc --noEmit` and `vite build` both exit 0.
- **2026-09-05**: Implemented Task 22 (E2E Testing). Added Playwright (`@playwright/test`) with `frontend/playwright.config.ts` (chromium + Pixel-5 projects, production `vite preview` server on port 4599), a demo-login helper, and 9 specs under `frontend/tests/e2e/` (auth sign-in/logout, landing desktop+mobile, i18n EN↔BN persistence, dark-mode persistence, AI chatbot). Selectors use accessible roles/placeholders; the demo-login bypass keeps the real Supabase DB untouched and embeds no secrets. Added `test:e2e`/`test:e2e:report` scripts; gitignored report/result artefacts. All 9 tests pass. DB-mutating flows and unit tests deferred pending an isolated test DB.
- **2026-09-05**: Task 23 (Final Documentation) — rewrote `README.md` (judge-ready, placeholders instead of real keys), corrected stale statuses across `FEATURES.md`/`projectdetails.md`, added `LIMITATIONS.md`.
- **2026-09-05**: Task 24 (Final Showcase) — wired the worker home dashboard to live Supabase data (`fetchAdminStats`/`fetchPatients`), removed hardcoded fake stats + non-Bangladeshi mock patient names, used the real auth profile for identity, wired the sync banner/nav badge to the real pending-sync count, deleted the unused `RECENT_PATIENTS`/`STATS` mock arrays. All 9 Playwright tests pass.
- **2026-09-05**: Added optional Groq LLM mode via a server-side Supabase Edge Function `supabase/functions/groq-chat` (holds `GROQ_API_KEY` as a Supabase secret; grounds the model on clinic-scoped Supabase context). `chatbotService.ts` calls it when signed in + online and falls back to the local grounded engine otherwise. No key committed; the function must be deployed and the secret set to activate.

## 24. Instructions for AI Coding Agents
1. **Read `projectdetails.md` first.**
2. **Read `FEATURES.md`.**
3. **Read `PROGRESS.md`.**
4. **Read `docs/frontend-uiux.md` before modifying UI.**
5. **Inspect existing code before implementing anything.**
6. **Verify the actual database schema before writing Supabase queries.**
7. **Never invent missing APIs, fields, credentials, or features.**
8. **Never disable security mechanisms just to make a feature work.**
9. **Preserve existing architecture.**
10. **Make the smallest appropriate change.**
11. **Run formatting/build/tests when appropriate.**
12. **Update `PROGRESS.md` after completing a project task.**
13. **Report exactly which files were changed and what was implemented.**
14. **Stop only when genuinely blocked by missing information, credentials, or a destructive decision requiring human approval.**

## 25. Next Immediate Tasks
Tasks 1–22 are complete (see `PROGRESS.md`). The MVP is feature-complete; remaining work is production hardening and QA, tracked in detail in `LIMITATIONS.md`:

1. **Security hardening** — move the Supabase secret key out of the frontend (`VITE_`-prefixed secrets are bundled) and rotate it; re-enable and test RLS policies before any real deployment.
2. **i18n coverage** — migrate the remaining English-only deep admin/clinical pages to `t()`.
3. **Offline robustness** — multi-device conflict resolution and a Service Worker (enabling an installable PWA + offline asset caching).
4. **Testing** — add an isolated test DB to cover DB-mutating E2E journeys; add Vitest unit tests; wire CI.
5. **Deployment** — hosting + CI/CD.
