package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    private String role; // e.g. "ROLE_ADMIN", "ROLE_USER", "ROLE_CLIENT", "ROLE_VENDOR"

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    @Builder.Default
    @Column(name = "token_version", nullable = false)
    private Long tokenVersion = 0L;

    @Column(name = "full_name")
    private String fullName;

    @Column(unique = true)
    private String email;

    private String phone;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "vendor_id")
    private UUID vendorId;

    @Builder.Default
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, SUSPENDED, PENDING_INVITE

    @Column(name = "invited_at")
    private LocalDateTime invitedAt;

    @Column(name = "invited_by")
    private String invitedBy;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Version
    @Builder.Default
    @Column(nullable = false)
    private Long version = 0L;
}
