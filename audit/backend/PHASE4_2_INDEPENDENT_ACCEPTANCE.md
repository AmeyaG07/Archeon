# ArcheOn Backend — Independent Phase 4.2 Acceptance Audit

**Audit Target:** `backend/phase4.2-operational-projects`  
**Target Commit:** `89637809eae42f44419b44563315c8b5aa42e48c`  
**Base Commit:** `bb8b0b0f1ec2ba00faecdaa6422ee79e2aab52eb`  
**Role:** Independent Principal Backend Architect & Application Security Auditor  
**Audit Date:** 2026-11-18  
**Audit Mode:** STRICT READ-ONLY AUDIT (Zero application code, migration, or git modifications)  
**Final Verdict:** **ACCEPTED WITH CONDITIONS**

---

## 1. Executive Audit Summary

An independent, read-only architectural and security acceptance audit was performed on commit `8963780` of branch `backend/phase4.2-operational-projects`. The audit examined domain entities, repositories, controllers, DTOs, service layer security invariants, database migrations (`V7__create_operational_project_schema.sql`), preflight validation scripts, and automated test suites.

The Phase 4.2 implementation successfully establishes the operational project backbone for the ArcheOn Design Studio platform, completely segregated from the public website portfolio project model (`ProjectEntity`). It introduces comprehensive hierarchical management for projects, phases, milestones, tasks, and vendor assignments, accompanied by tenant-aware Broken Object-Level Authorization (BOLA / IDOR) defenses and role-based data projection.

All **97 automated tests across all 8 test suites** passed with zero failures and zero regressions, verifying that financial concurrency, optimistic locking, token rotation, and Phase 4.1 identity boundaries remain robust.

Five security and architectural findings were identified (three **MEDIUM**, two **LOW**). None represent an active critical exploit blocking progression to Phase 4.3 (Financial Operations Integration), but all must be remediated under release conditions prior to production deployment.

---

## 2. Step 1 — Git and Baseline Verification

| Inspection Item | Requirement | Observed Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Current Branch** | `backend/phase4.2-operational-projects` | **VERIFIED** | `git branch --show-current` confirmed target branch. |
| **Target Commit** | `8963780` | **VERIFIED** | `89637809eae42f44419b44563315c8b5aa42e48c` |
| **Parent / Base Commit** | `bb8b0b0` | **VERIFIED** | `git log -1 --format="%H" 8963780^` -> `bb8b0b0f1ec2ba00faecdaa6422ee79e2aab52eb` |
| **Frontend Isolation** | Zero frontend modifications | **VERIFIED** | Diff against `bb8b0b0` contains zero frontend files. Only `backend/src/` and `audit/` changed. |
| **Backend Working Tree** | Clean working tree | **VERIFIED** | `git status backend/src/` reports zero uncommitted modifications. |
| **Commit Scope** | Focused exclusively on Phase 4.2 | **VERIFIED** | 19 files changed (5 entities, 5 repositories, 1 service, 1 controller, 1 DTO file, 2 SQL scripts, 2 test files, 1 roadmap, 1 implementation report). |

---

## 3. Step 2 — Project Authorization & Access Control

### 3.1 Endpoint Authorization Matrix
Inspection of [SecurityConfig.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/config/SecurityConfig.java) and [OperationalProjectController.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/controller/OperationalProjectController.java):

```java
// SecurityConfig.java line 102
.requestMatchers("/api/operational-projects/**").authenticated()
```
Fine-grained method-level RBAC is applied across all endpoints:
- `POST /api/operational-projects`: Restricted to `@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")`.
- `PUT /api/operational-projects/{id}`: Restricted to `@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")`.
- `PATCH /api/operational-projects/{id}/archive`: Restricted to `@PreAuthorize("hasRole('ADMIN')")`.
- `POST /api/operational-projects/{id}/vendors`: Restricted to `@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")`.
- `PATCH /api/operational-projects/{id}/vendors/{assignmentId}/status`: Restricted to `@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")`.
- `POST /api/operational-projects/{id}/phases`: Restricted to `@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")`.
- `POST /api/operational-projects/{id}/milestones`: Restricted to `@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")`.
- `POST /api/operational-projects/{id}/tasks`: Restricted to `@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")`.
- `PATCH /api/operational-projects/{id}/tasks/{taskId}/status`: Open to `@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'STAFF', 'VENDOR')")` subject to task assignment validation.

