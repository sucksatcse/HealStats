# HealthStats — AI Agent Instructions

## 1. Purpose
This file defines mandatory development rules and governance for all AI coding agents (Antigravity, Claude Code, Copilot, etc.) working on the HealthStats project. Strict adherence to these instructions ensures the codebase remains secure, the architecture remains consistent, and the documentation accurately reflects reality.

## 2. Mandatory Documentation Review
Before modifying any code, the agent **MUST** read the following documentation to understand the project context, rules, and current state:

1. **`projectdetails.md`** — The primary source of truth for engineering architecture, technical context, and development rules.
2. **`FEATURES.md`** — Defines the exact scope of product features and their current implementation status.
3. **`PROGRESS.md`** — Tracks implementation progress and identifies the next pending tasks.
4. **`docs/frontend-uiux.md`** — Establishes all frontend design, UX, performance, and accessibility rules.
5. **`README.md`** — Project overview, setup, and public-facing instructions (read when project setup context is needed).

## 3. Start-of-Task Workflow
Every agent task must follow this explicit sequence. Do not begin coding immediately after receiving a prompt:

1. Read the required Markdown documentation.
2. Determine the current project state (Online MVP vs Target Offline-First).
3. Identify the requested task.
4. Check whether the task is already implemented, partially implemented, or untouched.
5. Inspect relevant source files.
6. Inspect relevant database schema files (`supabase/migrations/`) when necessary.
7. Identify dependencies and existing patterns (e.g., existing contexts or Supabase clients).
8. Plan the smallest appropriate change.
9. Implement the change.
10. Run safe validation commands.
11. Review the resulting diff.
12. Update the appropriate documentation.
13. Report exactly what changed.

## 4. Source of Truth Rules
Resolve contradictions by prioritizing sources in this exact order:

1. **Actual source code and database schema** (Highest Authority)
2. `projectdetails.md`
3. `FEATURES.md`
4. `PROGRESS.md`
5. `docs/frontend-uiux.md`
6. `README.md`

If documentation contradicts the repository, **do not blindly trust the documentation**. Inspect the actual implementation, resolve the contradiction carefully, and update the appropriate documentation to reflect reality. Never invent a technical implementation simply to make outdated documentation appear correct.

## 5. Current vs Planned Features
Never describe a feature as "Implemented" merely because:
- a route exists
- a page or component exists
- a button exists
- a mock response or static UI is present

Only mark a feature as implemented when the underlying backend functionality actually works and is wired up. Clearly distinguish between:
- **IMPLEMENTED**: Fully working and wired.
- **IN PROGRESS**: UI scaffolded or partially wired.
- **PLANNED**: On the roadmap but development has not begun.
- **OPTIONAL / FUTURE**: Deferred capabilities (e.g., AI-Assisted Triage).
- **NOT STARTED**: Identified but untouched.
- **BLOCKED**: Cannot proceed without missing prerequisites.

## 6. Database Safety — STRICT
AI agents **MUST NOT** execute commands that modify the database unless the user explicitly authorizes that database modification in the current task.

**Forbidden without explicit authorization:**
- Database migrations or schema changes.
- `ALTER TABLE`, `DROP TABLE`, `DELETE`, or `TRUNCATE` operations.
- Database resets, wipes, or seed commands.
- Destructive SQL queries.
- Production database changes.
- Commands that automatically apply migrations or modify Supabase database state.

**Agents MAY:**
- Read SQL migration files (`initial_schema.sql`).
- Inspect schema definitions and TypeScript types.
- Inspect existing queries in the source code.
- Reason about database architecture.
- Use non-destructive local inspection when clearly safe.

**If a task appears to require a database modification:** STOP before executing the modification and report what authorization is required. Never assume authorization from the mere existence of a migration file.

## 7. Security Rules
Never:
- Disable authentication or bypass authorization.
- Remove security checks.
- Expose secrets or hardcode credentials.
- Commit `.env` secrets.
- Invent security policies.
- Weaken existing security controls.

**RLS Policy:** Respect the project's current MVP Row Level Security (RLS) state and the intended production security architecture documented in `projectdetails.md`. Do not claim RLS protection exists if the current migration disables it.

## 8. Git Safety Rules
Agents must use safe Git practices.

**NEVER execute without explicit user authorization:**
- `git push --force` or `git push --force-with-lease`
- `git reset --hard`
- Commands that rewrite shared history (amend, squash, rebase).
- Destructive branch deletion or repository cleanup.
- Overwriting another developer's work.

