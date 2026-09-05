# HealthStats — Known Limitations & Follow-Ups

> A single tracking list of known limitations, deferred work, and honest gaps
> across the project. Nothing here is "broken" unless stated — these are items
> intentionally deferred or out of scope for their originating task.
>
> **Status legend:** ⬜ open · 🟡 partial · ✅ done
>
> Last updated: 2026-09-05 (auth hardening; ARIA sweep, unit tests, CI, PWA/service worker added; dashboard placeholders removed)

---

## 1. Security & Secrets (highest priority)

- 🟡 **Row Level Security (RLS) is DISABLED** in the active MVP migration
  (`supabase/migrations/20260831000000_initial_schema.sql`). Everything is
  code-ready to turn it on:
  - `20260905000000_enable_rls.sql` defines clinic-scoped policies (admin = all
    clinics, worker = own clinic; self-signup INSERT guarded to `role='worker'`).
  - The demo logins (`AuthContext.loginDemoUser/loginDemoAdmin`) now establish a
    **real Supabase session** first (so `auth.uid()` exists under RLS) and only
    fall back to the client-side bypass while the demo users are absent.
  Remaining to fully enable (needs Supabase credentials / dashboard access):
  (1) seed the two demo Auth users (`worker@clinic.org`, `admin@healstats.org`)
  and link their `staff` rows; (2) apply the migration to the project;
  (3) re-test every signed-in flow. Until then, access is gated at the app layer.
- ⬜ **Self-signup inserts the `staff` row from the client** (`SignUpPage.tsx`),
  which only works because RLS is disabled. Under production RLS this must move to
  an Edge Function or a DB trigger on `auth.users` insert. The role is hardcoded
  `worker` (never admin) as a safeguard.

---

## 2. Internationalization (Task 18)

- 🟡 **Partial translation coverage.** i18next is the single source of truth and
  the switcher works app-wide, but only these are translated via `t()`: the Ops
  Map (`ClinicOpsPanel`), the AI Assistant (`ChatWidget` + `chatbotService`),
  and shared `common`/`urgency` labels. The landing page, navbar and dashboards
  localize via legacy inline labels.
- ⬜ **Deep pages still render English strings** and need migration to `t()`:
  `StaffPage`, `PatientRecordsPage`, `PatientDetailPage`, `VitalsPage`,
  `NewPatientPage`, `PatientFormPage`, `PatientLookupPage`, `DigitizePage`,
  `SyncPage`, `SyncMonitorPage`, `FlaggedPatientsPage`, `EmergencyDashboard`,
  `EmergencyTriagePage`, `OutbreakDetectionPage`, `AnalyticsPage`,
  `ResourceAllocationPage`, `AlertsCenterPage`, `SettingsPage`, `TriagePage`,
  `EmergencyReportPage`, `RoleSelectionPage`, `LoginPage`, `AdminLoginPage`.

---

## 3. Dark Mode (Task 19)

- ⬜ **Demo/showcase pages not audited for dark mode:** `StyleGuidePage`,
  `ButtonStatesPage`, `SkeletonStatesPage`, `NavbarPreviewPage`,
  `SuccessConfirmationPage`, `SyncProgressPage`. Reviewed and intentionally
  deferred — these are only reachable via footer demo links, not the product flow.

---

## 4. Animation & Motion (Task 20)

- ⬜ **No viewport/scroll-triggered reveals** (no IntersectionObserver). The
  landing hero animates on mount; below-the-fold sections and interior pages
  rely on existing hover/focus/entrance transitions only. A scroll-reveal system
  could be added for a stronger landing treatment.

---

## 5. Error / Empty / Loading States (Task 21)

- ✅ **ARIA sweep complete.** Inline error banners and field-level errors across
  the app (`LoginPage`, `AdminLoginPage`, `PatientFormPage`, `PatientRecordsPage`,
  `StaffPage`, `NewPatientPage`, `EmergencyTriagePage`, `OutbreakDetectionPage`)
  now carry `role="alert"`, alongside the shared state library, chatbot log and Ops Map.