### 3.2 BOLA / Tenant Isolation Verification
In [OperationalProjectService.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/service/OperationalProjectService.java) line 290 (`validateProjectAccess`):
1. **Admins and Staff:** Studio-wide read access is permitted.
2. **Project Managers:** Access is granted if `user.getUsername().equals(project.getProjectManagerUsername())` or caller has `ROLE_ADMIN`.
3. **Clients (`ROLE_CLIENT`):** Access is strictly validated against `user.getClientId().equals(project.getClientId())`. Client A attempting to access Client B's project (via UUID or reference) receives `AccessDeniedException` (HTTP 403).
4. **Vendors (`ROLE_VENDOR`):** Access is permitted if `user.getVendorId() != null` and an assignment exists in `ProjectVendorAssignmentRepository`.

#### Finding FINDING-4.2-01 (MEDIUM): Terminated Vendor Access Leak
In `OperationalProjectService.java` line 309:
```java
if (user.getVendorId() != null && vendorAssignmentRepository.existsByProjectIdAndVendorId(project.getId(), user.getVendorId())) {
    return;
}
```
`existsByProjectIdAndVendorId` does not filter by `status = 'ACTIVE'`. If a vendor's assignment status is updated to `TERMINATED`, this check still evaluates to `true`. As a result, terminated vendors retain read access to project details, milestones, and phases.
*Condition:* In `validateProjectAccess` and `listProjects`, vendor queries must check `status = 'ACTIVE'`.

#### Finding FINDING-4.2-02 (MEDIUM): Unvalidated Project Manager Assignment
In `OperationalProjectService.createProject` and `updateProject`:
```java
p.setProjectManagerUsername(req.getProjectManagerUsername());
```
The incoming `projectManagerUsername` string is stored directly on the entity without verifying:
1. That the user exists in `UserRepository`.
2. That the user possesses `ROLE_PROJECT_MANAGER` or `ROLE_ADMIN`.

A helper method `isProjectManager` is defined at line 96 of `OperationalProjectService` but is never invoked. An administrative user can accidentally or maliciously assign an arbitrary or nonexistent username, breaking project ownership invariants.

#### Finding FINDING-4.2-04 (LOW): Missing Mutation Guards on Archived Projects
In `OperationalProjectController` and `OperationalProjectService`:
The `PATCH /api/operational-projects/{id}/archive` endpoint sets `status = "ARCHIVED"`. However, mutating endpoints (`updateProject`, `assignVendor`, `createPhase`, `createMilestone`, `createTask`) do not check whether `project.getStatus().equals("ARCHIVED")`. Mutating sub-entities on an archived operational project is currently permitted by the code.

---

## 4. Step 3 — Financial Isolation & Data Leakage Prevention

### 4.1 Response Projections & Masking
Inspection of `OperationalProjectService.toDetailResponse`:
```java
boolean isVendor = hasRole(auth, "ROLE_VENDOR");
return OperationalProjectDetailResponse.builder()
    .id(p.getId())
    .projectReference(p.getProjectReference())
    .name(p.getName())
    .description(p.getDescription())
    .clientId(p.getClientId())
    .projectManagerUsername(p.getProjectManagerUsername())
    .status(p.getStatus())
    .contractValue(isVendor ? null : p.getContractValue())
    .budgetAllocated(isVendor ? null : p.getBudgetAllocated())
    .totalSpent(isVendor ? null : p.getTotalSpent())
    ...
```
- In `toDetailResponse`, `contractValue`, `budgetAllocated`, and `totalSpent` are explicitly set to `null` when the authenticated caller is a `ROLE_VENDOR`.
- Sub-entities (`phases`, `milestones`, `tasks`, `vendorAssignments`) do not leak internal contractor profit margins, vendor payout rates, or internal hourly costs.