**Prefer:**
- Normal commits and normal pushes.
- Creating a new branch.
- Reviewing `git diff` and `git status` before committing.
- Preserving existing work.

Never commit unrelated changes.

## 9. Code Modification Rules
Before creating a new component, function, or service:
- Search for an existing implementation.
- Reuse existing utilities, contexts, and the existing Supabase client.
- Follow existing naming conventions (e.g., PascalCase components, snake_case DB tables).

Do not create duplicate Supabase clients, authentication logic, database utilities, UI components, types, or state management patterns. Make the smallest appropriate change. Do not rewrite working code unnecessarily.

## 10. UI/UX Rules
Always follow `docs/frontend-uiux.md`.

Do not redesign unrelated pages while implementing a feature. Preserve:
- The existing visual language (professional, trustworthy healthcare tone).
- Responsive, desktop-first behavior.
- Dark mode compatibility.
- Bilingual (English/Bangla) translation support.
- Accessibility standards.
- Existing component patterns.

Do not introduce random UI libraries (like Framer Motion) or neon/cyberpunk visual styles without justification.

## 11. Fake Functionality Rule
**Never fake functionality.**

Do not use mock or static data to make an unfinished feature appear complete unless the task explicitly requires a temporary prototype. Examples:
- Do not claim offline storage works if IndexedDB (Dexie) is not implemented.
- Do not claim background sync works if the sync queue does not exist.
- Do not claim OCR works if OCR processing is not implemented.
- Do not claim outbreak detection works if the logic is not implemented.
- Do not claim live admin statistics if the dashboard still uses static data.

If something is incomplete, document it as incomplete.

## 12. Validation
After making changes, run appropriate **non-destructive** checks, such as:
- Formatter (`oxfmt` or similar if configured).
- TypeScript checks (`tsc --noEmit`).
- Local build tests.
- Existing automated tests.

Review `git status` and `git diff` before reporting completion. Do not run commands that modify the database or possess side effects without authorization.

## 13. Documentation Update Protocol
Documentation is part of the implementation. Any developer or AI agent who completes, partially completes, or materially changes a task must update the documentation in the same work session. Update **only** the documents whose responsibility is affected:

### Update `PROGRESS.md` when:
- A task changes status, is completed, or partially completed.
- A blocker appears.
- The next task changes or an implementation milestone is reached.

### Update `FEATURES.md` when:
- Feature status changes (e.g., Planned → In Progress → Implemented).
- A feature's actual behavior or limitations change.

### Update `projectdetails.md` when:
- Architecture, database structure, or authorization changes.
- Major technical decisions, development rules, or implementation assumptions change.

### Update `docs/frontend-uiux.md` when:
- UI/UX rules, design systems, or reusable frontend conventions change.

### Update `README.md` when:
- Public setup instructions, overview, or major user-facing capabilities change.

## 14. Documentation Accuracy
Never write "implemented" unless it has actually been implemented and verified. Never write "working" unless it has actually been tested. Never remove known limitations simply because they make the project look less complete. Honest documentation is more important than impressive documentation.

## 15. Collaboration Rules
Assume multiple developers may be working on the repository. Never overwrite another developer's changes. 

Before modifying important files:
- Inspect current status and existing changes.
- Understand the surrounding code context.

Do not revert unrelated changes or modify files outside the task scope unless strictly necessary. If another developer's work conflicts with the requested change, stop and report the conflict instead of destroying their work.

## 16. Environment and Secrets
Never expose or commit `.env`, API keys, service-role keys, passwords, access tokens, or private credentials. Use existing environment variables (e.g., `VITE_SUPABASE_URL`). Do not invent credentials.

## 17. Task Completion Report
At the end of every task, report:
1. **Implemented**: What actually works.
2. **Files Changed**: A precise list.
3. **Documentation Updated**: Which Markdown files were modified.
4. **Validation**: How it was tested safely.
5. **Remaining Limitations**: Honest account of what is missing.
6. **Next Recommended Task**: Based on `PROGRESS.md`.

The report must describe the actual result, not the intended result.

## 18. When to Stop
Stop and ask the user **only** when:
- Required credentials are unavailable.
- Required information cannot be determined from the repository.
- A destructive operation or database modification is necessary.
- A security-sensitive decision requires approval.
- Another developer's work would be overwritten.
- Requirements are genuinely ambiguous.

Otherwise, proceed autonomously with safe, non-destructive work.
