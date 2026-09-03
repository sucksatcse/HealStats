# HealthStats Features Guide

HealthStats is designed specifically for the unique challenges of rural clinics in Bangladesh. Below is a detailed breakdown of the core features that make the system resilient, fast, and accessible.

## 1. Offline-First Architecture & Auto-Sync
Rural clinics frequently experience network dropouts or complete outages during storms. 
* **Zero-Connectivity Workflows**: Health workers can register new patients, view complete medical histories, and record new visit details without an active internet connection. All data is securely stored on the local device.
* **Background Auto-Sync**: The moment the device reconnects to a network—whether it's a weak 3G signal or Wi-Fi—the system automatically pushes all queued records to the central server.
* **Conflict Resolution**: If a patient record was updated on multiple devices, the system automatically handles conflicts to ensure no critical health data is lost.

## 2. AI-Assisted Triage & Priority Scoring
Overcrowding is common in rural centers. Health workers need to quickly identify which patients require immediate attention.
* **Rapid Urgency Scoring**: As intake details and symptoms are entered, on-device machine learning algorithms instantly score the patient's condition.
* **High-Risk Flagging**: Patients exhibiting dangerous symptoms (like high fever with rapid breathing) are pushed to the top of the queue, ensuring doctors see the sickest patients first.

## 3. Disaster-Ready Emergency Mode
Bangladesh is highly prone to seasonal floods and cyclones, which can displace communities and destroy infrastructure.
* **Emergency Dashboards**: With a single toggle, the UI shifts to Emergency Mode. This brings triage queues, active disaster zones, and shelter resource allocations to the forefront.
* **Coordinated Response**: Enables scattered health workers to track outbreaks (like waterborne diseases post-flood) across different temporary shelters.

## 4. Role-Based Access & Dashboards
The system tailors the user experience based on the individual's role within the healthcare network.
* **Community Health Workers (CHW)**: Focuses on fast data entry, simple patient lookup, and offline queue management.
* **Medical Officers / Doctors**: Prioritizes patient history, lab results (when available), and prescribing treatments.
* **Clinic Administrators & NGO Coordinators**: Provides high-level analytics, data on disease trends across multiple clinics, and system sync statuses.

## 5. Progressive Web App (PWA) Capabilities
Installing software on diverse, older devices in the field can be difficult.
* **No App Store Required**: HealthStats can be installed directly from a web browser onto a tablet, phone, or laptop.
* **Lightweight**: It runs smoothly on low-end hardware, minimizing battery drain and avoiding the bloat of traditional desktop software.

## 6. Bilingual Support & Accessibility
Usability is critical for rapid adoption by local staff.
* **English & Bangla (Bengali)**: The entire interface, from landing pages to complex medical forms, supports instant toggling between English and Bangla.
* **Clear, Modern UI**: Built with a "desktop-first" but fully responsive design, featuring large, tappable card-based layouts, readable typography, and high contrast.
* **Dark Mode**: Reduces eye strain for workers doing data entry in low-light conditions or during night shifts.

---

## Roadmap / Things To Do

This section tracks outstanding work organized by category. Items marked ✅ are complete, 🔄 are in progress, and ⬜ are yet to start.

### Backend & Database
- ⬜ Set up Supabase project (Postgres database + Auth)
- ⬜ Define database schema for patients, visits, diagnoses, and prescriptions
- ⬜ Implement Row-Level Security (RLS) policies in Supabase for role-based data access
- ⬜ Create API routes / Edge Functions for syncing offline records
- ⬜ Set up conflict resolution logic for concurrent offline edits
- ⬜ Create `backend/` folder alongside `frontend/` and scaffold the server

### Authentication & Authorization
- ⬜ Integrate Supabase Auth (email/password login for clinic staff)
- ⬜ Implement role-based routing: Health Worker / Doctor / Admin / Coordinator
- ⬜ Add session persistence so users stay logged in after closing the browser
- ⬜ Secure all API routes with JWT token verification

### Offline & Sync Engine
- ⬜ Integrate a local database (e.g., IndexedDB via Dexie.js) for offline data storage
- ⬜ Build a background sync queue that watches for network reconnection
- ⬜ Display sync status (queued records count, last synced time) in the UI

### AI / ML Features
- ⬜ Research and select a triage scoring model (rule-based or ML)
- ⬜ Integrate AI triage scoring into the patient intake form
- ⬜ Build OCR pipeline for digitizing paper health records (e.g., using Google Vision API or Tesseract.js)
- ⬜ Add on-device model inference for offline triage support

### Patient Records
- ⬜ Connect `NewPatientPage` form to Supabase database
- ⬜ Connect `PatientDetailPage` to fetch and display real patient records
- ⬜ Connect `VitalsPage` to save and retrieve patient vitals
- ⬜ Connect `PatientRecordsPage` to show historical visit data
- ⬜ Implement fuzzy search for patient lookup by name, ID, or diagnosis

### Emergency Mode
- ⬜ Build Emergency Mode toggle in the Admin Dashboard
- ⬜ Connect `EmergencyDashboard` to live data (shelter occupancy, resource counts)
- ⬜ Implement real-time alerting for outbreak zones

### UI / UX Polish
- ⬜ Remove remaining Figma Make scaffold pages and boilerplate components
- ⬜ Add loading skeletons to all data-fetching pages
- ⬜ Add form validation and error states to all patient entry forms
- ⬜ Fully polish Bangla translation across all pages (not just the landing page)
- ⬜ Add end-to-end PWA support (service worker, app manifest, install prompt)

### DevOps & Deployment
- ⬜ Set up a `.env.example` file documenting required environment variables
- ⬜ Configure CI/CD pipeline (e.g., GitHub Actions) for automated builds
- ⬜ Deploy frontend to Vercel or Netlify
- ⬜ Deploy backend/Edge Functions via Supabase
- ⬜ Write a contributing guide (`CONTRIBUTING.md`)
- ⬜ Choose and add an open-source license
