# Frontend Stabilization Independent Acceptance

**Audit date:** November 18, 2026  
**Project:** `D:\WEBUI`  
**Audit mode:** Read-only acceptance audit  
**Scope:** `D:\WEBUI\frontend` and the three supplied stabilization reports. No merge, deployment, source change, configuration change, or backend change was performed.

# Verdict: REJECTED

The frontend is buildable and all declared application routes returned successful HTTP responses in a production Next.js runtime. However, the submitted stabilization cannot be accepted because active, public UI paths still present hard-coded financial operations and records as live and can call financial mutation endpoints without any verified authentication/session transport or resource authorization. This contradicts material assertions in `FRONTEND_IMPLEMENTATION_REPORT.md` and the non-production safety posture described in `FRONTEND_BACKEND_INTEGRATION_GAPS.md`.

## Evidence Summary

| Acceptance area | Result | Evidence |
| --- | --- | --- |
| TypeScript | Pass | `npx tsc --noEmit --pretty false` exited 0 during this audit. |
| Production build | Pass | `npm run build` completed with Next.js 16.4.6 and generated all application routes. |
| HTTP route rendering | Pass | A production `next start --port 3010` instance returned HTTP 200 for all 15 declared non-404 app routes. |
| Shell content duplication | Pass | Each of the admin, client, and vendor layouts passes `children` to its shell once; each shell passes `children` to its portal layout once. No shell independently mounts a second dashboard/content surface. |
| Broken imports / unresolved route tree | Pass | TypeScript and production build passed. Every declared route rendered HTTP 200. |
| Fake client-side authentication / JWT parsing | Pass, with security limitation | No active `AuthProvider`, auth guard, `localStorage` token flow, `atob` JWT parsing, process `AUTH_HEADER` guard, or `/api/auth/logout` reference was found under `frontend/src`. The portals remain public; this is correctly identified as a backend/session integration gap. |
| No fake financial operations presented as real | **Fail** | Active home-page client and vendor portal modals still display seeded financial records, perform direct finance/cash POSTs, and optimistically show success before server confirmation. The public `/admin` route also displays seeded bill/audit/aging data and provides approval/cash mutations. |
| API gaps documentation | Partially accurate | The session/cookie/RBAC gap is accurately documented, but the implementation report inaccurately says no UI presents mock operational/financial data as live and describes finance mutations as not enabled despite active modal and admin controls. |
| Responsive layout implementation | Pass by source inspection; visual QA not performed | Portal layouts implement mobile header/menu state, responsive Tailwind breakpoints, `max-w-*` constraints, and dialog layouts. There are 36 responsive utility matches across the three portal layouts. No browser screenshot/device visual regression test was performed. |
| Lint quality gate | Fail | ESLint reported 75 errors and 419 warnings across 80 files. |

## Verified Route Rendering

The production server returned HTTP 200 for:

- `/`
- `/admin`
- `/client`
- `/client/projects`
- `/client/documents`
- `/client/invoices`
- `/client/notifications`
- `/client/profile`
- `/design-system`
- `/vendor`
- `/vendor/projects`
- `/vendor/invoices`
- `/vendor/cash-settlements`
- `/vendor/notifications`
- `/vendor/profile`

`npm run build` also produced the corresponding static route manifest. This confirms routability and server-render output, not authorization correctness or successful backend transaction semantics.

## Shell and Navigation Findings

### No duplicated portal content

The following structure was verified:

- `src/app/admin/layout.tsx` renders `<AdminPortalShell>{children}</AdminPortalShell>` once.
- `src/app/client/layout.tsx` renders `<ClientPortalShell>{children}</ClientPortalShell>` once.
- `src/app/vendor/layout.tsx` renders `<VendorPortalShell>{children}</VendorPortalShell>` once.
- Each corresponding shell passes only `{children}` into its portal layout.

This resolves the prior duplication pattern where shells mounted their own dashboard content in addition to route children.

### Navigation conditions

Portal navigation labels do not all have distinct corresponding routes:

- Client `drawings` and `documents` both navigate to `/client/documents`.
- Client `payments` and `disputes` both navigate to `/client/invoices`.
- Client `support` navigates to `/client`.
- Vendor `payments` navigates to `/vendor/invoices`.
- Vendor `disputes` navigates to `/vendor/cash-settlements`.
- Vendor `support` navigates to `/vendor`.
- All non-dashboard admin navigation sections route back to `/admin`.

