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
@Table(name = "payment_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String billId;

    @Column(nullable = false)
    private String payerId;

    @Column(nullable = false)
    private String payeeId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency = "INR";

    @Column(nullable = false)
    private String paymentMode; // UPI, NEFT_RTGS, CHEQUE, CASH, OTHER

    private String transactionReference; // UTR or Cheque No

    private LocalDateTime paymentDate;

    private String proofAttachmentUrl;

    @Column(nullable = false)
    private String settlementStatus; // SUBMITTED_FOR_VERIFICATION, VERIFIED_PAID, REJECTED_MISMATCH, REVERSED

    private String verifiedBy;

    private LocalDateTime verifiedAt;

    private String verificationNotes;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
