package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "operational_projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationalProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "project_reference", nullable = false, unique = true, length = 64)
    private String projectReference;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "project_type", nullable = false, length = 64)
    private String projectType; // RESIDENTIAL_ARCHITECTURE, COMMERCIAL_INTERIOR, LANDSCAPE_DESIGN, TURNKEY_EXECUTION

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "project_manager_username", length = 50)
    private String projectManagerUsername;

    @Column(name = "site_address")
    private String siteAddress;

    @Column(name = "contract_value", precision = 15, scale = 2)
    private BigDecimal contractValue;

    @Column(name = "budget_allocated", precision = 15, scale = 2)
    private BigDecimal budgetAllocated;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "PLANNING"; // PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, ARCHIVED

    @Builder.Default
    @Column(name = "progress_percentage", nullable = false)
    private Integer progressPercentage = 0;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "expected_completion_date")
    private LocalDate expectedCompletionDate;

    @Column(name = "actual_completion_date")
    private LocalDate actualCompletionDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Builder.Default
    @Column(nullable = false)
    private Long version = 0L;
}