These are not 404/dead-import failures, but they are incomplete route integrations and make the navigation labels misleading.

## Security, Fake Data, and Financial-Operation Findings

### Positive finding: removed fake auth/JWT implementation

The audit found no active frontend implementation of the removed auth mechanism: no local-storage token flow, client JWT parsing, `AuthProvider`, `auth-guard`, `AUTH_HEADER` placeholder, or invented `/api/auth/logout` call remains under `frontend/src`.

The report correctly identifies that the backend expects `Authorization: Bearer <JWT>` and that no verified browser-to-server cookie/session contract is implemented. Therefore `/admin`, `/client`, and `/vendor` are public UI routes, not protected workspaces.

### Release-blocking finding A — Client portal modal

`src/components/ui/ClientPortalModal.tsx`, mounted from the public home page, still:

- POSTs directly to `http://localhost:8080/api/finance/payment-proof`.
- POSTs directly to `http://localhost:8080/api/finance/dispute`.
- Uses hard-coded `BILL-2026-081`, payer/payee identities, amount `₹5,00,000`, fallback UTR data, and a proof URL.
- Calls `setProofSubmitted(true)` and `setDisputeOpened(true)` **before** awaiting the request and leaves those success states active even if the request fails.
- Shows transaction/dispute success text in the active public UI.

This is an unintended mock financial operation presented as real. It is incompatible with the report statement that no UI presents mock financial data as live and with the documented requirement for verified finance/RBAC contracts.

### Release-blocking finding B — Vendor portal modal

`src/components/ui/VendorPortalModal.tsx`, also mounted from the public home page, still:

- Displays a hard-coded vendor, invoices, amounts, approval states, UTR, and settlement reference `CSH-SETTLE-409`.
- POSTs to `http://localhost:8080/api/finance/cash/CSH-SETTLE-409/respond` for acknowledge/reject actions.
- Calls `setCashAckState("acknowledged")` / `setCashAckState("rejected")` before API completion.
- Adds a simulated invoice through `setNewInvoiceCreated(true)` without a backend transaction.

This is an active financial/cash-settlement simulation with unsafe optimistic success behavior and hard-coded resource identifiers.

### Release-blocking finding C — Public admin financial workflow

`/admin` is a static public route. `src/app/admin/page.tsx` still:

- Seeds a `Sample Live Bills Queue`, audit entries, and aging-receivable figures.
- Uses `any` for leads/cash/aging data.
- Calls approval and settlement mutations: approval primary/secondary/reject and cash approval.
- Performs client-side state transitions after mutation attempts.
- Retains a direct hard-coded export link to `http://localhost:8080/api/finance/reports/export-bills-csv`.

Because no auth/session/RBAC boundary exists, this page must not be accepted as a stabilized operational/admin interface.

## Report Accuracy Assessment

### `FRONTEND_IMPLEMENTATION_REPORT.md`

Accurate:

- TypeScript suppression was removed.
- Separate client/vendor/admin shells exist.
- Typed empty-state routes exist for the new portal routes.
- The incomplete frontend auth implementation was removed.

Not accurate enough for acceptance:

- The statement that “No UI currently presents mock operational/financial data as live backend data” is false for the active public home-page portal modals and the admin page.
- The statement that finance/payment/cash-settlement mutations are not production-integrated omits that active UI actions still invoke the relevant backend endpoints.

### `FRONTEND_TEST_REPORT.md`

Accurate for this audit:

- TypeScript passes.
- Production build passes.
- The stated lint total is correct: 75 errors and 419 warnings.

Incomplete:

- Build success alone did not test public modal behavior, optimistic financial state changes, or authorization boundaries.

### `FRONTEND_BACKEND_INTEGRATION_GAPS.md`

Substantively accurate regarding the missing session/cookie/BFF design, RBAC, error contracts, and finance safety requirements. Its severity should be applied to the currently active modal/admin flows, not only to future integrations.

## Runtime and Responsive Findings

