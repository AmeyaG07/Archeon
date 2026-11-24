# ARCHÉON DESIGN STUDIO
# SPRINT 5.7 — MASTER DEFECT REGISTER

**Document ID:** `ARCHEON-SPR-5.7-DEFECT-REGISTER`  
**Phase:** Phase 10 — Defect Identification & Register Compilation  
**Target Repository:** `D:\WEBUI` (`system/phase5.7-full-system-acceptance`)  
**Frontend Branch:** `frontend/phase5.7-full-system-acceptance`  
**Date:** 2026-11-20  
**Status:** **ALL DISCOVERED CODE DEFECTS RESOLVED (ZERO UNRESOLVED CODE DEFECTS)**

---

## 1. Defect Classification Scheme

- **P0 — Critical:** Security vulnerability, financial data corruption, or cross-tenant leakage.
- **P1 — High:** Core business workflow failure blocking primary user journey.
- **P2 — Medium:** Major functionality or usability defect with existing operational workaround.
- **P3 — Low:** Minor cosmetic, layout, or typography defect.

---

## 2. Complete Defect Register

| Defect ID | Severity | Category | Affected Area | Description | Root Cause | Remediation & Status |
|---|---|---|---|---|---|---|
| **DEF-01** | P1 | Mobile UX | `Header.tsx` | Mobile nav menu truncated vertically on screens `< 600px` height (iPhone SE) | Missing `overflow-y-auto min-h-full` on overlay | **RESOLVED:** Added scroll container, adjusted padding `pt-20 sm:pt-24 pb-8`. Verified. |
| **DEF-02** | P1 | Mobile UX | `Header.tsx` | Background page scrolls while mobile navigation overlay is open | No body scroll locking mechanism | **RESOLVED:** Added `useEffect` body scroll lock (`document.body.style.overflow = "hidden"`) and ESC key listener. Verified. |
| **DEF-03** | P2 | Responsive | `design-system/page.tsx` | Design system container exceeded 320px viewport by +31px / +15px | Rigid `space-x-4` on button group prevented flex wrapping | **RESOLVED:** Converted to `flex-wrap gap-3 sm:gap-4`, tuned `.editorial-container` safe padding. Verified at 320px width (0px overflow). |
| **DEF-04** | P2 | Responsive | `ArchitecturalRevealHero.tsx` | Hero headline *"Spaces shaped by intention."* word-broken awkwardly on `< 360px` | Desktop font size too large without intermediate scaling | **RESOLVED:** Scaled typography `text-[38px] xs:text-[46px] sm:text-[68px] lg:text-[90px]`, full-width mobile button stacking. Verified. |
| **DEF-05** | P1 | Dialog UX | Modals (`ConsultationModal`, `ProjectDetailModal`, portal modals) | Modals overflowing viewport on short mobile displays without scroll affordance | Unconstrained vertical height and missing backdrop lock | **RESOLVED:** Standardized `max-h-[92dvh] overflow-y-auto`, outer margin guards `p-3 sm:p-4 md:p-8`, and body scroll lock. Verified. |
| **DEF-06** | P2 | Auth UX | `(auth)/login/page.tsx`, `PortalInvitationActivation.tsx` | Auth and invitation cards uncomfortably tight on 320px mobile screens | Inflexible card padding and unbroken email addresses | **RESOLVED:** Adjusted padding to `p-4 sm:p-12`, added `break-all` on token email strings. Verified. |
| **DEF-07** | P2 | 3D Section | `StudioSection.tsx` | 3D villa model overlapping statement card on narrow tablet viewports | Missing flexible padding and tab wrapping | **RESOLVED:** Adjusted container padding `p-4 xs:p-6 sm:p-9 md:p-11`, flexible tab wrapping. Verified. |
| **DEF-08** | P1 | Portal UX | `AdminPortalLayout`, `ClientPortalLayout`, `VendorPortalLayout` | Mobile drawers in portals lacked body scroll locking | Body scroll not locked when drawer opened | **RESOLVED:** Added `useEffect` body scroll lock and ESC key dismissal across all 3 portal layouts. Verified. |
| **DEF-09** | P1 | Frontend | `ArchitecturalCursor.tsx` | Next.js SSR hydration error: server-rendered HTML mismatched client-rendered transform inline styles | Cursor component rendered inline styles during server render | **RESOLVED:** Added client-mount guard (`if (!mounted) return null`). Verified console error: 0. |
| **DEF-10** | P2 | API / Form | `LeadController.java` / `ContactSection.tsx` | Public lead inquiry submission returned 400 Bad Request if field `clientName` was sent as `name` | Controller required `clientName` rather than generic `name` | **RESOLVED:** Client form and test harness aligned with `clientName`. Verified HTTP 200. |

---

## 3. External Dependencies & Operational Blockers (Not Code Bugs)

| Dependency ID | External Service | Business Requirement | Operational Action Required Before Production Go-Live |
|---|---|---|---|
| **DEP-01** | Meta Business Platform | WhatsApp Business Cloud API | Complete business manager verification, register official phone number, submit utility reminder templates for Meta approval. |
| **DEP-02** | SMTP Provider | Transactional Email | Replace local mock email provider with verified production SMTP credentials (e.g. AWS SES / SendGrid) and configure SPF/DKIM DNS records. |
| **DEP-03** | ClamAV Daemon | Malware Scanning | Deploy live ClamAV container on production infrastructure (`localhost:3310`). |
| **DEP-04** | Council of Architecture | Professional Registration | Verify Ar. Mandar Bhalekar's Council of Architecture registration renewal prior to public title marketing. |

---

## 4. Defect Register Sign-Off

All 10 identified code defects have been remediated and verified through regression testing. Zero unresolved code defects remain.
