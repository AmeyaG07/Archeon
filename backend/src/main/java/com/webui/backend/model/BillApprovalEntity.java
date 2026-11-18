package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bill_approvals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillApprovalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String billId;

    private String invoiceNumber;

    @Builder.Default
    private String billType = "VENDOR_TO_STUDIO"; // STUDIO_TO_CLIENT, VENDOR_TO_STUDIO, CLIENT_DIRECT_VENDOR, PASS_THROUGH

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Builder.Default
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Builder.Default
    private boolean disputed = false;

    private String disputeReason;

    private String paymentProofUrl;

    private String paymentProofUtr;

    @Column(nullable = false)
    private String currency; // "INR"

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private String projectId;

    @Column(nullable = false)
    private String initiatorId; // Maker (Creator of the bill)

    private String primaryApproverId; // Checker 1

    private LocalDateTime primaryApprovedAt;

    private String secondaryApproverId; // Checker 2 (Required for >= ₹1,00,000)

    private LocalDateTime secondaryApprovedAt;

    @Column(nullable = false)
    private String status; // PENDING_PRIMARY, PENDING_SECONDARY, APPROVED, REJECTED

    private String rejectionReason;

    private boolean isHighValue;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
}
