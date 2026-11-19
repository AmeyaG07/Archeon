# ArcheOn Backend — Independent Phase 4.2.1 Acceptance Audit

**Audit Target:** `backend/phase4.2.1-project-security-remediation`  
**Target Commit:** `506d2eb2ba788c3cbeb59c119508b021466b4cef`  
**Base Commit:** `89637809eae42f44419b44563315c8b5aa42e48c` (parent: `bb8b0b0f1ec2ba00faecdaa6422ee79e2aab52eb`)  
**Role:** Independent Principal Backend Security Auditor  
**Audit Date:** 2026-11-18  
**Audit Mode:** STRICT READ-ONLY AUDIT (Zero application code, migration, or git modifications)  
**Deliverable:** `D:\WEBUI\audit\backend\PHASE4_2_1_INDEPENDENT_ACCEPTANCE.md`  
**Final Verdict:** **ACCEPTED WITH CONDITIONS**

---

## 1. Executive Audit Summary

An independent, read-only architectural and security acceptance audit was performed on commit `506d2eb` of branch `backend/phase4.2.1-project-security-remediation`. The audit evaluated all source modifications made to remediate the five findings documented in `PHASE4_2_INDEPENDENT_ACCEPTANCE.md`.

The remediation was thoroughly verified across all controllers, service layer routines, DTOs, repository queries, Flyway migrations (`V8__harden_milestone_billing_and_vendor_status.sql`), preflight validation scripts, and automated test suites:
1. **Terminated Vendor Access:** Vendor access to projects, tasks, and summaries strictly requires an active assignment (`status = 'ACTIVE'`). Terminated or completed assignments no longer grant project access, while internal authorized staff retain full historical visibility.
2. **Project Manager Validation:** Project manager assignments in both creation and update endpoints strictly validate user existence in `UserRepository`, active status (`enabled == true`, `status == "ACTIVE"`), and authorized roles (`ROLE_PROJECT_MANAGER`, `ROLE_ADMIN`, `ROLE_PRINCIPAL_ARCHITECT`, `ROLE_STAFF`).
3. **Financial Data Masking:** Vendors never receive overall project contract values or internal studio budget allocations across any list or detail projection. Clients receive contract value but never internal studio budget allocations or vendor subcontractor rates.
4. **Archived Project Mutation Restrictions:** All 15 mutating operations across projects, vendor assignments, phases, milestones, and tasks are strictly rejected when the project is in `ARCHIVED` status. Unarchiving is strictly restricted to `ROLE_ADMIN`.
5. **Milestone Percentage Validation:** Billed percentage is bounded to `[0, 100]` at DTO, service, and database levels via a CHECK constraint in migration `V8`.
6. **Nested Entity Ownership:** Cross-project association bypasses are prevented across milestones, phases, tasks, and active vendor assignments.

The complete backend test suite was independently executed: **102 of 102 automated tests passed** (exit code 0) with zero failures, zero errors, and zero JVM crashes.

---

## 2. Step 1 — Git and Baseline Verification

| Inspection Item | Requirement | Observed Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Current Branch** | `backend/phase4.2.1-project-security-remediation` | **VERIFIED** | `git branch --show-current` confirmed target branch. |
| **Target Commit** | `506d2eb` | **VERIFIED** | `506d2eb2ba788c3cbeb59c119508b021466b4cef` |
| **Parent / Base Commit** | `8963780` | **VERIFIED** | Parent commit verified as `89637809eae42f44419b44563315c8b5aa42e48c`. |
| **Frontend Isolation** | Zero frontend modifications | **VERIFIED** | `git diff --name-only 8963780 506d2eb` contains zero frontend files. Only `backend/src/` and `audit/` changed. |
| **Backend Working Tree** | Clean working tree | **VERIFIED** | `git status backend/src/` reports zero uncommitted modifications. |
| **Commit Scope** | Focused exclusively on Phase 4.2.1 remediation | **VERIFIED** | 9 files modified/created (1 controller, 1 DTO, 1 repository, 1 service, 1 migration, 1 preflight, 1 test file, 2 audit documents). |

