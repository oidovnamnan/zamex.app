# 🔍 ZAMEX System Comprehensive Audit Report

**Date:** 2026-02-11  
**Auditor:** Antigravity AI  
**Scope:** Full-stack backend + frontend audit  
**Status:** ✅ Complete

---

## 📊 System Summary

| Layer | Files | Total Lines |
|-------|-------|-------------|
| Backend (Express + Prisma) | 20 route files, 2 middleware, 1 schema | ~4,500 |
| Frontend (Next.js + React) | 38 pages, 1 component, 2 lib files | ~9,000 |
| **Total** | **~63 files** | **~13,500+** |

**Tech Stack:** Express.js, Prisma (SQLite), Next.js 14 (App Router), Zustand, Axios, Framer Motion, Tailwind CSS

---

## ‼️ CRITICAL BUGS (Must Fix)

### 🔴 BUG-001: Return Photos NOT Uploaded to Server
**File:** `frontend/src/app/returns/new/page.tsx` (lines 174-181)  
**Severity:** 🔴 Critical

Photos are being stored as local `blob:` URLs via `URL.createObjectURL()` but are never actually uploaded to the server. When the return is submitted (line 66), it sends the blob URLs (or a placeholder string) as `evidencePhotos`, which the backend cannot access.

```tsx
// Current (BROKEN):
newPhotos[i] = URL.createObjectURL(e.target.files[0]); // blob: URL, local only
// ...
evidencePhotos: photos.length > 0 ? photos : ['placeholder_evidence.jpg'],
```

**Fix:** Upload each file via `/upload` endpoint (like the verify pages do), then use the returned server URL.

---

### 🔴 BUG-002: `getMediaUrl()` Returns Empty Path for Relative URLs
**File:** `frontend/src/lib/api.ts` (lines 10-14)  
**Severity:** 🔴 Critical

```typescript
export const getMediaUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path; // ← Returns relative path like "uploads/xxx.png" without base URL
};
```

Since the backend serves uploads from `http://localhost:4000/uploads/`, but the frontend runs on `http://localhost:3000`, relative paths like `uploads/IMG_123.png` will resolve to `localhost:3000/uploads/IMG_123.png` (404). This breaks all uploaded image previews.

**Fix:** Prepend the API base URL for non-http paths:
```typescript
return `${API_URL.replace('/api', '')}/${path}`;
```

---

### 🔴 BUG-003: Insurance Fund Page Uses Hardcoded Placeholder Data
**File:** `frontend/src/app/admin/insurance/page.tsx` (lines 16-21)  
**Severity:** 🔴 Critical (Misleading data)

The insurance fund page shows **hardcoded fake data** instead of fetching from the API. The balance `2,450,000` and all transactions are mock objects.

```typescript
setBalance(2450000); // Hardcoded!
setTransactions([
  { id: '1', type: 'PREMIUM_IN', amount: 15000, ... }, // Fake
]);
```

**Fix:** Build a backend endpoint for insurance fund balance/transactions, or query from `InsuranceFundTransaction` table.

---

