# HealthStats — Known Limitations & Follow-Ups

> A single tracking list of known limitations, deferred work, and honest gaps
> across the project. Nothing here is "broken" unless stated — these are items
> intentionally deferred or out of scope for their originating task.
>
> **Status legend:** ⬜ open · 🟡 partial · ✅ done
>
> Last updated: 2026-09-05 (after Task 22)

---

## 1. Security & Secrets (highest priority)

- ⬜ **`VITE_SUPABASE_SECRET_KEY` in the frontend `.env`.** Any `VITE_`-prefixed
  variable is inlined into the client bundle at build time, so a *secret* key
  here would be shipped to browsers. It should be **rotated** and moved
  server-side (Edge Function / server), never exposed to the frontend. The anon
  key is the only Supabase key that belongs in the frontend.
- ⬜ **Row Level Security (RLS) is DISABLED** in the MVP migration
  (`supabase/migrations/20260831000000_initial_schema.sql`). The intended
  production architecture uses RLS + `SECURITY DEFINER` helpers to enforce
  clinic-level isolation. Data access is currently gated only at the application
  layer. RLS must be re-enabled and tested before production.

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

- ✅ All reachable product routes are dark-mode complete.
- ⬜ **Demo/showcase pages not audited for dark mode:** `StyleGuidePage`,
  `ButtonStatesPage`, `SkeletonStatesPage`, `NavbarPreviewPage`,
  `SuccessConfirmationPage`, `SyncProgressPage`. (Not part of the product flow.)

---

## 4. Animation & Motion (Task 20)

- ⬜ **No viewport/scroll-triggered reveals** (no IntersectionObserver). The
  landing hero animates on mount; below-the-fold sections and interior pages
  rely on existing hover/focus/entrance transitions only. A scroll-reveal system
  could be added for a stronger landing treatment.

---

## 5. Error / Empty / Loading States (Task 21)

- 🟡 **ARIA sweep incomplete.** The shared state library (`EmptyStates.tsx`),
  chatbot log, and Ops Map states have proper `role`/`aria-live`. Some individual
  inline error banners on other pages still lack explicit `role="alert"` /
  `aria-live` and could be swept for full consistency.

---

## 6. Testing (Task 22)

- 🟡 **E2E covers safe/read-only flows only.** Playwright suite covers auth
  (sign-in/logout), landing (desktop+mobile), i18n persistence, dark-mode
  persistence, and the chatbot — via the demo-login bypass (no real DB writes).
- ⬜ **DB-mutating journeys not covered** (need an isolated test database):
  patient registration, visit/vitals submission, offline queue + reconnect sync,
  OCR save, admin staff CRUD, and flagged/triage/outbreak/map with real data.
- ⬜ **No unit tests** (Vitest/Jest) for services like `adminService`,
  `chatbotService`, or the outbreak/triage logic.
- ⬜ **No CI pipeline** running the suite automatically.

---

## 7. Offline-First & Sync

- ⬜ **No conflict-resolution engine** for concurrent offline edits to the same
  record across devices.
- ⬜ **No Service Worker** registered — offline asset caching / true PWA install
  is not yet available (see PWA below).

---

## 8. Feature Completeness (from FEATURES.md)

- ⬜ **Worker home dashboard** recent-patients list and quick stats are still
  placeholder figures (not wired to live data).
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

- ℹ️ **Grounded intent engine, by design** — not generative, no external LLM API.
  It answers a bounded set of questions from real queries + fixed platform facts
  and defers anything else to a capabilities prompt. Broader NLU would require an
  LLM integration (and careful privacy/secret handling).

---

## 11. DevOps / Deployment

- ⬜ **PWA**: missing `manifest.json` + service worker (required for installable,
  offline-capable app).
- ⬜ **Hosting/CI-CD**: not deployed to a production host; no GitHub Actions.
- ⬜ **Edge Functions / DB triggers / webhooks**: none exist (e.g. server-side
  sync validation, high-urgency alerting).
