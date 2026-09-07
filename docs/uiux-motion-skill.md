# HealthStats — UI/UX & Motion Design Skill Guide

This document is the version-controlled, permanent UI/UX and animation rulebook for the HealthStats project.
It mirrors and extends the Antigravity agent skill located at `.agents/skills/healthstats-uiux-motion/SKILL.md`.

---

## 1. Project Context & Authority Hierarchy

HealthStats is an electronic health record (EHR) and disaster-response system engineered for rural clinics in Bangladesh facing intermittent connectivity, floods, and cyclones.

When resolving any potential design or development ambiguity, follow this strict priority order:

1. **`AGENTS.md`** — Top authority: security, database safety, zero fake functionality.
2. **`CLAUDE.md`** — Agent instructions and execution constraints.
3. **`projectdetails.md`** — Technical architecture and engineering context.
4. **`FEATURES.md`** — Scope and actual working status of product features.
5. **`PROGRESS.md`** — Implementation tracking and task roadmap.
6. **`docs/frontend-uiux.md`** — Base frontend engineering & design system guide.
7. **This Skill / Guide** — Specific UI/UX, motion, and interaction rulebook.
8. Current task prompt.

*Rule: If this skill or any visual guideline appears to conflict with `AGENTS.md`, `AGENTS.md` strictly wins.*

---

## 2. HealthStats Product Identity

HealthStats is a serious, mission-critical healthcare application operating in challenging field conditions.

### Core Visual Identity Attributes:
- **Trust & Reliability:** The software must feel rock-solid; field workers are recording real clinical care.
- **Calmness & Clarity:** Interfaces must soothe rather than overwhelm stressed healthcare workers.
- **Accessibility & Resilience:** High contrast, legible typography, bilingual English/Bangla text, and offline persistence.
- **Modern Professionalism:** Polished and intentional without superfluous aesthetic gimmicks.

### What HealthStats is NOT:
- ❌ NOT a generic B2B SaaS dashboard.
- ❌ NOT a Web3/crypto product.
- ❌ NOT a gaming or dark cyberpunk interface.
- ❌ NOT a neon AI startup marketing site.
- ❌ NOT a social media platform.
- ❌ NOT an overly decorative Dribbble concept that sacrifices utility for flashiness.

---

## 3. Core Design Principles

Every visual and interaction decision must adhere to these foundational trade-offs:

```
CLARITY          >  DECORATION
TRUST            >  NOVELTY
USABILITY        >  VISUAL EFFECTS
CONSISTENCY      >  INDIVIDUAL PAGE STYLE
ACCESSIBILITY    >  AESTHETICS
PERFORMANCE      >  COMPLEXITY
REAL VALUE       >  DECORATIVE FEATURES
```

If an element does not help the healthcare worker, clinic administrator, or patient accomplish their task more quickly, accurately, and safely, remove or simplify it.

---

## 4. Healthcare UX Principles

Clinical interfaces demand higher visual and operational discipline than consumer software:

1. **Readable Information:** High-contrast text, robust font weights, and clear tabular layout.
2. **Clear Hierarchy:** Critical patient vitals and triage status must be visually prominent at a glance.
3. **Predictable Navigation:** Standard top navigation (`AppNavbar.tsx`), clear breadcrumbs, and explicit exit points.
4. **Obvious Primary Actions:** One clear primary CTA per view (e.g., "Save Visit", "Register Patient").
5. **Low Cognitive Load:** Group related fields logically; keep forms short and avoid visual clutter.
6. **Meaningful Status Indicators:** Badges and alerts must communicate operational reality, never generic decorative tags.
7. **Calm Visual Treatment:** Soft neutral backgrounds, crisp borders, and controlled accent usage.
8. **Instant Scanning:** Support rapid scanning for workers managing queues of 50+ patients per day.

---

## 5. Visual Hierarchy

Apply a strict 6-tier visual hierarchy across all views:

1. **Critical Operational Information:** Active disaster mode, urgent triage flags (Level 5/4), sync failure warnings.
2. **Primary User Action:** Main form submission, triage disposition, sync trigger.
3. **Patient & Context Information:** Patient name, age/sex, village, triage score, chief complaint.
4. **Supporting Information:** Vital signs history, previous visits, clinic assignment.
5. **Metadata:** Timestamp, sync status, staff recorder ID, audit notes.
6. **Decorative Elements:** Subtle background atmosphere, subtle brand teal bands, soft divider lines.

