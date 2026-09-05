# Family Expense Manager

Web app quản lý chi tiêu cho các thành viên trong cùng một gia đình.

## Overview

- Mỗi user có tài khoản riêng (email/password).
- User thuộc tối đa **một** Family.
- OWNER tạo Family, thêm member bằng email đã đăng ký.
- Thành viên CRUD chi tiêu, lọc theo tháng/danh mục/thành viên, xem Dashboard.

## Architecture

```text
Nuxt 3 SPA (TypeScript)
    → Supabase Auth
    → Supabase PostgreSQL + RLS
    → SECURITY DEFINER RPCs (create family, add/remove member)
```

Không có custom API server. Authorization được enforce bằng RLS trên database.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Nuxt 3, Vue 3, TypeScript |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Security | Row Level Security + RPCs |
| Unit tests | Vitest |
| E2E | Playwright |
| Deploy (recommended) | Cloudflare Pages |

## Setup local

### Prerequisites

- Node.js `>=20` (khuyến nghị `>=20.19` hoặc `22`)
- npm
- Tài khoản [Supabase](https://supabase.com) (Free Tier)

### 1. Clone & install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` → `.env`:

```env
NUXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Không commit file `.env`.

### 3. Database setup (Supabase)

1. Tạo project Supabase mới.
2. Mở **SQL Editor**, chạy toàn bộ nội dung:
   - [`supabase/migrations/20260905000000_initial_schema.sql`](supabase/migrations/20260905000000_initial_schema.sql)
3. (Tuỳ chọn) xem [`supabase/seed.sql`](supabase/seed.sql) cho hướng dẫn seed.

Hoặc dùng Supabase CLI:

```bash
npx supabase db push
```

### 4. Supabase Auth settings

- Enable **Email** provider.
- Với local/dev, có thể tắt **Confirm email** (Authentication → Providers → Email) để đăng ký không cần verify.
- Không cần Google/Facebook cho MVP.

### 5. Run development

```bash
npm run dev
```

Mở `http://localhost:3000`.

### 6. First-run flow

1. Register tài khoản OWNER.
2. Tạo Family (onboarding bắt buộc nếu chưa có family).
3. Register tài khoản member khác.
4. OWNER vào **Gia đình** → thêm member bằng email.
5. Thêm chi tiêu → xem Dashboard.

## Run tests

### Unit tests

```bash
npm run test:unit
```

Cover: money formatting, expense validation, monthly/category/member aggregation, date range helpers.

### E2E tests

Cần `.env` hợp lệ và migration đã apply:

```bash
npx playwright install chromium
npm run test:e2e
```

Nếu thiếu `NUXT_PUBLIC_SUPABASE_*`, E2E sẽ **skip** (không fail giả).

Flows: register → create family → expense CRUD → filter → dashboard → logout; cross-family isolation.

## Build production

```bash
npm run generate
```

Output tĩnh nằm trong `.output/public` (SPA).

Hoặc:

```bash
npm run build
```

## Deployment (Cloudflare Pages)

1. Connect repo hoặc upload `.output/public` sau `npm run generate`.
2. Build command: `npm run generate`
3. Output directory: `.output/public`
4. Set env:
   - `NUXT_PUBLIC_SUPABASE_URL`
   - `NUXT_PUBLIC_SUPABASE_ANON_KEY`

Vercel cũng hoạt động với cùng env vars nếu muốn.

## Security notes

- Chỉ dùng **anon key** trên frontend. Không bao giờ commit **service role** key.
- RLS bật trên `profiles`, `families`, `family_members`, `categories`, `expenses`.
- Thêm member qua RPC `add_family_member_by_email` (OWNER only); không cho client search toàn bộ email.
- Frontend validation chỉ UX; quyền thật nằm ở Postgres policies/RPCs.
- Chi tiết: [`DATABASE_DESIGN.md`](DATABASE_DESIGN.md), [`PROJECT_ANALYSIS.md`](PROJECT_ANALYSIS.md).

## Money & timezone

- `amount` lưu `BIGINT` VND (ví dụ `500000`).
- Hiển thị: `500.000 ₫`.
- `expense_date` kiểu `DATE`.
- Timestamps `created_at` / `updated_at` UTC.
- Thống kê tháng theo lịch `Asia/Ho_Chi_Minh`.

## Free-tier assumptions

Mục tiêu chi phí gần **0đ** cho gia đình nhỏ:

| Service | Free tier notes |
| --- | --- |
| Supabase | DB + Auth + API trong Free plan; project có thể **pause** sau khoảng 1 tuần không hoạt động; giới hạn storage/egress/MAU |
| Cloudflare Pages | Bandwidth & build miễn phí trong hạn mức; custom domain OK |
| Local development | 0đ |

**Free Tier ≠ miễn phí vô hạn.** Chi phí có thể phát sinh khi:

- Vượt MAU / storage / egress Supabase
- Giữ project luôn active vượt Free (hoặc nâng Pro để tránh pause)
- Bandwidth hosting vượt hạn mức
- Dùng paid add-on (custom SMTP, extra compute, …)

Xem pricing hiện tại trên trang Supabase và Cloudflare.

## Project structure

```text
app/                 Nuxt app (pages, composables, components)
supabase/migrations  SQL schema + RLS + RPCs
supabase/seed.sql    Seed notes
tests/unit           Vitest
tests/e2e            Playwright
```

## Documentation

- [`PROJECT_ANALYSIS.md`](PROJECT_ANALYSIS.md) — Phase 1 analysis
- [`DATABASE_DESIGN.md`](DATABASE_DESIGN.md) — schema & RLS
- [`IMPLEMENTATION_SUMMARY.md`](IMPLEMENTATION_SUMMARY.md) — deliverable summary

## Future roadmap (out of MVP)

- OAuth social login, invite email links
- OCR hóa đơn, bank sync, recurring expenses
- Multi-currency, budgets, push notifications
- Custom categories UI for members (DB already per-family)

## License

Private / family use.
