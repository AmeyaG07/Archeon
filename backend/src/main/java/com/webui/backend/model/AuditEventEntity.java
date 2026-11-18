package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String actorId;

    @Column(nullable = false)
    private String actorRole;

    @Column(nullable = false)
    private String action; // e.g. "BILL_CREATED", "PRIMARY_APPROVAL", "SECONDARY_APPROVAL", "BILL_REJECTED", "SPLIT_WARNING"

    @Column(nullable = false)
    private String entityName; // e.g. "Bill", "PaymentTransaction", "CashSettlement"

    @Column(nullable = false)
    private String entityId;

    @Column(columnDefinition = "TEXT")
    private String detailsJson;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