#### Finding FINDING-4.2-03 (MEDIUM): Project Contract Value Leaked to Vendors in Summary List
In `OperationalProjectService.toSummary`:
```java
private OperationalProjectSummaryResponse toSummary(OperationalProjectEntity p) {
    return OperationalProjectSummaryResponse.builder()
        .id(p.getId())
        .projectReference(p.getProjectReference())
        .name(p.getName())
        .clientId(p.getClientId())
        .projectManagerUsername(p.getProjectManagerUsername())
        .status(p.getStatus())
        .contractValue(p.getContractValue()) // <-- LEAK: Unconditionally populated
        .budgetAllocated(p.getBudgetAllocated()) // <-- LEAK: Unconditionally populated
        .startDate(p.getStartDate())
        .targetCompletionDate(p.getTargetCompletionDate())
        .build();
}
```
When a vendor queries `GET /api/operational-projects`, `listProjects` maps assigned projects using `toSummary`. The `contractValue` and `budgetAllocated` fields are NOT masked in the summary DTO. Consequently, any assigned vendor can inspect the total project contract value through the list endpoint.
*Condition:* Mask `contractValue` and `budgetAllocated` in `toSummary` or accept an `Authentication` parameter to nullify these fields for `ROLE_VENDOR`.

---

## 5. Step 4 — Task & Milestone Lifecycle & Invariant Integrity

### 5.1 State Transitions
- **Project Phases:** `PLANNED` -> `IN_PROGRESS` -> `COMPLETED` -> `ON_HOLD` / `CANCELLED`.
- **Project Milestones:** `PENDING` -> `IN_PROGRESS` -> `COMPLETED` -> `CANCELLED`.
- **Project Tasks:** `TODO` -> `IN_PROGRESS` -> `REVIEW` -> `DONE` -> `BLOCKED`.

### 5.2 Milestone Completion Invariant
In `OperationalProjectService.updateMilestoneStatus`:
```java
if ("COMPLETED".equals(status)) {
    boolean hasUnfinishedTasks = taskRepository.findByMilestoneIdOrderBySortOrderAsc(milestoneId)
        .stream()
        .anyMatch(t -> !"DONE".equals(t.getStatus()));
    if (hasUnfinishedTasks) {
        throw new IllegalStateException("Cannot complete milestone with pending or unfinished tasks");
    }
}
```
- An attempt to mark a milestone as `COMPLETED` while any of its associated tasks are in `TODO`, `IN_PROGRESS`, `REVIEW`, or `BLOCKED` throws an `IllegalStateException` (HTTP 400).
- Verified through test `testCannotCompleteMilestoneWithPendingTasks`.

