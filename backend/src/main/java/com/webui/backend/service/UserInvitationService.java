package com.webui.backend.service;

import com.webui.backend.dto.identity.InvitationDto.*;
import com.webui.backend.dto.identity.UserDto.UserSummaryResponse;
import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.model.UserInvitationEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.ClientRepository;
import com.webui.backend.repository.UserInvitationRepository;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.repository.VendorRepository;
import com.webui.backend.security.TokenHashUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserInvitationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final Set<String> ALLOWED_ROLES = Set.of(
            "ROLE_ADMIN", "ROLE_STAFF", "ROLE_FINANCE_MAKER", "ROLE_FINANCE_CHECKER",
            "ROLE_FINANCE_CHECKER_1", "ROLE_FINANCE_CHECKER_2", "ROLE_FINANCE_MANAGER",
            "ROLE_FINANCE_LEAD", "ROLE_FINANCE_AUDIT", "ROLE_SITE_SUPERVISOR",
            "ROLE_CLIENT", "ROLE_VENDOR"
    );

    @Autowired
    private UserInvitationRepository invitationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private boolean isInternalStaff(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return false;
        return authorities.stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("ROLE_STAFF") ||
                a.getAuthority().startsWith("ROLE_FINANCE_"));
    }

    private boolean isAdmin(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return false;
        return authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private InvitationResponse toResponse(UserInvitationEntity entity, String rawToken) {
        return InvitationResponse.builder()
                .invitationId(entity.getId())
                .email(entity.getEmail())
                .targetRole(entity.getTargetRole())
                .clientId(entity.getClientId())
                .vendorId(entity.getVendorId())
                .rawToken(rawToken)
                .invitationUrl("/auth/accept-invitation?token=" + rawToken)
                .status(entity.getStatus())
                .expiresAt(entity.getExpiresAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    @Transactional
    public InvitationResponse createInvitation(InviteUserRequest req, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can issue user invitations");
        }

        if (!StringUtils.hasText(req.getEmail())) {
            throw new IllegalArgumentException("Email is mandatory for invitation");
        }
        if (!StringUtils.hasText(req.getTargetRole())) {
            throw new IllegalArgumentException("Target role is mandatory for invitation");
        }

        String targetRole = req.getTargetRole().trim().toUpperCase();
        if (!targetRole.startsWith("ROLE_")) {
            targetRole = "ROLE_" + targetRole;
        }

        if (!ALLOWED_ROLES.contains(targetRole)) {
            throw new IllegalArgumentException("Invalid role specified: " + targetRole);
        }

        // Privileged role invariant: only ROLE_ADMIN can invite another ROLE_ADMIN or finance manager
        if (("ROLE_ADMIN".equals(targetRole) || targetRole.startsWith("ROLE_FINANCE_")) && !isAdmin(auth.getAuthorities())) {
            throw new AccessDeniedException("Only a studio administrator can invite users with administrative or finance roles");
        }

        String email = req.getEmail().trim().toLowerCase();

        // Check if active user already exists with this email
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An active user account is already registered with email: " + email);
        }

        // Revoke any previous pending invitations for this email
        List<UserInvitationEntity> existingInvites = invitationRepository.findByEmail(email);
        for (UserInvitationEntity existing : existingInvites) {
            if ("PENDING".equals(existing.getStatus())) {
                existing.setStatus("REVOKED");
                invitationRepository.save(existing);
            }
        }

        String rawToken = generateSecureToken();
        String tokenHash = TokenHashUtil.hashToken(rawToken);

        UserInvitationEntity invitation = UserInvitationEntity.builder()
                .email(email)
                .targetRole(targetRole)
                .clientId(req.getClientId())
                .vendorId(req.getVendorId())
                .tokenHash(tokenHash)
                .status("PENDING")
                .invitedBy(auth.getName())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .createdAt(LocalDateTime.now())
                .build();

        UserInvitationEntity saved = invitationRepository.save(invitation);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("INVITATION_CREATED")
                .entityName("UserInvitation")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"email\": \"%s\", \"role\": \"%s\"}", email, targetRole))
                .build());

        return toResponse(saved, rawToken);
    }

    @Transactional
    public UserSummaryResponse acceptInvitation(AcceptInvitationRequest req) {
        if (!StringUtils.hasText(req.getToken())) {
            throw new IllegalArgumentException("Invitation token is required");
        }
        if (!StringUtils.hasText(req.getUsername())) {
            throw new IllegalArgumentException("Username is required");
        }
        if (!StringUtils.hasText(req.getPassword()) || req.getPassword().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }

        String tokenHash = TokenHashUtil.hashToken(req.getToken().trim());
        UserInvitationEntity invitation = invitationRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or unrecognized invitation token"));

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new IllegalStateException("Invitation is no longer active. Status: " + invitation.getStatus());
        }

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus("EXPIRED");
            invitationRepository.save(invitation);
            throw new IllegalStateException("Invitation token has expired. Please request a new invitation from studio administration.");
        }

        String username = req.getUsername().trim();
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken: " + username);
        }

        // Create user account
        UserEntity user = UserEntity.builder()
                .username(username)
                .password(passwordEncoder.encode(req.getPassword()))
                .role(invitation.getTargetRole())
                .email(invitation.getEmail())
                .fullName(req.getFullName() != null ? req.getFullName().trim() : null)
                .phone(req.getPhone() != null ? req.getPhone().trim() : null)
                .clientId(invitation.getClientId())
                .vendorId(invitation.getVendorId())
                .status("ACTIVE")
                .enabled(true)
                .tokenVersion(0L)
                .invitedAt(invitation.getCreatedAt())
                .invitedBy(invitation.getInvitedBy())
                .build();

        UserEntity savedUser = userRepository.save(user);

        // Mark invitation accepted
        invitation.setStatus("ACCEPTED");
        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        // Activate portal access on linked client or vendor
        if (invitation.getClientId() != null) {
            clientRepository.findById(invitation.getClientId()).ifPresent(c -> {
                c.setPortalAccess("ACTIVE");
                c.setUpdatedAt(LocalDateTime.now());
                clientRepository.save(c);
            });
        }
        if (invitation.getVendorId() != null) {
            vendorRepository.findById(invitation.getVendorId()).ifPresent(v -> {
                v.setPortalAccess("ACTIVE");
                v.setUpdatedAt(LocalDateTime.now());
                vendorRepository.save(v);
            });
        }

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(username)
                .actorRole(invitation.getTargetRole())
                .action("INVITATION_ACCEPTED")
                .entityName("User")
                .entityId(savedUser.getId().toString())
                .detailsJson(String.format("{\"username\": \"%s\", \"email\": \"%s\", \"role\": \"%s\"}",
                        username, invitation.getEmail(), invitation.getTargetRole()))
                .build());

        return UserSummaryResponse.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .role(savedUser.getRole())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .clientId(savedUser.getClientId())
                .vendorId(savedUser.getVendorId())
                .status(savedUser.getStatus())
                .enabled(savedUser.isEnabled())
                .tokenVersion(savedUser.getTokenVersion())
                .version(savedUser.getVersion())
                .build();
    }

    @Transactional
    public void revokeInvitation(UUID invitationId, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can revoke invitations");
        }

        UserInvitationEntity invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found: " + invitationId));

        invitation.setStatus("REVOKED");
        invitationRepository.save(invitation);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("INVITATION_REVOKED")
                .entityName("UserInvitation")
                .entityId(invitationId.toString())
                .detailsJson(String.format("{\"email\": \"%s\"}", invitation.getEmail()))
                .build());
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> listPendingInvitations(Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can view invitations");
        }
        return invitationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(inv -> toResponse(inv, null))
                .collect(Collectors.toList());
    }
}
