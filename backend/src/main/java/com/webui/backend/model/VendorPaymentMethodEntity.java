package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vendor_payment_methods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorPaymentMethodEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "vendor_id", nullable = false, unique = true)
    private UUID vendorId;

    @Column(name = "account_holder_name")
    private String accountHolderName;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_number", length = 100)
    private String accountNumber;

    @Column(name = "ifsc_code", length = 50)
    private String ifscCode;

    @Column(name = "upi_id", length = 100)
    private String upiId;

    @Column(name = "qr_code_url", columnDefinition = "TEXT")
    private String qrCodeUrl;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
