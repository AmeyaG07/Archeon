package com.webui.backend.controller;

import com.webui.backend.dto.operational.OperationalProjectDto.*;
import com.webui.backend.service.OperationalProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/operational-projects")
public class OperationalProjectController {

    @Autowired
    private OperationalProjectService projectService;

    // ==========================================
    // 1. Projects
    // ==========================================

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody CreateOperationalProjectRequest req, Authentication auth) {
        try {
            OperationalProjectResponse res = projectService.createProject(req, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listProjects(@RequestParam(required = false) String status, Authentication auth) {
        try {
            List<OperationalProjectSummaryResponse> list = projectService.listProjects(auth, status);
            return ResponseEntity.ok(list);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable UUID id, Authentication auth) {
        try {
            OperationalProjectResponse res = projectService.getProjectById(id, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/ref/{reference}")
    public ResponseEntity<?> getProjectByReference(@PathVariable String reference, Authentication auth) {
        try {
            OperationalProjectResponse res = projectService.getProjectByReference(reference, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(
            @PathVariable UUID id,
            @RequestBody UpdateOperationalProjectRequest req,
            Authentication auth) {
        try {
            OperationalProjectResponse res = projectService.updateProject(id, req, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateProjectStatus(
            @PathVariable UUID id,
            @RequestBody UpdateProjectStatusRequest req,
            Authentication auth) {
        try {
            OperationalProjectResponse res = projectService.updateProjectStatus(id, req, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<?> archiveProject(@PathVariable UUID id, Authentication auth) {
        try {
            OperationalProjectResponse res = projectService.archiveProject(id, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 2. Vendor Assignments
    // ==========================================

    @PostMapping("/{id}/vendors")
    public ResponseEntity<?> assignVendor(
            @PathVariable UUID id,
            @RequestBody AssignVendorRequest req,
            Authentication auth) {
        try {
            VendorAssignmentResponse res = projectService.assignVendor(id, req, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/vendors")
    public ResponseEntity<?> listProjectVendors(@PathVariable UUID id, Authentication auth) {
        try {
            List<VendorAssignmentResponse> list = projectService.listProjectVendors(id, auth);
            return ResponseEntity.ok(list);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/vendors/{vendorId}/status")
    public ResponseEntity<?> updateVendorAssignmentStatus(
            @PathVariable UUID id,
            @PathVariable UUID vendorId,
            @RequestBody UpdateVendorAssignmentStatusRequest req,
            Authentication auth) {
        try {
            VendorAssignmentResponse res = projectService.updateVendorAssignmentStatus(id, vendorId, req, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 3. Phases
    // ==========================================

    @PostMapping("/{id}/phases")
    public ResponseEntity<?> createPhase(
            @PathVariable UUID id,
            @RequestBody CreatePhaseRequest req,
            Authentication auth) {
        try {
            PhaseResponse res = projectService.createPhase(id, req, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/phases")
    public ResponseEntity<?> listPhases(@PathVariable UUID id, Authentication auth) {
        try {
            List<PhaseResponse> list = projectService.listPhases(id, auth);
            return ResponseEntity.ok(list);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/phases/{phaseId}")
    public ResponseEntity<?> updatePhase(
            @PathVariable UUID id,
            @PathVariable UUID phaseId,
            @RequestBody UpdatePhaseRequest req,
            Authentication auth) {
        try {
            PhaseResponse res = projectService.updatePhase(id, phaseId, req, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/phases/{phaseId}/status")
    public ResponseEntity<?> updatePhaseStatus(
            @PathVariable UUID id,
            @PathVariable UUID phaseId,
            @RequestBody UpdatePhaseStatusRequest req,
            Authentication auth) {
        try {
            PhaseResponse res = projectService.updatePhaseStatus(id, phaseId, req, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 4. Milestones
    // ==========================================

    @PostMapping("/{id}/milestones")
    public ResponseEntity<?> createMilestone(
            @PathVariable UUID id,
            @RequestBody CreateMilestoneRequest req,
            Authentication auth) {
        try {
            MilestoneResponse res = projectService.createMilestone(id, req, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/milestones")
    public ResponseEntity<?> listMilestones(@PathVariable UUID id, Authentication auth) {
        try {
            List<MilestoneResponse> list = projectService.listMilestones(id, auth);
            return ResponseEntity.ok(list);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/milestones/{milestoneId}")
    public ResponseEntity<?> updateMilestone(
            @PathVariable UUID id,
            @PathVariable UUID milestoneId,
            @RequestBody UpdateMilestoneRequest req,
            Authentication auth) {
        try {
            MilestoneResponse res = projectService.updateMilestone(id, milestoneId, req, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/milestones/{milestoneId}/status")
    public ResponseEntity<?> updateMilestoneStatus(
            @PathVariable UUID id,
            @PathVariable UUID milestoneId,
            @RequestBody UpdateMilestoneStatusRequest req,
            Authentication auth) {
        try {
            MilestoneResponse res = projectService.updateMilestoneStatus(id, milestoneId, req, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 5. Tasks
    // ==========================================

    @PostMapping("/{id}/tasks")
    public ResponseEntity<?> createTask(
            @PathVariable UUID id,
            @RequestBody CreateTaskRequest req,
            Authentication auth) {
        try {
            TaskResponse res = projectService.createTask(id, req, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<?> listTasks(@PathVariable UUID id, Authentication auth) {
        try {
            List<TaskResponse> list = projectService.listTasks(id, auth);
            return ResponseEntity.ok(list);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/tasks/{taskId}")
    public ResponseEntity<?> updateTask(
            @PathVariable UUID id,
            @PathVariable UUID taskId,
            @RequestBody UpdateTaskRequest req,
            Authentication auth) {
        try {
            TaskResponse res = projectService.updateTask(id, taskId, req, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/tasks/{taskId}/status")
    public ResponseEntity<?> updateTaskStatus(
            @PathVariable UUID id,
            @PathVariable UUID taskId,
            @RequestBody UpdateTaskStatusRequest req,
            Authentication auth) {
        try {
            TaskResponse res = projectService.updateTaskStatus(id, taskId, req, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
