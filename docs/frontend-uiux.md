# HealthStats — Frontend Engineering & Design Skill Guide

*This document serves as the permanent frontend design and UX rulebook for HealthStats. All developers and AI agents must read and adhere to this document before making significant UI or architectural changes.*

## 1. PROJECT GOAL
HealthStats is an offline-first healthcare management system designed for rural clinics in Bangladesh, especially environments where internet connectivity may be unreliable and disasters such as floods and cyclones can disrupt operations.

**The core product experience is:**
```
Health Worker -> Login -> Register Patient -> Record Visit / Vitals / Symptoms
   -> Internet? 
      -> YES -> Sync to Supabase
      -> NO -> Save to IndexedDB -> Pending Sync Queue -> Sync when Internet Returns
   -> Admin Dashboard -> Analytics + Risk + Alerts -> Outbreak Detection -> Emergency Mode
```

**Product Principles:**
Offline-first • Reliable • Fast • Simple • Accessible • Secure • Mobile-friendly • Healthcare-focused • Emergency-ready • Data-driven • Professional • Easy to demonstrate

## 2. HEALTHSTATS DESIGN PHILOSOPHY
This is a healthcare and emergency-response application, not a generic SaaS dashboard.
- **Tone:** Trustworthy, Calm, Professional, Modern, Clean, Fast, Operational, Human.
- **Avoid:** Neon colors, excessive gradients, cyberpunk aesthetics, huge decorative elements, generic AI appearances, 3D effects, and excessive rounded cards.

## 3. DESIGN SYSTEM & COLORS

### Ashen Nebula Theme (Active Visual Language)
HealthStats uses the "Ashen Nebula" visual theme as its design foundation. This is a CSS custom-property design system defined in `index.css`.