### 🔴 BUG-004: Company Detail Page Uses Undefined `MessageCircle` Import
**File:** `frontend/src/app/companies/[id]/page.tsx` (line 322)  
**Severity:** 🟡 Medium (Won't crash but renders custom SVG)

`MessageCircle` is reimplemented as a custom SVG function at the bottom of the file (line 383) instead of importing from lucide-react. This works but is inconsistent and fragile.

---

### 🔴 BUG-005: Auth redirectByRole Sends TRANSPORT_ADMIN to `/cargo`
**File:** `frontend/src/app/auth/page.tsx` (line 37)  
**Severity:** 🟡 Medium

```typescript
case 'TRANSPORT_ADMIN':
  router.push('/cargo'); // Comment says: "keep them under /cargo or create /transport"
```

Transport admins might need their own dashboard. Currently they land on the cargo admin page.

---

## ⚠️ SECURITY ISSUES

### 🔶 SEC-001: Demo Credentials Visible in Production Code
**File:** `frontend/src/app/auth/page.tsx` (lines 266-328)  
**Severity:** 🟡 High

Hardcoded demo credentials appear in the auth form when URL params contain `?role=customer`, `?role=cargo`, or `?role=driver`:

```
Customer: 99887766 / customer123
Cargo Admin: 88001122 / cargo123456
Staff China: 88440011 / staffchina123
Staff MN: 88440022 / staffmn123
Driver: 88112233 / driver123456
```

These should be behind an environment flag (`NODE_ENV === 'development'`) or removed before production.

---

### 🔶 SEC-002: No Route-Level Auth Guards on Frontend Pages
**Severity:** 🟡 High

None of the frontend pages verify the user is authenticated before rendering. If someone navigates directly to `/admin`, `/cargo`, or `/dashboard`, the page renders and makes API calls that will fail with 401 but shows no redirect logic.

**Affected pages:** `/admin/*`, `/cargo/*`, `/driver/*`, `/staff/*`, `/dashboard`, `/orders/*`

**Fix:** Add auth guard middleware or a layout-level check that redirects to `/auth` if not logged in.

---

### 🔶 SEC-003: Backend Settings Update Requires Password But No Rate Limiting
**File:** `backend/src/modules/settings/settings.routes.ts`
**Severity:** 🟡 Medium

The settings update endpoint requires a `configPassword`, which is good. However, there's no rate limiting on the password verification attempt, allowing brute-force attacks against the config password.

---

### 🔶 SEC-004: File Upload Has No Virus/Content Scanning
**File:** `backend/src/modules/upload/upload.routes.ts`
**Severity:** 🟡 Medium

Files are uploaded with only extension-based filtering. No actual content validation or malware scanning is performed. A malformed file with a `.jpg` extension could contain malicious content.

---

## 🔧 LOGIC INCONSISTENCIES (Frontend ↔ Backend)

### 🟠 LOGIC-001: Order Status Mismatch Between Frontend and Backend
**Backend** (`packages.routes.ts`): Uses statuses like `RECEIVED_IN_CHINA`, `MEASURED`, `CATEGORIZED`, `SHELVED_CHINA`, `BATCHED`, `DEPARTED`, `IN_TRANSIT`, `AT_CUSTOMS`, `CUSTOMS_CLEARED`, `ARRIVED_MN`, `SHELVED_MN`, `READY_FOR_PICKUP`, `DELIVERED`

**Frontend Dashboard** (`dashboard/page.tsx` lines 21-31): Only maps these statuses:
```
RECEIVED_IN_CHINA, MEASURED, CATEGORIZED, SHELVED_CHINA, BATCHED,
DEPARTED, IN_TRANSIT, ARRIVED_MN, READY_FOR_PICKUP, DELIVERED
```

**Missing from frontend mapping:** `AT_CUSTOMS`, `CUSTOMS_CLEARED`, `SHELVED_MN`

Packages with these statuses will show with no label in the dashboard.

---

### 🟠 LOGIC-002: Order Detail Timeline Skips Intermediate Statuses  
**File:** `frontend/src/app/orders/[id]/page.tsx` (lines 14-21)

The visual timeline only shows 6 steps: `PENDING → RECEIVED_IN_CHINA → DEPARTED → ARRIVED_MN → READY_FOR_PICKUP → DELIVERED`

But the `STATUS_ORDER` array (line 23-25) tracks 15 statuses. Intermediate states like `MEASURED`, `CATEGORIZED`, `IN_TRANSIT`, `AT_CUSTOMS`, etc. are invisible to the customer.

---

### 🟠 LOGIC-003: Dashboard Order Status Map Missing Key Statuses
**File:** `frontend/src/app/dashboard/page.tsx` (lines 13-19)

The `ORDER_STATUS_MAP` omits several order-level statuses from the Prisma schema:
- `PRE_ANNOUNCED`
- `IN_TRANSIT_TO_WAREHOUSE`

Orders with these statuses will display with no label.

---

### 🟠 LOGIC-004: Cargo Admin renderChinaView / renderMNView Not Role-Protected
**File:** `frontend/src/app/cargo/page.tsx`

The cargo dashboard calls `loadData()` which fetches from `/packages` and `/batches`, but there's no check on whether the user has `STAFF_CHINA` vs `STAFF_MONGOLIA` role to determine which view to show. The view selection logic should be role-based, but the implementation isn't visible in the outline — needs verification.

---

### 🟠 LOGIC-005: Verification Backend Expects `entityType` But Forms Send Different Types
**Backend** (`verification.routes.ts`): Accepts `entityType: 'USER' | 'COMPANY' | 'VEHICLE'`
- **Driver Verify page** sends `entityType: 'USER'` ✅
- **Cargo Verify page** sends `entityType: 'COMPANY'` ✅  
- **Transport Verify page** sends `entityType: 'COMPANY'` ⚠️ (Should this be 'COMPANY' or a separate type?)

---

### 🟠 LOGIC-006: Company Detail Shows Hardcoded `99.9%` Integrity Rating
**File:** `frontend/src/app/companies/[id]/page.tsx` (line 236)

```tsx
<span className="text-xl font-black text-slate-900">99.9%</span>
```

This value is hardcoded and not fetched from any backend data. Should be calculated from actual return/damage rates.

---

## 🧩 MISSING FEATURES / PLACEHOLDERS

### 📦 PLACEHOLDER-001: AI Chat Returns Static Responses
**File:** `backend/src/modules/ai/ai.routes.ts`
**Status:** Placeholder — returns canned responses, no LLM integration

---

### 📦 PLACEHOLDER-002: Customs Duty Calculation is Placeholder
**File:** `backend/src/modules/customs/customs.routes.ts`
**Status:** Returns a fixed formula instead of actual HS code-based duty calculation

---

### 📦 PLACEHOLDER-003: GPS Map is a Colored Gradient Placeholder
**File:** `frontend/src/app/tracking/[batchId]/page.tsx` (line 45)
**Status:** Shows a gradient box with a MapPin icon, no actual map integration

---

### 📦 PLACEHOLDER-004: QR Code Scanning Not Implemented
**File:** `frontend/src/app/cargo/pickup/page.tsx` (line 41)
**Status:** The "QR скан" button exists but has no camera/scanning functionality. Only manual input works.

---

### 📦 PLACEHOLDER-005: Staff Scanner Camera Mode Not Implemented
**File:** `frontend/src/app/staff/scanner/page.tsx`
**Status:** Has a `ScanMode` type but no actual camera integration for barcode scanning.

---

### 📦 PLACEHOLDER-006: i-Mongolia Integration is Simulated
**Files:** `driver/verify/page.tsx`, `cargo/verify/page.tsx`, `transport/verify/page.tsx`
**Status:** All three use `setTimeout(resolve, 2000)` to fake an i-Mongolia API call and return hardcoded data.

---

### 📦 PLACEHOLDER-007: Notifications Page Search Input Not Functional
**File:** `frontend/src/app/admin/verifications/page.tsx` (lines 121-128)
**Status:** Search input exists but has no `onChange` handler or filtering logic.

---

### 📦 PLACEHOLDER-008: Filter Button on Customers Page Non-Functional
**File:** `frontend/src/app/cargo/customers/page.tsx` (line 70-72)
**Status:** Filter button renders but does nothing when clicked.

---

## 🎨 UI/UX ISSUES

### 🟣 UX-001: Inconsistent Sidebar Duplication
**Affected pages:** `companies/page.tsx`, `companies/[id]/page.tsx`, `orders/[id]/page.tsx`, `dashboard/page.tsx`

The same sidebar navigation is copy-pasted across multiple pages with slight variations. This should be extracted into a shared `<Sidebar>` component or layout.

---

### 🟣 UX-002: Mixed Design Systems
Some pages use a custom design system (`card`, `btn-primary`, `badge-green`, `input`, etc.) while others use raw Tailwind classes. This creates visual inconsistency:
- **Custom classes:** `dashboard`, `chat`, `notifications`, `returns/new`, `ratings/new`, `unidentified`
- **Raw Tailwind:** `companies`, `companies/[id]`, `admin`, `auth`, `cargo/verify`

---

### 🟣 UX-003: No Loading States on Several Pages
**Affected pages:**
- `profile/page.tsx` — no loading indicator while fetching user
- `cargo/settings/page.tsx` — needs review
- `invoices/page.tsx` — needs review

---

### 🟣 UX-004: `cargo/layout.tsx` Missing From Review
There's a `cargo/layout.tsx` file that likely provides shared navigation for all cargo sub-pages. Need to verify it properly protects routes.

---

### 🟣 UX-005: "Verified" Badge Always Shows on Company Detail
**File:** `frontend/src/app/companies/[id]/page.tsx` (line 177-179)

The "Verified" badge is always rendered regardless of the company's actual verification status.

```tsx
<span className="..."><Check className="w-3 h-3 stroke-[3]" /> Verified</span>
// No conditional check!
```

---

## 📋 CODE QUALITY

### 🔵 QUALITY-001: Excessive Use of `any` Type
Almost every frontend page uses `useState<any>` or `useState<any[]>` for data. This defeats TypeScript's purpose and makes bugs harder to catch.

**Affected:** All 38 page files, store.ts (line 20: `customerCompanies?: any[]`)

---

### 🔵 QUALITY-002: Error Handling Silences Failures
Many API calls use empty `catch {}` blocks that silently swallow errors:
```typescript
const load = async () => {
  try { ... } catch {} setLoading(false); // Error is completely hidden
};
```
**Affected files:** `notifications`, `settlements`, `unidentified`, `dashboard`, `tracking`

---

### 🔵 QUALITY-003: Large Monolithic Page Files
Several pages exceed 300+ lines with no component extraction:
- `page.tsx` (landing): 800+ lines
- `driver/page.tsx`: 453 lines
- `auth/page.tsx`: 431 lines
- `marketplace/page.tsx`: 427 lines
- `companies/[id]/page.tsx`: 409 lines
- `cargo/page.tsx`: 375 lines

---

### 🔵 QUALITY-004: Duplicated FileUpload Component
The `FileUploadInput` component is duplicated identically in:
- `driver/verify/page.tsx`
- `cargo/verify/page.tsx`
- `transport/verify/page.tsx`

Should be extracted to a shared component.

---

### 🔵 QUALITY-005: No Internationalization Architecture
The app is primarily in Mongolian with some English mixed in. There's no i18n framework, making future multi-language support difficult.

---

## ✅ WHAT'S WORKING WELL

1. **Auth Flow:** JWT + Refresh Token + OTP system is well-implemented with proper token management
2. **API Interceptors:** Auto-refresh on 401 with retry logic is solid
3. **Prisma Schema:** Comprehensive and well-structured with proper relations
4. **Role-Based Access:** Backend middleware properly separates roles
5. **Error Handling Middleware:** Custom `AppError` class is consistent
6. **Zod Validation:** Consistent request validation across all backend routes
7. **Package Lifecycle:** Full status tracking from RECEIVED_IN_CHINA to DELIVERED
8. **Return System:** Automatic liability detection is a nice feature
9. **Rating System:** Comprehensive sub-ratings (speed, safety, service, price) with tag system
10. **Settlement System:** Clean financial calculation with fee breakdown
11. **Framer Motion:** Smooth animations throughout the frontend
12. **Responsive Design:** Desktop sidebar + mobile layouts are well done

---

## 📊 PRIORITY MATRIX

| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| 🔴 P0 | BUG-001: Return photos not uploaded | Data loss | Low |
| 🔴 P0 | BUG-002: getMediaUrl broken for relative paths | All uploads broken | Low |
| 🔴 P0 | SEC-001: Demo credentials in production | Security breach | Low |
| 🔴 P0 | SEC-002: No frontend auth guards | Unauthorized access | Medium |
| 🟡 P1 | BUG-003: Insurance fund uses fake data | Wrong financial data | Medium |
| 🟡 P1 | LOGIC-001: Status mismatch frontend/backend | Missing labels | Low |
| 🟡 P1 | UX-005: Verified badge always shows | Trust erosion | Low |
| 🟡 P1 | LOGIC-006: Hardcoded 99.9% integrity | Misleading metric | Low |
| 🟠 P2 | QUALITY-001: Excessive `any` types | Maintainability | High |
| 🟠 P2 | QUALITY-004: Duplicated FileUpload | Code smell | Medium |
| 🟠 P2 | UX-001: Sidebar duplication | Maintenance burden | Medium |
| 🔵 P3 | All PLACEHOLDER items | Feature completeness | High |
| 🔵 P3 | QUALITY-003: Large monolithic files | Dev velocity | High |

---

## 🏁 CONCLUSION

The Zamex system has a solid architectural foundation with well-designed backend routes, comprehensive data models, and a polished frontend UI. The main areas requiring immediate attention are:

1. **3 critical bugs** that can cause data loss or broken UI (photo upload, media URLs, fake insurance data)
2. **2 security issues** that must be fixed before production (demo creds, auth guards)
3. **6+ status/logic mismatches** between frontend and backend that cause missing labels
4. **8 placeholder features** that need real implementation

The codebase is functional for demo/development purposes but needs the P0 and P1 items resolved before any production deployment.
