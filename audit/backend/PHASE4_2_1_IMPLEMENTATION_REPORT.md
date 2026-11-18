# ArcheOn Backend — Phase 4.2.1 Operational Project Security Remediation Report

**Date:** 2026-11-18  
**Branch:** `backend/phase4.2.1-project-security-remediation`  
**Base Commit:** `89637809eae42f44419b44563315c8b5aa42e48c` (parent: `bb8b0b0f1ec2ba00faecdaa6422ee79e2aab52eb`)  
**Role:** Principal Spring Boot Engineer & Application Security Specialist  
**Target Repository:** `D:\WEBUI\backend`  
**Status:** **REMEDIATION COMPLETE & VERIFIED**

---

## 1. Executive Summary

Phase 4.2.1 remediated all five findings identified during the strict read-only acceptance audit documented in `PHASE4_2_INDEPENDENT_ACCEPTANCE.md`. The operational project management domain now enforces active assignment checks for vendor project access, validates project manager identity and role authorization against `UserRepository`, masks financial figures (`contractValue`, `budgetAllocated`, and contractor rates) across all summary and detail response paths, seals `ARCHIVED` projects against all sub-entity mutations, and validates milestone billing percentage boundaries `[0, 100]` at DTO, service, and database levels.

Flyway migration `V8__harden_milestone_billing_and_vendor_status.sql` and read-only preflight check `V8_preflight_check.sql` were created to enforce constraints without altering existing data.

All **102 automated tests across all 8 backend test classes** passed with 0 failures, 0 errors, and zero regressions.

---

## 2. Finding-by-Finding Resolution

### 2.1 FINDING-4.2-01: Terminated Vendor Access
- **Defect:** In `OperationalProjectService.validateProjectAccess`, vendor access was checked using `existsByProjectIdAndVendorId`, which ignored assignment lifecycle status. A vendor whose assignment was updated to `TERMINATED` or `COMPLETED` retained read access to project details, milestones, phases, and tasks.
- **Remediation:**
  1. Updated `validateProjectAccess` to check `existsByProjectIdAndVendorIdAndStatus(project.getId(), user.getVendorId(), "ACTIVE")`.
  2. Updated `listProjects` so vendor callers query active assignments via `findByVendorIdAndStatus(user.getVendorId(), "ACTIVE")`.
  3. Updated `updateTaskStatus` so vendors must hold an `ACTIVE` assignment on the project in addition to being the assigned vendor.
  4. Preserved internal studio staff visibility: internal staff (`ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_PROJECT_MANAGER`, `ROLE_FINANCE_*`) bypass vendor tenant checks and retain complete historical visibility of all terminated or completed assignments.
- **Verification:** Test `testTerminatedVendorImmediateAccessRevocation` verified that immediately upon transitioning an assignment to `TERMINATED`, the vendor receives HTTP 403 `AccessDeniedException` on project details and task queries, while staff retains full historical visibility.

### 2.2 FINDING-4.2-02: Project Manager Validation
- **Defect:** In `createProject` and `updateProject`, `projectManagerUsername` was accepted directly without verifying existence in `UserRepository` or checking role authorization.
- **Remediation:**
  1. Implemented `validateAndResolveProjectManager(String pmUsername)` in `OperationalProjectService`.
  2. Verifies user exists in `UserRepository`.
  3. Verifies user is active (`enabled == true` and `status == "ACTIVE"`).
  4. Restricts allowable project manager roles to `ROLE_PROJECT_MANAGER`, `ROLE_ADMIN`, `ROLE_PRINCIPAL_ARCHITECT`, and `ROLE_STAFF`. Attempts to assign client users (`ROLE_CLIENT`), vendors (`ROLE_VENDOR`), or nonexistent users throw `IllegalArgumentException`. Inactive users throw `IllegalStateException`.
  5. Applied to both `createProject` and `updateProject` (manager reassignment).
- **Verification:** Test `testProjectManagerValidationPositiveAndNegative` verified positive assignment of valid PMs and admins, and verified negative rejections for nonexistent usernames, inactive users, and unauthorized roles.

