# Project Changelog

## [2026-02-08] - Security, Quality & UI Enhancement

### Design System Rebrand — `9277969`
- **Color palette**: Navy (hue 260) → Teal (hue 185) across all CSS variables
- **Design tokens**: Primary `#0F766E` (teal-700), Secondary `#14B8A6` (teal-500), CTA `#0369A1` (sky-700)
- **Font**: Added Cinzel for brand name ("Joyhomes CRM"), Inter remains body font
- **Sidebar**: Dark teal (`oklch(0.22 0.04 185)`) replacing dark navy
- **Auth pages**: Teal gradient background (`from-teal-50 to-teal-100`)
- **Charts**: Revenue/booking/customer-source charts updated to teal palette
- **KPI cards**: Conversion rate accent changed violet → sky-600
- **Transitions**: 200ms `transition-colors` on all interactive elements
- **Font var fix**: `--font-geist-sans` → `--font-inter` (corrected mismatch)
- **Hydration fix**: Dashboard greeting/date moved to `useEffect` to prevent SSR mismatch (`39f1a6f`)
- Files: `globals.css`, `layout.tsx`, `(auth)/layout.tsx`, `login-form-component.tsx`, 5 dashboard components

### Security Fixes (16 issues)
- **Critical IDOR vulnerabilities**: API routes hardened with ownership checks (`9904be6`)
- **File upload security**: Validate MIME types, file size limits, sanitize filenames
- **High-severity issues**: Rate limiting middleware, CSRF protection, input sanitization (`3048e07`)
- **Medium-severity issues**: Session handling, error message leakage, SQL injection prevention (`29bb596`)
- Full report: `plans/reports/security-fix-260208-1657-all-issues-resolved.md`

### Code Quality Fixes (5 issues) — `d0aa53f`
- Tasks PATCH: ownership check (creator/assignee, elevated role bypass)
- Dashboard stats: SALES role scoped to own data only
- `getCustomersNeedingAttention`: DB-level filter instead of in-memory
- `isElevatedRole()` + `hasPermission()` used instead of hardcoded role checks
- Full report: `plans/reports/quality-fix-260208-1706-code-quality-resolved.md`

### Inventory Management — `318ed40`
- Property listing with filtering (status, price range, area, bedrooms)
- Bulk import dialog (CSV/Excel support)
- Property CRUD with form dialog
- Project CRUD with edit/new pages
- Delete confirmation dialog
- New UI components: `alert-dialog`, `slider`, `tabs`
- Custom hooks: `use-inventory-queries.ts`
- Utility: `format-price-vnd.ts`, `inventory-import-parser.ts`

### Dashboard UI Enhancement — `bbbb033`
- Improved KPI cards layout and styling
- Enhanced charts: booking status, customer source, sales performance
- Updated top performers leaderboard
- Refined sidebar navigation
- Global CSS refinements
- Properties API route fix

## [2026-02-07] - Bugfix Session

### Fixed
- **Login không hoạt động**: Seed script sử dụng sai hash format. Better Auth dùng scrypt (`salt:hash`), không phải bcrypt hay SHA256
  - File: `prisma/database-seed-script.ts`
  - Fix: Sử dụng Node.js native `scryptSync` với đúng params của Better Auth

- **Customers API 400**: API `/api/customers` trả về 400 khi không có query params
  - File: `src/app/api/customers/route.ts`
  - Fix: Filter null/empty values trước khi pass vào Zod schema

- **Settings page 404**: Trang `/settings` chưa tồn tại
  - Files created: `src/app/(dashboard)/settings/page.tsx`, `src/components/settings/settings-page-content.tsx`

- **Avatar 404**: File `/avatar.png` không tồn tại
  - File created: `public/avatar.svg`
  - File updated: `src/components/layouts/dashboard-sidebar-navigation.tsx` (đổi path sang `.svg`)

- **Better Auth base URL warning**: Warning về Base URL chưa được config
  - File: `.env` - thêm `NEXT_PUBLIC_APP_URL=http://localhost:3000`
  - File: `src/lib/auth.ts` - thêm explicit `baseURL` config

- **Events/new 404**: Trang tạo sự kiện mới chưa tồn tại
  - File created: `src/app/(dashboard)/events/new/page.tsx`

- **Tasks/new 404**: Trang tạo task mới chưa tồn tại
  - File created: `src/app/(dashboard)/tasks/new/page.tsx`

- **Tasks PATCH 400**: Frontend gửi status `"DONE"` nhưng schema chỉ chấp nhận `"COMPLETED"`
  - File: `src/components/tasks/tasks-page-content.tsx`
  - Fix: Đổi tất cả `"DONE"` → `"COMPLETED"`

### Technical Details

#### Better Auth Password Hashing
Better Auth sử dụng scrypt với format `salt:hash`:
```typescript
// Correct format for seed script
import { scryptSync, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}
```

#### Better Auth Account Table
Better Auth lưu credentials trong bảng `accounts` với `providerId: "credential"`, không phải trong `users.passwordHash`.

### Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@joyhomes.vn | admin123 | ADMIN |
| manager@joyhomes.vn | manager123 | MANAGER |
| sales1@joyhomes.vn | sales123 | SALES |
| sales2@joyhomes.vn | sales123 | SALES |
| ketoan@joyhomes.vn | ketoan123 | ACCOUNTANT |
