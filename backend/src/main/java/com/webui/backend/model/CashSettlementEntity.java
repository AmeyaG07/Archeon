package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cash_settlement_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashSettlementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String settlementRef; // e.g. CSH-SETTLE-409

    @Column(nullable = false)
    private String billId;

    @Column(nullable = false)
    private String projectId;

    @Column(nullable = false)
    private String initiatorId;

    @Column(nullable = false)
    private String counterpartyId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency = "INR";

    private String sitePurpose; // e.g. Unloading raw granite on site

    private String receiptReference;

    @Column(nullable = false)
    private String counterpartyStatus; // PENDING_COUNTERPARTY_ACK, ACKNOWLEDGED, REJECTED_CONTESTED

    private LocalDateTime counterpartyRespondedAt;

    private String counterpartyNotes;

    @Column(nullable = false)
    private String financeApprovalStatus; // PENDING_FINANCE_REVIEW, SETTLED_VERIFIED, REJECTED_BY_FINANCE

    private String financeApproverId;

    private LocalDateTime financeApprovedAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