### 2.3 FINDING-4.2-03: Vendor & Client Financial Data Masking
- **Defect:** `toSummary` unconditionally included `p.getContractValue()`, exposing total studio contract values to vendors in `GET /api/operational-projects`. Furthermore, client views did not mask internal studio budget allocations.
- **Remediation:**
  1. Updated `toSummary` to accept `Authentication auth` and set `contractValue` to `null` whenever caller has `ROLE_VENDOR`.
  2. In `getProjectById`:
     - Vendors receive `contractValue = null` and `budgetAllocated = null`.
     - Clients receive `contractValue` (their client contract sum), but `budgetAllocated = null` (internal studio budget).
     - Internal studio staff receive both figures.
  3. In `toVendorAssignmentResponse`:
     - Clients receive `contractAmount = null` (clients cannot inspect vendor subcontractor payout rates).
     - Vendors receive `contractAmount` only for their own assignment (`null` for other vendors).
     - Internal studio staff receive unmasked amounts.
- **Verification:** Test `testFinancialDataMaskingAcrossAllRolesAndEndpoints` verified masking behavior across list, detail, and nested assignment responses for vendors, clients, and staff.

### 2.4 FINDING-4.2-04: Sub-Entity Modifications on Archived Projects
- **Defect:** Projects with `status = "ARCHIVED"` permitted mutations (updates, adding phases, milestones, tasks, and assigning vendors).
- **Remediation:**
  1. Added helper `checkNotArchived(OperationalProjectEntity project, String operation)` in `OperationalProjectService`.
  2. Applied `checkNotArchived` to:
     - `updateProject`
     - `assignVendor`
     - `updateVendorAssignmentStatus`
     - `createPhase`, `updatePhase`, `updatePhaseStatus`
     - `createMilestone`, `updateMilestone`, `updateMilestoneStatus`
     - `createTask`, `updateTask`, `updateTaskStatus`
  3. In `updateProjectStatus`, transitioning status out of `ARCHIVED` is strictly restricted to `ROLE_ADMIN`. Non-admin attempts throw `IllegalStateException`.
  4. Preserved historical read access for authorized users via `getProjectById`.
  5. Updated `OperationalProjectController` to catch `IllegalStateException` alongside `IllegalArgumentException` and return HTTP 400 Bad Request.
- **Verification:** Test `testArchivedProjectRejectsAllMutations` verified that once archived, all 5 mutation operations are rejected, non-admin unarchiving is rejected, admin unarchiving succeeds, and read access remains available.

### 2.5 FINDING-4.2-05: Milestone Billing Validation
- **Defect:** `billedPercentage` was unconstrained (allowing negative numbers or values >100) and lacked validation annotations and database constraints.
- **Remediation:**
  1. Added `@Min(0)` and `@Max(100)` Jakarta validation annotations to `CreateMilestoneRequest` and `UpdateMilestoneRequest` in `OperationalProjectDto.java`.
  2. Added service-layer validation `validateBilledPercentage(Integer percentage)` in `OperationalProjectService` for `createMilestone` and `updateMilestone`.
  3. Added database CHECK constraint `chk_milestone_billed_percentage CHECK (billed_percentage >= 0 AND billed_percentage <= 100)` in Flyway migration `V8__harden_milestone_billing_and_vendor_status.sql`.
- **Verification:** Test `testMilestoneBilledPercentageValidation` verified rejection of negative (`-5`) and excessive (`105`, `150`) values, and acceptance of `0`, `40`, and `100`.

---

## 3. Database Migration & Preflight Scripts

### 3.1 Migration `V8__harden_milestone_billing_and_vendor_status.sql`
- **Location:** `backend/src/main/resources/db/migration/V8__harden_milestone_billing_and_vendor_status.sql`
- **DDL Changes:**
  ```sql
  ALTER TABLE project_milestones
      ADD CONSTRAINT chk_milestone_billed_percentage CHECK (billed_percentage >= 0 AND billed_percentage <= 100);

  CREATE INDEX IF NOT EXISTS idx_pva_vendor_status ON project_vendor_assignments (vendor_id, status);
  ```
- **Safety:** Strictly non-destructive; enforces integrity check on milestones and adds composite indexing for high-performance active vendor lookups.

### 3.2 Preflight Check `V8_preflight_check.sql`
- **Location:** `backend/src/main/resources/db/preflight/V8_preflight_check.sql`
- **Purpose:** Read-only inspection script verifying table existence, checking for any existing milestone records violating `[0, 100]`, and reporting vendor assignment status distribution prior to migration execution.

