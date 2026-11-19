package com.webui.backend.dto.operational;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class OperationalProjectDto {

    // ==========================================
    // Project DTOs
    // ==========================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateOperationalProjectRequest {
        private String projectReference;
        private String name;
        private String description;
        private String projectType; // RESIDENTIAL_ARCHITECTURE, COMMERCIAL_INTERIOR, LANDSCAPE_DESIGN, TURNKEY_EXECUTION
        private UUID clientId;
        private String projectManagerUsername;
        private String siteAddress;
        private BigDecimal contractValue;
        private BigDecimal budgetAllocated;
        private LocalDate startDate;
        private LocalDate expectedCompletionDate;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateOperationalProjectRequest {
        private String name;
        private String description;
        private String projectType;
        private String projectManagerUsername;
        private String siteAddress;
        private BigDecimal contractValue;
        private BigDecimal budgetAllocated;
        private Integer progressPercentage;
        private LocalDate startDate;
        private LocalDate expectedCompletionDate;
        private LocalDate actualCompletionDate;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateProjectStatusRequest {
        private String status; // PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, ARCHIVED
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OperationalProjectResponse {
        private UUID id;
        private String projectReference;
        private String name;
        private String description;
        private String projectType;
        private UUID clientId;
        private String clientReference;
        private String clientName;
        private String projectManagerUsername;
        private String siteAddress;
        private BigDecimal contractValue;
        private BigDecimal budgetAllocated;
        private String status;
        private Integer progressPercentage;
        private LocalDate startDate;
        private LocalDate expectedCompletionDate;
        private LocalDate actualCompletionDate;
        private String notes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long version;

        // Nested lists for comprehensive view
        private List<VendorAssignmentResponse> assignedVendors;
        private List<PhaseResponse> phases;
        private List<MilestoneResponse> milestones;
        private List<TaskResponse> tasks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OperationalProjectSummaryResponse {
        private UUID id;
        private String projectReference;
        private String name;
        private String projectType;
        private UUID clientId;
        private String clientReference;
        private String clientName;
        private String projectManagerUsername;
        private String status;
        private Integer progressPercentage;
        private LocalDate startDate;
        private LocalDate expectedCompletionDate;
        private BigDecimal contractValue;
        private Long version;
    }

    // ==========================================
    // Vendor Assignment DTOs
    // ==========================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignVendorRequest {
        private UUID vendorId;
        private String scopeOfWork;
        private BigDecimal contractAmount;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateVendorAssignmentStatusRequest {
        private String status; // ACTIVE, COMPLETED, TERMINATED
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VendorAssignmentResponse {
        private UUID id;
        private UUID projectId;
        private String projectReference;
        private UUID vendorId;
        private String vendorReference;
        private String vendorBusinessName;
        private String vendorCategory;
        private String scopeOfWork;
        private String status;
        private BigDecimal contractAmount;
        private String assignedBy;
        private LocalDateTime assignedAt;
        private LocalDateTime completedAt;
        private String notes;
        private Long version;
    }

    // ==========================================
    // Phase DTOs
    // ==========================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreatePhaseRequest {
        private String name;
        private String description;
        private Integer sequenceOrder;
        private LocalDate startDate;
        private LocalDate expectedCompletionDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdatePhaseRequest {
        private String name;
        private String description;
        private Integer sequenceOrder;
        private LocalDate startDate;
        private LocalDate expectedCompletionDate;
        private LocalDate actualCompletionDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdatePhaseStatusRequest {
        private String status; // PENDING, IN_PROGRESS, COMPLETED
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PhaseResponse {
        private UUID id;
        private UUID projectId;
        private String name;
        private String description;
        private Integer sequenceOrder;
        private String status;
        private LocalDate startDate;
        private LocalDate expectedCompletionDate;
        private LocalDate actualCompletionDate;
        private Long version;
    }

    // ==========================================
    // Milestone DTOs
    // ==========================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateMilestoneRequest {
        private UUID phaseId;
        private String title;
        private String description;
        private LocalDate dueDate;
        private String responsibleOwner;
        @Min(value = 0, message = "Billed percentage cannot be negative")
        @Max(value = 100, message = "Billed percentage cannot exceed 100")
        private Integer billedPercentage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateMilestoneRequest {
        private UUID phaseId;
        private String title;
        private String description;
        private LocalDate dueDate;
        private LocalDate completionDate;
        private String responsibleOwner;
        @Min(value = 0, message = "Billed percentage cannot be negative")
        @Max(value = 100, message = "Billed percentage cannot exceed 100")
        private Integer billedPercentage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateMilestoneStatusRequest {
        private String status; // PENDING, IN_PROGRESS, COMPLETED, DELAYED
        private LocalDate completionDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MilestoneResponse {
        private UUID id;
        private UUID projectId;
        private UUID phaseId;
        private String phaseName;
        private String title;
        private String description;
        private LocalDate dueDate;
        private LocalDate completionDate;
        private String status;
        private String responsibleOwner;
        private Integer billedPercentage;
        private LocalDateTime createdAt;
        private Long version;
    }

    // ==========================================
    // Task DTOs
    // ==========================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateTaskRequest {
        private UUID phaseId;
        private UUID milestoneId;
        private String title;
        private String description;
        private String priority; // LOW, MEDIUM, HIGH, URGENT
        private String assignedTo;
        private UUID assignedVendorId;
        private LocalDate dueDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateTaskRequest {
        private UUID phaseId;
        private UUID milestoneId;
        private String title;
        private String description;
        private String priority;
        private String assignedTo;
        private UUID assignedVendorId;
        private LocalDate dueDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateTaskStatusRequest {
        private String status; // TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskResponse {
        private UUID id;
        private UUID projectId;
        private UUID phaseId;
        private String phaseName;
        private UUID milestoneId;
        private String milestoneTitle;
        private String title;
        private String description;
        private String priority;
        private String status;
        private String assignedTo;
        private UUID assignedVendorId;
        private String assignedVendorName;
        private LocalDate dueDate;
        private LocalDateTime completedAt;
        private String createdBy;
        private LocalDateTime createdAt;
        private Long version;
    }
}
