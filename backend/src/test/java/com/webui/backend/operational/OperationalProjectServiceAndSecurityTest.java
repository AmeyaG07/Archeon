package com.webui.backend.operational;

import com.webui.backend.dto.operational.OperationalProjectDto.*;
import com.webui.backend.model.*;
import com.webui.backend.repository.*;
import com.webui.backend.service.OperationalProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public class OperationalProjectServiceAndSecurityTest {

    @Autowired
    private OperationalProjectService projectService;

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
    private ProjectRepository portfolioProjectRepository;

    private ClientEntity testClientA;
    private ClientEntity testClientB;
    private VendorEntity testVendorA;
    private VendorEntity testVendorB;

    private UserEntity userClientA;
    private UserEntity userClientB;
    private UserEntity userVendorA;
    private UserEntity userVendorB;
    private UserEntity userStaff;
    private UserEntity userAdmin;

    private Authentication authAdmin;
    private Authentication authStaff;
    private Authentication authClientA;
    private Authentication authClientB;
    private Authentication authVendorA;
    private Authentication authVendorB;

    @BeforeEach
    public void setUp() {
        // Clear sub-entities and operational projects for test isolation
        taskRepository.deleteAll();
        milestoneRepository.deleteAll();
        phaseRepository.deleteAll();
        vendorAssignmentRepository.deleteAll();
        projectRepository.deleteAll();

        // Selective clean of test-specific entities
        userRepository.findByUsername("op_user_client_a").ifPresent(userRepository::delete);
        userRepository.findByUsername("op_user_client_b").ifPresent(userRepository::delete);
        userRepository.findByUsername("op_user_vendor_a").ifPresent(userRepository::delete);
        userRepository.findByUsername("op_user_vendor_b").ifPresent(userRepository::delete);
        userRepository.findByUsername("op_user_staff").ifPresent(userRepository::delete);

        clientRepository.findByClientReference("CLI-TEST-OP-A").ifPresent(clientRepository::delete);
        clientRepository.findByClientReference("CLI-TEST-OP-B").ifPresent(clientRepository::delete);
        vendorRepository.findByVendorReference("VEN-TEST-OP-A").ifPresent(vendorRepository::delete);
        vendorRepository.findByVendorReference("VEN-TEST-OP-B").ifPresent(vendorRepository::delete);

        // Create Test Clients
        testClientA = clientRepository.save(ClientEntity.builder()
                .clientReference("CLI-TEST-OP-A")
                .fullName("Entity Client Alpha")
                .email("client.alpha@test-archeon.local")
                .phone("+919800000001")
                .status("ACTIVE")
                .build());

        testClientB = clientRepository.save(ClientEntity.builder()
                .clientReference("CLI-TEST-OP-B")
                .fullName("Entity Client Beta")
                .email("client.beta@test-archeon.local")
                .phone("+919800000002")
                .status("ACTIVE")
                .build());

        // Create Test Vendors
        testVendorA = vendorRepository.save(VendorEntity.builder()
                .vendorReference("VEN-TEST-OP-A")
                .businessName("Fabricator Alpha Works")
                .contactPerson("Master Artisan Alpha")
                .email("vendor.alpha@test-archeon.local")
                .phone("+919800000003")
                .category("CARPENTRY")
                .status("ACTIVE")
                .build());

        testVendorB = vendorRepository.save(VendorEntity.builder()
                .vendorReference("VEN-TEST-OP-B")
                .businessName("Civil Contractor Beta")
                .contactPerson("Master Builder Beta")
                .email("vendor.beta@test-archeon.local")
                .phone("+919800000004")
                .category("CIVIL_WORK")
                .status("ACTIVE")
                .build());

        // Create Test Users
        userClientA = userRepository.save(UserEntity.builder()
                .username("op_user_client_a")
                .password("$2a$10$dummyHashAlphaClient")
                .role("ROLE_CLIENT")
                .clientId(testClientA.getId())
                .enabled(true)
                .status("ACTIVE")
                .build());

        userClientB = userRepository.save(UserEntity.builder()
                .username("op_user_client_b")
                .password("$2a$10$dummyHashBetaClient")
                .role("ROLE_CLIENT")
                .clientId(testClientB.getId())
                .enabled(true)
                .status("ACTIVE")
                .build());

        userVendorA = userRepository.save(UserEntity.builder()
                .username("op_user_vendor_a")
                .password("$2a$10$dummyHashAlphaVendor")
                .role("ROLE_VENDOR")
                .vendorId(testVendorA.getId())
                .enabled(true)
                .status("ACTIVE")
                .build());

        userVendorB = userRepository.save(UserEntity.builder()
                .username("op_user_vendor_b")
                .password("$2a$10$dummyHashBetaVendor")
                .role("ROLE_VENDOR")
                .vendorId(testVendorB.getId())
                .enabled(true)
                .status("ACTIVE")
                .build());

        userStaff = userRepository.save(UserEntity.builder()
                .username("op_user_staff")
                .password("$2a$10$dummyHashStaff")
                .role("ROLE_STAFF")
                .enabled(true)
                .status("ACTIVE")
                .build());

        authAdmin = new UsernamePasswordAuthenticationToken(
                "admin_mandar", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        authStaff = new UsernamePasswordAuthenticationToken(
                "op_user_staff", null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        authClientA = new UsernamePasswordAuthenticationToken(
                "op_user_client_a", null, List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));
        authClientB = new UsernamePasswordAuthenticationToken(
                "op_user_client_b", null, List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));
        authVendorA = new UsernamePasswordAuthenticationToken(
                "op_user_vendor_a", null, List.of(new SimpleGrantedAuthority("ROLE_VENDOR")));
        authVendorB = new UsernamePasswordAuthenticationToken(
                "op_user_vendor_b", null, List.of(new SimpleGrantedAuthority("ROLE_VENDOR")));
    }

    // ==========================================
    // 1. Operational Project Creation & Lifecycle
    // ==========================================

    @Test
    public void testCreateOperationalProjectAndSummary() {
        CreateOperationalProjectRequest req = CreateOperationalProjectRequest.builder()
                .projectReference("OPR-2026-TEST01")
                .name("Villa Solitude Pavilion")
                .description("Bespoke residential architectural execution in Lonavala")
                .projectType("RESIDENTIAL_ARCHITECTURE")
                .clientId(testClientA.getId())
                .projectManagerUsername("op_user_staff")
                .siteAddress("Survey No. 44, Lonavala Hills")
                .contractValue(new BigDecimal("12500000.00"))
                .budgetAllocated(new BigDecimal("10000000.00"))
                .startDate(LocalDate.now())
                .expectedCompletionDate(LocalDate.now().plusMonths(12))
                .build();

        OperationalProjectResponse response = projectService.createProject(req, authStaff);

        assertNotNull(response.getId());
        assertEquals("OPR-2026-TEST01", response.getProjectReference());
        assertEquals("Villa Solitude Pavilion", response.getName());
        assertEquals(testClientA.getId(), response.getClientId());
        assertEquals("Entity Client Alpha", response.getClientName());
        assertEquals("PLANNING", response.getStatus());
        assertEquals(0, response.getProgressPercentage());
        assertEquals(new BigDecimal("12500000.00"), response.getContractValue());
    }

    @Test
    public void testClientCannotCreateProject() {
        CreateOperationalProjectRequest req = CreateOperationalProjectRequest.builder()
                .name("Unauthorized Client Project")
                .projectType("RESIDENTIAL_ARCHITECTURE")
                .clientId(testClientA.getId())
                .build();

        assertThrows(AccessDeniedException.class, () -> projectService.createProject(req, authClientA));
    }

    // ==========================================
    // 2. Client BOLA Tenant Isolation
    // ==========================================

    @Test
    public void testClientBOLAIsolation() {
        // Create project for Client A
        OperationalProjectResponse projA = projectService.createProject(CreateOperationalProjectRequest.builder()
                .name("Client A Luxury Estate")
                .projectType("RESIDENTIAL_ARCHITECTURE")
                .clientId(testClientA.getId())
                .build(), authStaff);

        // 1. Client A can view Project A
        OperationalProjectResponse viewedByA = projectService.getProjectById(projA.getId(), authClientA);
        assertEquals(projA.getId(), viewedByA.getId());

        // 2. Client B CANNOT view Project A
        assertThrows(AccessDeniedException.class, () ->
                projectService.getProjectById(projA.getId(), authClientB));

        // 3. Client B listing projects does not see Project A
        List<OperationalProjectSummaryResponse> clientBProjects = projectService.listProjects(authClientB, null);
        assertTrue(clientBProjects.stream().noneMatch(p -> p.getId().equals(projA.getId())));
    }

    // ==========================================
    // 3. Vendor Assignment & Scoped Visibility
    // ==========================================

    @Test
    public void testVendorAssignmentAndScopedVisibility() {
        OperationalProjectResponse proj = projectService.createProject(CreateOperationalProjectRequest.builder()
                .name("Turnkey Commercial Studio")
                .projectType("COMMERCIAL_INTERIOR")
                .clientId(testClientA.getId())
                .contractValue(new BigDecimal("5000000.00"))
                .build(), authStaff);

        // Before assignment: Vendor A cannot access project
        assertThrows(AccessDeniedException.class, () ->
                projectService.getProjectById(proj.getId(), authVendorA));

        // Assign Vendor A to project
        AssignVendorRequest assignReq = AssignVendorRequest.builder()
                .vendorId(testVendorA.getId())
                .scopeOfWork("Custom Oak Millwork and Acoustic Paneling")
                .contractAmount(new BigDecimal("1500000.00"))
                .notes("Phase 1 fabrication")
                .build();

        VendorAssignmentResponse assignment = projectService.assignVendor(proj.getId(), assignReq, authStaff);
        assertNotNull(assignment.getId());
        assertEquals("ACTIVE", assignment.getStatus());
        assertEquals("Fabricator Alpha Works", assignment.getVendorBusinessName());

        // After assignment: Vendor A CAN access project
        OperationalProjectResponse vendorView = projectService.getProjectById(proj.getId(), authVendorA);
        assertEquals(proj.getId(), vendorView.getId());

        // Invariant: Overall project contract value is masked/null for vendor
        assertNull(vendorView.getContractValue());

        // Invariant: Unassigned Vendor B still CANNOT access project
        assertThrows(AccessDeniedException.class, () ->
                projectService.getProjectById(proj.getId(), authVendorB));
    }

    // ==========================================
    // 4. Project Phases & Milestones
    // ==========================================

    @Test
    public void testProjectPhasesAndMilestonesLifecycle() {
        OperationalProjectResponse proj = projectService.createProject(CreateOperationalProjectRequest.builder()
                .name("Monolithic Cantilever Villa")
                .projectType("RESIDENTIAL_ARCHITECTURE")
                .clientId(testClientA.getId())
                .build(), authStaff);

        // Add Phase 1
        PhaseResponse phase1 = projectService.createPhase(proj.getId(), CreatePhaseRequest.builder()
                .name("CONCEPT_DESIGN")
                .description("Topographical mapping and massing model studies")
                .sequenceOrder(1)
                .startDate(LocalDate.now())
                .expectedCompletionDate(LocalDate.now().plusWeeks(4))
                .build(), authStaff);

        assertEquals("CONCEPT_DESIGN", phase1.getName());
        assertEquals(1, phase1.getSequenceOrder());
        assertEquals("PENDING", phase1.getStatus());

        // Duplicate sequence order should fail
        assertThrows(IllegalArgumentException.class, () ->
                projectService.createPhase(proj.getId(), CreatePhaseRequest.builder()
                        .name("DUPLICATE_ORDER")
                        .sequenceOrder(1)
                        .build(), authStaff));

        // Add Milestone linked to Phase 1
        MilestoneResponse milestone1 = projectService.createMilestone(proj.getId(), CreateMilestoneRequest.builder()
                .phaseId(phase1.getId())
                .title("Client Approval of Massing Concept")
                .description("Client signoff on physical stone block mockup")
                .dueDate(LocalDate.now().plusWeeks(3))
                .responsibleOwner("op_user_staff")
                .billedPercentage(15)
                .build(), authStaff);

        assertEquals("Client Approval of Massing Concept", milestone1.getTitle());
        assertEquals("PENDING", milestone1.getStatus());
        assertEquals(15, milestone1.getBilledPercentage());

        // Update Milestone Status to COMPLETED
        MilestoneResponse updatedMilestone = projectService.updateMilestoneStatus(proj.getId(), milestone1.getId(),
                UpdateMilestoneStatusRequest.builder()
                        .status("COMPLETED")
                        .completionDate(LocalDate.now())
                        .build(), authStaff);

        assertEquals("COMPLETED", updatedMilestone.getStatus());
        assertNotNull(updatedMilestone.getCompletionDate());

        // Complete Phase 1
        PhaseResponse completedPhase = projectService.updatePhaseStatus(proj.getId(), phase1.getId(),
                UpdatePhaseStatusRequest.builder().status("COMPLETED").build(), authStaff);

        assertEquals("COMPLETED", completedPhase.getStatus());
        assertNotNull(completedPhase.getActualCompletionDate());
    }

    // ==========================================
    // 5. Project Tasks & Vendor Scoping
    // ==========================================

    @Test
    public void testProjectTasksAndVendorIsolation() {
        OperationalProjectResponse proj = projectService.createProject(CreateOperationalProjectRequest.builder()
                .name("Brutalist Gallery Pavilions")
                .projectType("COMMERCIAL_INTERIOR")
                .clientId(testClientA.getId())
                .build(), authStaff);

        // Assign Vendor A
        projectService.assignVendor(proj.getId(), AssignVendorRequest.builder()
                .vendorId(testVendorA.getId())
                .scopeOfWork("Display Pedestals")
                .build(), authStaff);

        // Create Task 1 assigned to Vendor A
        TaskResponse task1 = projectService.createTask(proj.getId(), CreateTaskRequest.builder()
                .title("Mill 4 Travertine display plinths")
                .description("Dimension: 600x600x900mm honed finish")
                .priority("HIGH")
                .assignedVendorId(testVendorA.getId())
                .dueDate(LocalDate.now().plusDays(10))
                .build(), authStaff);

        // Create Task 2 internal staff task
        TaskResponse task2 = projectService.createTask(proj.getId(), CreateTaskRequest.builder()
                .title("Review structural lighting layout")
                .priority("MEDIUM")
                .assignedTo("op_user_staff")
                .build(), authStaff);

        // Vendor A listing tasks sees only Task 1 (not Task 2)
        List<TaskResponse> vendorATasks = projectService.listTasks(proj.getId(), authVendorA);
        assertEquals(1, vendorATasks.size());
        assertEquals(task1.getId(), vendorATasks.get(0).getId());

        // Vendor A updates task status to IN_PROGRESS
        TaskResponse inProgress = projectService.updateTaskStatus(proj.getId(), task1.getId(),
                UpdateTaskStatusRequest.builder().status("IN_PROGRESS").build(), authVendorA);
        assertEquals("IN_PROGRESS", inProgress.getStatus());

        // Vendor A completes task
        TaskResponse completed = projectService.updateTaskStatus(proj.getId(), task1.getId(),
                UpdateTaskStatusRequest.builder().status("DONE").build(), authVendorA);
        assertEquals("DONE", completed.getStatus());
        assertNotNull(completed.getCompletedAt());

        // Invariant: Vendor A CANNOT modify Task 2 (internal task)
        assertThrows(AccessDeniedException.class, () ->
                projectService.updateTaskStatus(proj.getId(), task2.getId(),
                        UpdateTaskStatusRequest.builder().status("DONE").build(), authVendorA));
    }

    // ==========================================
    // 6. Project Archival & Status Lifecycle
    // ==========================================

    @Test
    public void testProjectArchivalSoftDelete() {
        OperationalProjectResponse proj = projectService.createProject(CreateOperationalProjectRequest.builder()
                .name("Historic Haveli Restoration")
                .projectType("RENOVATION_HERITAGE")
                .clientId(testClientA.getId())
                .build(), authStaff);

        assertEquals("PLANNING", proj.getStatus());

        // Soft archive instead of destructive delete
        OperationalProjectResponse archived = projectService.archiveProject(proj.getId(), authStaff);
        assertEquals("ARCHIVED", archived.getStatus());

        // Verify project record still exists in database
        OperationalProjectEntity entity = projectRepository.findById(proj.getId()).orElse(null);
        assertNotNull(entity);
        assertEquals("ARCHIVED", entity.getStatus());
    }

    // ==========================================
    // 7. Portfolio Projects Remain Untouched
    // ==========================================

    @Test
    public void testPortfolioProjectsRemainUntouched() {
        // Verify portfolio project table exists and contains portfolio items
        List<ProjectEntity> portfolioProjects = portfolioProjectRepository.findAll();
        assertNotNull(portfolioProjects);
        assertFalse(portfolioProjects.isEmpty());
        assertTrue(portfolioProjects.stream().anyMatch(p -> p.getId().equals("the-monolith-sanctuary")));
    }
}
