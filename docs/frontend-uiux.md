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
Healthcare colors should communicate meaning, not just decoration:
- **Success:** successful operation
- **Warning:** attention required
- **Danger:** critical/high risk
- **Offline:** disconnected state
- **Syncing:** synchronization in progress
- **Emergency:** urgent operational state
*Note: Do not rely solely on color to communicate status. Use icons, labels, badges, and visual hierarchy.*

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