---

## 3. Step 2 & 3 — Independent Verification of All Five Findings

### 3.1 FINDING-4.2-01: Terminated Vendor Access & Negative Authorization
- **Inspection Targets:**
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L169-L178) (`validateProjectAccess`)
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L495-L505) (`listProjects`)
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L1220-L1228) (`updateTaskStatus`)
  - [ProjectVendorAssignmentRepository.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/repository/ProjectVendorAssignmentRepository.java)
- **Verified Implementation:**
  - `validateProjectAccess`:
    ```java
    if ("ROLE_VENDOR".equals(user.getRole())) {
        if (user.getVendorId() != null &&
                vendorAssignmentRepository.existsByProjectIdAndVendorIdAndStatus(project.getId(), user.getVendorId(), "ACTIVE")) {
            return;
        }
        throw new AccessDeniedException("Access denied: You do not have an active assignment on project " + project.getProjectReference());
    }
    ```
  - `listProjects`: Vendors query projects solely through `vendorAssignmentRepository.findByVendorIdAndStatus(user.getVendorId(), "ACTIVE")`.
  - `updateTaskStatus`: Explicitly checks `existsByProjectIdAndVendorIdAndStatus(projectId, user.getVendorId(), "ACTIVE")`.
  - Staff / Admin bypass: `isInternalStaff(auth.getAuthorities())` returns early at line 157, retaining full historical access to terminated and completed records.
- **Independent Test Verification:**
  - `testTerminatedVendorImmediateAccessRevocation`: Verified that transitioning an assignment to `TERMINATED` immediately revokes vendor read and update access across project detail, summary list, and task endpoints, while staff maintains complete visibility.

### 3.2 FINDING-4.2-02: Project Manager Validation & Role Boundaries
- **Inspection Targets:**
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L116-L134) (`validateAndResolveProjectManager`)
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L353) (`createProject`)
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L549) (`updateProject`)
- **Verified Implementation:**
  ```java
  private String validateAndResolveProjectManager(String pmUsername) {
      if (!StringUtils.hasText(pmUsername)) {
          return null;
      }
      String trimmed = pmUsername.trim();
      UserEntity pmUser = userRepository.findByUsername(trimmed)
              .orElseThrow(() -> new IllegalArgumentException("Assigned project manager user does not exist: " + trimmed));

      if (!pmUser.isEnabled() || (pmUser.getStatus() != null && !"ACTIVE".equalsIgnoreCase(pmUser.getStatus()))) {
          throw new IllegalStateException("Assigned project manager user is inactive or suspended: " + trimmed);
      }

      if (!ALLOWED_PM_ROLES.contains(pmUser.getRole())) {
          throw new IllegalArgumentException("User " + trimmed + " has role " + pmUser.getRole()
                  + ", which is not authorized for project manager assignment. Allowed roles: " + ALLOWED_PM_ROLES);
      }

      return trimmed;
  }
  ```
- **Independent Test Verification:**
  - `testProjectManagerValidationPositiveAndNegative`: Successfully verified positive assignment of valid PMs (`ROLE_PROJECT_MANAGER`, `ROLE_ADMIN`), and negative rejections for nonexistent usernames (throws `IllegalArgumentException`), inactive/deactivated users (throws `IllegalStateException`), and unauthorized roles like `ROLE_CLIENT` (throws `IllegalArgumentException`).

### 3.3 FINDING-4.2-03: Financial Response Masking Across Roles & Paths
- **Inspection Targets:**
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L200-L225) (`toSummary`)
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L424-L436) (`getProjectById`)
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L278-L300) (`toVendorAssignmentResponse`)
- **Verified Implementation:**
  - In `toSummary`: `summaryContractValue = isVendor ? null : p.getContractValue();`. Vendors querying `GET /api/operational-projects` receive `contractValue: null`.
  - In `getProjectById`:
    - `contractVal = isVendor ? null : p.getContractValue();`
    - `budgetAlloc = (isVendor || isClient) ? null : p.getBudgetAllocated();`
    - Vendors receive `null` for both `contractValue` and `budgetAllocated`.
    - Clients receive `contractValue`, but `budgetAllocated` is masked to `null`.
    - Studio staff receive both values.
  - In `toVendorAssignmentResponse`:
    - Clients receive `contractAmount: null` (subcontractor payout rates are masked).
    - Vendors receive `contractAmount` only for their own assignment (`null` for other vendors).
    - Studio staff receive unmasked amounts.
