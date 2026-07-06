# Phase 1 Implementation Order

The scaffold maps to the requested 20-step implementation sequence:

1. Initialize Next.js, Prisma, Tailwind, env validation.
2. Create Prisma CampusCore schema.
3. Run first migration with `npm run db:migrate -- --name init_campuscore`.
4. Add db client.
5. Add permission registry.
6. Add seed script for permissions.
7. Add tenant bootstrap seed.
8. Add default role seed for tenant.
9. Add session/password auth foundation.
10. Add tenant context resolver.
11. Add RBAC requirePermission utility.
12. Add audit logging utility.
13. Add Zod schemas.
14. Add CampusCore services.
15. Add server actions.
16. Add dashboard layout, sidebar, topbar.
17. Add CampusCore pages.
18. Add audit log viewer.
19. Add test suite.
20. Add Docker compose for local Postgres.
