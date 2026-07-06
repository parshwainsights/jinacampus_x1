# KICKOFF_PROMPT.md — First Prompt to Send to Codex

Use this prompt after placing `AGENTS.md`, `PRD.md`, and `TASKS.md` in the repository root.

```txt
You are working on JinaCampus, a production-grade multi-tenant School Management SaaS for Indian schools.

Before doing any work, read and follow these files strictly:

1. AGENTS.md
2. PRD.md
3. TASKS.md

Your first job is not to code immediately. First inspect the repository and produce a concise implementation plan aligned to the docs.

Start with TASKS.md Phase 0 and Phase 1 only:

- Phase 0: Repository Discovery and Setup
- Phase 1: CampusCore Foundation

Do not implement Academia or StaffBoard Lite yet.
Do not implement GradeBook, FeeDesk, SchoolCast, InsightBoard, CampusFleet, BookNest, AssetRoom, payroll, biometric attendance, or mobile apps.

Required first response:

1. Confirm that you read AGENTS.md, PRD.md, and TASKS.md.
2. Summarize the repository structure you found.
3. Identify package manager and available scripts.
4. Identify whether Next.js App Router, Prisma, Tailwind, and TypeScript already exist.
5. Propose the exact files you will create or edit for Phase 0 and Phase 1.
6. State any assumptions.
7. Wait only if a required environment detail is truly missing; otherwise proceed with the safest MVP implementation.

After the plan, implement Phase 0 and Phase 1 in small, reviewable changes.

Strict rules:

- Maintain strict tenantId scoping.
- Add RBAC permission checks for protected services.
- Add audit logging foundation.
- Use Zod validation for external inputs.
- Keep business logic out of UI components.
- Do not overbuild future modules.
- Run available lint/typecheck/test/build commands before final response.

Final response after implementation must include:

1. What changed
2. Files changed
3. Commands run
4. Test/check results
5. Known risks
6. Next recommended task from TASKS.md
```