- Portal layout source includes mobile headers, mobile navigation state, responsive `sm:`/`md:`/`lg:` styles, constrained modal/dialog widths, and vertical overflow handling.
- The production routes return HTML successfully and no runtime 500/404 was observed in the HTTP audit.
- This audit did **not** perform interactive browser automation, viewport screenshots, keyboard-focus testing, or transaction network interception. The responsive conclusion is source-level rather than a full visual acceptance test.
- The Next production server warns that the package lock in `D:\` is outside the frontend Git repository. This is non-blocking for the build, but deployment/build-root configuration should be made explicit (`turbopack.root` / `outputFileTracingRoot`) before release.

## Required Remediation Before Re-Audit

1. Remove, disable, or clearly isolate the public `ClientPortalModal` and `VendorPortalModal` finance/cash flows. They must not call finance endpoints or display success for hard-coded transactions.
2. Remove seeded live financial records and active approval/cash actions from public `/admin`, or implement verified server-side/session-backed access enforcement before rendering the route.
3. Replace direct hard-coded `http://localhost:8080` requests/links in active UI code with a confirmed environment-configured API contract. Ensure finance API calls carry the validated auth transport only after the chosen session design is implemented.
4. Eliminate optimistic “success” state changes until a response is confirmed; surface failures instead.
5. Make portal navigation either point to distinct implemented routes or label fallback destinations accurately.
6. Resolve the lint gate, prioritizing 75 errors. Third-party generated assets should be excluded from lint or linted with an appropriate vendor configuration rather than counted as application violations.
7. Update the three stabilization reports to reflect any remaining active financial UI and the actual authorization exposure.
8. Conduct browser-level responsive/accessibility/runtime tests after the above changes.

## Lint Summary by Rule

| Rule | Errors | Warnings |
| --- | ---: | ---: |
| `react/no-unescaped-entities` | 25 | 0 |
| `react/jsx-no-comment-textnodes` | 19 | 0 |
| `@typescript-eslint/no-require-imports` | 7 | 0 |
| `@typescript-eslint/no-explicit-any` | 6 | 0 |
| `@typescript-eslint/no-this-alias` | 4 | 0 |
| `react-hooks/purity` | 4 | 0 |
| `react-hooks/static-components` | 3 | 0 |
| `react-hooks/refs` | 3 | 0 |
| `@next/next/no-html-link-for-pages` | 2 | 0 |
| `@next/next/no-assign-module-variable` | 1 | 0 |
| `react-hooks/immutability` | 1 | 0 |
| `@typescript-eslint/no-unused-vars` | 0 | 233 |
| `@typescript-eslint/no-unused-expressions` | 0 | 176 |
| `@next/next/no-img-element` | 0 | 8 |
| `import/no-anonymous-default-export` | 0 | 1 |
| `@next/next/no-page-custom-font` | 0 | 1 |

## Complete Lint Inventory by File and Severity

Totals: 75 errors, 419 warnings; 80 affected files.

