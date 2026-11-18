package com.webui.backend.controller;

import com.webui.backend.model.RefreshTokenEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.repository.RefreshTokenRepository;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.security.JwtTokenProvider;
import com.webui.backend.security.TokenHashUtil;
import com.webui.backend.service.TokenRevocationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private TokenRevocationService tokenRevocationService;

    // Injected services and repositories

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefreshRequest {
        private String refreshToken;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogoutRequest {
        private String refreshToken;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String refreshToken;
        private String username;
        private String role;
        private Long expiresIn;

        public AuthResponse(String token, String username, String role) {
            this.token = token;
            this.username = username;
            this.role = role;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SessionResponse {
        private String familyId;
        private String deviceInfo;
        private String ipAddress;
        private LocalDateTime createdAt;
        private LocalDateTime expiresAt;
        private boolean active;
    }

    private String generateSecureRandomToken() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return HexFormat.of().formatHex(randomBytes);
    }

    @PostMapping("/login")
    @Transactional
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        if (request.getUsername() == null || request.getPassword() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Username and password are required"));
        }

        Optional<UserEntity> userOpt = userRepository.findByUsername(request.getUsername());
        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        UserEntity user = userOpt.get();
        if (!user.isEnabled()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Account is disabled"));
        }

        String familyId = UUID.randomUUID().toString();

        // 1. Generate Access Token (15 minutes) with familyId claim
        String accessToken = jwtTokenProvider.generateToken(user.getUsername(), user.getRole(), user.getTokenVersion(), familyId);

        // 2. Generate Refresh Token (7 days) & Family Tracking
        String rawRefreshToken = generateSecureRandomToken();
        String tokenHash = TokenHashUtil.hashToken(rawRefreshToken);

        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        RefreshTokenEntity refreshTokenEntity = RefreshTokenEntity.builder()
                .tokenHash(tokenHash)
                .username(user.getUsername())
                .familyId(familyId)
                .used(false)
                .revoked(false)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusSeconds(jwtTokenProvider.getRefreshExpirationMs() / 1000))
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);

        long expiresIn = jwtTokenProvider.getJwtExpirationMs() / 1000;
        return ResponseEntity.ok(new AuthResponse(
                accessToken,
                rawRefreshToken,
                user.getUsername(),
                user.getRole(),
                expiresIn
        ));
    }

    @PostMapping("/refresh")
    @Transactional
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest request, HttpServletRequest httpRequest) {
        if (request == null || !StringUtils.hasText(request.getRefreshToken())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Refresh token is required"));
        }

        String rawToken = request.getRefreshToken();
        String tokenHash = TokenHashUtil.hashToken(rawToken);

        Optional<RefreshTokenEntity> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid refresh token"));
        }

        RefreshTokenEntity tokenEntity = tokenOpt.get();

        // 1. Check if token was already revoked
        if (tokenEntity.isRevoked()) {
            refreshTokenRepository.revokeFamily(tokenEntity.getFamilyId());
            tokenRevocationService.revokeFamily(tokenEntity.getFamilyId());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Refresh token has been revoked"));
        }

        // 2. Check expiration
        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenEntity.setRevoked(true);
            refreshTokenRepository.save(tokenEntity);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Refresh token has expired"));
        }

        // 3. Verify user active status in DB
        Optional<UserEntity> userOpt = userRepository.findByUsername(tokenEntity.getUsername());
        if (userOpt.isEmpty() || !userOpt.get().isEnabled()) {
            refreshTokenRepository.revokeFamily(tokenEntity.getFamilyId());
            tokenRevocationService.revokeFamily(tokenEntity.getFamilyId());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User account disabled or not found"));
        }

        UserEntity user = userOpt.get();

        // 4. Token Reuse / Replay Detection on already-consumed tokens
        LocalDateTime now = LocalDateTime.now();
        if (tokenEntity.isUsed()) {
            LocalDateTime consumedAt = tokenEntity.getConsumedAt();
            boolean isRecentConcurrencyConflict = consumedAt != null &&
                    Duration.between(consumedAt, now).toMillis() < 3000L;

            if (isRecentConcurrencyConflict) {
                // Distinguish normal concurrency conflict: Reject parallel request without destroying the family
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Concurrent refresh conflict: Token was already consumed by a parallel request"));
            } else {
                // Confirmed token replay: REVOKE the entire family
                refreshTokenRepository.revokeFamily(tokenEntity.getFamilyId());
                tokenRevocationService.revokeFamily(tokenEntity.getFamilyId());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Refresh token reuse detected. Token family invalidated"));
            }
        }

        // 5. P3-01: ATOMIC SINGLE-USE CONSUMPTION (Prevents concurrent dual rotation)
        int consumed = refreshTokenRepository.consumeTokenIfUnused(tokenHash, now);

        if (consumed == 0) {
            // Re-fetch token entity since clearAutomatically flushed and cleared the persistence context
            RefreshTokenEntity freshToken = refreshTokenRepository.findByTokenHash(tokenHash).orElse(tokenEntity);

            if (freshToken.isRevoked()) {
                tokenRevocationService.revokeFamily(freshToken.getFamilyId());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Refresh token has been revoked"));
            }

            if (freshToken.isUsed()) {
                LocalDateTime consumedAt = freshToken.getConsumedAt();
                boolean isRecentConcurrencyConflict = consumedAt != null &&
                        Duration.between(consumedAt, now).toMillis() < 3000L;

                if (isRecentConcurrencyConflict) {
                    // Distinguish normal concurrency conflict: Reject parallel request without destroying the family
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("error", "Concurrent refresh conflict: Token was already consumed by a parallel request"));
                } else {
                    // Confirmed token replay: REVOKE the entire family
                    refreshTokenRepository.revokeFamily(freshToken.getFamilyId());
                    tokenRevocationService.revokeFamily(freshToken.getFamilyId());
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "Refresh token reuse detected. Token family invalidated"));
                }
            }

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Concurrent refresh conflict: Token was already consumed by a parallel request"));
        }

        // 5. Issue new Refresh Token in the SAME family
        String newRawRefreshToken = generateSecureRandomToken();
        String newTokenHash = TokenHashUtil.hashToken(newRawRefreshToken);

        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        RefreshTokenEntity nextTokenEntity = RefreshTokenEntity.builder()
                .tokenHash(newTokenHash)
                .username(user.getUsername())
                .familyId(tokenEntity.getFamilyId())
                .used(false)
                .revoked(false)
                .createdAt(now)
                .expiresAt(now.plusSeconds(jwtTokenProvider.getRefreshExpirationMs() / 1000))
                .deviceInfo(StringUtils.hasText(deviceInfo) ? deviceInfo : tokenEntity.getDeviceInfo())
                .ipAddress(StringUtils.hasText(ipAddress) ? ipAddress : tokenEntity.getIpAddress())
                .build();

        refreshTokenRepository.save(nextTokenEntity);

        // 6. Issue new Access Token containing the familyId (`fid`)
        String newAccessToken = jwtTokenProvider.generateToken(
                user.getUsername(), user.getRole(), user.getTokenVersion(), tokenEntity.getFamilyId());
        long expiresIn = jwtTokenProvider.getJwtExpirationMs() / 1000;

        return ResponseEntity.ok(new AuthResponse(
                newAccessToken,
                newRawRefreshToken,
                user.getUsername(),
                user.getRole(),
                expiresIn
        ));
    }

    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<?> logout(@RequestBody(required = false) LogoutRequest request,
                                    HttpServletRequest httpRequest,
                                    Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthenticated"));
        }

        String currentUsername = authentication.getName();

        // 1. Revoke current Access Token by JTI and Family ID
        String authHeader = httpRequest.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            String jti = jwtTokenProvider.getJtiFromJwt(jwt);
            String fid = jwtTokenProvider.getFamilyIdFromJwt(jwt);
            long remainingTtl = jwtTokenProvider.getRemainingTtlMs(jwt);
            if (jti != null) {
                tokenRevocationService.revokeToken(jti, remainingTtl);
            }
            if (fid != null) {
                tokenRevocationService.revokeFamily(fid);
                refreshTokenRepository.revokeFamily(fid);
            }
        }

        // 2. P3-02: Revoke Refresh Token with Ownership Verification and Complete Family Revocation
        if (request != null && StringUtils.hasText(request.getRefreshToken())) {
            String hash = TokenHashUtil.hashToken(request.getRefreshToken());
            Optional<RefreshTokenEntity> rtOpt = refreshTokenRepository.findByTokenHash(hash);
            if (rtOpt.isPresent()) {
                RefreshTokenEntity rt = rtOpt.get();
                // Reject cross-user token revocation
                if (!currentUsername.equals(rt.getUsername())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "Cannot revoke refresh token belonging to another user"));
                }
                // Revoke complete token family to eliminate race conditions
                refreshTokenRepository.revokeFamily(rt.getFamilyId());
                tokenRevocationService.revokeFamily(rt.getFamilyId());
            }
        }

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/logout-all")
    @Transactional
    public ResponseEntity<?> logoutAll(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthenticated"));
        }

        String username = authentication.getName();
        Optional<UserEntity> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();
            user.setTokenVersion(user.getTokenVersion() + 1);
            userRepository.save(user);
        }

        // Invalidate all refresh tokens in DB
        refreshTokenRepository.revokeAllForUser(username);

        // Set user-level revocation in Redis / In-memory
        tokenRevocationService.revokeAllForUser(username);

        return ResponseEntity.ok(Map.of("message", "All sessions terminated successfully"));
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> listSessions(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthenticated"));
        }

        String username = authentication.getName();
        List<RefreshTokenEntity> userTokens = refreshTokenRepository.findByUsername(username);

        // Group by family_id to represent sessions
        Map<String, List<RefreshTokenEntity>> families = userTokens.stream()
                .collect(Collectors.groupingBy(RefreshTokenEntity::getFamilyId));

        LocalDateTime now = LocalDateTime.now();
        List<SessionResponse> sessions = new ArrayList<>();

        for (Map.Entry<String, List<RefreshTokenEntity>> entry : families.entrySet()) {
            String familyId = entry.getKey();
            List<RefreshTokenEntity> tokens = entry.getValue();

            // Active if any token in the family is not revoked and not expired
            boolean active = tokens.stream().anyMatch(t -> !t.isRevoked() && t.getExpiresAt().isAfter(now));

            RefreshTokenEntity latest = tokens.stream()
                    .max(Comparator.comparing(RefreshTokenEntity::getCreatedAt))
                    .orElse(tokens.get(0));

            RefreshTokenEntity earliest = tokens.stream()
                    .min(Comparator.comparing(RefreshTokenEntity::getCreatedAt))
                    .orElse(tokens.get(0));

            sessions.add(SessionResponse.builder()
                    .familyId(familyId)
                    .deviceInfo(latest.getDeviceInfo())
                    .ipAddress(latest.getIpAddress())
                    .createdAt(earliest.getCreatedAt())
                    .expiresAt(latest.getExpiresAt())
                    .active(active)
                    .build());
        }

        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/sessions/{familyId}/revoke")
    @Transactional
    public ResponseEntity<?> revokeSession(@PathVariable String familyId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthenticated"));
        }

        String username = authentication.getName();
        List<RefreshTokenEntity> tokens = refreshTokenRepository.findByFamilyId(familyId);

        if (tokens.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Session family not found"));
        }

        // Ownership invariant check: ensure user owns this session family
        if (!tokens.get(0).getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Cannot revoke session belonging to another user"));
        }

        // 1. Revoke in DB
        refreshTokenRepository.revokeFamily(familyId);

        // 2. P3-07: Immediately invalidate existing in-flight access tokens for this session family
        tokenRevocationService.revokeFamily(familyId);

        return ResponseEntity.ok(Map.of("message", "Session revoked successfully"));
    }
}
