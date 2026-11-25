package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "architect_ledger_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArchitectLedgerEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "entry_type", nullable = false, length = 16)
    private String entryType; // REVENUE | EXPENSE

    @Column(name = "source_type", nullable = false, length = 16)
    private String sourceType; // CLIENT | VENDOR | DIRECT

    @Column(name = "source_id", length = 128)
    private String sourceId;

    @Column(name = "source_name", length = 255)
    private String sourceName;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "payment_mode", length = 32)
    private String paymentMode; // BANK_TRANSFER | UPI | CASH | CHEQUE

    @Column(length = 100)
    private String category;

    @Column(name = "reference_number", length = 128)
    private String referenceNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "recorded_by", length = 100)
    private String recordedBy;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