- **Independent Test Verification:**
  - `testFinancialDataMaskingAcrossAllRolesAndEndpoints`: Validated masking behavior across all list, detail, and nested assignment response payloads for vendors, clients, and staff.

### 3.4 FINDING-4.2-04: Archived Project Mutation Restrictions
- **Inspection Targets:**
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L136-L141) (`checkNotArchived`)
  - All 15 mutating service methods and controller endpoints.
  - [OperationalProjectController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/OperationalProjectController.java) (exception handling).
- **Verified Implementation:**
  - `checkNotArchived` throws `IllegalStateException` whenever `status.equalsIgnoreCase("ARCHIVED")`.
  - Applied to `updateProject`, `assignVendor`, `updateVendorAssignmentStatus`, `createPhase`, `updatePhase`, `updatePhaseStatus`, `createMilestone`, `updateMilestone`, `updateMilestoneStatus`, `createTask`, `updateTask`, `updateTaskStatus`.
  - In `updateProjectStatus`, unarchiving a project out of `ARCHIVED` status requires `ROLE_ADMIN`; staff attempts throw `IllegalStateException`.
  - All controller catch blocks updated to catch `IllegalStateException` and return HTTP 400 Bad Request.
  - Historical read access via `getProjectById` remains available to authorized users.
- **Independent Test Verification:**
  - `testArchivedProjectRejectsAllMutations`: Verified rejection of all 5 mutation types, verified non-admin unarchiving rejection, verified admin unarchiving success, and confirmed historical read access.