*Strict Rule: Never allow atmospheric gradients, background effects, animations, or large decorative headings to overpower healthcare data or actionable controls.*

---

## 6. HealthStats Color Philosophy & Semantic Tokens

HealthStats uses a carefully curated palette based on healthcare teal accents paired with warm neutral surfaces and restrained status tokens.

### Tailwind Theme & CSS Variable Tokens (defined in `frontend/src/index.css`):

| Semantic Role | Light Mode Token | Dark Mode Token | Value / Purpose |
|---|---|---|---|
| **Page Background** | `var(--an-bg)` | `var(--an-bg-dark)` | Light: `#faf8f2` (warm parchment), Dark: `#100e0b` (deep warm charcoal) |
| **Surface (Card/Panel)** | `var(--an-surface)` | `var(--an-surface)` | Light: `rgba(255,255,255,0.72)`, Dark: `rgba(28,25,23,0.80)` |
| **Solid Surface** | `var(--an-surface-solid)` | `var(--an-surface-solid)` | Light: `#ffffff`, Dark: `#1c1917` |
| **Raised Surface** | `var(--an-surface-raised)` | `var(--an-surface-raised)` | Light: `rgba(255,255,255,0.85)`, Dark: `rgba(40,36,33,0.90)` |
| **Primary Text** | `var(--an-text-primary)` | `var(--an-text-primary)` | Light: `#1c1917`, Dark: `#faf8f2` (WCAG AAA) |
| **Secondary Text** | `var(--an-text-secondary)` | `var(--an-text-secondary)` | Light: `#44403c`, Dark: `#e7e5e4` |
| **Muted Text** | `var(--an-text-muted)` | `var(--an-text-muted)` | Light: `#78716c`, Dark: `#a8a29e` |
| **Subtle Border** | `var(--an-border)` | `var(--an-border)` | Subtle separation without heavy visual weight |
| **Strong Border** | `var(--an-border-strong)` | `var(--an-border-strong)` | Form inputs, active borders, card outlines |
| **Healthcare Accent** | `var(--an-accent)` | `var(--an-accent)` | Light: `#0d9488` (Teal-600), Dark: `#14b8a6` (Teal-500) |
| **Accent Hover** | `var(--an-accent-hover)` | `var(--an-accent-hover)` | Light: `#0f766e` (Teal-700), Dark: `#0d9488` (Teal-600) |
| **Accent Subtle Light**| `var(--an-accent-light)` | `var(--an-accent-light)` | `rgba(13, 148, 136, 0.08)` (tints, chips, hover states) |

### Status Colors:
- **Success:** Emerald (`#059669` / `#10b981`) — Confirmed sync, record saved, stable status.
- **Warning:** Amber (`#d97706` / `#f59e0b`) — Moderate urgency (Level 3), pending sync, potential pattern.
- **Danger / Critical:** Crimson / Rose (`#dc2626` / `#f43f5e`) — Critical triage (Level 5/4), emergency mode active.
- **Offline / Disconnected:** Slate / Stone (`#64748b` / `#78716c`) — Offline mode, local cache active.
- **Syncing:** Cyan / Teal (`#0284c7` / `#0d9488`) — Active synchronization in flight.

*Rule: Always use CSS variables (`style={{ background: 'var(--an-bg)' }}`) for full-page backgrounds and panels rather than hardcoding arbitrary utility classes.*

---

## 7. Ashen Nebula Visual Language

The **Ashen Nebula** visual theme provides a calm, atmospheric visual foundation for HealthStats.

### Permitted Surfaces:
- Landing Page (`/`)
- Authentication screens (`/login`, `/admin/login`, `/signup`, `/role-selection`)
- Showcase header cards and demo milestone views

### Strict Restraints:
- **Never apply atmospheric nebula gradients across clinical data views:** The visit entry form, patient records table, vital signs page, and triage queues must remain completely crisp, clean, and legible on neutral solid surfaces.
- **Static & Performance-Safe:** The `.an-atmosphere` container uses static blurred ellipses (`filter: blur(48px)` / `blur(60px)`) that do not animate continuously, ensuring zero battery drain on low-end mobile devices.
- **No Neon/Glow Clutter:** Do not add intense neon box-shadows or glowing borders to content cards.

