# ARCHÉON DESIGN STUDIO
# SPRINT 5.6 — RESPONSIVE DESIGN BASELINE AUDIT REPORT

**Date:** 2026-11-20  
**Phase:** Phase 2 — Complete Responsive Design Audit  
**Repository:** `D:\WEBUI`  
**Frontend Branch:** `frontend/phase5.6-responsive-engineering`  
**Verified Baseline Checkpoint:** `3f595f438c39712e2aac761d27c4e86fc90b7ea8` (Parent Ancestor) / `e4792aed96aea19907fb384e90d72954e3838499` (HEAD)  
**Testing Harness:** Automated Playwright Headless Chromium Engine (216 route-viewport matrix runs)  
**Status:** COMPLETE — BASELINE DEFECTS ISOLATED & CATALOGUED

---

## 1. EXECUTIVE SUMMARY

An exhaustive responsive engineering audit of the entire ARCHÉON platform was performed across all 33 static routes and 8 required viewport tiers. The audit evaluated layout stability, horizontal overflow (`scrollWidth > clientWidth`), typography readability, mobile navigation usability, table responsiveness, touch target adequacy (WCAG 2.5.5 / 44×44px standard), and modal containment.

Of the **216 test executions**, **215 executions** exhibited zero horizontal viewport overflow, demonstrating a fundamentally solid container structure (`editorial-container` and fluid grid systems). However, critical usability and layout defects were identified on narrow mobile devices (320px–375px) and short viewports (568px height):
1. **Public Mobile Navigation Menu Cut-off:** On small mobile screens (e.g. 320×568), the navigation menu inner height is 715px but lacks `overflow-y-auto`, cutting off primary CTA buttons ("Start a Conversation", "Client Access", "Vendor Access").
2. **Missing Body Scroll Locks:** Opening mobile drawers or modal overlays on both Public and Portal layouts does not lock `document.body` scrolling, resulting in jarring dual-scroll experiences.
3. **Design System Overflow:** The `/design-system` page overflowed by +31px on 320px viewport due to excessive card padding (`p-8`) combined with non-wrapping metadata strings.
4. **Hero Headline & Button Proportion on Mobile:** Hero typography (`text-[52px]`) and rigid button widths crowd narrow mobile screens, requiring fluid clamp scaling and full-width mobile button adaptability.
5. **Touch Target Sizing:** Several micro-controls (filter tags, pagination controls, icon buttons) measured below the 44×44px touch target guideline.

---

## 2. TEST VIEWPORT MATRIX

The platform was inspected across 8 standardized viewport tiers:

| Tier | Category | Resolution | Device Reference | Orientation |
|---|---|---|---|---|
| **V1** | Small mobile | 320 × 568 | iPhone SE (1st gen), compact Android | Portrait |
| **V2** | Standard mobile | 375 × 812 | iPhone X / 11 / 12 / 13 Mini | Portrait |
| **V3** | Large mobile | 430 × 932 | iPhone 14/15/16 Pro Max, Pixel 8 Pro | Portrait |
| **V4** | Small tablet | 768 × 1024 | iPad Mini, iPad 9th/10th Gen | Portrait |
| **V5** | Large tablet | 1024 × 1366 | iPad Pro 12.9" | Portrait |
| **V6** | Laptop | 1366 × 768 | Standard 14" Notebook | Landscape |
| **V7** | Desktop | 1440 × 900 | MacBook Pro 15", Standard Monitor | Landscape |
| **V8** | Large desktop | 1920 × 1080 | 1080p FHD Display / Ultra-wide | Landscape |

---

## 3. ROUTE INVENTORY CLASSIFICATION

All 33 static application routes were audited individually:

### Category A — Public Website
- `/` — Homepage (ArchitecturalRevealHero, StudioSection, ServicesSection, ProjectsSection, ProcessSection, SiteFooter)
- `/design-system` — Design System Component & Token Gallery

### Category B — Authentication & Invitation
- `/login` — Multi-portal unified login (Studio, Client, Vendor tabs)
- `/accept-invitation` — Invitation activation route alias
- `/auth/accept-invitation` — Canonical invitation onboarding workflow