#### Finding FINDING-4.2-05 (LOW): Milestone `billedPercentage` Unconstrained Range
In [ProjectMilestoneEntity.java](file:///D:/WEBUI/backend/src/main/java/com/webui/backend/model/ProjectMilestoneEntity.java):
- `billedPercentage` is defined as an unconstrained `Integer`.
- Neither `@Min(0) @Max(100)` Bean Validation annotations on DTOs nor a database CHECK constraint `CHECK (billed_percentage >= 0 AND billed_percentage <= 100)` are enforced.
- Furthermore, there is no validation ensuring that the sum of `billedPercentage` across all milestones of a project does not exceed 100%.

---

## 6. Step 5 — Vendor Assignment & Lifecycle Integrity

### 6.1 Vendor Assignment Operations
- `OperationalProjectService.assignVendor` validates:
  - Project exists and is retrieved.
  - Vendor exists in `VendorRepository`.
  - Duplicate active assignment check: `vendorAssignmentRepository.findByProjectIdAndVendorId(projectId, req.getVendorId())` prevents duplicate assignment records for the same project/vendor pair.
  - Records `vendorRole` (e.g. `CONTRACTOR`, `CONSULTANT`, `FABRICATOR`, `SUPPLIER`) and `scopeOfWork`.
  - Defaults initial status to `ACTIVE`.

### 6.2 Assignment Status Updates
- `PATCH /api/operational-projects/{id}/vendors/{assignmentId}/status` transitions status between `ACTIVE`, `COMPLETED`, `TERMINATED`.
- However, as identified in **FINDING-4.2-01**, transitioning to `TERMINATED` must be paired with immediate authorization revocation in `validateProjectAccess`.

---

## 7. Step 6 — Database & Migration Safety Audit

### 7.1 Schema DDL Inspection (`V7__create_operational_project_schema.sql`)
Inspection of [V7__create_operational_project_schema.sql](file:///D:/WEBUI/backend/src/main/resources/db/migration/V7__create_operational_project_schema.sql):
- **Foreign Key Constraints:**
  - `fk_op_proj_client` -> `clients(id) ON DELETE RESTRICT` (**VERIFIED: Prevents cascade deletion of client data**).
  - `fk_proj_assign_proj` -> `operational_projects(id) ON DELETE RESTRICT`.
  - `fk_proj_assign_vendor` -> `vendors(id) ON DELETE RESTRICT` (**VERIFIED: Prevents cascade deletion of vendor records**).
  - `fk_phase_proj` -> `operational_projects(id) ON DELETE RESTRICT`.
  - `fk_ms_phase` -> `project_phases(id) ON DELETE RESTRICT`.
  - `fk_ms_proj` -> `operational_projects(id) ON DELETE RESTRICT`.
  - `fk_task_proj` -> `operational_projects(id) ON DELETE RESTRICT`.
  - `fk_task_ms` -> `project_milestones(id) ON DELETE RESTRICT`.
  - `fk_task_assignee` -> `users(id) ON DELETE RESTRICT`.
- **Indexes:**
  - `idx_op_proj_client`, `idx_op_proj_status`, `idx_op_proj_pm`.
  - `idx_proj_assign_proj`, `idx_proj_assign_vendor`.
  - `idx_phase_proj`, `idx_ms_phase`, `idx_ms_proj`, `idx_task_proj`, `idx_task_ms`, `idx_task_assignee`.
- **Status Check Constraints:**
  - `chk_op_proj_status`: `DRAFT`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`, `CANCELLED`.
  - `chk_proj_assign_status`: `ACTIVE`, `COMPLETED`, `TERMINATED`.
  - `chk_phase_status`: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`, `CANCELLED`.
  - `chk_ms_status`: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
  - `chk_task_status`: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`, `BLOCKED`.
  - `chk_task_priority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

### 7.2 Preflight Validation Script (`V7_preflight_check.sql`)
- Inspection of `backend/src/main/resources/db/migration/V7_preflight_check.sql` confirmed that it checks prerequisites (`clients`, `vendors`, `users` tables exist) without issuing destructive DDL or DML.

---

## 8. Step 7 — Test Suite & Regression Verification

All backend automated test suites were compiled and executed. Every test suite passed cleanly with zero regressions:

```
[INFO] Running com.webui.backend.concurrency.FinancialConcurrencyAndOptimisticLockingTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.887 s
[INFO] 
[INFO] Running com.webui.backend.config.ProductionBootstrapHardeningTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.838 s
[INFO] Running com.webui.backend.config.ProductionProfileContextTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.486 s
[INFO] 
[INFO] Running com.webui.backend.identity.BusinessIdentityServiceAndSecurityTest
[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.258 s
[INFO] Running com.webui.backend.operational.OperationalProjectServiceAndSecurityTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.846 s
[INFO] 
[INFO] Running com.webui.backend.security.Phase3AuthLifecycleTest
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.793 s
[INFO] 
[INFO] Running com.webui.backend.security.MakerCheckerAndSafetyInvariantsTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.115 s
[INFO] Running com.webui.backend.security.SecurityAndRbacIntegrationTest
[INFO] Tests run: 26, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.482 s
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Test Count Summary

| Test Class | Focus Domain | Tests Executed | Passed | Failed |
| :--- | :--- | :---: | :---: | :---: |
| `FinancialConcurrencyAndOptimisticLockingTest` | Phase 2 Concurrency & Locking | 9 | 9 | 0 |
| `ProductionBootstrapHardeningTest` | Phase 3.2 Bootstrap Security | 11 | 11 | 0 |
| `ProductionProfileContextTest` | Phase 3.2 Spring Context Isolation | 1 | 1 | 0 |
| `BusinessIdentityServiceAndSecurityTest` | Phase 4.1 Business Identity & BOLA | 13 | 13 | 0 |
| `OperationalProjectServiceAndSecurityTest` | Phase 4.2 Operational Projects & RBAC | 8 | 8 | 0 |
| `Phase3AuthLifecycleTest` | Phase 3/3.1 Token Lifecycle & Replay | 17 | 17 | 0 |
| `MakerCheckerAndSafetyInvariantsTest` | Maker-Checker Financial Invariants | 12 | 12 | 0 |
| `SecurityAndRbacIntegrationTest` | Studio-wide RBAC Integration | 26 | 26 | 0 |
| **TOTAL** | **Entire Backend Test Suite** | **97** | **97** | **0** |

---

## 9. Comprehensive Findings Log

### 9.1 Phase 4.2 Findings

| ID | Title | Severity | Impact | Required Remediation |
| :--- | :--- | :---: | :--- | :--- |
| **FINDING-4.2-01** | Terminated Vendor Project Access Leak | **MEDIUM** | In `validateProjectAccess`, `existsByProjectIdAndVendorId` ignores assignment status. Terminated vendors can still read project details. | Change check to verify `status = 'ACTIVE'` (e.g. `existsByProjectIdAndVendorIdAndStatus(id, vendorId, "ACTIVE")`). |
| **FINDING-4.2-02** | Unvalidated Project Manager Assignment | **MEDIUM** | Arbitrary or nonexistent usernames can be assigned as project managers without checking `UserRepository` or roles. | Call `userRepository.findByUsername` and verify target user has `ROLE_PROJECT_MANAGER` or `ROLE_ADMIN`. |
| **FINDING-4.2-03** | Contract Value Leaked to Vendors in Summary List | **MEDIUM** | `toSummary` populates `contractValue` and `budgetAllocated` without role masking. Vendors calling `GET /api/operational-projects` learn total contract values. | Mask `contractValue` and `budgetAllocated` in `toSummary` when caller is `ROLE_VENDOR`. |
| **FINDING-4.2-04** | Sub-entity Modifications on Archived Projects | **LOW** | No status guard prevents creating phases, milestones, tasks, or vendor assignments on `ARCHIVED` projects. | Add guard in mutating methods rejecting actions if `project.getStatus().equals("ARCHIVED")`. |
| **FINDING-4.2-05** | Unconstrained Milestone `billedPercentage` | **LOW** | `billedPercentage` is unconstrained (can be negative or >100) and cumulative milestone sums are not validated. | Add `@Min(0) @Max(100)` validation annotations and verify milestone percentage totals. |

### 9.2 Outstanding Phase 4.1 Conditions (Carried Forward)
1. **Bank Details At-Rest Encryption:** `vendors.bank_details_json` remains in plaintext JSON. An AES-256-GCM JPA `@Convert` must be applied before production deployment.
2. **Sensitive Vendor PI Masking:** GSTIN, PAN, and bank account numbers are unmasked in staff DTOs.
3. **Database Unique Constraint on `users(email)`:** Currently enforced in application layer; database index lacks `UNIQUE`.
4. **Invitation Rate Limiting:** Missing IP/subnet rate-limiting on `/api/invitations/accept`.

---

## 10. Final Acceptance Verdict

### **VERDICT: ACCEPTED WITH CONDITIONS**

**Justification:**
1. The domain architecture cleanly and correctly isolates operational project workflows from the public portfolio model.
2. Tenant isolation and Broken Object-Level Authorization (BOLA) between clients are enforced across all operational project endpoints.
3. Milestone completion invariants strictly prevent completing milestones with pending tasks.
4. Foreign key integrity utilizes `ON DELETE RESTRICT` throughout, preventing cascading operational data loss.
5. All **97 backend automated tests pass cleanly** with zero regressions in financial, authentication, or identity domains.
6. The identified findings (FINDING-4.2-01 through FINDING-4.2-05) are scoped and do not represent architectural blockers for beginning Phase 4.3 (Financial Operations Integration).

### Mandatory Release Conditions for Production:
1. **Resolve FINDING-4.2-01:** Ensure terminated vendor assignments immediately forfeit read permissions to projects.
2. **Resolve FINDING-4.2-02:** Enforce project manager username validation against the user repository and required roles.
3. **Resolve FINDING-4.2-03:** Mask `contractValue` and `budgetAllocated` in `OperationalProjectSummaryResponse` for vendor callers.
4. **Resolve FINDING-4.2-04:** Guard all sub-entity mutations against `ARCHIVED` projects.
5. **Resolve Phase 4.1 Encryption Condition:** Apply AES-256-GCM envelope encryption to `vendors.bank_details_json`.
