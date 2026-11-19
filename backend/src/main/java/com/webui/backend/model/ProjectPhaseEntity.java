package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "project_phases", uniqueConstraints = {
        @UniqueConstraint(name = "uq_project_phase_order", columnNames = {"project_id", "sequence_order"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectPhaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false, length = 100)
    private String name; // e.g. CONCEPT_DESIGN, SCHEMATIC_DESIGN, DESIGN_DEVELOPMENT, CONSTRUCTION_DOCS, EXECUTION, HANDOVER

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "expected_completion_date")
    private LocalDate expectedCompletionDate;

    @Column(name = "actual_completion_date")
    private LocalDate actualCompletionDate;

    @Version
    @Builder.Default
    @Column(nullable = false)
    private Long version = 0L;
}
