# Step 12: User management (admin)

## Objective
Build the admin user management page — add/remove Google accounts, assign roles.

## Context
- Step 04 delivered: User model, auth system.
- See PRD user story #19.

## Specification

### Route: `/admin/users`

**Page layout:**
- Table of all users: email, name, role, created date.
- "Add User" button — form with email, name, role (Admin/Scorer) dropdown.
- Each row: Edit role, Remove (delete) actions.
- Cannot remove the last admin (prevent lockout).
- Cannot remove yourself.

### Server Actions:
1. `createUser(email, name, role)` — adds a new authorised Google account.
2. `updateUserRole(userId, role)` — changes role.
3. `deleteUser(userId)` — removes access (they can no longer sign in).

### Validation:
- Email must be a valid format.
- Email must be unique.
- At least one admin must remain.
- User cannot delete themselves.

**Behaviours to verify (TDD order):**
1. Admin can add a new user with Scorer role.
2. Admin can add a new user with Admin role.
3. Admin can change a user's role from Scorer to Admin.
4. Admin can delete a Scorer.
5. Admin cannot delete themselves.
6. Admin cannot delete the last admin.
7. Duplicate email is rejected.
8. Invalid email format is rejected.
9. Scorer cannot access `/admin/users`.

## Validation
```bash
npm run test
npm run build
```

## Completion
1. Update `CHANGELOG.md`
2. Mark step complete in `PLAN.md`
3. Commit `step-12: user management (admin)`
4. Push `at-wip`
