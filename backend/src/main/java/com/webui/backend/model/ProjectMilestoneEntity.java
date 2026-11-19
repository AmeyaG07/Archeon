package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "project_milestones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMilestoneEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "phase_id")
    private UUID phaseId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED, DELAYED

    @Column(name = "responsible_owner", length = 100)
    private String responsibleOwner;

    @Builder.Default
    @Column(name = "billed_percentage", nullable = false)
    private Integer billedPercentage = 0;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Version
    @Builder.Default
    @Column(nullable = false)
    private Long version = 0L;
}