---

## 6. Testing (Task 22)

- 🟡 **E2E covers safe/read-only flows only.** Playwright suite covers auth
  (sign-in/logout), landing (desktop+mobile), i18n persistence, dark-mode
  persistence, and the chatbot — via the demo-login bypass (no real DB writes).
- ⬜ **DB-mutating journeys not covered** (need an isolated test database):
  patient registration, visit/vitals submission, offline queue + reconnect sync,
  OCR save, admin staff CRUD, and flagged/triage/outbreak/map with real data.
- ✅ **Unit tests** added (Vitest) for pure logic (`urgencyFromScore`,
  `urgencyScoreRange`, `shortId`, `initials`, `parseOcrText`) — 13 tests. Service
  modules that call Supabase (`adminService`/`chatbotService`) still need mocked tests.
- ✅ **CI pipeline** added (`.github/workflows/ci.yml`): type-check, build, unit
  tests and Playwright E2E on push/PR.

---

## 7. Offline-First & Sync

- ⬜ **No conflict-resolution engine** for concurrent offline edits to the same
  record across devices.
- ✅ **Service Worker** registered (`public/sw.js`, network-first with an offline
  cache fallback; production builds only) — offline app-shell + PWA install now available.

---

## 8. Feature Completeness (from FEATURES.md)

- ⬜ **Alerts Center** external real-time feeds (weather/flood/shelter capacity)
  are not connected — static shell.
- ⬜ **Emergency Mode** external meteorological/flood sensor feeds are pending
  (internal DB metrics, zones, triage, broadcast are implemented).
- ⬜ **Clinical forms** (Vitals/Visit) are English-only and visits cannot be
  edited after saving.
- ⬜ **AI-Assisted Triage** (auto urgency scoring from vitals/symptoms) is
  deferred as optional/future; the chatbot is a grounded intent engine, not a
  generative model.

---

## 9. Map (Task 16)

- ⬜ **No geographic coordinates in the schema.** Clinics are placed by matching
  `zone`/`name` to an in-app district lookup; unmatched clinics are listed as
  "not on map" rather than given a fabricated location. Real lat/lng columns +
  a map provider would be needed for true geolocation.
- ℹ️ The map intentionally shows **clinical activity** (visit recency), not device
  connectivity, because the schema tracks no per-clinic device status.

---

## 10. AI Chatbot (Task 17)

- ℹ️ **Grounded by design** — the built-in engine answers a bounded set of
  questions from real queries + fixed platform facts and defers anything else to
  a capabilities prompt.
- 🟡 **Optional LLM mode (Groq)** via `supabase/functions/groq-chat` (server-side
  key, grounded on clinic-scoped Supabase context). ✅ **Deployed and active** on
  the current Supabase project (model `openai/gpt-oss-20b`, set via the
  `GROQ_MODEL` secret; `GROQ_API_KEY` set as a Supabase secret). The frontend
  calls it when signed in + online and falls back to the local grounded engine
  otherwise. Remaining caveats: enabling it sends clinic-scoped context
  (including real high-risk patient names) to Groq (third party) — an operator
  privacy decision; and prompt-injection/fabrication are mitigated by strict
  system instructions but not eliminated. A fresh clone must re-deploy the
  function and set its own `GROQ_API_KEY` to activate LLM mode.

---

## 11. DevOps / Deployment

- ✅ **PWA**: `manifest.webmanifest` + `icon.svg` + a network-first service worker
  (`public/sw.js`) added and linked in `index.html` — installable, offline-capable shell.
- 🟡 **Hosting/CI-CD**: GitHub Actions CI added (`.github/workflows/ci.yml`, runs
  type-check/build/unit/E2E); not yet deployed to a production host.
- 🟡 **Edge Functions**: one exists and is **deployed** — `supabase/functions/groq-chat`
  (server-side Groq proxy; `GROQ_API_KEY`/`GROQ_MODEL` set as Supabase secrets).
  Other server-side automation (sync validation, high-urgency alerting, DB
  triggers/webhooks) does not exist.
