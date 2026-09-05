# Project Analysis — Family Expense Management MVP

## 1. Current architecture

Workspace `e:\KDL\3.Others\finance_manager` was **empty** at analysis time:

| Item | Status |
| --- | --- |
| Framework | None |
| `package.json` | None |
| Source code | None |
| Database | None |
| Authentication | None |
| Environment management | None |
| Build / deploy | None |
| Git repository | Not initialized |
| Node (local) | v22.22.0 |
| npm (local) | 11.3.0 |

**Conclusion:** Greenfield project. No existing patterns to preserve. Architecture is chosen to match the MVP spec.

---

## 2. Recommended architecture

```text
Browser (Nuxt 3 SPA + TypeScript)
        │
        ▼
Supabase Auth (email/password)
        │
        ▼
Supabase PostgreSQL + Row Level Security
        │
        ▼
SECURITY DEFINER RPCs (create family, add member by email, remove member)
```

### Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Frontend | Nuxt 3, TypeScript strict, `ssr: false` | Simple SPA, free static hosting, good DX |
| Auth | Supabase Auth | Free tier, session persistence, no custom backend |
| Database | Supabase PostgreSQL | Free tier, RLS, indexes |
| Authorization | RLS + RPCs | Security enforced in DB, not only UI |
| Money | `BIGINT` VND | Avoid floating-point errors |
| Timezone | UTC in DB; UI `Asia/Ho_Chi_Minh` | Correct month/day for VN users |
| Deploy | Cloudflare Pages | Free tier, static-friendly |

### Product decisions (locked)

1. **Add member:** OWNER enters email of an already-registered user → RPC attaches them.
2. **Onboarding:** After login, if user has no family → must create a Family (becomes OWNER). Users added by email skip this.
3. **One user ↔ at most one family** (DB unique constraint on `family_members.user_id`).

### Explicitly not used in MVP

AWS, Redis, Kafka, microservices, custom Node API, OAuth social login, invite email server, Edge Functions (unless later required).

---

## 3. Database design (summary)

Tables: `profiles`, `families`, `family_members`, `categories`, `expenses`.

- Default categories seeded when a family is created.
- `expenses.amount` is `BIGINT` (VND).
- `expenses.expense_date` is `date` (calendar day, not timestamptz).
- RLS isolates all family data per membership.
- Sensitive operations use `SECURITY DEFINER` RPCs:
  - `create_family_with_defaults`
  - `add_family_member_by_email`
  - `remove_family_member`

Details: see `DATABASE_DESIGN.md` (Phase 2).

---

## 4. Files to create / change

### Documentation

- `PROJECT_ANALYSIS.md` (this file)
- `DATABASE_DESIGN.md`
- `README.md`
- `IMPLEMENTATION_SUMMARY.md`
- `.env.example`
- `.gitignore`

### Application (Nuxt 3)

- `package.json`, `nuxt.config.ts`, `tsconfig.json`
- `app/app.vue`, layouts, pages, middleware, composables, components, utils, types, plugins
- Pages: login, register, onboarding (create family), dashboard, expenses, family settings

### Database

- `supabase/migrations/*.sql`
- `supabase/seed.sql`

### Tests

- `tests/unit/*` (Vitest)
- `tests/e2e/*` (Playwright)

---

## 5. Dependencies to add

**Runtime**

- `nuxt`
- `@supabase/supabase-js`
- `vue`, `vue-router` (via Nuxt)

**Dev**

- `typescript`
- `vitest`
- `@nuxt/test-utils` / vitest config as needed
- `@playwright/test`
- `sass` only if SCSS is used; prefer scoped CSS first

Do **not** add UI frameworks (Vuetify/Tailwind) unless necessary — keep CSS minimal and maintainable.

---

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| Looking up users by email needs privileged access | `profiles` table + `SECURITY DEFINER` RPC; never expose service role to client |
| Timezone shifts month boundaries | Store `expense_date` as `date`; compute month filters in `Asia/Ho_Chi_Minh` |
| RLS misconfiguration | Policies + E2E cross-family isolation tests |
| Supabase Free Tier limits / pause | Document limits and cost triggers in README |
| Auth email confirmation friction in local/dev | Document disabling confirm for local, or verify email flow |
| Node 22 vs Nuxt engines | Pin `engines.node` to `>=20` |

---

## 7. Estimated implementation complexity

**Medium.**

- Clear MVP scope and empty repo reduce ambiguity.
- Hardest parts: RLS correctness, add-member RPC, month statistics with VN timezone, responsive expense UX, E2E with real Supabase (or documented test strategy).

Rough effort: **2–4 focused days** for full MVP + unit/E2E + docs.

---

## 8. What not to change later without reason

Once implemented, avoid:

- Replacing Supabase with a custom API “just because”
- Introducing floating-point money types
- Weakening RLS in favor of frontend-only checks
- Adding paid services while Free Tier still fits family usage

---

## 9. Phase status

- **Phase 1 — Analyze:** Complete (this document).
- Next: Phase 2 — Database schema, RLS, seed, `DATABASE_DESIGN.md`.
