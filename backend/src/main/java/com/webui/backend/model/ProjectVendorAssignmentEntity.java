package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "project_vendor_assignments", uniqueConstraints = {
        @UniqueConstraint(name = "uq_project_vendor", columnNames = {"project_id", "vendor_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectVendorAssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "vendor_id", nullable = false)
    private UUID vendorId;

    @Column(name = "scope_of_work", nullable = false)
    private String scopeOfWork;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "ACTIVE"; // ACTIVE, COMPLETED, TERMINATED

    @Column(name = "contract_amount", precision = 15, scale = 2)
    private BigDecimal contractAmount;

    @Column(name = "assigned_by", nullable = false, length = 50)
    private String assignedBy;

    @Builder.Default
    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Version
    @Builder.Default
    @Column(nullable = false)
    private Long version = 0L;
}
