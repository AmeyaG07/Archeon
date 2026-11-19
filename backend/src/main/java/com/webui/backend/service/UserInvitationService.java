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
import com.webui.backend.service.email.EmailDeliveryService;
import com.webui.backend.service.email.EmailDispatchResult;
import com.webui.backend.service.email.InvitationEmailPayload;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
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

    @Autowired
    private EmailDeliveryService emailDeliveryService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private TransactionTemplate transactionTemplate;

    @PostConstruct
    public void init() {
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Value("${app.portal.base-url:http://localhost:3000}")
    private String portalBaseUrl;

    @Getter
    @AllArgsConstructor
    private static class PersistedInvitationState {
        private final UserInvitationEntity entity;
        private final String rawToken;
        private final String recipientName;
        private final String deliveryMethod;
        private final String absoluteUrl;
    }

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

    private String resolveRecipientName(String explicitName, UUID clientId, UUID vendorId, String email) {
        if (StringUtils.hasText(explicitName)) {
            return explicitName.trim();
        }
        if (clientId != null) {
            Optional<ClientEntity> client = clientRepository.findById(clientId);
            if (client.isPresent() && StringUtils.hasText(client.get().getFullName())) {
                return client.get().getFullName().trim();
            }
        }
        if (vendorId != null) {
            Optional<VendorEntity> vendor = vendorRepository.findById(vendorId);
            if (vendor.isPresent() && StringUtils.hasText(vendor.get().getBusinessName())) {
                return vendor.get().getBusinessName().trim();
            }
        }
        if (StringUtils.hasText(email) && email.contains("@")) {
            return email.split("@")[0];
        }
        return "Valued Partner";
    }

    private InvitationResponse toResponse(
            UserInvitationEntity entity,
            String rawToken,
            String recipientName,
            String deliveryMethod,
            String emailDeliveryStatus,
            String emailMessageId
    ) {
        String relativeUrl = rawToken != null ? "/auth/accept-invitation?token=" + rawToken : null;
        String absoluteUrl = null;
        String snippet = null;

        if (rawToken != null) {
            String base = (portalBaseUrl != null && !portalBaseUrl.isBlank())
                    ? portalBaseUrl.replaceAll("/+$", "")
                    : "http://localhost:3000";
            absoluteUrl = base + relativeUrl;
            String expiryFormatted = entity.getExpiresAt() != null
                    ? entity.getExpiresAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm 'IST'"))
                    : "7 days from issuance";

            snippet = String.format(
                    "ArcheOn Design Studio Invitation Link:\n"
                            + "Recipient: %s (%s)\n"
                            + "Role: %s\n"
                            + "Activation URL: %s\n"
                            + "Expires: %s (Single-use token)",
                    recipientName != null ? recipientName : entity.getEmail(),
                    entity.getEmail(),
                    entity.getTargetRole(),
                    absoluteUrl,
                    expiryFormatted
            );
        }

        return InvitationResponse.builder()
                .invitationId(entity.getId())
                .email(entity.getEmail())
                .recipientName(recipientName)
                .targetRole(entity.getTargetRole())
                .clientId(entity.getClientId())
                .vendorId(entity.getVendorId())
                .rawToken(rawToken)
                .invitationUrl(absoluteUrl != null ? absoluteUrl : relativeUrl)
                .relativeUrl(relativeUrl)
                .deliveryMethod(deliveryMethod != null ? deliveryMethod : "BOTH")
                .emailDeliveryStatus(emailDeliveryStatus != null ? emailDeliveryStatus : "NOT_REQUESTED")
                .emailMessageId(emailMessageId)
                .manualSharingSnippet(snippet)
                .status(entity.getStatus())
                .expiresAt(entity.getExpiresAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public InvitationResponse createInvitation(InviteUserRequest req, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can issue user invitations");
        }

        // 1. Transactionally persist invitation and INVITATION_CREATED audit inside DB transaction
        PersistedInvitationState state = transactionTemplate.execute(status -> {
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

            String deliveryMethod = (req.getDeliveryMethod() != null && !req.getDeliveryMethod().isBlank())
                    ? req.getDeliveryMethod().trim().toUpperCase()
                    : "BOTH";
            if (!Set.of("EMAIL", "MANUAL", "BOTH").contains(deliveryMethod)) {
                deliveryMethod = "BOTH";
            }

            String recipientName = resolveRecipientName(req.getRecipientName(), req.getClientId(), req.getVendorId(), email);
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

            String base = (portalBaseUrl != null && !portalBaseUrl.isBlank())
                    ? portalBaseUrl.replaceAll("/+$", "")
                    : "http://localhost:3000";
            String absoluteUrl = base + "/auth/accept-invitation?token=" + rawToken;

            auditEventRepository.save(AuditEventEntity.builder()
                    .actorId(auth.getName())
                    .actorRole("STAFF")
                    .action("INVITATION_CREATED")
                    .entityName("UserInvitation")
                    .entityId(saved.getId().toString())
                    .detailsJson(String.format("{\"email\": \"%s\", \"role\": \"%s\", \"deliveryMethod\": \"%s\"}",
                            email, targetRole, deliveryMethod))
                    .build());

            return new PersistedInvitationState(saved, rawToken, recipientName, deliveryMethod, absoluteUrl);
        });

        // 2. Database transaction is COMMITTED and HikariCP connection released!
        // 3. Dispatch email outside the active database transaction:
        String emailDeliveryStatus = "NOT_REQUESTED";
        String emailMessageId = null;

        if ("EMAIL".equals(state.getDeliveryMethod()) || "BOTH".equals(state.getDeliveryMethod())) {
            InvitationEmailPayload emailPayload = InvitationEmailPayload.builder()
                    .invitationId(state.getEntity().getId())
                    .recipientEmail(state.getEntity().getEmail())
                    .recipientName(state.getRecipientName())
                    .targetRole(state.getEntity().getTargetRole())
                    .invitationUrl(state.getAbsoluteUrl())
                    .expiresAt(state.getEntity().getExpiresAt())
                    .invitedBy(auth.getName())
                    .build();

            try {
                EmailDispatchResult dispatchResult = emailDeliveryService.sendInvitationEmail(emailPayload);
                if (dispatchResult.isSuccess()) {
                    emailDeliveryStatus = "DELIVERED";
                    emailMessageId = dispatchResult.getMessageId();
                    recordEmailAudit(auth.getName(), state.getEntity().getId(), state.getEntity().getEmail(),
                            "INVITATION_EMAIL_DISPATCHED", dispatchResult.getProvider(), dispatchResult.getMessageId(), null);
                } else {
                    emailDeliveryStatus = "FAILED";
                    log.warn("Invitation email dispatch failed for '{}': {}", state.getEntity().getEmail(), dispatchResult.getErrorMessage());
                    recordEmailAudit(auth.getName(), state.getEntity().getId(), state.getEntity().getEmail(),
                            "INVITATION_EMAIL_FAILED", dispatchResult.getProvider(), null, dispatchResult.getErrorMessage());
                }
            } catch (Exception e) {
                emailDeliveryStatus = "FAILED";
                log.error("Unexpected error during invitation email dispatch to '{}': {}", state.getEntity().getEmail(), e.getMessage());
                recordEmailAudit(auth.getName(), state.getEntity().getId(), state.getEntity().getEmail(),
                        "INVITATION_EMAIL_FAILED", "SMTP", null, e.getMessage());
            }
        }

        return toResponse(state.getEntity(), state.getRawToken(), state.getRecipientName(),
                state.getDeliveryMethod(), emailDeliveryStatus, emailMessageId);
    }

    public InvitationResponse resendInvitation(UUID invitationId, ResendInvitationRequest req, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can resend user invitations");
        }

        // 1. Transactionally update invitation token & refresh expiry inside DB transaction
        PersistedInvitationState state = transactionTemplate.execute(status -> {
            UserInvitationEntity invitation = invitationRepository.findById(invitationId)
                    .orElseThrow(() -> new IllegalArgumentException("Invitation not found: " + invitationId));

            if (!"PENDING".equals(invitation.getStatus())) {
                throw new IllegalStateException("Cannot resend invitation with status: " + invitation.getStatus());
            }

            if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
                invitation.setStatus("EXPIRED");
                invitationRepository.save(invitation);
                throw new IllegalStateException("Invitation token has expired. Please create a new invitation.");
            }

            String deliveryMethod = (req != null && req.getDeliveryMethod() != null && !req.getDeliveryMethod().isBlank())
                    ? req.getDeliveryMethod().trim().toUpperCase()
                    : "BOTH";
            if (!Set.of("EMAIL", "MANUAL", "BOTH").contains(deliveryMethod)) {
                deliveryMethod = "BOTH";
            }

            String rawToken = generateSecureToken();
            String tokenHash = TokenHashUtil.hashToken(rawToken);

            invitation.setTokenHash(tokenHash);
            invitation.setExpiresAt(LocalDateTime.now().plusDays(7));
            UserInvitationEntity saved = invitationRepository.save(invitation);

            String recipientName = resolveRecipientName(null, saved.getClientId(), saved.getVendorId(), saved.getEmail());

            String base = (portalBaseUrl != null && !portalBaseUrl.isBlank())
                    ? portalBaseUrl.replaceAll("/+$", "")
                    : "http://localhost:3000";
            String absoluteUrl = base + "/auth/accept-invitation?token=" + rawToken;

            auditEventRepository.save(AuditEventEntity.builder()
                    .actorId(auth.getName())
                    .actorRole("STAFF")
                    .action("INVITATION_RESENT")
                    .entityName("UserInvitation")
                    .entityId(saved.getId().toString())
                    .detailsJson(String.format("{\"email\": \"%s\", \"deliveryMethod\": \"%s\"}",
                            saved.getEmail(), deliveryMethod))
                    .build());

            return new PersistedInvitationState(saved, rawToken, recipientName, deliveryMethod, absoluteUrl);
        });

        // 2. Database transaction COMMITTED and connection released!
        // 3. Dispatch outside transaction:
        String emailDeliveryStatus = "NOT_REQUESTED";
        String emailMessageId = null;

        if ("EMAIL".equals(state.getDeliveryMethod()) || "BOTH".equals(state.getDeliveryMethod())) {
            InvitationEmailPayload emailPayload = InvitationEmailPayload.builder()
                    .invitationId(state.getEntity().getId())
                    .recipientEmail(state.getEntity().getEmail())
                    .recipientName(state.getRecipientName())
                    .targetRole(state.getEntity().getTargetRole())
                    .invitationUrl(state.getAbsoluteUrl())
                    .expiresAt(state.getEntity().getExpiresAt())
                    .invitedBy(auth.getName())
                    .build();

            try {
                EmailDispatchResult dispatchResult = emailDeliveryService.sendInvitationEmail(emailPayload);
                if (dispatchResult.isSuccess()) {
                    emailDeliveryStatus = "DELIVERED";
                    emailMessageId = dispatchResult.getMessageId();
                    recordEmailAudit(auth.getName(), state.getEntity().getId(), state.getEntity().getEmail(),
                            "INVITATION_EMAIL_DISPATCHED", dispatchResult.getProvider(), dispatchResult.getMessageId(), null);
                } else {
                    emailDeliveryStatus = "FAILED";
                    log.warn("Resend invitation email dispatch failed for '{}': {}", state.getEntity().getEmail(), dispatchResult.getErrorMessage());
                    recordEmailAudit(auth.getName(), state.getEntity().getId(), state.getEntity().getEmail(),
                            "INVITATION_EMAIL_FAILED", dispatchResult.getProvider(), null, dispatchResult.getErrorMessage());
                }
            } catch (Exception e) {
                emailDeliveryStatus = "FAILED";
                log.error("Unexpected error during resend invitation email dispatch to '{}': {}", state.getEntity().getEmail(), e.getMessage());
                recordEmailAudit(auth.getName(), state.getEntity().getId(), state.getEntity().getEmail(),
                        "INVITATION_EMAIL_FAILED", "SMTP", null, e.getMessage());
            }
        }

        return toResponse(state.getEntity(), state.getRawToken(), state.getRecipientName(),
                state.getDeliveryMethod(), emailDeliveryStatus, emailMessageId);
    }

    private void recordEmailAudit(
            String actorId, UUID entityId, String email, String action,
            String provider, String messageId, String errorMessage
    ) {
        try {
            transactionTemplate.execute(status -> {
                String detailsJson = errorMessage != null
                        ? String.format("{\"email\": \"%s\", \"provider\": \"%s\", \"error\": \"%s\"}",
                                email, provider, errorMessage.replace("\"", "\\\""))
                        : String.format("{\"email\": \"%s\", \"provider\": \"%s\", \"messageId\": \"%s\"}",
                                email, provider, messageId != null ? messageId : "N/A");
                auditEventRepository.save(AuditEventEntity.builder()
                        .actorId(actorId)
                        .actorRole("STAFF")
                        .action(action)
                        .entityName("UserInvitation")
                        .entityId(entityId != null ? entityId.toString() : null)
                        .detailsJson(detailsJson)
                        .build());
                return null;
            });
        } catch (Exception e) {
            log.error("Failed to persist email audit record for '{}': {}", email, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public InvitationValidationResponse validateInvitation(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            return InvitationValidationResponse.builder()
                    .valid(false)
                    .status("INVALID")
                    .message("Invitation token is missing or malformed")
                    .build();
        }

        String tokenHash = TokenHashUtil.hashToken(rawToken.trim());
        Optional<UserInvitationEntity> optionalInv = invitationRepository.findByTokenHash(tokenHash);
        if (optionalInv.isEmpty()) {
            return InvitationValidationResponse.builder()
                    .valid(false)
                    .status("INVALID")
                    .message("Invalid or unrecognized invitation token")
                    .build();
        }

        UserInvitationEntity invitation = optionalInv.get();

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            return InvitationValidationResponse.builder()
                    .valid(false)
                    .status("EXPIRED")
                    .email(invitation.getEmail())
                    .targetRole(invitation.getTargetRole())
                    .expiresAt(invitation.getExpiresAt())
                    .message("Invitation token has expired. Please contact studio administration for a new invitation.")
                    .build();
        }

        if (!"PENDING".equalsIgnoreCase(invitation.getStatus())) {
            String msg = "ACCEPTED".equalsIgnoreCase(invitation.getStatus())
                    ? "This invitation has already been accepted. Please proceed to the portal login."
                    : "This invitation is no longer active (Status: " + invitation.getStatus() + ").";
            return InvitationValidationResponse.builder()
                    .valid(false)
                    .status(invitation.getStatus())
                    .email(invitation.getEmail())
                    .targetRole(invitation.getTargetRole())
                    .expiresAt(invitation.getExpiresAt())
                    .message(msg)
                    .build();
        }

        String recipientName = resolveRecipientName(null, invitation.getClientId(), invitation.getVendorId(), invitation.getEmail());

        return InvitationValidationResponse.builder()
                .valid(true)
                .status("PENDING")
                .email(invitation.getEmail())
                .recipientName(recipientName)
                .targetRole(invitation.getTargetRole())
                .expiresAt(invitation.getExpiresAt())
                .message("Invitation is valid and ready for activation")
                .build();
    }

    @Transactional(noRollbackFor = IllegalStateException.class)
    public UserSummaryResponse acceptInvitation(AcceptInvitationRequest req) {
        if (!StringUtils.hasText(req.getToken())) {
            throw new IllegalArgumentException("Invitation token is required");
        }
        if (!StringUtils.hasText(req.getUsername())) {
            throw new IllegalArgumentException("Username is required");
        }
        String username = req.getUsername().trim();
        if (username.length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters long");
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
                .map(inv -> toResponse(inv, null, null, null, null, null))
                .collect(Collectors.toList());
    }
}