---

## 4. Source Files Modified

| File | Type | Changes |
| :--- | :--- | :--- |
| `backend/src/main/java/com/webui/backend/repository/ProjectVendorAssignmentRepository.java` | Repository | Added `findByVendorIdAndStatus` and `findByProjectIdAndStatus` query methods. |
| `backend/src/main/java/com/webui/backend/dto/operational/OperationalProjectDto.java` | DTO | Added `@Min(0)` and `@Max(100)` annotations on `billedPercentage` in milestone requests. |
| `backend/src/main/java/com/webui/backend/service/OperationalProjectService.java` | Service | Implemented `validateAndResolveProjectManager`, `checkNotArchived`, `validateBilledPercentage`, active vendor checks, role-based financial projections, and archived status guards. |
| `backend/src/main/java/com/webui/backend/controller/OperationalProjectController.java` | Controller | Updated exception handlers to catch `IllegalStateException` and return clean HTTP 400 Bad Request. |
| `backend/src/main/resources/db/migration/V8__harden_milestone_billing_and_vendor_status.sql` | Flyway SQL | Added `chk_milestone_billed_percentage` and `idx_pva_vendor_status`. |
| `backend/src/main/resources/db/preflight/V8_preflight_check.sql` | SQL | Read-only preflight check for milestone data ranges and table prerequisites. |
| `backend/src/test/java/com/webui/backend/operational/OperationalProjectServiceAndSecurityTest.java` | Test | Added 5 comprehensive test methods covering findings 4.2-01 through 4.2-05. |

---

## 5. Test Execution Evidence & Full Suite Results

All 8 backend test suites were compiled and executed with JVM heap configured (`-Xmx512m`):

| Test Suite | Tests Run | Failures | Errors | Skipped | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `OperationalProjectServiceAndSecurityTest` | 13 | 0 | 0 | 0 | **PASSED** |
| `BusinessIdentityServiceAndSecurityTest` | 13 | 0 | 0 | 0 | **PASSED** |
| `FinancialConcurrencyAndOptimisticLockingTest` | 9 | 0 | 0 | 0 | **PASSED** |
| `ProductionBootstrapHardeningTest` | 11 | 0 | 0 | 0 | **PASSED** |
| `ProductionProfileContextTest` | 1 | 0 | 0 | 0 | **PASSED** |
| `Phase3AuthLifecycleTest` | 17 | 0 | 0 | 0 | **PASSED** |
| `SecurityAndRbacIntegrationTest` | 26 | 0 | 0 | 0 | **PASSED** |
| `MakerCheckerAndSafetyInvariantsTest` | 12 | 0 | 0 | 0 | **PASSED** |
| **TOTAL** | **102** | **0** | **0** | **0** | **ALL PASSED** |

---

## 6. Outstanding Business Decisions & Phase 4.1 Conditions

### 6.1 Phase 4.2 Business Invariant Decision
- **Cumulative Milestone Percentage Allocation:** As specified in the remediation directive, individual milestones are constrained to `[0, 100]`. ArcheOn Design Studio business policy does NOT assume cumulative milestone percentages must equal 100% (e.g. projects with variable retainer billing, retainage withholdings, or rolling milestone allocations). Cumulative allocation rules are tracked as a business policy decision requiring studio leadership signoff.

### 6.2 Remaining Phase 4.1 Production Release Conditions (Tracked)
1. **Plaintext Vendor Banking Details:** `vendors.bank_details_json` remains in unencrypted JSON. AES-256-GCM JPA `@Convert` envelope encryption must be applied prior to production deployment.
2. **Unmasked Vendor Financial Data in Staff Views:** PAN, GSTIN, and account numbers are displayed in full to staff roles; needs partial masking (e.g. `XXXX-XXXX-1234`).
3. **Database Unique Constraint on `users(email)`:** Currently enforced in application service layer; database index lacks `UNIQUE`.
4. **Invitation Endpoint Rate Limiting:** Missing rate limiting on `/api/invitations/accept`.
5. **Inbound Email Dispatch Configuration:** SMTP relay credentials pending business infrastructure provisioning.
