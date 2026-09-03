# HealthStats — Claude Code Instructions

## 1. Required Reading
Before doing any work, read the following files in this exact order to understand the project architecture, context, and current state:

- **`AGENTS.md`**
- **`projectdetails.md`**
- **`FEATURES.md`**
- **`PROGRESS.md`**
- **`docs/frontend-uiux.md`**

Read `README.md` only when setup or general project overview context is needed.

## 2. Authority
- **`AGENTS.md`** contains the general mandatory rules. Claude must follow those rules strictly.
- **`projectdetails.md`** contains technical architecture, database constraints, and engineering context.
- **`FEATURES.md`** contains the definition of features and their actual implementation status.
- **`PROGRESS.md`** contains implementation progress, task status, and the roadmap.
- **`docs/frontend-uiux.md`** contains the frontend rules, accessible design systems, and responsive layout mandates.

## 3. Claude Workflow
Before writing or modifying code:

1. Read the required documentation.
2. Inspect the repository status (Online MVP vs Target Offline-First).
3. Inspect relevant source code and database files.
4. Understand the current implementation and available context (e.g., Supabase instances, contexts).
5. Identify the smallest safe change required.
6. Implement the feature.
7. Validate the changes safely (TypeScript, formatting, etc.).
8. Review the diff.
9. Update relevant documentation.
10. Report the result clearly.

## 4. Database Protection
Claude must **NOT** execute database-changing commands unless explicitly authorized by the user in the current task. 

Never automatically:
- Run migrations or seed files.
- Reset the Supabase instance.
- Alter the SQL schema or drop tables.
- Delete or truncate patient/staff data.
- Apply production database changes.

*Reading schema files (`initial_schema.sql`) and non-destructive schema inspection is permitted and encouraged.*

## 5. Git Protection
Claude must never execute destructive Git commands. Never use:
- `git push --force`
- `git push --force-with-lease`

Do not rewrite shared Git history (rebase, squash, amend) without explicit authorization. Always avoid destructive Git operations and respect other developers' ongoing work.

## 6. Documentation Synchronization
Whenever Claude changes an implementation, it must pause and determine:
- Whether `PROGRESS.md` needs updating (did a task progress?).
- Whether `FEATURES.md` needs updating (did a capability change?).
- Whether `projectdetails.md` needs updating (did the architecture or security model shift?).
- Whether `docs/frontend-uiux.md` needs updating (were new design tokens established?).

Documentation must perfectly reflect reality immediately after the task. Do not mark an incomplete feature as "working."

## 7. No Hallucination
Do not invent:
- Features or capabilities
- External APIs or services
- Database tables or fields
- Routes or pages
- Credentials or secrets
- Roles or auth policies
- Dependencies or libraries

Always inspect the repository first. If it does not exist in the codebase, assume it is planned or not started.

## 8. Final Response
Always end your task session by summarizing:
- **What changed**: The actual implementation achieved.
- **Files changed**: The specific codebase files altered.
- **Documentation updated**: The Markdown files that were synced with reality.
- **Validation performed**: The checks run to ensure safety.
- **Limitations**: What is still missing or broken.
- **Next task**: The recommended next step based on `PROGRESS.md`.
