package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "project_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "phase_id")
    private UUID phaseId;

    @Column(name = "milestone_id")
    private UUID milestoneId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, URGENT

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "TODO"; // TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED

    @Column(name = "assigned_to", length = 100)
    private String assignedTo; // Staff username

    @Column(name = "assigned_vendor_id")
    private UUID assignedVendorId; // Linked vendor for subcontracted tasks

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Version
    @Builder.Default
    @Column(nullable = false)
    private Long version = 0L;
}