| File | Errors | Warnings | Rule counts |
| --- | ---: | ---: | --- |
| `D:\WEBUI\frontend\postcss.config.mjs` | 0 | 1 | import/no-anonymous-default-export: 0E/1W |
| `D:\WEBUI\frontend\public\assets\libs\basis\basis_transcoder.js` | 3 | 48 | @typescript-eslint/no-unused-vars: 0E/48W<br>@typescript-eslint/no-require-imports: 3E/0W |
| `D:\WEBUI\frontend\public\assets\libs\draco\draco_decoder.js` | 3 | 107 | @typescript-eslint/no-require-imports: 2E/0W<br>@typescript-eslint/no-unused-vars: 0E/57W<br>@typescript-eslint/no-unused-expressions: 0E/50W<br>@next/next/no-assign-module-variable: 1E/0W |
| `D:\WEBUI\frontend\public\assets\libs\draco\draco_wasm_wrapper.js` | 6 | 138 | @typescript-eslint/no-unused-vars: 0E/12W<br>@typescript-eslint/no-unused-expressions: 0E/126W<br>@typescript-eslint/no-this-alias: 4E/0W<br>@typescript-eslint/no-require-imports: 2E/0W |
| `D:\WEBUI\frontend\src\app\admin\page.tsx` | 9 | 16 | @typescript-eslint/no-unused-vars: 0E/16W<br>@typescript-eslint/no-explicit-any: 5E/0W<br>react/jsx-no-comment-textnodes: 4E/0W |
| `D:\WEBUI\frontend\src\app\design-system\page.tsx` | 0 | 3 | @typescript-eslint/no-unused-vars: 0E/3W |
| `D:\WEBUI\frontend\src\app\layout.tsx` | 0 | 1 | @next/next/no-page-custom-font: 0E/1W |
| `D:\WEBUI\frontend\src\app\page.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\canvas\ArchitecturalCave.tsx` | 0 | 2 | @typescript-eslint/no-unused-vars: 0E/2W |
| `D:\WEBUI\frontend\src\components\canvas\CameraRig.tsx` | 1 | 0 | react-hooks/immutability: 1E/0W |
| `D:\WEBUI\frontend\src\components\canvas\IglooDome.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\canvas\IglooWorld.tsx` | 1 | 1 | @typescript-eslint/no-unused-vars: 0E/1W<br>@typescript-eslint/no-explicit-any: 1E/0W |
| `D:\WEBUI\frontend\src\components\canvas\ParticleSnow.tsx` | 4 | 1 | @typescript-eslint/no-unused-vars: 0E/1W<br>react-hooks/purity: 4E/0W |
| `D:\WEBUI\frontend\src\components\forms\PortalAccessForm.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\home\ConsultationCTASection.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\home\ContactSection.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\home\MaterialsSection.tsx` | 0 | 1 | @next/next/no-img-element: 0E/1W |
| `D:\WEBUI\frontend\src\components\home\ServiceDetailView.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\home\SiteFooter.tsx` | 1 | 0 | @next/next/no-html-link-for-pages: 1E/0W |
| `D:\WEBUI\frontend\src\components\home\StudioExperienceSection.tsx` | 0 | 1 | @next/next/no-img-element: 0E/1W |
| `D:\WEBUI\frontend\src\components\journal\JournalArticleCard.tsx` | 0 | 1 | @next/next/no-img-element: 0E/1W |
| `D:\WEBUI\frontend\src\components\journal\JournalArticleDetail.tsx` | 0 | 2 | @next/next/no-img-element: 0E/2W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminAuditLogViewer.tsx` | 0 | 4 | @typescript-eslint/no-unused-vars: 0E/4W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminBackupRecoveryCenter.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminCashSettlementManagement.tsx` | 2 | 5 | @typescript-eslint/no-unused-vars: 0E/5W<br>react/no-unescaped-entities: 2E/0W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminClientManagement.tsx` | 1 | 3 | @typescript-eslint/no-unused-vars: 0E/3W<br>react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminConsentNotificationPreferenceCenter.tsx` | 2 | 0 | react/no-unescaped-entities: 2E/0W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminDashboardOverview.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminDataAccessRequestCenter.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminDataExportGovernanceCenter.tsx` | 1 | 2 | @typescript-eslint/no-unused-vars: 0E/2W<br>react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminDataRetentionCenter.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminDocumentManagement.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminFinanceOverview.tsx` | 0 | 4 | @typescript-eslint/no-unused-vars: 0E/4W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminIntegrationManagementCenter.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminInvoiceApprovalWorkspace.tsx` | 0 | 2 | @typescript-eslint/no-unused-vars: 0E/2W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminInvoiceManagement.tsx` | 0 | 5 | @typescript-eslint/no-unused-vars: 0E/5W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminLeadManagement.tsx` | 0 | 4 | @typescript-eslint/no-unused-vars: 0E/4W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminMaintenanceManagementCenter.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminNotificationChannelConfigurationCenter.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminNotificationDeadLetterQueueCenter.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminNotificationProviderWebhookMonitor.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminNotificationScheduleManagementCenter.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminNotificationSuppressionRulesCenter.tsx` | 1 | 2 | @typescript-eslint/no-unused-vars: 0E/2W<br>react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminNotificationTemplateManagementCenter.tsx` | 0 | 3 | @typescript-eslint/no-unused-vars: 0E/3W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminPlatformHealthMonitor.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminPortalLayout.tsx` | 0 | 2 | @typescript-eslint/no-unused-vars: 0E/2W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminRolePermissionMatrix.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminSecurityAccessCenter.tsx` | 0 | 3 | @typescript-eslint/no-unused-vars: 0E/3W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminSecurityEventCenter.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminSessionManagementCenter.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminSystemSettings.tsx` | 1 | 1 | @typescript-eslint/no-unused-vars: 0E/1W<br>react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminUserActivityTimeline.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminUserRoleManagement.tsx` | 1 | 1 | @typescript-eslint/no-unused-vars: 0E/1W<br>react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminVendorManagement.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\admin\AdminWebhookEventCenter.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\client\ClientDisputeTracking.tsx` | 2 | 0 | react/no-unescaped-entities: 2E/0W |
| `D:\WEBUI\frontend\src\components\portal\client\ClientInvoiceDisputeForm.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\client\ClientInvoiceOverview.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\client\ClientPortalDashboard.tsx` | 0 | 2 | @typescript-eslint/no-unused-vars: 0E/2W |
| `D:\WEBUI\frontend\src\components\portal\client\ClientProjectWorkspace.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\vendor\VendorCashSettlement.tsx` | 0 | 1 | @typescript-eslint/no-unused-vars: 0E/1W |
| `D:\WEBUI\frontend\src\components\portal\vendor\VendorDisputeTracking.tsx` | 2 | 0 | react/no-unescaped-entities: 1E/0W<br>react-hooks/static-components: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\vendor\VendorInvoiceHistory.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\vendor\VendorInvoiceSubmissionForm.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\vendor\VendorNotificationsCentre.tsx` | 1 | 1 | @typescript-eslint/no-unused-vars: 0E/1W<br>react-hooks/static-components: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\vendor\VendorPaymentHistory.tsx` | 1 | 0 | react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\vendor\VendorProfileSettings.tsx` | 1 | 3 | @typescript-eslint/no-unused-vars: 0E/3W<br>react/no-unescaped-entities: 1E/0W |
| `D:\WEBUI\frontend\src\components\portal\vendor\VendorSupportCentre.tsx` | 1 | 1 | @typescript-eslint/no-unused-vars: 0E/1W<br>react-hooks/static-components: 1E/0W |
| `D:\WEBUI\frontend\src\components\projects\ProjectCard.tsx` | 0 | 1 | @next/next/no-img-element: 0E/1W |
| `D:\WEBUI\frontend\src\components\projects\ProjectDetailView.tsx` | 0 | 1 | @next/next/no-img-element: 0E/1W |
| `D:\WEBUI\frontend\src\components\shared\EditorialPageHero.tsx` | 0 | 1 | @next/next/no-img-element: 0E/1W |
| `D:\WEBUI\frontend\src\components\ui\ClientPortalModal.tsx` | 1 | 5 | @typescript-eslint/no-unused-vars: 0E/5W<br>react/jsx-no-comment-textnodes: 1E/0W |
| `D:\WEBUI\frontend\src\components\ui\ConsultationModal.tsx` | 2 | 3 | @typescript-eslint/no-unused-vars: 0E/3W<br>react/jsx-no-comment-textnodes: 2E/0W |
| `D:\WEBUI\frontend\src\components\ui\Header.tsx` | 1 | 0 | @next/next/no-html-link-for-pages: 1E/0W |
| `D:\WEBUI\frontend\src\components\ui\ManifestoModal.tsx` | 1 | 0 | react/jsx-no-comment-textnodes: 1E/0W |
| `D:\WEBUI\frontend\src\components\ui\ProjectDetailModal.tsx` | 6 | 3 | @typescript-eslint/no-unused-vars: 0E/3W<br>react-hooks/refs: 3E/0W<br>react/jsx-no-comment-textnodes: 3E/0W |
| `D:\WEBUI\frontend\src\components\ui\ProjectModal.tsx` | 3 | 1 | @typescript-eslint/no-unused-vars: 0E/1W<br>react/jsx-no-comment-textnodes: 3E/0W |
| `D:\WEBUI\frontend\src\components\ui\ScrollOverlay.tsx` | 2 | 9 | @typescript-eslint/no-unused-vars: 0E/9W<br>react/jsx-no-comment-textnodes: 2E/0W |
| `D:\WEBUI\frontend\src\components\ui\ServiceModal.tsx` | 2 | 0 | react/jsx-no-comment-textnodes: 2E/0W |
| `D:\WEBUI\frontend\src\components\ui\VendorPortalModal.tsx` | 1 | 5 | @typescript-eslint/no-unused-vars: 0E/5W<br>react/jsx-no-comment-textnodes: 1E/0W |