package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInvitationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String email;

    @Column(name = "target_role", nullable = false)
    private String targetRole; // e.g. ROLE_CLIENT, ROLE_VENDOR, ROLE_STAFF

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "vendor_id")
    private UUID vendorId;

    @Column(name = "token_hash", unique = true, nullable = false, length = 64)
    private String tokenHash;

    @Builder.Default
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, ACCEPTED, EXPIRED, REVOKED

    @Column(name = "invited_by", nullable = false)
    private String invitedBy;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Version
    @Builder.Default
    @Column(nullable = false)
    private Long version = 0L;
}