---

## 8. Dark Mode Architecture

HealthStats supports class-based dark mode (`.dark` on `<html>`), driven by `ThemeContext.tsx`.

### Dark Mode Principles:
1. **Never Pure `#000000` Black:** Surfaces use warm charcoal tones (`#100e0b`, `#1c1917`, `#282421`) to avoid harsh eye strain during night shifts.
2. **Restrained Contrast:** Border colors soften to subtle stone/slate tones (`rgba(120, 113, 108, 0.25)`).
3. **No Inversion Hacks:** Do not blindly invert colors. Re-evaluate badges, text shades, and button outlines.
4. **Readable Forms:** Inputs in dark mode maintain distinct background surfaces (`#1c1917`) with clear focus rings.

---

## 9. Component Language & Reusability

Before writing a new component, search the codebase (`frontend/src/`) for existing implementations.
Reuse existing utilities and shared components:

- `AppNavbar.tsx` — Main application navigation with language and theme switchers.
- `ChatWidget.tsx` — AI assistant floating trigger and grounded chat dialog.
- `.an-card` / `.glass-card` — Standard card containers.
- `.btn-primary`, `.btn-secondary`, `.btn-ghost` — Core button hierarchy.
- `.an-input` — Standard form inputs with accessible focus states.

### Component Design Tokens:
- **Border Radius:** `rounded-lg` (`0.5rem`) for small inputs and badges; `rounded-xl` (`0.75rem`) for buttons and form fields; `rounded-2xl` (`1rem`) for primary cards and modals.
- **Consistent Elevation:** Use subtle multi-layered shadows (`var(--an-glass-shadow)`) rather than harsh heavy drops.

---

## 10. Card Design System

Cards must group related healthcare data logically without nested container clutter.

### Permitted Uses:
- Grouping a patient's core identity.
- Key Performance Indicators (KPIs) on the Admin Dashboard.
- Outbreak cluster summary cards.
- Triage patient cards in mobile view.

### Anti-Patterns:
- ❌ Nesting cards inside cards 3+ levels deep.
- ❌ Wrapping every lone text paragraph in an isolated bordered card.
- ❌ Huge cards with massive empty white space that forces unnecessary scrolling.

---

## 11. Button System & Interaction States

Buttons must unambiguously communicate their role in the clinical workflow.

```
Primary Action    → Solid Teal (.btn-primary)      → 1 per visual container
Secondary Action  → Outline/Glass (.btn-secondary) → Filters, exports, cancel
Ghost Action      → Borderless (.btn-ghost)        → Dismiss, back, navigation
Destructive       → Crimson Rose (.btn-danger)     → Discharge, deactivate staff
```

### Every button must define 5 distinct visual states:
1. **Default:** Crisp text, legible contrast, subtle depth.
2. **Hover:** Slight color elevation (`translateY(-1px)`, darkened background).
3. **Active/Press:** `translateY(0)` or `scale(0.98)` for tactile feedback.
4. **Focus-Visible:** Visible 2px focus ring (`outline: 2px solid var(--an-accent)`).
5. **Disabled / Loading:** `opacity-50 cursor-not-allowed`, with an inline spinner replacing or flanking the label.

---

## 12. Icon System

- **Primary Library:** Lucide React icons (`lucide-react`).
- **Emoji Policy:** ❌ Never use raw emoji as UI icons or status indicators.
- **Sizing Standards:**
  - Inline metadata / badge icons: `w-3.5 h-3.5` (14px) or `w-4 h-4` (16px).
  - Button icons: `w-4 h-4` (16px) or `w-5 h-5` (20px).
  - Navigation / header icons: `w-5 h-5` (20px).
  - Empty state / hero feature icons: `w-8 h-8` to `w-12 h-12` (32px–48px).
- **Accessibility:** Icons accompanying text must use `aria-hidden="true"`. Icon-only buttons must provide an accessible `aria-label`.

---

## 13. Patient UX & Scanning Hierarchy

When health workers look at a patient profile or list, their eye should flow in this exact sequence:

```
1. Full Name + Identification Code
2. Urgency Score Badge (1–5) + Triage Status
3. Age, Sex, Village, Clinic Location
4. Primary Diagnosis / Chief Complaint
5. Recent Vitals (BP, Temp, SpO2, Pulse)
6. Historical Visit Timeline
```