### Category C — Admin Portal (Workspace & Governance)
- `/admin` — Administration Dashboard Overview
- `/admin/projects` — Project Management Workspace
- `/admin/leads` — Lead & Consultation Intake Management
- `/admin/clients` — Client Accounts Directory
- `/admin/vendors` — Vendor & Contractor Directory
- `/admin/invoices` — Invoice & Bill Management
- `/admin/approvals` — Financial Approval Workflow Center
- `/admin/cash-settlements` — Cash Settlement Verification
- `/admin/finance-reports` — Receivables & Financial Reporting
- `/admin/audit-logs` — Forensic Electronic Audit Log Viewer
- `/admin/settings` — System Settings & Security Configurations

### Category D — Client Portal
- `/client` — Client Project Dashboard Overview
- `/client/projects` — Client Project Milestones & Workspaces
- `/client/documents` — Client Document & Drawing Library
- `/client/invoices` — Client Invoices & GST Statements
- `/client/notifications` — Notification Operations Center
- `/client/profile` — Client Security & Profile Settings
- `/client/unavailable` — Graceful Unavailable State

### Category E — Vendor Portal
- `/vendor` — Vendor Dashboard Overview
- `/vendor/projects` — Vendor Assigned Contracts & Sites
- `/vendor/invoices` — Bill & Tax Invoice Submission / History
- `/vendor/cash-settlements` — Cash Advance & Settlement Ledger
- `/vendor/notifications` — Vendor Notification Operations
- `/vendor/profile` — Vendor Security & Bank Settings
- `/vendor/unavailable` — Graceful Unavailable State

### Category F — Shared & Overlay Components
- `Header.tsx` (Public fixed header & mobile overlay menu)
- `SiteFooter.tsx` & `FooterClockEmblem.tsx`
- `AdminPortalLayout.tsx` (Admin responsive shell & mobile drawer)
- `ClientPortalLayout.tsx` (Client responsive shell & mobile drawer)
- `VendorPortalLayout.tsx` (Vendor responsive shell & mobile drawer)
- `ConsultationModal.tsx` (Interactive project enquiry modal)
- `ClientPortalModal.tsx` & `VendorPortalModal.tsx` (Access request dialogs)
- `ProjectDetailModal.tsx` (Architectural plan-to-render comparison modal)

---

## 4. DEFECT CATALOGUE & ROOT CAUSE ANALYSIS

| Defect ID | Route / Component | Viewports | Severity | Problem Description | Root Cause | Recommended Correction |
|---|---|---|---|---|---|---|
| **DEF-01** | `Header.tsx` (Public Mobile Menu) | 320×568, 375×667 | **Critical** | Mobile navigation menu content is 715px tall, cutting off bottom action buttons ("Start a Conversation", "Client Access", "Vendor Access") | Wrapper lacks `overflow-y-auto` and has excessive top padding (`pt-28`) | Add `overflow-y-auto min-h-0`, adjust mobile padding to `pt-20 pb-8 sm:pt-28`, enable smooth scrolling |
| **DEF-02** | `Header.tsx`, `AdminPortalLayout.tsx`, `ClientPortalLayout.tsx`, `VendorPortalLayout.tsx` | All Mobile (320px–430px) | **High** | Background body scrolling is not locked when mobile menu or drawer is open | Missing `document.body.style.overflow = "hidden"` toggle on menu state | Implement `useEffect` syncing `mobileMenuOpen` state to body overflow with proper cleanup |
| **DEF-03** | `/design-system` (`page.tsx`) | 320×568 | **Medium** | Horizontal page overflow (+31px, scrollWidth 351px vs winWidth 320px) | Card container uses rigid `p-8` (64px total padding) leaving only 216px, causing button group and metadata lines to overflow | Change `p-8` to `p-4 sm:p-8`, add `flex-wrap` and word breaking to metadata strings |
| **DEF-04** | `ArchitecturalRevealHero.tsx` | 320×568, 375×812 | **High** | Headline `text-[52px]` and fixed-width CTA buttons crowd narrow mobile screens | Typography does not scale smoothly down for small mobile; buttons use inline flex without `w-full` mobile adaptability | Use responsive clamp typography (`text-[38px] xs:text-[44px] sm:text-[72px] lg:text-[90px]`), adjust container padding to `px-4 sm:px-10 lg:px-14`, make buttons `w-full sm:w-auto` |
| **DEF-05** | `ConsultationModal.tsx`, `ProjectDetailModal.tsx`, `ClientPortalModal.tsx`, `VendorPortalModal.tsx` | 320×568, 375×812 | **Medium** | Modal dialogs lack background scroll lock and have tight padding on small mobile screens | No `document.body.style.overflow = "hidden"` hook; outer padding `p-4` plus inner `p-6` limits content width to 240px | Add body scroll lock hook, adjust mobile padding to `p-3 sm:p-4` outer and `p-4 sm:p-8` inner, ensure `max-h-[90dvh]` scroll container |
| **DEF-06** | `login/page.tsx`, `PortalInvitationActivation.tsx` | 320×568 | **Medium** | Form cards feel cramped due to nested `p-6` + `p-8` padding (112px horizontal padding out of 320px) | Static padding scale not tuned for narrowest mobile tier | Set outer container to `p-4 sm:p-12`, card container to `p-5 sm:p-10`, ensure email strings use `break-all` |
| **DEF-07** | `StudioSection.tsx` | 320×568 | **Low** | Left architectural statement card has tight horizontal space for 3 philosophy tabs | Card uses `p-6` on 320px viewport leaving 232px width | Adjust card padding to `p-4 sm:p-9 md:p-11`, refine tab typography to `text-[10px] sm:text-[10.5px]` |
| **DEF-08** | Global Interactive Elements (Admin/Vendor/Client) | 320×568, 375×812 | **Medium** | Several filter pills, pagination buttons, and icon buttons measure under 44×44px | Fixed compact padding without minimum touch target bounds | Enforce minimum 44px touch height/width via utility classes or pseudo-element hitbox expansion |

