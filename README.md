# HealthStats
**Healthcare records that never stop working.**

## Overview
HealthStats is an offline-first electronic health record (EHR) system built specifically for rural clinics across Bangladesh. These clinics often rely on paper records and face intermittent internet connectivity and power outages. HealthStats solves this by allowing health workers to capture visits, triage patients, and manage records entirely offline, with automatic synchronization kicking in the moment a signal returns. It also features built-in disaster-response capabilities for extreme weather events.

## Key Features
- **Offline-First Patient Records:** Register patients and log visits with zero connectivity; records sync automatically upon reconnection.
- **AI-Assisted Triage/OCR:** Automated urgency scoring and symptom flagging for rapid triage (capabilities planned/in-progress).
- **Role-Based Access:** Distinct workflows for community health workers, clinic administrators, and district coordinators.
- **Emergency Mode:** Disaster-ready interface to coordinate care during monsoon floods and cyclones.
- **Language Support:** Bilingual support for Bangla and English.
- **Dark Mode:** Fully responsive, accessible, desktop-first UI with dark mode.

## Tech Stack
Based on the current project configuration, the application is built using:
- **Frontend Framework:** React 19
- **Build Tooling:** Vite 8, TypeScript 5.7
- **Styling:** Tailwind CSS v4

*(Note: Integrations such as Supabase, Framer Motion, and AI/ML libraries have not yet been installed or configured in the dependencies. They will be added to this list as the project evolves.)*

## Project Structure
```text
HealthStats/
├── frontend/             # The core React frontend web application
│   ├── public/           # Static assets (if applicable)
│   ├── src/              # React components, pages, and context
│   │   ├── App.tsx       # Main router and page definitions
│   │   ├── index.css     # Tailwind CSS entrypoint
│   │   └── main.tsx      # React DOM entrypoint
│   ├── package.json      # Frontend dependencies and scripts
│   └── vite.config.ts    # Vite configuration
└── README.md             # Project documentation
```
*(Backend directory will sit alongside `frontend/` once implemented).*

## Getting Started

Follow these steps to set up the project locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sucksatcse/HealStats.git
   cd HealStats
   ```

2. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   This project uses `npm` (or `pnpm`).
   ```bash
   npm install
   # or
   pnpm install
   ```

4. **Environment Variables:**
   Copy the `.env.example` file to create your local `.env` file at the project root:
   ```bash
   # From the project root (HealStats/):
   cp .env.example .env
   ```
   Open the `.env` file and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the details from your Supabase Dashboard (under Settings > API).

5. **Run the development server:**
   ```bash
   npm run dev
   # or
   pnpm run dev
   ```
   The app will start at `http://localhost:8443` (or another available port).

## Team
- **[Name]** — [Role/Title]
- **[Name]** — [Role/Title]

## License
[License Placeholder] — Please update with your preferred license (e.g., MIT, Apache 2.0).