Do not bury critical medical parameters under tabs or accordion folds when reviewing a patient in triage.

---

## 14. Patient Privacy UX

Patient data is confidential medical information:

- **No Public Profiles:** Patient records must never be rendered in public or unauthenticated states.
- **Authorization Scoping:** Community health workers can only see patients registered to their assigned clinic; Admins view aggregate and clinic-scoped records.
- **Minimal Surface Exposure:** Mask national IDs or sensitive contact details in summary tables unless explicitly expanded by an authorized provider.
- **Zero Console Leaks:** Never log patient identifying details (name, village, symptoms) to the browser developer console.

---

## 15. Urgency Visual System (1–5 Scale)

The standardized HealthStats triage urgency scale must remain consistent across all pages, badges, cards, and reports:

| Score | Urgency Level | Visual Styling | Icon Indicator | Required Action |
|---|---|---|---|---|
| **5** | **Critical** | Red badge (`bg-red-600 text-white font-bold animate-pulse-subtle`) | `AlertOctagon` / `Flame` | Immediate clinical resuscitation |
| **4** | **High** | Orange/Amber badge (`bg-orange-500 text-white font-semibold`) | `AlertTriangle` | Urgent evaluation within 15–30 mins |
| **3** | **Moderate** | Yellow badge (`bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200`) | `Clock` | Standard queue evaluation |
| **2** | **Low** | Blue/Slate badge (`bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300`) | `Activity` | Routine clinical visit |
| **1 / null** | **Stable** | Emerald/Green badge (`bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`) | `CheckCircle` | Stable outpatient / routine follow-up |

*Multi-modal rule: Never use color alone. Always pair color with the numerical score (e.g., "Urgency 5 — Critical") and a corresponding icon.*

---

## 16. Emergency Mode Design

Emergency Mode shifts the entire application into disaster response operation (e.g., floods, cyclones, mass casualty):

### Design Mandates:
- **Urgent but Controlled:** The UI communicates extreme focus without inducing panic.
- **Prominent Banner:** High-contrast emergency banner pinned below navbar with active crisis summary, current zone, and one-click access to the Triage Queue.
- **De-clutter:** Hide non-urgent administrative widgets, promotional sections, and secondary analytics.
- **No Flashing Noise:** ❌ Strictly avoid fast-strobing reds, blinking sirens, or whole-page screen shakes.
- **High Contrast:** Text contrast increases to ensure readability in sunlight, rain, or low-battery mobile field conditions.

---

## 17. Outbreak Detection UX

Outbreak surveillance detects spatial-temporal symptom clusters (e.g., acute watery diarrhea cluster):

### Terminology Rules:
- ✅ Always use: *"Potential outbreak cluster"*, *"Surveillance pattern detected"*, *"Elevated symptom threshold"*.
- ❌ Never use: *"Confirmed outbreak"*, *"Guaranteed epidemic"*, *"Clinically verified outbreak"*.

### Information Hierarchy:
1. **Symptom Category:** (e.g., Acute Watery Diarrhea, Respiratory Distress).
2. **Clinic Zone & Catchment:** Geographic cluster bounds.
3. **Time Window & Velocity:** (e.g., "8 cases reported in past 36 hours").
4. **Actionable Step:** "Review Cluster Patients", "Notify Public Health Coordinator", "Activate Emergency Protocol".

---

## 18. Triage UX

Triage interfaces prioritize care:

- **The Primary Question:** *"Who requires immediate clinical attention first?"*
- **Sorting:** Default sorting must strictly prioritize Urgency Score (5 → 4 → 3 → 2 → 1), followed by waiting time.
- **Speed of Review:** Allow clinicians to disposition or update urgency in one tap/click without opening nested dialog chains.
- **Zero Medical Hallucinations:** Do not automatically prescribe medications or generate ungrounded diagnostic claims.

---

## 19. Offline-First UX & Messaging Clarity

Health workers in rural upazilas regularly lose cellular connectivity. The UI must reassure them that their work is safe:

### Positive Communication Patterns:
- ✅ *"You are currently offline. All records are saved safely on this device and will sync automatically when your connection returns."*
- ✅ *"Saved locally (Pending Sync)"*
- ✅ *"Sync complete. 12 records updated in Supabase."*

