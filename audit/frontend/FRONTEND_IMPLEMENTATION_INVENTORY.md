# ArcheOn Design Studio — Frontend Implementation Inventory

**Audit Date:** November 18, 2026
**Auditor:** Senior Frontend Architect & Independent Code Auditor
**Scope:** `D:\WEBUI\frontend` (Next.js 16 / React 19 / TypeScript / Tailwind CSS 4)
**Execution Mode:** STRICT READ-ONLY ARCHITECTURE AUDIT

---

## 1. Executive Summary

This document records a complete filesystem and dependency analysis of the ArcheOn Design Studio frontend. The frontend is a Next.js 16 App Router application containing **141 TypeScript/React asset files** under `src/` plus the standard Next.js scaffolding (`package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, etc.).

The application currently exposes **3 explicit public routes** (`/`, `/admin`, `/design-system`) and **no routed client/vendor portal pages**. The client and vendor portal are delivered only as transient `<ClientPortalModal>` / `<VendorPortalModal>` overlays on the public homepage; there is no dedicated `/client` or `/vendor` route tree and no login/role-selection surface.

The codebase contains a large, partially-prepared component set: **58 Admin portal components**, **11 Client portal components**, **11 Vendor portal components**, plus shared, form, home, canvas, journal, project, and UI components. A substantial majority of the portal component set is **orphaned/unreferenced** — none of the 58 Admin components are imported or mounted anywhere in the active application.

---

## 2. Filesystem Inventory

| Category | File count | Directory |
|---|---|---|
| Next.js App Router routes (`app/`) | 6 | `src/app` |
| Component files | 130 | `src/components/{canvas,forms,home,journal,portal,projects,shared,ui}` |
| Config files | 2 | `src/config` |
| Provider files | 2 | `src/providers` |
| Utility files | 1 | `src/utils` |
| **Total** | **141** | |

### 2.1 `app/` route files

| Path | Role |
|---|---|
| `src/app/layout.tsx` | Root layout (metadata, fonts, global styles) |
| `src/app/page.tsx` | Homepage (`/`) — public, hero + services + projects + process + contact |
| `src/app/admin/page.tsx` | Admin dashboard (`/admin`) — monolithic 691-line dashboard |
| `src/app/design-system/page.tsx` | Design-system documentation (`/design-system`) |
| `src/app/globals.css` | Tailwind + design tokens + global CSS |
| `public/favicon.ico` | Static favicon |

### 2.2 Component category summary

| Directory | Count | Status |
|---|---|---|
| `components/canvas/` | 8 | Unreferenced (Three.js scene experiments) |
| `components/forms/` | 7 | Reusable forms, not yet mounted |
| `components/home/` | 16 | Mounted on `/` |
| `components/journal/` | 2 | Unreferenced |
| `components/portal/admin/` | 58 | All orphaned (unreferenced by any route) |
| `components/portal/client/` | 11 | 10 orphaned + 1 (`ClientPortalLayout`) used only as modal content |
| `components/portal/vendor/` | 11 | 10 orphaned + 1 (`VendorPortalLayout`) used only as modal content |
| `components/projects/` | 2 | Unreferenced |
| `components/shared/` | 6 | Reusable primitives (`Button`, `Container`, `SectionHeading`, `EditorialPageHero`, `TestimonialCard`, `index.ts`) |
| `components/ui/` | 9 | Mixed (Header, modals, AudioToggle, ScrollOverlay) |


## 3. Route Map (Current)

| Route | File | Type | Auth |
|---|---|---|---|
| `/` | `app/page.tsx` | Client component (home) | Public |
| `/admin` | `app/admin/page.tsx` | Server+client dashboard | Unauthenticated (no guard) |
| `/design-system` | `app/design-system/page.tsx` | Static docs | Public |
| `/*` (404) | implicit | — | — |
| `/client` | **missing** | — | — |
| `/vendor` | **missing** | — | — |
| `/client/*`, `/vendor/*` | **missing** | — | — |

> **Key gap:** The client and vendor portals have **no route tree**. They exist only as `<ClientPortalModal>` and `<VendorPortalModal>` overlays on the public homepage. A proper role-gated routing structure must be created.

---

## 4. Components Currently Imported & Mounted

### 4.1 Public homepage (`src/app/page.tsx`)
Imports and mounts:
- `Header`, `HeroSection`, `ServicesSection`, `ProjectsSection`, `ProcessSection`, `ContactSection`, `SiteFooter`, `StudioSection`
- Modals: `ServiceModal`, `ProjectDetailModal`, `ConsultationModal`, `ClientPortalModal`, `VendorPortalModal`
- Providers: `AudioProvider`, `SmoothScroll`
- `siteConfig` (services, projects, mission, etc.)

### 4.2 Design-system documentation (`src/app/design-system/page.tsx`)
Imports and mounts:
- `Container`, `SectionHeading`, `Button` (shared)
- Design tokens + `lucide-react` icons

### 4.3 Admin dashboard (`src/app/admin/page.tsx`)
Monolithic component. Does **not** import any of the 58 `components/portal/admin/` files. Implements its own inline HTML/CSS version of dashboard, approvals, leads, cash, reports.

### 4.4 Header (`components/ui/Header.tsx`)
Used only by the public homepage. Exports `HeaderProps` with callbacks `onOpenConsultation`, `onOpenClientPortal`, `onOpenVendorPortal`.


## 5. Components That Exist But Are Unused (Orphaned)

### 5.1 Admin portal — 58 files (100% orphaned)

All 58 files in `components/portal/admin/` are imported by **no** active route or component. They are referenced in `AdminPortalLayout.tsx` as a *prop* structure, not as imports. The orphaned components are:
`AdminAccessRequestManagementCenter`, `AdminApiAccessPolicyCenter`, `AdminApiKeyManagementCenter`, `AdminApiRateLimitMonitor`, `AdminApprovalWorkflowCenter`, `AdminAuditLogViewer`, `AdminBackgroundJobMonitor`, `AdminBackupRecoveryCenter`, `AdminCashSettlementManagement`, `AdminChangeManagementCenter`, `AdminClientManagement`, `AdminComplianceEvidenceCenter`, `AdminConsentNotificationPreferenceCenter`, `AdminDashboardOverview`, `AdminDataAccessRequestCenter`, `AdminDataClassificationPolicyCenter`, `AdminDataExportGovernanceCenter`, `AdminDataGovernanceCenter`, `AdminDataImportCenter`, `AdminDataRetentionCenter`, `AdminDocumentManagement`, `AdminFeatureFlagManagementCenter`, `AdminFinanceOverview`, `AdminIncidentManagementCenter`, `AdminIntegrationManagementCenter`, `AdminInvoiceApprovalWorkspace`, `AdminInvoiceManagement`, `AdminLeadManagement`, `AdminMaintenanceManagementCenter`, `AdminNotificationChannelConfigurationCenter`, `AdminNotificationDeadLetterQueueCenter`, `AdminNotificationDeliveryAuditCenter`, `AdminNotificationOperations`, `AdminNotificationProviderWebhookMonitor`, `AdminNotificationQueueMonitor`, `AdminNotificationScheduleManagementCenter`, `AdminNotificationSuppressionRulesCenter`, `AdminNotificationTemplateManagementCenter`, `AdminOperationalMonitoring`, `AdminPeriodicAccessReviewCenter`, `AdminPlatformHealthMonitor`, `AdminPortalLayout`, `AdminProjectDetailWorkspace`, `AdminProjectManagement`, `AdminReportExportCenter`, `AdminRolePermissionMatrix`, `AdminSecurityAccessCenter`, `AdminSecurityEventCenter`, `AdminSecurityExceptionHistory`, `AdminSecurityExceptionManagementCenter`, `AdminSecurityPolicyManagementCenter`, `AdminSessionManagementCenter`, `AdminSystemSettings`, `AdminUserActivityTimeline`, `AdminUserRoleManagement`, `AdminVendorManagement`, `AdminWebhookEndpointManagementCenter`, `AdminWebhookEventCenter`.

> Note: `AdminPortalLayout.tsx` is orphaned as well (nothing imports it). It defines the navigation contract used by these components.

### 5.2 Client portal — 10 of 11 orphaned

`ClientDisputeTracking`, `ClientDocumentLibrary`, `ClientInvoiceDisputeForm`, `ClientInvoiceOverview`, `ClientNotificationsCentre`, `ClientPaymentProofForm`, `ClientPortalDashboard`, `ClientProfileSettings`, `ClientProjectOverview`, `ClientProjectWorkspace` — all orphaned. Only `ClientPortalLayout` is imported by `ClientPortalModal`.

### 5.3 Vendor portal — 10 of 11 orphaned

`VendorCashSettlement`, `VendorDisputeTracking`, `VendorInvoiceHistory`, `VendorInvoiceSubmissionForm`, `VendorNotificationsCentre`, `VendorPaymentHistory`, `VendorPortalDashboard`, `VendorProfileSettings`, `VendorProjectOverview`, `VendorSupportCentre` — all orphaned. Only `VendorPortalLayout` is imported by `VendorPortalModal`.

### 5.4 Canvas (8)

`ArchitecturalCave`, `ArchitecturalMonoliths`, `CameraRig`, `FloatingProjectCubes`, `IglooDome`, `IglooWorld`, `ParticleSnow`, `Scene` — Three.js scene experiments, unreferenced.

### 5.5 Forms (7)

`ConsultationRequestForm`, `EnquiryFeedback`, `PasswordResetForm`, `PortalAccessForm`, `PortalInvitationActivation`, `ProjectEnquiryForm` — standalone forms, not mounted.

### 5.6 Journal (2)

`JournalArticleCard`, `JournalArticleDetail` — unreferenced (the navigation links `#journal` exist in the header, but no journal section/page is mounted).

### 5.7 Projects (2)

`ProjectCard`, `ProjectDetailView` — unreferenced.

---

## 6. Duplicate / Near-Duplicate Components

| # | Issue |
|---|---|
| 1 | `src/app/admin/page.tsx` (monolithic, 691 lines) **duplicates** the functionality of `AdminApprovalWorkflowCenter`, `AdminLeadManagement`, `AdminCashSettlementManagement`, `AdminFinanceOverview`, `AdminInvoiceManagement` — the intents of the prepared component set are re-implemented inline rather than composed. |
| 2 | The public homepage's portal entrance pattern (`<ClientPortalModal>` / `<VendorPortalModal>`) duplicates, at a smaller scale, the full client/vendor portal layouts that exist in `components/portal/client` and `components/portal/vendor`. |
| 3 | `components/shared/EditorialPageHero.tsx` and `components/home/StudioSection.tsx` / `StudioExperienceSection` serve overlapping editorial-hero roles on the homepage. |
| 4 | `components/ui/ClientPortalModal` and `components/portal/client/ClientPortalLayout` + `ClientPortalDashboard` are two overlapping "client" surfaces. |


## 7. Broken Imports & TypeScript Errors

Verified via `npx tsc --noEmit` (exit code 1):

| # | File | Error | Detail |
|---|---|---|---|
| 1 | `src/components/portal/admin/AdminClientManagement.tsx` | **TS2393 Duplicate function implementation** | `async function runAction(action: () => Promise<void>)` is declared at **line 208** and **again at line 792** within the same component body. |
| 2 | `src/components/portal/admin/AdminDashboardOverview.tsx` | **TS2304 Cannot find name 'ShieldCheck'** | `<ShieldCheck />` referenced at line 644 but never imported from `lucide-react`. |
| 3 | `src/components/portal/client/ClientNotificationsCentre.tsx` | **TS2304 Cannot find name 'ShieldCheck'** | `<ShieldCheck />` referenced at line 352 but never imported from `lucide-react`. |

Additionally, the `next.config.ts` sets `typescript.ignoreBuildErrors: true`, which masks all of the above and makes `npm run build` exit 0 despite `tsc --noEmit` failing.

---

## 8. Existing API Integrations

The frontend currently contains **no shared API client**. All network calls are inlined `fetch()` expressions.

### 8.1 `src/app/admin/page.tsx` (admin dashboard)

Hardcoded `http://localhost:8080` base URL. The admin dashboard makes the following calls (all hardcoded, no JWT, no env config):

| Line(s) | Endpoint pattern | Method | Purpose |
|---|---|---|---|
| 106 | `/api/approvals/config` | GET | Approval policy config |
| 126 | `/api/approvals/all` | GET (inferred) | List all bills/approvals |
| 142, 161, 187, 203, 219, 235, 251 | `/api/approvals/{id}/approve-primary` | POST | Primary approval |
| 161, 187, 203, 219, 235, 251 | `/api/approvals/{id}/approve-secondary` | POST | Secondary approval |
| 161, 187, 203, 219, 235, 251 | `/api/approvals/{id}/reject` | POST | Reject bill |
| 187 (approx) | `/api/leads` | GET (inferred) | List CRM leads |
| 219 (approx) | `/api/finance/cash/all` | GET (inferred) | List cash register |
| 235 (approx) | `/api/finance/cash/{ref}/approve` | POST (inferred) | Approve cash settlement |
| 251 (approx) | `/api/finance/reports/aging-receivables` | GET (inferred) | Aging receivables |
| 251 (approx) | `/api/finance/reports/export-bills-csv` | GET (inferred) | Export CSV |

> **Critical finding:** Every URL is hardcoded to `http://localhost:8080` with no environment variable, no JWT token injection, and no base-URL configuration. This makes the dashboard non-deployable and the calls unauthenticated.

### 8.2 Other components

No other component performs network fetches. The client/vendor portals (where they exist as modals) are purely presentational.

---

## 9. Hardcoded Localhost URLs

| # | File | URL | Severity |
|---|---|---|---|
| 1 | `src/app/admin/page.tsx` | `http://localhost:8080/api/...` | CRITICAL — deployed build depends on a local backend on the developer's machine |


## 10. Authentication & Authorization Gaps

| # | Gap | Impact |
|---|---|---|
| 1 | No JWT/token storage (no `localStorage`/`cookies` abstraction) | Users cannot maintain session |
| 2 | No protected route mechanism | `/admin` and the (future) client/vendor portals are fully public |
| 3 | No role-based navigation (admin/client/vendor) | Any user sees any portal content |
| 4 | No 401/403 handling | Expired/invalid tokens produce silent failures or leaked data |
| 5 | No session-expiry handling | No `onAuthExpired` / redirect-to-login behaviour |
| 6 | No login/registration/forgot-password routes | Authentication is not surfaced to the user |
| 7 | No API base-URL environment variable | Backend connection is hardcoded and non-configurable |
| 8 | No authority/service-role model implemented on the frontend | Role checks are absent entirely |
| 9 | Backend "verified API" endpoints (`/api/approvals/*`, `/api/leads`, `/api/finance/cash/*`) are called **without authentication** | Security and authorization contract not met |

---

## 11. API Architecture Recommendations

1. **Central API client** (`src/lib/api.ts` or `src/services/api.ts`) exporting:
   - `apiFetch()` — JWT-injecting fetch wrapper that reads a token from a configurable storage (cookie/http-only or `localStorage`).
   - `BASE_URL` from `process.env.NEXT_PUBLIC_API_BASE_URL`.
   - Standard error mapping (`401` → `AuthError`, `403` → `ForbiddenError`, etc.).
2. **Auth provider** (`src/contexts/AuthContext.tsx`) managing:
   - `user`, `token`, `role`, `loading`
   - login / logout / refresh
   - session-expiry redirect
3. **Route guard** — `app/(auth)/login/page.tsx` and a `src/middleware.ts` (or server Layout) that enforces role-based access.
4. **Environment variables** — `NEXT_PUBLIC_API_BASE_URL` (public, for client components) and `API_BASE_URL` (server-only) in `.env.example`.

---

## 12. Readiness Summary

| Area | Status |
|---|---|
| Public homepage (`/`) | Compiles, but build is secretly masked by `ignoreBuildErrors` |
| `/admin` | Compiles only because type errors are suppressed; no auth; hardcoded localhost |
| `/design-system` | Compiles OK |
| `/client`, `/vendor` | **Missing** |
| Component integration | 130 components, 100+ orphaned |
| API integration | None (hardcoded, unauthenticated) |
| TypeScript | **4 errors** (masked by `ignoreBuildErrors`) |
| ESLint | ~496 problems (77 errors, 419 warnings) per existing audit |
| Build | Exit 0 **only because** `ignoreBuildErrors: true` |
| Auth | None |

---

## 13. Source of Truth

- `D:\WEBUI\frontend\src\`
- `D:\WEBUI\frontend\package.json`
- `D:\WEBUI\frontend\next.config.ts`
- `D:\WEBUI\frontend\tsconfig.json`
- `D:\WEBUI\frontend\eslint.config.mjs`
- Pre-existing audit artifacts: `audit/admin-portal/` (component inventory, backend matrix, TypeScript & build report, security & business-logic audit), `audit/security/`

**Grand total components: 130.**
