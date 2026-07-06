# CampusCore Test Plan

## Unit
- Zod validation.
- Permission registry.
- Password hash/verify.
- Session token hashing.

## Integration
- Tenant A cannot read/update Tenant B records.
- Branch-scoped user cannot mutate another branch.
- Missing permission rejects mutation.
- Academic year activation respects tenant setting.
- Critical writes create audit logs inside transactions.

## E2E
- Tenant owner login.
- Create institution.
- Create branch.
- Create academic year and activate it.
- Create user and assign role.
- View audit logs.
- Teacher cannot access users/roles.