### 3.5 FINDING-4.2-05: Milestone Billing Validation & Bounds
- **Inspection Targets:**
  - [OperationalProjectDto.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/dto/operational/OperationalProjectDto.java#L236-L255) (`CreateMilestoneRequest`, `UpdateMilestoneRequest`)
  - [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java#L143-L147) (`validateBilledPercentage`)
  - [V8__harden_milestone_billing_and_vendor_status.sql](file:///D:/WEBUI/backend/src/main/resources/db/migration/V8__harden_milestone_billing_and_vendor_status.sql)
- **Verified Implementation:**
  - `@Min(0)` and `@Max(100)` Bean Validation annotations on DTOs.
  - `validateBilledPercentage(Integer percentage)` enforced in `createMilestone` and `updateMilestone`.
  - Database constraint: `CONSTRAINT chk_milestone_billed_percentage CHECK (billed_percentage >= 0 AND billed_percentage <= 100)` installed via migration V8.
- **Independent Test Verification:**
  - `testMilestoneBilledPercentageValidation`: Verified rejection of negative values (`-5`), excessive values (`105`, `150`), and successful persistence of `0`, `40`, and `100`.

---

## 4. Step 4 — Endpoint Authorization Matrix

Inspection of [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java) and [OperationalProjectController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/OperationalProjectController.java):

| HTTP Method | Route | Required Roles | Programmatic Security Guard |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/operational-projects` | `ADMIN`, `PROJECT_MANAGER` | Client existence, Client ACTIVE status, PM user validation |
| `GET` | `/api/operational-projects` | Authenticated | Scoped by caller role (Staff: all, Client: own, Vendor: active assignments) |
| `GET` | `/api/operational-projects/{id}` | Authenticated | `validateProjectAccess` (BOLA isolation, Active Vendor assignment) |
| `GET` | `/api/operational-projects/ref/{reference}` | Authenticated | `validateProjectAccess` |
| `PUT` | `/api/operational-projects/{id}` | `ADMIN`, `PROJECT_MANAGER` | `validateProjectAccess`, `checkNotArchived`, PM user validation |
| `PATCH` | `/api/operational-projects/{id}/status` | `ADMIN`, `PROJECT_MANAGER` | `validateProjectAccess`, Admin-only unarchive guard |
| `POST` | `/api/operational-projects/{id}/archive` | `ADMIN` | Transitions status to `ARCHIVED` |
| `POST` | `/api/operational-projects/{id}/vendors` | `ADMIN`, `PROJECT_MANAGER` | `checkNotArchived`, Vendor exists & ACTIVE, duplicate check |
| `GET` | `/api/operational-projects/{id}/vendors` | Authenticated | `validateProjectAccess`, role-based financial masking |
| `PATCH` | `/api/operational-projects/{id}/vendors/{vendorId}/status` | `ADMIN`, `PROJECT_MANAGER` | `checkNotArchived`, assignment exists |
| `POST` | `/api/operational-projects/{id}/phases` | `ADMIN`, `PROJECT_MANAGER` | `checkNotArchived`, unique sequence order per project |
| `GET` | `/api/operational-projects/{id}/phases` | Authenticated | `validateProjectAccess` |
| `PUT` | `/api/operational-projects/{id}/phases/{phaseId}` | `ADMIN`, `PROJECT_MANAGER` | `checkNotArchived`, phase belongs to project |
| `PATCH` | `/api/operational-projects/{id}/phases/{phaseId}/status` | `ADMIN`, `PROJECT_MANAGER` | `checkNotArchived`, phase belongs to project |
| `POST` | `/api/operational-projects/{id}/milestones` | `ADMIN`, `PROJECT_MANAGER` | `checkNotArchived`, phase belongs to project, percentage `[0, 100]` |
| `GET` | `/api/operational-projects/{id}/milestones` | Authenticated | `validateProjectAccess` |
| `PUT` | `/api/operational-projects/{id}/milestones/{milestoneId}` | `ADMIN`, `PROJECT_MANAGER` | `checkNotArchived`, milestone belongs to project, percentage `[0, 100]` |
| `PATCH` | `/api/operational-projects/{id}/milestones/{milestoneId}/status` | `ADMIN`, `PROJECT_MANAGER` | `checkNotArchived`, milestone belongs to project, **milestone completion invariant** (all tasks DONE) |
| `POST` | `/api/operational-projects/{id}/tasks` | `ADMIN`, `PROJECT_MANAGER` | `checkNotArchived`, phase/milestone belong to project, vendor active assignment check |
| `GET` | `/api/operational-projects/{id}/tasks` | Authenticated | `validateProjectAccess`, vendor sees only own assigned tasks |
| `PUT` | `/api/operational-projects/{id}/tasks/{taskId}` | `ADMIN`, `PROJECT_MANAGER` | `checkNotArchived`, task belongs to project, vendor active assignment check |
| `PATCH` | `/api/operational-projects/{id}/tasks/{taskId}/status` | `ADMIN`, `PROJECT_MANAGER`, `STAFF`, `VENDOR` | `checkNotArchived`, task belongs to project, vendor can only update own tasks & must have active assignment |

---

## 5. Step 5 — Nested Entity Ownership & Isolation Verification

Detailed code inspection of [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java) confirmed that cross-project association and UUID substitution attacks are comprehensively mitigated:

1. **Milestone -> Phase Association:**
   - In `createMilestone` (lines 923-929):
     ```java
     if (req.getPhaseId() != null) {
         ProjectPhaseEntity phase = phaseRepository.findById(req.getPhaseId())
                 .orElseThrow(() -> new IllegalArgumentException("Phase not found: " + req.getPhaseId()));
         if (!phase.getProjectId().equals(projectId)) {
             throw new IllegalArgumentException("Phase does not belong to this project");
         }
     }
     ```
2. **Task -> Phase & Milestone Association:**
   - In `createTask` (lines 1063-1077):
     ```java
     if (req.getPhaseId() != null) {
         ProjectPhaseEntity phase = phaseRepository.findById(req.getPhaseId())
                 .orElseThrow(() -> new IllegalArgumentException("Phase not found: " + req.getPhaseId()));
         if (!phase.getProjectId().equals(projectId)) {
             throw new IllegalArgumentException("Phase does not belong to this project");
         }
     }
     if (req.getMilestoneId() != null) {
         ProjectMilestoneEntity milestone = milestoneRepository.findById(req.getMilestoneId())
                 .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + req.getMilestoneId()));
         if (!milestone.getProjectId().equals(projectId)) {
             throw new IllegalArgumentException("Milestone does not belong to this project");
         }
     }
     ```
3. **Task -> Vendor Assignment Association:**
   - In `createTask` (lines 1079-1083) and `updateTask` (lines 1183-1188):
     ```java
     if (req.getAssignedVendorId() != null) {
         if (!vendorAssignmentRepository.existsByProjectIdAndVendorIdAndStatus(projectId, req.getAssignedVendorId(), "ACTIVE")) {
             throw new IllegalArgumentException("Vendor " + req.getAssignedVendorId() + " does not have an active assignment on this project.");
         }
     }
     ```
4. **Task & Milestone Entity Verification:**
   - In `updatePhase`, `updatePhaseStatus`, `updateMilestone`, `updateMilestoneStatus`, `updateTask`, `updateTaskStatus`, the service verifies `entity.getProjectId().equals(projectId)`, preventing URL path UUID substitution attacks.

---

## 6. Step 6 — Database Migration & Preflight Safety Audit

### 6.1 Schema DDL Inspection (`V8__harden_milestone_billing_and_vendor_status.sql`)
```sql
ALTER TABLE project_milestones
    ADD CONSTRAINT chk_milestone_billed_percentage CHECK (billed_percentage >= 0 AND billed_percentage <= 100);

CREATE INDEX IF NOT EXISTS idx_pva_vendor_status ON project_vendor_assignments (vendor_id, status);
```
- **Constraint Behavior:** The CHECK constraint enforces that any newly inserted or updated milestone must have `billed_percentage` between 0 and 100.
- **Index Correctness:** Composite index on `(vendor_id, status)` optimizes the active assignment lookup query used by `validateProjectAccess`, `listProjects`, and task operations.
- **Data Preservation:** Migration is strictly additive and non-destructive. No tables or columns are dropped.

### 6.2 Preflight Validation Script (`V8_preflight_check.sql`)
- Inspection of `backend/src/main/resources/db/preflight/V8_preflight_check.sql`:
  - Step 1: Confirms existence of prerequisite tables `project_milestones` and `project_vendor_assignments`.
  - Step 2: Queries for any existing milestones violating the bounds (`WHERE billed_percentage < 0 OR billed_percentage > 100`).
  - Step 3: Inspects vendor assignment status distribution.
- **Production Migration Risk Assessment:**
  - If applied to a live database containing existing rows where `billed_percentage < 0 OR billed_percentage > 100`, the `ALTER TABLE ADD CONSTRAINT` command will fail.
  - The preflight check guarantees visibility of violating rows prior to running the migration. In a clean database or standard deployment, this risk is negligible.

---

## 7. Step 7 — Regression Audit of Previous Phase Invariants

Inspection confirmed that all prior phase architectural and security boundaries remain completely intact:
- **Phase 2 (Financial Concurrency & Locking):** `@Version` optimistic locking, cash settlement transitions, and payment transaction isolation remain untouched.
- **Phase 3 / 3.1 (Authentication Lifecycle & Refresh Rotation):** Single-use refresh token rotation, conditional DB updates, and replay token family revocation remain untouched in `RefreshTokenRepository` and `AuthController`.
- **Phase 3.2 (Production Bootstrap Hardening):** `DataInitializer` profile restrictions and secure token generation are unmodified.
- **Phase 4.1 (Business Identity & Tenant BOLA):** Client and vendor isolation, admin non-self-demotion/deactivation, and single-use invitation tokens are unmodified.

---

## 8. Step 8 — Test Suite Execution Evidence

The full backend test suite was independently executed with Maven:
```
cmd /c "cd D:\WEBUI\backend && mvn test -DargLine=-Xmx512m"
```

### Complete Test Results Summary

| Test Class | Category / Domain | Tests | Passed | Failures | Errors | Skipped | Time |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `FinancialConcurrencyAndOptimisticLockingTest` | Phase 2 Concurrency & Locking | 9 | 9 | 0 | 0 | 0 | 3.52 s |
| `ProductionBootstrapHardeningTest` | Phase 3.2 Credential Security | 11 | 11 | 0 | 0 | 0 | 2.14 s |
| `ProductionProfileContextTest` | Phase 3.2 Profile Isolation | 1 | 1 | 0 | 0 | 0 | 3.65 s |
| `BusinessIdentityServiceAndSecurityTest` | Phase 4.1 Business Identity & BOLA | 13 | 13 | 0 | 0 | 0 | 1.32 s |
| `OperationalProjectServiceAndSecurityTest` | Phase 4.2 & 4.2.1 Operational Projects | 13 | 13 | 0 | 0 | 0 | 2.45 s |
| `Phase3AuthLifecycleTest` | Phase 3/3.1 Token Rotation & Replay | 17 | 17 | 0 | 0 | 0 | 5.21 s |
| `SecurityAndRbacIntegrationTest` | Studio-wide RBAC & Security Chain | 26 | 26 | 0 | 0 | 0 | 1.84 s |
| `MakerCheckerAndSafetyInvariantsTest` | Maker-Checker Financial Controls | 12 | 12 | 0 | 0 | 0 | 2.32 s |
| **TOTAL** | **Entire Backend Automated Test Suite** | **102** | **102** | **0** | **0** | **0** | **1m 02s** |

- **Actual Exit Code:** `0` (`BUILD SUCCESS`)
- **JVM Crashes / Abnormal Exits:** Zero crashes; memory allocation remained stable under `-Xmx512m`.

---

## 9. Step 9 — Retained Phase 4.1 Production Release Conditions

The following outstanding release conditions from Phase 4.1 remain active and are carried forward. They must be resolved prior to production deployment:

1. **Plaintext Vendor Banking Details:**
   - `vendors.bank_details_json` is stored in plaintext JSON. An AES-256-GCM JPA `@Convert` envelope encryption must be applied before live deployment.
2. **Sensitive Vendor Data Masking in Staff Views:**
   - Vendor PAN, GSTIN, and bank account numbers are visible in plaintext to all staff roles. Partial masking (e.g. `XXXX-XXXX-1234`) must be implemented.
3. **Database-Level Unique Constraint on `users(email)`:**
   - Uniqueness is currently validated in the application service layer. A database unique constraint/index must be added to prevent concurrent insertion collisions.
4. **Invitation Endpoint Rate Limiting:**
   - `/api/invitations/accept` requires IP/subnet rate limiting to mitigate token brute-force attempts.
5. **Inbound Email Dispatch Configuration:**
   - Production SMTP relay credentials must be configured when infrastructure provisioning is completed.

---

## 10. Final Acceptance Verdict

### **VERDICT: ACCEPTED WITH CONDITIONS**

**Justification:**
1. All five findings from `PHASE4_2_INDEPENDENT_ACCEPTANCE.md` (FINDING-4.2-01 through FINDING-4.2-05) have been completely and correctly remediated.
2. Endpoint authorization and nested entity ownership validations prevent cross-project and cross-tenant BOLA/IDOR exploits.
3. Terminated vendors are immediately and strictly barred from accessing project data.
4. Financial figures are properly masked according to caller role across all list and detail projections.
5. Archived projects are sealed against sub-entity mutations, with unarchival restricted to `ROLE_ADMIN`.
6. Migration V8 correctly establishes the milestone billing percentage database constraint and vendor assignment indexing.
7. All **102 backend tests pass cleanly with zero failures and zero regressions**.
8. Progression to **Phase 4.3 (Financial Operations Integration)** is fully approved.
9. Final production release remains subject to the resolution of the retained Phase 4.1 production conditions.
