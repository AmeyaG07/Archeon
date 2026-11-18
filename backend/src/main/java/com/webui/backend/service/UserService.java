package com.webui.backend.service;

import com.webui.backend.dto.identity.UserDto.*;
import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.ClientRepository;
import com.webui.backend.repository.RefreshTokenRepository;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Set<String> ALLOWED_ROLES = Set.of(
            "ROLE_ADMIN", "ROLE_STAFF", "ROLE_FINANCE_MAKER", "ROLE_FINANCE_CHECKER",
            "ROLE_FINANCE_CHECKER_1", "ROLE_FINANCE_CHECKER_2", "ROLE_FINANCE_MANAGER",
            "ROLE_FINANCE_LEAD", "ROLE_FINANCE_AUDIT", "ROLE_SITE_SUPERVISOR",
            "ROLE_CLIENT", "ROLE_VENDOR"
    );

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private TokenRevocationService tokenRevocationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private boolean isAdmin(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return false;
        return authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private UserSummaryResponse toSummary(UserEntity entity) {
        return UserSummaryResponse.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .role(entity.getRole())
                .fullName(entity.getFullName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .clientId(entity.getClientId())
                .vendorId(entity.getVendorId())
                .status(entity.getStatus())
                .enabled(entity.isEnabled())
                .tokenVersion(entity.getTokenVersion())
                .version(entity.getVersion())
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }

        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("User not found: " + username));

        UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .clientId(user.getClientId())
                .vendorId(user.getVendorId())
                .status(user.getStatus())
                .enabled(user.isEnabled())
                .lastLoginAt(user.getLastLoginAt());

        if (user.getClientId() != null) {
            clientRepository.findById(user.getClientId()).ifPresent(c -> {
                builder.clientReference(c.getClientReference());
                builder.clientName(c.getFullName());
            });
        }

        if (user.getVendorId() != null) {
            vendorRepository.findById(user.getVendorId()).ifPresent(v -> {
                builder.vendorReference(v.getVendorReference());
                builder.vendorBusinessName(v.getBusinessName());
            });
        }

        return builder.build();
    }

    @Transactional
    public UserProfileResponse updateCurrentUserProfile(Authentication auth, UpdateProfileRequest req) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }

        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("User not found: " + username));

        if (req.getFullName() != null) {
            user.setFullName(req.getFullName().trim());
        }
        if (req.getPhone() != null) {
            user.setPhone(req.getPhone().trim());
        }

        UserEntity saved = userRepository.save(user);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(username)
                .actorRole(saved.getRole())
                .action("USER_PROFILE_UPDATED")
                .entityName("User")
                .entityId(saved.getId().toString())
                .detailsJson("{\"action\": \"SELF_PROFILE_UPDATE\"}")
                .build());

        return getCurrentUserProfile(auth);
    }

    @Transactional
    public void changePassword(Authentication auth, ChangePasswordRequest req) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }

        if (!StringUtils.hasText(req.getCurrentPassword())) {
            throw new IllegalArgumentException("Current password is required");
        }
        if (!StringUtils.hasText(req.getNewPassword()) || req.getNewPassword().length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters long");
        }

        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("User not found: " + username));

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password verification failed. Please check your credentials.");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        // Security Invariant: Terminate all refresh tokens and sessions on password change
        refreshTokenRepository.revokeAllForUser(username);
        tokenRevocationService.revokeAllForUser(username);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(username)
                .actorRole(user.getRole())
                .action("USER_PASSWORD_CHANGED")
                .entityName("User")
                .entityId(user.getId().toString())
                .detailsJson("{\"sessionsRevoked\": true}")
                .build());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listUsers(Authentication auth) {
        if (!isAdmin(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators can view the full user roster");
        }
        return userRepository.findAllByOrderByUsernameAsc().stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserSummaryResponse getUserById(Long userId, Authentication auth) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // BOLA: Admin can view any user; other users can only view their own user account
        if (!isAdmin(auth.getAuthorities()) && !auth.getName().equals(user.getUsername())) {
            throw new AccessDeniedException("Access denied: You cannot view this user account");
        }

        return toSummary(user);
    }

    @Transactional
    public UserSummaryResponse updateUserRole(Long userId, UpdateUserRoleRequest req, Authentication auth) {
        if (!isAdmin(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators can assign user roles");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Strict Invariant: Admin CANNOT modify their own role
        if (auth.getName().equals(user.getUsername())) {
            throw new IllegalStateException("Security Invariant Violation: Administrators cannot modify their own role to prevent self-lockout or privilege manipulation.");
        }

        String newRole = req.getRole() != null ? req.getRole().trim().toUpperCase() : null;
        if (newRole == null || !newRole.startsWith("ROLE_")) {
            newRole = "ROLE_" + newRole;
        }

        if (!ALLOWED_ROLES.contains(newRole)) {
            throw new IllegalArgumentException("Invalid role specified: " + newRole);
        }

        String oldRole = user.getRole();
        user.setRole(newRole);
        user.setTokenVersion(user.getTokenVersion() + 1);
        UserEntity saved = userRepository.save(user);

        // Security Invariant: Role change invalidates existing sessions
        refreshTokenRepository.revokeAllForUser(user.getUsername());
        tokenRevocationService.revokeAllForUser(user.getUsername());

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("ADMIN")
                .action("USER_ROLE_CHANGED")
                .entityName("User")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"username\": \"%s\", \"oldRole\": \"%s\", \"newRole\": \"%s\"}",
                        saved.getUsername(), oldRole, newRole))
                .build());

        return toSummary(saved);
    }

    @Transactional
    public UserSummaryResponse updateUserStatus(Long userId, UpdateUserStatusRequest req, Authentication auth) {
        if (!isAdmin(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators can activate or suspend user accounts");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Strict Invariant: Admin CANNOT deactivate their own account
        if (auth.getName().equals(user.getUsername())) {
            throw new IllegalStateException("Security Invariant Violation: Administrators cannot deactivate their own account.");
        }

        boolean shouldEnable = req.getEnabled() != null ? req.getEnabled() : !"SUSPENDED".equalsIgnoreCase(req.getStatus());
        String status = shouldEnable ? "ACTIVE" : "SUSPENDED";

        user.setEnabled(shouldEnable);
        user.setStatus(status);

        if (!shouldEnable) {
            // Immediately revoke sessions and tokens
            user.setTokenVersion(user.getTokenVersion() + 1);
            refreshTokenRepository.revokeAllForUser(user.getUsername());
            tokenRevocationService.revokeAllForUser(user.getUsername());
        }

        UserEntity saved = userRepository.save(user);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("ADMIN")
                .action(shouldEnable ? "USER_ACTIVATED" : "USER_DEACTIVATED")
                .entityName("User")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"username\": \"%s\", \"status\": \"%s\", \"enabled\": %s}",
                        saved.getUsername(), status, shouldEnable))
                .build());

        return toSummary(saved);
    }
}