**Key design tokens (all in `index.css` `:root` and `.dark`):**
- `--an-bg` / `--an-bg-dark` — Page background (#faf8f2 light, #100e0b dark)
- `--an-surface`, `--an-surface-solid`, `--an-surface-raised` — Panel surfaces
- `--an-border`, `--an-border-subtle`, `--an-border-strong` — Border hierarchy
- `--an-text-primary`, `--an-text-secondary`, `--an-text-muted`, `--an-text-faint` — Text hierarchy
- `--an-accent`, `--an-accent-hover`, `--an-accent-light`, `--an-accent-glow` — Healthcare teal accent
- `--an-glass-bg`, `--an-glass-border`, `--an-glass-shadow`, `--an-glass-shadow-lg` — Glassmorphism

**Atmospheric background layer:** The `.an-atmosphere` class applies a fixed, pointer-events-none background element with three blurred radial-gradient ellipses creating a calm slate-blue nebula haze over the base parchment background. Applied to: Landing page, LoginPage, AdminLoginPage. Fixed/static behind content without continuous animation overhead for maximum performance on field hardware.

**Brand-Anchor Sections:** The solid teal gradient bands (`#0a2e2b` to `#0f766e` to `#115e59`) are intentional brand anchors:
- **Stats strip:** 4 primary operational metrics (Clinics served, Patient records, Data integrity rate, Avg. offline durability) with teal background and white/teal typography.
- **Final CTA band:** "Ready to bring reliable records to your clinic?" solid teal anchor with dual action buttons.
- **Footer:** Dark neutral `#0a1f1d` with high-contrast `text-teal-300` / `hover:text-white` links (WCAG AA compliant). Never make the footer teal or full-gradient.

**Utility classes defined in `index.css`:**
- `.glass-nav` — Navbar glassmorphism treatment (backdrop-blur + border)
- `.glass-card` / `.glass-card-lg` — Elevated glass card panels
- `.glass-panel` — Subtle inset glass treatment
- `.an-card` — Standard white card with nebula-toned border
- `.an-card-glass` — Glass-blur card for marketing/landing sections
- `.an-divider` — Section separator line
- `.btn-primary` / `.btn-secondary` / `.btn-ghost` — Button system
- `.an-input` — Form input with Ashen Nebula focus ring
- `.badge-teal` — Teal status badge

Healthcare colors should communicate meaning, not just decoration:
- **Success:** successful operation
- **Warning:** attention required
- **Danger:** critical/high risk
- **Offline:** disconnected state
- **Syncing:** synchronization in progress
- **Emergency:** urgent operational state
*Note: Do not rely solely on color to communicate status. Use icons, labels, badges, and visual hierarchy.*

**Always use CSS variables** (`var(--an-bg)`, `var(--an-accent)`, etc.) for colors in page wrappers, login screens, and any new full-screen components. Do not hardcode `bg-slate-50 dark:bg-slate-950` — use `style={{background: 'var(--an-bg)'}}` instead.


## 4. TYPOGRAPHY & SPACING
- **Typography:** Prioritize readability, medical information scanning, and mobile readability. Avoid extremely thin fonts. Use a consistent hierarchy (Display, H1, H2, Body, Caption, etc.).
- **Spacing:** Use predictable and consistent page padding, section spacing, card spacing, and table spacing across all views (Dashboard, Triage, Emergency Mode, etc.).

## 5. HEALTHCARE & OFFLINE-FIRST UX
- **Patient Workflows:** Speed and clarity are paramount. Clearly separate Registration (Name, Age, Sex) from Vitals/Symptoms. 
- **Offline UX:** The UI must always communicate network state clearly (e.g., "OFFLINE: Saved offline. Will sync automatically"). Never silently lose data or fake a "saved" message.
- **Sync Experience:** Clearly show Pending, Syncing, Synced, and Failed states without using raw technical terminology.

## 6. ADMIN DASHBOARD & OUTBREAK ALERTS
- **Dashboards:** Prioritize operational info. Hierarchy: Critical alerts -> High-risk patients -> Important stats -> Operational data -> Detailed analytics.
- **Outbreak Alerts:** Represented as a *threshold-based early-warning proof of concept* (e.g., "6 diarrhea cases in 36 hrs"). Do NOT describe this as a medically validated AI prediction system.

## 7. EMERGENCY MODE
When activated, Emergency Mode shifts the UI to an operational state:
- Increase visual urgency.
- Prioritize high-risk patients and live alerts.
- Reduce unnecessary decorative content.
- Use smooth, subtle transitions (do not turn the interface into a dramatic animation).

## 8. RESPONSIVE DESIGN & ACCESSIBILITY
- **Responsive:** Every major screen must work from 320px to large desktop. Do not just shrink desktop layouts; design mobile workflows intentionally (especially tables).
- **Accessibility:** Ensure semantic HTML, proper form labels, keyboard navigation, visible focus states, sufficient contrast, and reduced-motion support.

## 9. PERFORMANCE & ANIMATION
- **Performance:** HealthStats must feel fast. Avoid huge UI libraries, duplicate CSS, repeated API calls, and blocking initializations. Prefer lazy loading and efficient queries.
- **Animation:** Use subtle, professional motion for button feedback, modal transitions, and sync states. Avoid long transitions and distracting motion.

## 10. SUPABASE DATA ACCESS & PRIVACY
- **Architecture:** Keep Supabase access organized inside services/hooks. Never allow the frontend to bypass RLS security expectations.
- **Privacy:** Never log patient information unnecessarily. Do not expose private keys or store unnecessary medical information.

## 11. DEVELOPMENT RULES
- **Audit First:** Always audit existing components, contexts, and routing before making changes.
- **Reuse:** Do not create duplicate components. Reuse existing design tokens.
- **Dependencies:** Before installing packages, check if native browser APIs or existing dependencies suffice. Prefer lightweight solutions.
- **Placeholder vs Implementation:** Do not claim an unfinished feature is implemented. Implement only what is required, test it, and then consider it complete.

## 12. EXHIBITION DEMO PRIORITY
Prioritize features that demonstrate the core innovation reliably for the exhibition demo.

**🔴 Essential Priority:**
1. Authentication
2. Patient registration
3. Patient records
4. Visit/vitals entry
5. Supabase database integration
6. Offline storage (IndexedDB)
7. Automatic sync
8. Admin dashboard
9. Emergency Mode
10. Outbreak detection
11. End-to-end demo reliability

**Demo-First Reliability Flow to Protect:**
`Health Worker Login -> Register Patient -> Turn Internet OFF -> Record Visit -> "Saved Offline" -> Turn Internet ON -> Automatic Sync -> Admin Dashboard sees synced patient & stats -> Trigger outbreak -> Show Alert -> Switch to Emergency Mode.`