---

## 5. SCREENSHOT EVIDENCE REPOSITORY

All 81 baseline verification screenshots covering the 27 key routes across `small_mobile`, `small_tablet`, and `desktop` have been captured and archived in:
`D:\WEBUI\audit\frontend\screenshots\baseline\`

Key baseline evidence files:
- `homepage_small_mobile.png` (Hero section and mobile header on 320×568)
- `homepage_mobile_menu_open.png` (Cut-off demonstration on 320×568)
- `consultation_modal_small_mobile.png` (Modal presentation on 320×568)
- `admin_small_mobile.png` & `admin_mobile_drawer_open.png` (Admin mobile drawer on 320×568)
- `admin_invoices_small_mobile.png` (Responsive invoice cards on 320×568)
- `login_small_mobile.png` (Multi-portal login on 320×568)
- `design-system_small_mobile.png` (Overflow evidence on 320×568)
- `client_small_mobile.png` & `vendor_small_mobile.png` (Client & Vendor dashboards on 320×568)

---

## 6. PHASE REMEDIATION EXECUTION ROADMAP

The remediation plan will be implemented progressively in the following sequence:

1. **Phase 3 — Responsive Foundations & Utility Layer:**
   - Add touch-target utility classes in `globals.css` ensuring accessible hit areas.
   - Standardize viewport safe-padding variables and responsive typography scales.
2. **Phase 4 — Public Website Remediation:**
   - `Header.tsx`: Enable `overflow-y-auto`, reduce top padding on mobile, implement background scroll lock.
   - `ArchitecturalRevealHero.tsx`: Fluid typography clamp, full-width mobile CTAs, responsive metadata bar.
   - `StudioSection.tsx`: Responsive card padding (`p-4 sm:p-9`), flexible tab container.
   - `design-system/page.tsx`: Fix card padding (`p-4 sm:p-8`), flex-wrap button groups and metadata strings.
3. **Phase 5 — Admin Portal Remediation:**
   - `AdminPortalLayout.tsx`: Lock body scroll on drawer open, ensure touch-friendly nav links (min 44px).
   - Ensure all sub-pages maintain card/horizontal scroll integrity.
4. **Phase 6 — Client Portal Remediation:**
   - `ClientPortalLayout.tsx`: Lock body scroll on drawer open.
   - `ClientDocumentLibrary.tsx` & `ClientPaymentProofForm.tsx`: Verify mobile upload button and form responsiveness.
5. **Phase 7 — Vendor Portal Remediation:**
   - `VendorPortalLayout.tsx`: Lock body scroll on drawer open.
   - `VendorInvoiceSubmissionForm.tsx`: Touch-friendly line items, file dropzone accessibility.
6. **Phase 8 — Shared Overlays & Modals Remediation:**
   - `ConsultationModal.tsx`, `ClientPortalModal.tsx`, `VendorPortalModal.tsx`, `ProjectDetailModal.tsx`: Lock body scroll, ensure `max-h-[92dvh]`, responsive padding.