### Negative Anti-Patterns:
- ❌ *"Network Error 500: Failed to fetch"*
- ❌ Blocking modal lockouts when an internet drop occurs.
- ❌ Erasing form data on submission if offline.
- ❌ Pretending sync succeeded when records remain in Dexie IndexedDB.

---

## 20. Offline Status Visuals

Keep offline indicators visible, understandable, and calm:

- **Navbar Indicator:** Compact badge in `AppNavbar.tsx` (`Online` in green dot / `Offline (Saved locally)` with amber dot).
- **Non-blocking Toasts:** Show subtle status transitions when transitioning online/offline.
- **Pending Queue Counter:** Display the count of un-synced local records (e.g., `3 pending sync`) with direct link to `/sync`.
- **Form Save Feedback:** When a visit is saved offline, show an explicit confirmation: *"Saved to device queue"*.

---

## 21. Admin Dashboard UX

Admin screens provide operational oversight across all clinics:

```
Top:    Context & Date/Zone Filters
Row 1:  Primary Operational KPIs (Total Patients, Today's Visits, Active Outbreaks, Sync Health)
Row 2:  Urgent Attention Required (High-risk patients, Flagged clinics, Pending clusters)
Row 3:  Trends & Visualizations (Symptom trends, clinic volume comparison)
Row 4:  Operational Tables & Audit Feeds
```

- Keep cards purposeful: every chart or metric must answer a specific operational question.
- Allow quick drill-down from an aggregate number directly to the filtered record list.

---

## 22. Map UX & Spatial Awareness

The clinic map (`ClinicOpsPanel.tsx`) displays facility status and regional activity:

- **Scope:** Display clinic locations, zone boundaries, and aggregated status indicators (active patients, open alerts).
- **Patient Privacy Boundary:** ❌ Never plot individual patient home locations or private residences on any map.
- **Map Interaction:** Keep pan and zoom restrained; provide a clear "Reset View" button.
- **Accessible Fallback:** Always provide a tabular list view of the clinics alongside or beneath the interactive map.

---

## 23. AI Assistant (Chatbot) UX

The HealthStats chatbot (`ChatWidget.tsx`) is a grounded operational assistant:

- **Clear Role Definition:** Communicate clearly that the assistant is an operational tool grounded in current clinic data, not a medical practitioner.
- **Contextual Starter Questions:** Offer chips such as:
  - *"Summarize today's visits"*
  - *"Are there any active symptom clusters?"*
  - *"Show high-urgency patients in Clinic 1"*
- **Grounding Transparency:** When providing figures, reference the underlying data source (e.g., *"Based on 24 visits recorded today"*).
- **Graceful Fallbacks:** If queried for unsupported tasks, politely state capabilities and recommend consulting the health coordinator.

---

## 24. AI Safety UX & Clinical Boundaries

- **No Diagnostic Prescriptions:** The chatbot and system must not recommend specific drug dosages or definitive clinical diagnoses.
- **Visible Disclaimer:** Subtle caption on the chat widget: *"HealthStats Assistant provides operational summaries from clinic records and does not substitute for qualified clinical judgment."*
- **Escalation Path:** If a user types high-urgency keywords ("cardiac arrest", "unconscious child", "severe hemorrhage"), immediately surface the emergency triage protocol link.

---

## 25. Loading States

Never leave users looking at a blank screen or an unexplained frozen UI:

- **Skeleton Screens:** Prefer skeleton screens (`.skeleton`) that mimic the shape and layout of the incoming content (cards, tables, summary metrics).
- **Contextual Spinners:** Use small inline spinners (16px–20px) inside buttons or search inputs during quick background checks.
- **Avoid Full-Screen Spinners:** Unless the entire application authorization session is initializing, avoid blanking out the layout with a centered full-page spinner.

---

## 26. Empty States

Empty states should explain reality clearly and provide an obvious next step:

| Scenario | Heading | Subtext | Action Button |
|---|---|---|---|
| **No Patients Found** | *"No matching patients"* | *"No records match your search query or clinic filter."* | *"Clear Filters"* or *"Register New Patient"* |
| **No Urgent Cases** | *"No critical patients"* | *"All patients currently registered have stable urgency scores."* | None / *"Refresh Queue"* |
| **No Outbreaks** | *"No active clusters detected"* | *"Surveillance algorithms detect normal baseline illness rates across all zones."* | *"View Surveillance Log"* |
| **Sync Queue Empty** | *"All records synchronized"* | *"Local IndexedDB cache is fully up to date with central Supabase database."* | *"Check for Updates"* |

---

## 27. Error States & Recovery

When an error occurs, provide clarity and actionable recovery:

1. **What Happened:** Plain language explanation without raw stack traces.
2. **Data Safety:** Reassure the user (e.g., *"Your entered data has been preserved in your browser."*).
3. **Actionable Options:** Provide explicit recovery buttons:
   - `Try Again` / `Retry`
   - `Save to Offline Cache`
   - `Go to Dashboard`
   - `Clear Search Filters`

---

## 28. Forms & Clinical Data Entry

Clinical data entry in field settings requires maximum speed and minimum friction:

- **Sensible Defaults:** Pre-fill current clinic from logged-in staff session (`staff.clinic_id`); pre-fill today's date and current time.
- **Large Touch Targets:** Inputs, radio buttons, and checkboxes must have a minimum tap target of 44x44px.
- **Grouping:** Group logically into:
  1. Patient Identity (Name, Age, Sex, Village)
  2. Clinical Vitals (Heart rate, Blood pressure, SpO2, Temperature)
  3. Symptoms & Urgency (Category chips, chief complaint, score selector 1–5)
- **Inline Validation:** Validate fields on blur and show clear, accessible error text beneath the field.

---

## 29. Tables & Mobile Adaptations

Healthcare data is naturally tabular, but mobile screens require thoughtful adaptation:

- **Desktop (>= 1024px):** Full multi-column data table with sortable headers, sticky table header, and row hover states (`hover:bg-teal-50/40 dark:hover:bg-stone-800/40`).
- **Tablet / Mobile (< 768px):** Do not merely force an unreadable horizontally squashed table. Adapt into:
  - Responsive cards displaying core identity, urgency badge, and primary action.
  - Or a clean horizontally scrollable container with visual affordance (gradient scroll fade indicator).

---

## 30. Responsive Design & Breakpoint Matrix

Test every screen across standard device tiers:

| Breakpoint | Target Devices | Layout Behavior |
|---|---|---|
| **375px** | Mobile phones (iPhone SE, basic Android) | Single column, full-width inputs, stacked buttons, card-based tables |
| **640px (`sm`)** | Large phones / phablets | 2-column KPI grids, compact nav bar |
| **768px (`md`)** | Small tablets (iPad Mini, field tablets) | Side-by-side forms, 2–3 column grids, condensed tables |
| **1024px (`lg`)** | Laptops & desktop displays | Full data tables, multi-column analytics, persistent sidebar/filter panels |
| **1280px (`xl`)** | High-res clinic monitors | Max-width containers (`max-w-7xl mx-auto`) with comfortable reading whitespace |

---

## 31. Accessibility & Inclusive Design

HealthStats is built for all users, including low-vision workers, night shifts, and non-English speakers:

- **WCAG AA Minimum:** All body text must maintain a contrast ratio >= 4.5:1 against its background. Large text (>= 18pt) >= 3:1.
- **Keyboard Navigation:** All interactive elements must be reachable via `Tab` with a visible focus ring (`focus-visible:ring-2 focus-visible:ring-teal-500`).
- **Semantic Structure:** Every page must have exactly one `<h1>` heading followed by a logical hierarchy (`<h2>`, `<h3>`).
- **Bilingual i18n:** Every label, placeholder, and button must support English and Bangla via `LanguageContext` / `i18next`. Use font class `.lang-bn` (`Hind Siliguri`) for Bengali text.
- **Screen Reader Labels:** Use `aria-label` on icon-only buttons (e.g., theme toggle, language toggle, close dialog).

---

## 32. Motion Design Philosophy & Intentionality

Animation in HealthStats exists solely to enhance usability, clarity, and feedback. It is never decorative filler.

