package com.webui.backend.model;

import com.webui.backend.security.crypto.VendorBankDetailsEncryptionConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vendors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "vendor_reference", unique = true, nullable = false)
    private String vendorReference; // e.g. VND-2026-001

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(name = "contact_person", nullable = false)
    private String contactPerson;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String category; // CARPENTRY, ELECTRICAL, CIVIL_WORK, HVAC, PLUMBING, FABRICATION, MASONRY, OTHER

    private String location;

    private String gstin;

    private String pan;

    @Convert(converter = VendorBankDetailsEncryptionConverter.class)
    @Column(name = "bank_details_json", columnDefinition = "TEXT")
    private String bankDetailsJson;

    @Builder.Default
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED

    @Builder.Default
    @Column(name = "portal_access", nullable = false)
    private String portalAccess = "NOT_INVITED"; // NOT_INVITED, INVITATION_PENDING, ACTIVE, SUSPENDED

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
