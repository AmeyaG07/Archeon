package com.webui.backend.service;

import com.webui.backend.dto.operational.OperationalProjectDto.*;
import com.webui.backend.model.*;
import com.webui.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OperationalProjectService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final Set<String> ALLOWED_PROJECT_TYPES = Set.of(
            "RESIDENTIAL_ARCHITECTURE", "COMMERCIAL_INTERIOR", "LANDSCAPE_DESIGN",
            "TURNKEY_EXECUTION", "RENOVATION_HERITAGE", "HOSPITALITY_DEVELOPMENT"
    );

    private static final Set<String> ALLOWED_PROJECT_STATUSES = Set.of(
            "PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "ARCHIVED"
    );

    private static final Set<String> ALLOWED_PHASE_STATUSES = Set.of(
            "PENDING", "IN_PROGRESS", "COMPLETED"
    );

    private static final Set<String> ALLOWED_MILESTONE_STATUSES = Set.of(
            "PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"
    );

    private static final Set<String> ALLOWED_TASK_STATUSES = Set.of(
            "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"
    );

    private static final Set<String> ALLOWED_TASK_PRIORITIES = Set.of(
            "LOW", "MEDIUM", "HIGH", "URGENT"
    );

    private static final Set<String> ALLOWED_VENDOR_ASSIGNMENT_STATUSES = Set.of(
            "ACTIVE", "COMPLETED", "TERMINATED"
    );

    @Autowired
    private OperationalProjectRepository projectRepository;

    @Autowired
    private ProjectVendorAssignmentRepository vendorAssignmentRepository;

    @Autowired
    private ProjectPhaseRepository phaseRepository;

    @Autowired
    private ProjectMilestoneRepository milestoneRepository;

    @Autowired
    private ProjectTaskRepository taskRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    private static final Set<String> ALLOWED_PM_ROLES = Set.of(
            "ROLE_PROJECT_MANAGER", "ROLE_ADMIN", "ROLE_PRINCIPAL_ARCHITECT", "ROLE_STAFF"
    );

    // ==========================================
    // Security Helper & Authorization Checks
    // ==========================================

    private boolean isInternalStaff(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return false;
        return authorities.stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("ROLE_STAFF") ||
                a.getAuthority().equals("ROLE_PROJECT_MANAGER") ||
                a.getAuthority().equals("ROLE_PRINCIPAL_ARCHITECT") ||
                a.getAuthority().startsWith("ROLE_FINANCE_"));
    }

    private boolean isProjectManager(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return false;
        return authorities.stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("ROLE_PROJECT_MANAGER") ||
                a.getAuthority().equals("ROLE_PRINCIPAL_ARCHITECT"));
    }

    private UserEntity getAuthenticatedUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found: " + auth.getName()));
    }

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

    private void checkNotArchived(OperationalProjectEntity project, String operation) {
        if ("ARCHIVED".equalsIgnoreCase(project.getStatus())) {
            throw new IllegalStateException("Security Invariant Violation: Cannot " + operation
                    + " on an ARCHIVED project (" + project.getProjectReference() + "). Project is sealed.");
        }
    }

    private void validateBilledPercentage(Integer percentage) {
        if (percentage != null && (percentage < 0 || percentage > 100)) {
            throw new IllegalArgumentException("Milestone billed percentage must be between 0 and 100 inclusive. Received: " + percentage);
        }
    }

    /**
     * BOLA / Tenant Isolation Check for Operational Projects
     */
    public void validateProjectAccess(OperationalProjectEntity project, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }
        if (isInternalStaff(auth.getAuthorities())) {
            return;
        }

        UserEntity user = getAuthenticatedUser(auth);

        // 1. Client User Access Check
        if ("ROLE_CLIENT".equals(user.getRole())) {
            if (user.getClientId() != null && user.getClientId().equals(project.getClientId())) {
                return;
            }
            throw new AccessDeniedException("Access denied: You are not authorized to access project " + project.getProjectReference());
        }

        // 2. Vendor User Access Check - requires ACTIVE assignment
        if ("ROLE_VENDOR".equals(user.getRole())) {
            if (user.getVendorId() != null &&
                    vendorAssignmentRepository.existsByProjectIdAndVendorIdAndStatus(project.getId(), user.getVendorId(), "ACTIVE")) {
                return;
            }
            throw new AccessDeniedException("Access denied: You do not have an active assignment on project " + project.getProjectReference());
        }

        throw new AccessDeniedException("Access denied: Insufficient privileges for project " + project.getProjectReference());
    }

    private void validateStaffOrPm(Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio personnel can perform project management operations");
        }
    }

    private String generateProjectReference() {
        String ref;
        do {
            int randomNum = 1000 + SECURE_RANDOM.nextInt(9000);
            ref = "OPR-" + LocalDate.now().getYear() + "-" + randomNum;
        } while (projectRepository.existsByProjectReference(ref));
        return ref;
    }

    // ==========================================
    // Mappers
    // ==========================================

    private OperationalProjectSummaryResponse toSummary(OperationalProjectEntity p, Map<UUID, ClientEntity> clientMap, Authentication auth) {
        ClientEntity client = clientMap.get(p.getClientId());
        UserEntity currentUser = getAuthenticatedUser(auth);
        boolean isVendor = "ROLE_VENDOR".equals(currentUser.getRole());

        // Invariant: Vendors must NEVER receive contractValue or budgetAllocated
        BigDecimal summaryContractValue = isVendor ? null : p.getContractValue();

        return OperationalProjectSummaryResponse.builder()
                .id(p.getId())
                .projectReference(p.getProjectReference())
                .name(p.getName())
                .projectType(p.getProjectType())
                .clientId(p.getClientId())
                .clientReference(client != null ? client.getClientReference() : null)
                .clientName(client != null ? client.getFullName() : null)
                .projectManagerUsername(p.getProjectManagerUsername())
                .status(p.getStatus())
                .progressPercentage(p.getProgressPercentage())
                .startDate(p.getStartDate())
                .expectedCompletionDate(p.getExpectedCompletionDate())
                .lastVisitDate(p.getLastVisitDate())
                .contractValue(summaryContractValue)
                .version(p.getVersion())
                .build();
    }

    private PhaseResponse toPhaseResponse(ProjectPhaseEntity phase) {
        return PhaseResponse.builder()
                .id(phase.getId())
                .projectId(phase.getProjectId())
                .name(phase.getName())
                .description(phase.getDescription())
                .sequenceOrder(phase.getSequenceOrder())
                .status(phase.getStatus())
                .startDate(phase.getStartDate())
                .expectedCompletionDate(phase.getExpectedCompletionDate())
                .actualCompletionDate(phase.getActualCompletionDate())
                .version(phase.getVersion())
                .build();
    }

    private MilestoneResponse toMilestoneResponse(ProjectMilestoneEntity m, Map<UUID, String> phaseNameMap) {
        return MilestoneResponse.builder()
                .id(m.getId())
                .projectId(m.getProjectId())
                .phaseId(m.getPhaseId())
                .phaseName(m.getPhaseId() != null ? phaseNameMap.get(m.getPhaseId()) : null)
                .title(m.getTitle())
                .description(m.getDescription())
                .dueDate(m.getDueDate())
                .completionDate(m.getCompletionDate())
                .status(m.getStatus())
                .responsibleOwner(m.getResponsibleOwner())
                .billedPercentage(m.getBilledPercentage())
                .createdAt(m.getCreatedAt())
                .version(m.getVersion())
                .build();
    }

    private TaskResponse toTaskResponse(ProjectTaskEntity t, Map<UUID, String> phaseNameMap, Map<UUID, String> milestoneTitleMap, Map<UUID, String> vendorNameMap) {
        return TaskResponse.builder()
                .id(t.getId())
                .projectId(t.getProjectId())
                .phaseId(t.getPhaseId())
                .phaseName(t.getPhaseId() != null ? phaseNameMap.get(t.getPhaseId()) : null)
                .milestoneId(t.getMilestoneId())
                .milestoneTitle(t.getMilestoneId() != null ? milestoneTitleMap.get(t.getMilestoneId()) : null)
                .title(t.getTitle())
                .description(t.getDescription())
                .priority(t.getPriority())
                .status(t.getStatus())
                .assignedTo(t.getAssignedTo())
                .assignedVendorId(t.getAssignedVendorId())
                .assignedVendorName(t.getAssignedVendorId() != null ? vendorNameMap.get(t.getAssignedVendorId()) : null)
                .dueDate(t.getDueDate())
                .completedAt(t.getCompletedAt())
                .createdBy(t.getCreatedBy())
                .createdAt(t.getCreatedAt())
                .version(t.getVersion())
                .build();
    }

    private VendorAssignmentResponse toVendorAssignmentResponse(ProjectVendorAssignmentEntity a, OperationalProjectEntity p, VendorEntity v, Authentication auth) {
        UserEntity currentUser = getAuthenticatedUser(auth);
        boolean isClient = "ROLE_CLIENT".equals(currentUser.getRole());
        boolean isVendor = "ROLE_VENDOR".equals(currentUser.getRole());

        // Invariant: Clients must NEVER see vendor subcontract contract amounts (contractor rates)
        // Vendors must ONLY see their own contract amount, never other vendors' amounts
        BigDecimal amount = a.getContractAmount();
        if (isClient) {
            amount = null;
        } else if (isVendor && !a.getVendorId().equals(currentUser.getVendorId())) {
            amount = null;
        }

        return VendorAssignmentResponse.builder()
                .id(a.getId())
                .projectId(a.getProjectId())
                .projectReference(p != null ? p.getProjectReference() : null)
                .vendorId(a.getVendorId())
                .vendorReference(v != null ? v.getVendorReference() : null)
                .vendorBusinessName(v != null ? v.getBusinessName() : null)
                .vendorCategory(v != null ? v.getCategory() : null)
                .scopeOfWork(a.getScopeOfWork())
                .status(a.getStatus())
                .contractAmount(amount)
                .assignedBy(a.getAssignedBy())
                .assignedAt(a.getAssignedAt())
                .completedAt(a.getCompletedAt())
                .notes(a.getNotes())
                .version(a.getVersion())
                .build();
    }

    // ==========================================
    // 1. Operational Project Lifecycle
    // ==========================================

    @Transactional
    public OperationalProjectResponse createProject(CreateOperationalProjectRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        if (!StringUtils.hasText(req.getName())) {
            throw new IllegalArgumentException("Project name is mandatory");
        }
        if (!StringUtils.hasText(req.getProjectType())) {
            throw new IllegalArgumentException("Project type is mandatory");
        }
        if (req.getClientId() == null) {
            throw new IllegalArgumentException("Client ID is mandatory for operational project");
        }

        String rawType = req.getProjectType() != null ? req.getProjectType().trim() : "";
        if (rawType.isEmpty()) {
            throw new IllegalArgumentException("Project category/type is required");
        }
        String upperType = rawType.toUpperCase();
        String projectType = ALLOWED_PROJECT_TYPES.contains(upperType) ? upperType : rawType;

        ClientEntity client = clientRepository.findById(req.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + req.getClientId()));

        if (!"ACTIVE".equalsIgnoreCase(client.getStatus())) {
            throw new IllegalArgumentException("Cannot associate project with inactive or suspended client: " + client.getClientReference());
        }

        String ref = StringUtils.hasText(req.getProjectReference())
                ? req.getProjectReference().trim().toUpperCase()
                : generateProjectReference();

        if (projectRepository.existsByProjectReference(ref)) {
            throw new IllegalArgumentException("Project reference already in use: " + ref);
        }

        String validatedPm = validateAndResolveProjectManager(req.getProjectManagerUsername());

        OperationalProjectEntity project = OperationalProjectEntity.builder()
                .projectReference(ref)
                .name(req.getName().trim())
                .description(req.getDescription())
                .projectType(projectType)
                .clientId(req.getClientId())
                .projectManagerUsername(validatedPm)
                .siteAddress(req.getSiteAddress())
                .contractValue(req.getContractValue())
                .budgetAllocated(req.getBudgetAllocated())
                .status("PLANNING")
                .progressPercentage(0)
                .startDate(req.getStartDate())
                .expectedCompletionDate(req.getExpectedCompletionDate())
                .lastVisitDate(req.getLastVisitDate())
                .notes(req.getNotes())
                .createdAt(LocalDateTime.now())
                .build();

        OperationalProjectEntity saved = projectRepository.save(project);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("OPERATIONAL_PROJECT_CREATED")
                .entityName("OperationalProject")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"reference\": \"%s\", \"client\": \"%s\"}", ref, client.getClientReference()))
                .build());

        return getProjectById(saved.getId(), auth);
    }

    @Transactional(readOnly = true)
    public OperationalProjectResponse getProjectById(UUID id, Authentication auth) {
        OperationalProjectEntity p = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + id));

        validateProjectAccess(p, auth);

        ClientEntity client = clientRepository.findById(p.getClientId()).orElse(null);

        // Fetch phases
        List<ProjectPhaseEntity> phases = phaseRepository.findByProjectIdOrderBySequenceOrderAsc(id);
        Map<UUID, String> phaseNameMap = phases.stream().collect(Collectors.toMap(ProjectPhaseEntity::getId, ProjectPhaseEntity::getName));

        // Fetch milestones
        List<ProjectMilestoneEntity> milestones = milestoneRepository.findByProjectIdOrderByDueDateAsc(id);
        Map<UUID, String> milestoneTitleMap = milestones.stream().collect(Collectors.toMap(ProjectMilestoneEntity::getId, ProjectMilestoneEntity::getTitle));

        // Fetch vendor assignments
        List<ProjectVendorAssignmentEntity> assignments = vendorAssignmentRepository.findByProjectId(id);
        Set<UUID> vendorIds = assignments.stream().map(ProjectVendorAssignmentEntity::getVendorId).collect(Collectors.toSet());
        Map<UUID, VendorEntity> vendorMap = vendorRepository.findAllById(vendorIds).stream()
                .collect(Collectors.toMap(VendorEntity::getId, v -> v));
        Map<UUID, String> vendorNameMap = vendorMap.values().stream()
                .collect(Collectors.toMap(VendorEntity::getId, VendorEntity::getBusinessName));

        // Fetch tasks with vendor filtering if caller is a vendor
        UserEntity user = getAuthenticatedUser(auth);
        List<ProjectTaskEntity> tasks;
        if ("ROLE_VENDOR".equals(user.getRole())) {
            tasks = taskRepository.findByProjectIdAndAssignedVendorIdOrderByDueDateAsc(id, user.getVendorId());
        } else {
            tasks = taskRepository.findByProjectIdOrderByDueDateAsc(id);
        }

        // Mask overall financials based on role:
        // - Vendors NEVER receive contractValue or budgetAllocated
        // - Clients receive contractValue, but NEVER receive internal budgetAllocated
        // - Internal staff receive both
        BigDecimal contractVal = "ROLE_VENDOR".equals(user.getRole()) ? null : p.getContractValue();
        BigDecimal budgetAlloc = ("ROLE_VENDOR".equals(user.getRole()) || "ROLE_CLIENT".equals(user.getRole())) ? null : p.getBudgetAllocated();

        List<VendorAssignmentResponse> assignmentResponses = assignments.stream()
                .filter(a -> !"ROLE_VENDOR".equals(user.getRole()) || a.getVendorId().equals(user.getVendorId()))
                .map(a -> toVendorAssignmentResponse(a, p, vendorMap.get(a.getVendorId()), auth))
                .collect(Collectors.toList());

        return OperationalProjectResponse.builder()
                .id(p.getId())
                .projectReference(p.getProjectReference())
                .name(p.getName())
                .description(p.getDescription())
                .projectType(p.getProjectType())
                .clientId(p.getClientId())
                .clientReference(client != null ? client.getClientReference() : null)
                .clientName(client != null ? client.getFullName() : null)
                .projectManagerUsername(p.getProjectManagerUsername())
                .siteAddress(p.getSiteAddress())
                .contractValue(contractVal)
                .budgetAllocated(budgetAlloc)
                .status(p.getStatus())
                .progressPercentage(p.getProgressPercentage())
                .startDate(p.getStartDate())
                .expectedCompletionDate(p.getExpectedCompletionDate())
                .actualCompletionDate(p.getActualCompletionDate())
                .lastVisitDate(p.getLastVisitDate())
                .notes(p.getNotes())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .version(p.getVersion())
                .phases(phases.stream().map(this::toPhaseResponse).collect(Collectors.toList()))
                .milestones(milestones.stream().map(m -> toMilestoneResponse(m, phaseNameMap)).collect(Collectors.toList()))
                .tasks(tasks.stream().map(t -> toTaskResponse(t, phaseNameMap, milestoneTitleMap, vendorNameMap)).collect(Collectors.toList()))
                .assignedVendors(assignmentResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public OperationalProjectResponse getProjectByReference(String reference, Authentication auth) {
        OperationalProjectEntity p = projectRepository.findByProjectReference(reference)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + reference));
        return getProjectById(p.getId(), auth);
    }

    @Transactional(readOnly = true)
    public List<OperationalProjectSummaryResponse> listProjects(Authentication auth, String statusFilter) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }

        UserEntity user = getAuthenticatedUser(auth);
        List<OperationalProjectEntity> list;

        if (isInternalStaff(auth.getAuthorities())) {
            if (StringUtils.hasText(statusFilter)) {
                list = projectRepository.findByStatusOrderByCreatedAtDesc(statusFilter.trim().toUpperCase());
            } else {
                list = projectRepository.findAllByOrderByCreatedAtDesc();
            }
        } else if ("ROLE_CLIENT".equals(user.getRole())) {
            if (user.getClientId() == null) {
                return Collections.emptyList();
            }
            list = projectRepository.findByClientIdOrderByCreatedAtDesc(user.getClientId());
            if (StringUtils.hasText(statusFilter)) {
                String filter = statusFilter.trim().toUpperCase();
                list = list.stream().filter(p -> p.getStatus().equals(filter)).collect(Collectors.toList());
            }
        } else if ("ROLE_VENDOR".equals(user.getRole())) {
            if (user.getVendorId() == null) {
                return Collections.emptyList();
            }
            List<ProjectVendorAssignmentEntity> assignments = vendorAssignmentRepository.findByVendorIdAndStatus(user.getVendorId(), "ACTIVE");
            Set<UUID> projectIds = assignments.stream().map(ProjectVendorAssignmentEntity::getProjectId).collect(Collectors.toSet());
            if (projectIds.isEmpty()) {
                return Collections.emptyList();
            }
            list = projectRepository.findAllById(projectIds);
            if (StringUtils.hasText(statusFilter)) {
                String filter = statusFilter.trim().toUpperCase();
                list = list.stream().filter(p -> p.getStatus().equals(filter)).collect(Collectors.toList());
            }
        } else {
            throw new AccessDeniedException("Insufficient privileges to list projects");
        }

        Set<UUID> clientIds = list.stream().map(OperationalProjectEntity::getClientId).collect(Collectors.toSet());
        Map<UUID, ClientEntity> clientMap = clientRepository.findAllById(clientIds).stream()
                .collect(Collectors.toMap(ClientEntity::getId, c -> c));

        return list.stream().map(p -> toSummary(p, clientMap, auth)).collect(Collectors.toList());
    }

    @Transactional
    public OperationalProjectResponse updateProject(UUID id, UpdateOperationalProjectRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity p = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + id));

        validateProjectAccess(p, auth);
        checkNotArchived(p, "update project details");

        if (StringUtils.hasText(req.getName())) {
            p.setName(req.getName().trim());
        }
        if (req.getDescription() != null) {
            p.setDescription(req.getDescription().trim());
        }
        if (StringUtils.hasText(req.getProjectType())) {
            String rawPt = req.getProjectType().trim();
            String upperPt = rawPt.toUpperCase();
            p.setProjectType(ALLOWED_PROJECT_TYPES.contains(upperPt) ? upperPt : rawPt);
        }
        if (req.getProjectManagerUsername() != null) {
            String validatedPm = validateAndResolveProjectManager(req.getProjectManagerUsername());
            p.setProjectManagerUsername(validatedPm);
        }
        if (req.getSiteAddress() != null) {
            p.setSiteAddress(req.getSiteAddress().trim());
        }
        if (req.getContractValue() != null) {
            p.setContractValue(req.getContractValue());
        }
        if (req.getBudgetAllocated() != null) {
            p.setBudgetAllocated(req.getBudgetAllocated());
        }
        if (req.getProgressPercentage() != null) {
            int progress = Math.max(0, Math.min(100, req.getProgressPercentage()));
            p.setProgressPercentage(progress);
        }
        if (req.getStartDate() != null) {
            p.setStartDate(req.getStartDate());
        }
        if (req.getExpectedCompletionDate() != null) {
            p.setExpectedCompletionDate(req.getExpectedCompletionDate());
        }
        if (req.getActualCompletionDate() != null) {
            p.setActualCompletionDate(req.getActualCompletionDate());
        }
        if (req.getLastVisitDate() != null) {
            p.setLastVisitDate(req.getLastVisitDate());
        }
        if (req.getNotes() != null) {
            p.setNotes(req.getNotes().trim());
        }

        p.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(p);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("OPERATIONAL_PROJECT_UPDATED")
                .entityName("OperationalProject")
                .entityId(p.getId().toString())
                .detailsJson(String.format("{\"reference\": \"%s\"}", p.getProjectReference()))
                .build());

        return getProjectById(id, auth);
    }

    @Transactional
    public OperationalProjectResponse updateProjectStatus(UUID id, UpdateProjectStatusRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity p = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + id));

        validateProjectAccess(p, auth);

        String newStatus = req.getStatus() != null ? req.getStatus().trim().toUpperCase() : null;
        if (!ALLOWED_PROJECT_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("Invalid status: " + req.getStatus() + ". Allowed: " + ALLOWED_PROJECT_STATUSES);
        }

        // Invariant: If project is currently ARCHIVED, only ROLE_ADMIN can transition status out of ARCHIVED
        if ("ARCHIVED".equalsIgnoreCase(p.getStatus()) && !"ARCHIVED".equalsIgnoreCase(newStatus)) {
            boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) {
                throw new IllegalStateException("Security Invariant Violation: Only studio administrators can reactivate an ARCHIVED project.");
            }
        }

        p.setStatus(newStatus);
        if ("COMPLETED".equals(newStatus)) {
            p.setProgressPercentage(100);
            if (p.getActualCompletionDate() == null) {
                p.setActualCompletionDate(LocalDate.now());
            }
        }
        if (req.getNotes() != null) {
            p.setNotes(req.getNotes().trim());
        }

        p.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(p);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("OPERATIONAL_PROJECT_STATUS_UPDATED")
                .entityName("OperationalProject")
                .entityId(p.getId().toString())
                .detailsJson(String.format("{\"reference\": \"%s\", \"newStatus\": \"%s\"}", p.getProjectReference(), newStatus))
                .build());

        return getProjectById(id, auth);
    }

    @Transactional
    public OperationalProjectResponse archiveProject(UUID id, Authentication auth) {
        UpdateProjectStatusRequest req = UpdateProjectStatusRequest.builder()
                .status("ARCHIVED")
                .notes("Archived by studio administration.")
                .build();
        return updateProjectStatus(id, req, auth);
    }

    // ==========================================
    // 2. Vendor Assignment
    // ==========================================

    @Transactional
    public VendorAssignmentResponse assignVendor(UUID projectId, AssignVendorRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));

        checkNotArchived(project, "assign vendor");

        if (req.getVendorId() == null) {
            throw new IllegalArgumentException("Vendor ID is mandatory for assignment");
        }
        if (!StringUtils.hasText(req.getScopeOfWork())) {
            throw new IllegalArgumentException("Scope of work is mandatory for vendor assignment");
        }

        VendorEntity vendor = vendorRepository.findById(req.getVendorId())
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + req.getVendorId()));

        if (!"ACTIVE".equalsIgnoreCase(vendor.getStatus())) {
            throw new IllegalArgumentException("Cannot assign inactive or suspended vendor: " + vendor.getVendorReference());
        }

        if (vendorAssignmentRepository.existsByProjectIdAndVendorId(projectId, req.getVendorId())) {
            throw new IllegalArgumentException("Vendor " + vendor.getVendorReference() + " is already assigned to this project.");
        }

        ProjectVendorAssignmentEntity assignment = ProjectVendorAssignmentEntity.builder()
                .projectId(projectId)
                .vendorId(req.getVendorId())
                .scopeOfWork(req.getScopeOfWork().trim())
                .contractAmount(req.getContractAmount())
                .status("ACTIVE")
                .assignedBy(auth.getName())
                .assignedAt(LocalDateTime.now())
                .notes(req.getNotes())
                .build();

        ProjectVendorAssignmentEntity saved = vendorAssignmentRepository.save(assignment);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("PROJECT_VENDOR_ASSIGNED")
                .entityName("ProjectVendorAssignment")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"project\": \"%s\", \"vendor\": \"%s\"}",
                        project.getProjectReference(), vendor.getVendorReference()))
                .build());

        return toVendorAssignmentResponse(saved, project, vendor, auth);
    }

    @Transactional(readOnly = true)
    public List<VendorAssignmentResponse> listProjectVendors(UUID projectId, Authentication auth) {
        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));

        validateProjectAccess(project, auth);

        UserEntity user = getAuthenticatedUser(auth);
        List<ProjectVendorAssignmentEntity> list = vendorAssignmentRepository.findByProjectId(projectId);

        if ("ROLE_VENDOR".equals(user.getRole())) {
            list = list.stream().filter(a -> a.getVendorId().equals(user.getVendorId())).collect(Collectors.toList());
        }

        Set<UUID> vendorIds = list.stream().map(ProjectVendorAssignmentEntity::getVendorId).collect(Collectors.toSet());
        Map<UUID, VendorEntity> vendorMap = vendorRepository.findAllById(vendorIds).stream()
                .collect(Collectors.toMap(VendorEntity::getId, v -> v));

        return list.stream().map(a -> toVendorAssignmentResponse(a, project, vendorMap.get(a.getVendorId()), auth)).collect(Collectors.toList());
    }

    @Transactional
    public VendorAssignmentResponse updateVendorAssignmentStatus(UUID projectId, UUID vendorId, UpdateVendorAssignmentStatusRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));

        checkNotArchived(project, "update vendor assignment status");

        ProjectVendorAssignmentEntity assignment = vendorAssignmentRepository.findByProjectIdAndVendorId(projectId, vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor assignment not found for vendor " + vendorId));

        String newStatus = req.getStatus() != null ? req.getStatus().trim().toUpperCase() : null;
        if (!ALLOWED_VENDOR_ASSIGNMENT_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("Invalid status: " + req.getStatus() + ". Allowed: " + ALLOWED_VENDOR_ASSIGNMENT_STATUSES);
        }

        assignment.setStatus(newStatus);
        if ("COMPLETED".equals(newStatus)) {
            assignment.setCompletedAt(LocalDateTime.now());
        }
        if (req.getNotes() != null) {
            assignment.setNotes(req.getNotes().trim());
        }

        ProjectVendorAssignmentEntity saved = vendorAssignmentRepository.save(assignment);
        VendorEntity vendor = vendorRepository.findById(vendorId).orElse(null);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("PROJECT_VENDOR_STATUS_UPDATED")
                .entityName("ProjectVendorAssignment")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"project\": \"%s\", \"vendor\": \"%s\", \"status\": \"%s\"}",
                        project.getProjectReference(), vendor != null ? vendor.getVendorReference() : vendorId, newStatus))
                .build());

        return toVendorAssignmentResponse(saved, project, vendor, auth);
    }

    // ==========================================
    // 3. Project Phases
    // ==========================================

    @Transactional
    public PhaseResponse createPhase(UUID projectId, CreatePhaseRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));

        checkNotArchived(project, "create phase");

        if (!StringUtils.hasText(req.getName())) {
            throw new IllegalArgumentException("Phase name is mandatory");
        }
        if (req.getSequenceOrder() == null || req.getSequenceOrder() < 1) {
            throw new IllegalArgumentException("Phase sequence order must be a positive integer");
        }

        if (phaseRepository.existsByProjectIdAndSequenceOrder(projectId, req.getSequenceOrder())) {
            throw new IllegalArgumentException("A phase with sequence order " + req.getSequenceOrder() + " already exists for this project");
        }

        ProjectPhaseEntity phase = ProjectPhaseEntity.builder()
                .projectId(projectId)
                .name(req.getName().trim())
                .description(req.getDescription())
                .sequenceOrder(req.getSequenceOrder())
                .status("PENDING")
                .startDate(req.getStartDate())
                .expectedCompletionDate(req.getExpectedCompletionDate())
                .build();

        ProjectPhaseEntity saved = phaseRepository.save(phase);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("PROJECT_PHASE_CREATED")
                .entityName("ProjectPhase")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"project\": \"%s\", \"phase\": \"%s\"}", project.getProjectReference(), saved.getName()))
                .build());

        return toPhaseResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PhaseResponse> listPhases(UUID projectId, Authentication auth) {
        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));

        validateProjectAccess(project, auth);
        return phaseRepository.findByProjectIdOrderBySequenceOrderAsc(projectId).stream()
                .map(this::toPhaseResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PhaseResponse updatePhase(UUID projectId, UUID phaseId, UpdatePhaseRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));
        checkNotArchived(project, "update phase");

        ProjectPhaseEntity phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new IllegalArgumentException("Project phase not found: " + phaseId));

        if (!phase.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Phase does not belong to project " + projectId);
        }

        if (StringUtils.hasText(req.getName())) {
            phase.setName(req.getName().trim());
        }
        if (req.getDescription() != null) {
            phase.setDescription(req.getDescription().trim());
        }
        if (req.getSequenceOrder() != null && !req.getSequenceOrder().equals(phase.getSequenceOrder())) {
            if (phaseRepository.existsByProjectIdAndSequenceOrder(projectId, req.getSequenceOrder())) {
                throw new IllegalArgumentException("Phase sequence order " + req.getSequenceOrder() + " already in use");
            }
            phase.setSequenceOrder(req.getSequenceOrder());
        }
        if (req.getStartDate() != null) {
            phase.setStartDate(req.getStartDate());
        }
        if (req.getExpectedCompletionDate() != null) {
            phase.setExpectedCompletionDate(req.getExpectedCompletionDate());
        }
        if (req.getActualCompletionDate() != null) {
            phase.setActualCompletionDate(req.getActualCompletionDate());
        }

        ProjectPhaseEntity saved = phaseRepository.save(phase);
        return toPhaseResponse(saved);
    }

    @Transactional
    public PhaseResponse updatePhaseStatus(UUID projectId, UUID phaseId, UpdatePhaseStatusRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));
        checkNotArchived(project, "update phase status");

        ProjectPhaseEntity phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new IllegalArgumentException("Project phase not found: " + phaseId));

        if (!phase.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Phase does not belong to project " + projectId);
        }

        String newStatus = req.getStatus() != null ? req.getStatus().trim().toUpperCase() : null;
        if (!ALLOWED_PHASE_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("Invalid phase status: " + req.getStatus() + ". Allowed: " + ALLOWED_PHASE_STATUSES);
        }

        phase.setStatus(newStatus);
        if ("COMPLETED".equals(newStatus) && phase.getActualCompletionDate() == null) {
            phase.setActualCompletionDate(LocalDate.now());
        }

        ProjectPhaseEntity saved = phaseRepository.save(phase);
        return toPhaseResponse(saved);
    }

    // ==========================================
    // 4. Milestones
    // ==========================================

    @Transactional
    public MilestoneResponse createMilestone(UUID projectId, CreateMilestoneRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));
        checkNotArchived(project, "create milestone");

        if (!StringUtils.hasText(req.getTitle())) {
            throw new IllegalArgumentException("Milestone title is mandatory");
        }
        if (req.getDueDate() == null) {
            throw new IllegalArgumentException("Milestone due date is mandatory");
        }

        validateBilledPercentage(req.getBilledPercentage());

        if (req.getPhaseId() != null) {
            ProjectPhaseEntity phase = phaseRepository.findById(req.getPhaseId())
                    .orElseThrow(() -> new IllegalArgumentException("Phase not found: " + req.getPhaseId()));
            if (!phase.getProjectId().equals(projectId)) {
                throw new IllegalArgumentException("Phase does not belong to this project");
            }
        }

        ProjectMilestoneEntity milestone = ProjectMilestoneEntity.builder()
                .projectId(projectId)
                .phaseId(req.getPhaseId())
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .dueDate(req.getDueDate())
                .status("PENDING")
                .responsibleOwner(req.getResponsibleOwner())
                .billedPercentage(req.getBilledPercentage() != null ? req.getBilledPercentage() : 0)
                .createdAt(LocalDateTime.now())
                .build();

        ProjectMilestoneEntity saved = milestoneRepository.save(milestone);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("PROJECT_MILESTONE_CREATED")
                .entityName("ProjectMilestone")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"project\": \"%s\", \"title\": \"%s\"}", project.getProjectReference(), saved.getTitle()))
                .build());

        String phaseName = null;
        if (saved.getPhaseId() != null) {
            phaseName = phaseRepository.findById(saved.getPhaseId()).map(ProjectPhaseEntity::getName).orElse(null);
        }
        return toMilestoneResponse(saved, phaseName != null ? Map.of(saved.getPhaseId(), phaseName) : Collections.emptyMap());
    }

    @Transactional(readOnly = true)
    public List<MilestoneResponse> listMilestones(UUID projectId, Authentication auth) {
        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));

        validateProjectAccess(project, auth);

        List<ProjectPhaseEntity> phases = phaseRepository.findByProjectIdOrderBySequenceOrderAsc(projectId);
        Map<UUID, String> phaseNameMap = phases.stream().collect(Collectors.toMap(ProjectPhaseEntity::getId, ProjectPhaseEntity::getName));

        return milestoneRepository.findByProjectIdOrderByDueDateAsc(projectId).stream()
                .map(m -> toMilestoneResponse(m, phaseNameMap))
                .collect(Collectors.toList());
    }

    @Transactional
    public MilestoneResponse updateMilestone(UUID projectId, UUID milestoneId, UpdateMilestoneRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));
        checkNotArchived(project, "update milestone");

        ProjectMilestoneEntity milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        if (!milestone.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Milestone does not belong to project " + projectId);
        }

        if (StringUtils.hasText(req.getTitle())) {
            milestone.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            milestone.setDescription(req.getDescription().trim());
        }
        if (req.getDueDate() != null) {
            milestone.setDueDate(req.getDueDate());
        }
        if (req.getCompletionDate() != null) {
            milestone.setCompletionDate(req.getCompletionDate());
        }
        if (req.getResponsibleOwner() != null) {
            milestone.setResponsibleOwner(req.getResponsibleOwner().trim());
        }
        if (req.getBilledPercentage() != null) {
            validateBilledPercentage(req.getBilledPercentage());
            milestone.setBilledPercentage(req.getBilledPercentage());
        }

        ProjectMilestoneEntity saved = milestoneRepository.save(milestone);
        String phaseName = saved.getPhaseId() != null ? phaseRepository.findById(saved.getPhaseId()).map(ProjectPhaseEntity::getName).orElse(null) : null;
        return toMilestoneResponse(saved, phaseName != null ? Map.of(saved.getPhaseId(), phaseName) : Collections.emptyMap());
    }

    @Transactional
    public MilestoneResponse updateMilestoneStatus(UUID projectId, UUID milestoneId, UpdateMilestoneStatusRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));
        checkNotArchived(project, "update milestone status");

        ProjectMilestoneEntity milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        if (!milestone.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Milestone does not belong to project " + projectId);
        }

        String newStatus = req.getStatus() != null ? req.getStatus().trim().toUpperCase() : null;
        if (!ALLOWED_MILESTONE_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("Invalid status: " + req.getStatus() + ". Allowed: " + ALLOWED_MILESTONE_STATUSES);
        }

        milestone.setStatus(newStatus);
        if ("COMPLETED".equals(newStatus)) {
            boolean hasUnfinishedTasks = taskRepository.findByProjectIdOrderByDueDateAsc(projectId)
                    .stream()
                    .filter(t -> milestoneId.equals(t.getMilestoneId()))
                    .anyMatch(t -> !"DONE".equals(t.getStatus()));
            if (hasUnfinishedTasks) {
                throw new IllegalStateException("Cannot complete milestone with pending or unfinished tasks");
            }
            milestone.setCompletionDate(req.getCompletionDate() != null ? req.getCompletionDate() : LocalDate.now());
        }

        ProjectMilestoneEntity saved = milestoneRepository.save(milestone);
        String phaseName = saved.getPhaseId() != null ? phaseRepository.findById(saved.getPhaseId()).map(ProjectPhaseEntity::getName).orElse(null) : null;
        return toMilestoneResponse(saved, phaseName != null ? Map.of(saved.getPhaseId(), phaseName) : Collections.emptyMap());
    }

    // ==========================================
    // 5. Tasks
    // ==========================================

    @Transactional
    public TaskResponse createTask(UUID projectId, CreateTaskRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));
        checkNotArchived(project, "create task");

        if (!StringUtils.hasText(req.getTitle())) {
            throw new IllegalArgumentException("Task title is mandatory");
        }

        String priority = StringUtils.hasText(req.getPriority()) ? req.getPriority().trim().toUpperCase() : "MEDIUM";
        if (!ALLOWED_TASK_PRIORITIES.contains(priority)) {
            throw new IllegalArgumentException("Invalid priority: " + req.getPriority() + ". Allowed: " + ALLOWED_TASK_PRIORITIES);
        }

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

        if (req.getAssignedVendorId() != null) {
            if (!vendorAssignmentRepository.existsByProjectIdAndVendorIdAndStatus(projectId, req.getAssignedVendorId(), "ACTIVE")) {
                throw new IllegalArgumentException("Vendor " + req.getAssignedVendorId() + " does not have an active assignment on this project.");
            }
        }

        ProjectTaskEntity task = ProjectTaskEntity.builder()
                .projectId(projectId)
                .phaseId(req.getPhaseId())
                .milestoneId(req.getMilestoneId())
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .priority(priority)
                .status("TODO")
                .assignedTo(req.getAssignedTo())
                .assignedVendorId(req.getAssignedVendorId())
                .dueDate(req.getDueDate())
                .createdBy(auth.getName())
                .createdAt(LocalDateTime.now())
                .build();

        ProjectTaskEntity saved = taskRepository.save(task);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("PROJECT_TASK_CREATED")
                .entityName("ProjectTask")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"project\": \"%s\", \"title\": \"%s\"}", project.getProjectReference(), saved.getTitle()))
                .build());

        String phaseName = saved.getPhaseId() != null ? phaseRepository.findById(saved.getPhaseId()).map(ProjectPhaseEntity::getName).orElse(null) : null;
        String milestoneTitle = saved.getMilestoneId() != null ? milestoneRepository.findById(saved.getMilestoneId()).map(ProjectMilestoneEntity::getTitle).orElse(null) : null;
        String vendorName = saved.getAssignedVendorId() != null ? vendorRepository.findById(saved.getAssignedVendorId()).map(VendorEntity::getBusinessName).orElse(null) : null;

        return toTaskResponse(saved,
                phaseName != null ? Map.of(saved.getPhaseId(), phaseName) : Collections.emptyMap(),
                milestoneTitle != null ? Map.of(saved.getMilestoneId(), milestoneTitle) : Collections.emptyMap(),
                vendorName != null ? Map.of(saved.getAssignedVendorId(), vendorName) : Collections.emptyMap());
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> listTasks(UUID projectId, Authentication auth) {
        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));

        validateProjectAccess(project, auth);

        UserEntity user = getAuthenticatedUser(auth);
        List<ProjectTaskEntity> tasks;

        // Vendor can ONLY see tasks assigned to them
        if ("ROLE_VENDOR".equals(user.getRole())) {
            tasks = taskRepository.findByProjectIdAndAssignedVendorIdOrderByDueDateAsc(projectId, user.getVendorId());
        } else {
            tasks = taskRepository.findByProjectIdOrderByDueDateAsc(projectId);
        }

        List<ProjectPhaseEntity> phases = phaseRepository.findByProjectIdOrderBySequenceOrderAsc(projectId);
        Map<UUID, String> phaseNameMap = phases.stream().collect(Collectors.toMap(ProjectPhaseEntity::getId, ProjectPhaseEntity::getName));

        List<ProjectMilestoneEntity> milestones = milestoneRepository.findByProjectIdOrderByDueDateAsc(projectId);
        Map<UUID, String> milestoneTitleMap = milestones.stream().collect(Collectors.toMap(ProjectMilestoneEntity::getId, ProjectMilestoneEntity::getTitle));

        Set<UUID> vendorIds = tasks.stream().map(ProjectTaskEntity::getAssignedVendorId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<UUID, String> vendorNameMap = vendorRepository.findAllById(vendorIds).stream()
                .collect(Collectors.toMap(VendorEntity::getId, VendorEntity::getBusinessName));

        return tasks.stream()
                .map(t -> toTaskResponse(t, phaseNameMap, milestoneTitleMap, vendorNameMap))
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse updateTask(UUID projectId, UUID taskId, UpdateTaskRequest req, Authentication auth) {
        validateStaffOrPm(auth);

        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));
        checkNotArchived(project, "update task");

        ProjectTaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        if (!task.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Task does not belong to project " + projectId);
        }

        if (StringUtils.hasText(req.getTitle())) {
            task.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            task.setDescription(req.getDescription().trim());
        }
        if (StringUtils.hasText(req.getPriority())) {
            String p = req.getPriority().trim().toUpperCase();
            if (ALLOWED_TASK_PRIORITIES.contains(p)) {
                task.setPriority(p);
            }
        }
        if (req.getAssignedTo() != null) {
            task.setAssignedTo(req.getAssignedTo().trim());
        }
        if (req.getAssignedVendorId() != null) {
            if (!vendorAssignmentRepository.existsByProjectIdAndVendorIdAndStatus(projectId, req.getAssignedVendorId(), "ACTIVE")) {
                throw new IllegalArgumentException("Vendor " + req.getAssignedVendorId() + " does not have an active assignment on this project.");
            }
            task.setAssignedVendorId(req.getAssignedVendorId());
        }
        if (req.getDueDate() != null) {
            task.setDueDate(req.getDueDate());
        }

        ProjectTaskEntity saved = taskRepository.save(task);

        String phaseName = saved.getPhaseId() != null ? phaseRepository.findById(saved.getPhaseId()).map(ProjectPhaseEntity::getName).orElse(null) : null;
        String milestoneTitle = saved.getMilestoneId() != null ? milestoneRepository.findById(saved.getMilestoneId()).map(ProjectMilestoneEntity::getTitle).orElse(null) : null;
        String vendorName = saved.getAssignedVendorId() != null ? vendorRepository.findById(saved.getAssignedVendorId()).map(VendorEntity::getBusinessName).orElse(null) : null;

        return toTaskResponse(saved,
                phaseName != null ? Map.of(saved.getPhaseId(), phaseName) : Collections.emptyMap(),
                milestoneTitle != null ? Map.of(saved.getMilestoneId(), milestoneTitle) : Collections.emptyMap(),
                vendorName != null ? Map.of(saved.getAssignedVendorId(), vendorName) : Collections.emptyMap());
    }

    @Transactional
    public TaskResponse updateTaskStatus(UUID projectId, UUID taskId, UpdateTaskStatusRequest req, Authentication auth) {
        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Operational project not found: " + projectId));
        checkNotArchived(project, "update task status");

        ProjectTaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        if (!task.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Task does not belong to project " + projectId);
        }

        UserEntity user = getAuthenticatedUser(auth);

        // Authorization: Staff/PM can update any task; Vendor can update ONLY their assigned tasks and must have an ACTIVE assignment
        if ("ROLE_VENDOR".equals(user.getRole())) {
            if (user.getVendorId() == null ||
                    !vendorAssignmentRepository.existsByProjectIdAndVendorIdAndStatus(projectId, user.getVendorId(), "ACTIVE")) {
                throw new AccessDeniedException("Access denied: Active project vendor assignment required to update tasks");
            }
            if (task.getAssignedVendorId() == null || !task.getAssignedVendorId().equals(user.getVendorId())) {
                throw new AccessDeniedException("Access denied: You can only update tasks assigned to your vendor organization");
            }
        } else if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Insufficient privileges to update task status");
        }

        String newStatus = req.getStatus() != null ? req.getStatus().trim().toUpperCase() : null;
        if (!ALLOWED_TASK_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("Invalid task status: " + req.getStatus() + ". Allowed: " + ALLOWED_TASK_STATUSES);
        }

        task.setStatus(newStatus);
        if ("DONE".equals(newStatus)) {
            task.setCompletedAt(LocalDateTime.now());
        }

        ProjectTaskEntity saved = taskRepository.save(task);

        String phaseName = saved.getPhaseId() != null ? phaseRepository.findById(saved.getPhaseId()).map(ProjectPhaseEntity::getName).orElse(null) : null;
        String milestoneTitle = saved.getMilestoneId() != null ? milestoneRepository.findById(saved.getMilestoneId()).map(ProjectMilestoneEntity::getTitle).orElse(null) : null;
        String vendorName = saved.getAssignedVendorId() != null ? vendorRepository.findById(saved.getAssignedVendorId()).map(VendorEntity::getBusinessName).orElse(null) : null;

        return toTaskResponse(saved,
                phaseName != null ? Map.of(saved.getPhaseId(), phaseName) : Collections.emptyMap(),
                milestoneTitle != null ? Map.of(saved.getMilestoneId(), milestoneTitle) : Collections.emptyMap(),
                vendorName != null ? Map.of(saved.getAssignedVendorId(), vendorName) : Collections.emptyMap());
    }
}