### The 5 Golden Rules of HealthStats Motion:
1. **Purposeful:** Motion must communicate state change, spatial continuity, or operational confirmation.
2. **Restrained:** Keep durations short and easings smooth; never make clinicians wait for an animation to finish before interacting.
3. **Lightweight:** Animate only GPU-accelerated CSS properties (`transform`, `opacity`).
4. **Non-distracting:** Motion must never compete with clinical vitals or triage queues.
5. **Respects Preferences:** Instantly disabled or minimized when `prefers-reduced-motion: reduce` is active.

---

## 33. Motion Intensity Levels

Use a strict 3-tier motion hierarchy:

```
┌──────────────────────────────────────────────────────────┐
│ Level 1 — Micro Interactions (100–200ms)                │
│ Hover, focus, button press, toggle switches, icon flips  │
├──────────────────────────────────────────────────────────┤
│ Level 2 — UI Transitions (150–300ms)                     │
│ Dialogs, slide-overs, tab switches, card reveals         │
├──────────────────────────────────────────────────────────┤
│ Level 3 — Showcase Entrances (300–450ms)                 │
│ Hero reveal on landing, emergency banner entrance        │
└──────────────────────────────────────────────────────────┘
```

*Data-heavy healthcare screens must use ONLY Level 1 and Level 2 motion.*

---

## 34. Preferred Animation Properties

### ✅ Hardware-Accelerated (Use Freely):
- `opacity` (fade effects)
- `transform: translateY()`, `translateX()` (slide effects)
- `transform: scale()` (pop / subtle focus feedback)

### ❌ Layout-Heavy (Avoid in Frequent Animations):
- `width` / `height` (causes layout reflows)
- `top` / `left` / `margin` / `padding`
- Heavy animated box-shadows or large blur filters on scrolling elements

---

## 35. Page Entrances & Restraint

- Use subtle upward fades (`.animate-slide-up` or `.animate-fade-in` from `index.css`).
- Maximum translation distance: **8px to 12px**.
- Duration: **250ms to 350ms** with smooth ease-out curves (`cubic-bezier(0.22, 1, 0.36, 1)`).
- ❌ Do not use dramatic spinning, full-screen horizontal swoops, or bouncing spring physics on clinical dashboards.

---

## 36. Stagger Animation Best Practices

- Permitted on: Small KPI card clusters (3–4 cards), hero landing features, or short filter lists.
- Classes: `.stagger-1` through `.stagger-6` (stagger intervals of `50ms` per child).
- ❌ **Forbidden on Large Lists:** Never stagger rows in a patient table with 20+ items. All rows must render immediately so clinicians can scan without delay.

---

## 37. Hover Interactions & Tactile Micro-feedback

Keep hover feedback subtle and informative:

- **Cards:** Subtle elevation (`hover:border-teal-400/40` or `hover:translate-y-[-1px] hover:shadow-md`).
- **Table Rows:** Gentle background tint (`hover:bg-teal-50/50 dark:hover:bg-stone-800/50`).
- **Icons:** Slight rotation or shift (e.g., arrow nudging right 2px on hover: `group-hover:translate-x-0.5`).

---

## 38. Button Motion & Tactile Feedback

```css
/* Recommended button transition recipe */
transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease;
```

- **Hover:** `translateY(-1px)` and subtle shadow glow (`box-shadow: 0 4px 20px var(--an-accent-glow)`).
- **Active / Tap:** `translateY(0)` or `scale(0.98)` to confirm click registration on touchscreen devices.

---

## 39. Loading Animation

- **Skeleton Shimmer:** `.skeleton` with `.skeleton::after` linear-gradient shimmer (1.7s cycle).
- **Sync Dots:** `.animate-dot` for discrete 3-dot pulse indicators during sync or chat generation.
- **Button Spinner:** 16px CSS rotating spinner border (`border-2 border-white border-t-transparent rounded-full animate-spin`).

---

## 40. Emergency Animation Standards

- **Controlled Urgency:** The emergency banner glides smoothly into view from the top (`.animate-slide-up`).
- **Subtle Status Glow:** A gentle 2-second ease-in-out opacity pulse (`opacity: 0.85` to `1.0`) on the critical badge.
- ❌ **No Alarm Strobing:** Never strobe colors, flash text, or vibrate screens. Critical data must remain readable at all times.

---

## 41. Offline & Sync Animation Transitions

