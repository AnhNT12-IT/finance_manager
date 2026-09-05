# Database Design — Family Expense Manager

## Overview

PostgreSQL on Supabase with Row Level Security (RLS). Clients use the anon key only; privileged operations run through `SECURITY DEFINER` RPCs.

Timestamps are stored in **UTC**. Business calendar fields use `expense_date DATE` so month filters follow the intended calendar day (display/filter in `Asia/Ho_Chi_Minh`).

Money is stored as **`BIGINT` VND** (no decimals).

---

## Tables

### `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | = `auth.users.id` |
| email | TEXT | Synced from auth |
| display_name | TEXT | Optional |
| created_at / updated_at | TIMESTAMPTZ | UTC |

Populated by trigger on `auth.users` insert. Used by `add_family_member_by_email` so clients never query `auth.users` or list all emails.

### `families`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| name | TEXT | Required |
| created_at / updated_at | TIMESTAMPTZ | UTC |

### `family_members`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| family_id | UUID FK → families | |
| user_id | UUID FK → auth.users | **UNIQUE** (one family per user) |
| display_name | TEXT | Shown on expenses |
| role | TEXT | `OWNER` \| `MEMBER` |
| created_at / updated_at | TIMESTAMPTZ | UTC |

### `categories`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| family_id | UUID FK → families | Per-family categories |
| name | TEXT | Unique per family |
| created_at / updated_at | TIMESTAMPTZ | UTC |

Default names seeded on family create:

Ăn uống, Mua sắm, Điện nước, Nhà ở, Di chuyển, Y tế, Giáo dục, Giải trí, Khác.

### `expenses`

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| family_id | UUID FK → families | |
| member_id | UUID FK → family_members | Who spent |
| category_id | UUID FK → categories | Required |
| amount | BIGINT | `> 0`, VND |
| description | TEXT | Optional |
| expense_date | DATE | Required |
| created_at / updated_at | TIMESTAMPTZ | UTC |

---

## Relationships

```text
auth.users 1──1 profiles
auth.users 1──0..1 family_members
families 1──* family_members
families 1──* categories
families 1──* expenses
family_members 1──* expenses
categories 1──* expenses
```

---

## RPCs (SECURITY DEFINER)

| Function | Who | Purpose |
| --- | --- | --- |
| `create_family_with_defaults(name, display_name?)` | Authenticated user with no family | Create family, OWNER row, seed categories |
| `add_family_member_by_email(email, display_name?)` | OWNER | Attach registered user as MEMBER |
| `remove_family_member(member_id)` | OWNER | Remove member (not self; blocked if member has expenses) |

Helpers: `current_family_id()`, `current_member_id()`, `is_family_member(family_id)`, `is_family_owner(family_id?)`.

---

## RLS strategy

| Table | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| profiles | Own row only | Trigger only | Own row | — |
| families | Members of family | Via RPC | OWNER | — |
| family_members | Same family | Via RPC | OWNER (limited) | Via RPC |
| categories | Same family | OWNER | OWNER | OWNER |
| expenses | Same family | Same family + valid member/category | Same family | Same family |

**Guarantees**

- User A cannot read/update/delete expenses of Family B.
- User cannot insert expense with another family's `family_id`.
- `member_id` and `category_id` must belong to the same family.
- Clients cannot freely invent OWNER memberships (no direct INSERT on `family_members`).

---

## Important indexes

- `profiles (lower(email))` unique — email lookup for add-member
- `family_members (user_id)` unique — one family per user
- `family_members (family_id)`
- `categories (family_id, name)` unique
- `expenses (family_id, expense_date DESC)` — list + monthly filters
- `expenses (family_id, category_id)`, `expenses (family_id, member_id)`

---

## Seed

See `supabase/seed.sql`. Preferred path: Register users in Auth → call `create_family_with_defaults` → `add_family_member_by_email` → insert sample expenses for current and previous month.

---

## Migration file

- [`supabase/migrations/20260905000000_initial_schema.sql`](supabase/migrations/20260905000000_initial_schema.sql)