- **Offline Transition:** When connection drops, the navbar dot changes smoothly from emerald to amber with a 200ms transition.
- **Sync In-Flight:** Rotate sync icon (`animate-spin` with smooth 1.5s linear speed) or pulse sync dots.
- **Sync Complete:** Trigger `.animate-success-pop` checkmark for 500ms, then settle into static confirmation.
- **Sync Error:** Display a static rose alert badge with a clear retry action. Never loop failed animation cycles indefinitely.

---

## 42. Chatbot Motion

- **Panel Opening:** Scale and fade in from lower-right corner (`.animate-scale-in` over 250ms).
- **Message Arrival:** Incoming messages slide up 6px with fade-in (`.animate-fade-in`).
- **Thinking State:** Restrained typing indicator with 3 bouncing dots (`.animate-dot`).
- ❌ Avoid re-animating past conversation history when a new message arrives.

---

## 43. Map Motion

- **Map Container:** Enters with a gentle fade-in upon loading.
- **Clinic Marker Selection:** Selected marker pulses a subtle ring once to confirm selection; open detail drawer slides in smoothly from the right (200ms).
- ❌ Do not animate every map marker continuously on the screen.

---

## 44. Reduced Motion (`prefers-reduced-motion: reduce`)

HealthStats enforces an unyielding global reduced motion guard in `index.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Essential Rule for Developers:
Every component must remain 100% functional, readable, and visually coherent when animations are instant (duration = 0ms). Never rely on an `onAnimationEnd` callback to render critical DOM nodes or unlock interactive buttons.

---

## 45. CSS Utility & Class Reference Cheatsheet

Quick reference of active tokens and classes ready for use in HealthStats:

```css
/* Containers & Surfaces */
.an-atmosphere        /* Fixed atmospheric slate/nebula haze behind landing/auth */
.an-card              /* Standard white/dark warm card with subtle border */
.glass-card           /* Elevated glass card with 20px blur and border */
.glass-card-lg        /* Large elevated glass card with 28px blur */
.glass-panel          /* Subtle inset glass panel */
.glass-nav            /* Navbar backdrop blur with bottom border */

/* Button System */
.btn-primary          /* Solid healthcare teal CTA */
.btn-secondary        /* Outline/glass secondary action */
.btn-ghost            /* Transparent subtle button */

/* Animation Utilities */
.animate-slide-up     /* 0.28s subtle upward slide (12px) */
.animate-fade-in      /* 0.35s fade in (8px) */
.animate-fade-up      /* 0.45s reveal (18px) for hero elements */
.animate-scale-in     /* 0.30s modal / dialog scale reveal */
.animate-success-pop  /* 0.50s checkmark success burst */
.animate-dot          /* 1.20s pulsing dot for sync/chat loading */
.skeleton             /* Accessible loading skeleton with shimmer */
.stagger-1 to .stagger-8 /* Sequential 50ms animation delay helpers */

/* Typography & Localization */
.font-display         /* 'DM Serif Display' serif headline class */
.lang-bn              /* 'Hind Siliguri' Bengali typography class */
```

---

## 46. Agent Pre-Commit Design Checklist

Before completing any frontend task on HealthStats, run through this verification checklist:

- [ ] **Clarity > Decoration:** Does every element serve a clear clinical or operational purpose?
- [ ] **Ashen Nebula Restraint:** Are atmospheric gradients confined to landing/auth? Are clinical screens calm and readable?
- [ ] **Design Tokens:** Did you use CSS variables (`var(--an-bg)`, `var(--an-accent)`, etc.) instead of arbitrary hardcoded colors?
- [ ] **Dark Mode Verified:** Did you test both Light and Dark mode? Are all text, inputs, and borders readable in both?
- [ ] **Urgency Scale Respected:** Are triage scores 1–5 using the standardized color, label, and icon indicators?
- [ ] **Offline UX Supported:** Is network state communicated with calm, reassuring language?
- [ ] **Mobile Responsive:** Does the view adapt cleanly at 375px without horizontal overflow or crushed tables?
- [ ] **Bilingual Ready:** Are all new text strings wired through `useTranslation()` (`i18next`) for English and Bangla?
- [ ] **Accessible:** Are heading tags hierarchical? Do interactive icons have `aria-label`? Does focus show a clear outline?
- [ ] **Motion Restrained:** Are animations within Level 1 (100–200ms) or Level 2 (150–300ms)? Is reduced motion respected?
