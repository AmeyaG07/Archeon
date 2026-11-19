package com.webui.backend.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.webui.backend.model.RefreshTokenEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.repository.RefreshTokenRepository;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.service.InMemoryTokenRevocationService;
import com.webui.backend.service.RedisTokenRevocationService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class Phase3AuthLifecycleTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private InMemoryTokenRevocationService tokenRevocationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        tokenRevocationService.clear();
        refreshTokenRepository.deleteAll();
        // Clean up test-specific users without wiping seeded studio accounts
        userRepository.findAll().stream()
                .filter(u -> u.getUsername().startsWith("test_") ||
                             u.getUsername().startsWith("session_") ||
                             u.getUsername().startsWith("conc_"))
                .forEach(userRepository::delete);
    }

    private UserEntity createTestUser(String username, String rawPassword, String role, boolean enabled) {
        userRepository.findByUsername(username).ifPresent(userRepository::delete);
        UserEntity user = UserEntity.builder()
                .username(username)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .enabled(enabled)
                .tokenVersion(0L)
                .build();
        return userRepository.save(user);
    }

    // =========================================================================
    // 1. EXPIRED ACCESS TOKEN (MUST RETURN 401)
    // =========================================================================
    @Test
    @DisplayName("P3-01: Expired access token is rejected with HTTP 401 Unauthorized")
    void test_expiredAccessToken_rejectedWith401() throws Exception {
        createTestUser("test_expired", "Pass123!", "ROLE_ADMIN", true);
        String expiredToken = jwtTokenProvider.generateCustomToken(
                "test_expired", "ROLE_ADMIN", 0L, "archeon-api", "archeon-web", -5000L);

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 2. INVALID SIGNATURE (MUST RETURN 401)
    // =========================================================================
    @Test
    @DisplayName("P3-02: JWT token with invalid signature is rejected with HTTP 401 Unauthorized")
    void test_invalidSignature_rejectedWith401() throws Exception {
        createTestUser("test_forged", "Pass123!", "ROLE_ADMIN", true);
        SecretKey rogueKey = Keys.hmacShaKeyFor("RogueRogueRogueRogueRogueRogueRogueRogueRogueRogue12".getBytes(StandardCharsets.UTF_8));
        String forgedToken = Jwts.builder()
                .issuer("archeon-api")
                .audience().add("archeon-web").and()
                .subject("test_forged")
                .id(UUID.randomUUID().toString())
                .claim("role", "ROLE_ADMIN")
                .claim("ver", 0L)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(rogueKey)
                .compact();

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + forgedToken))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 3. MISSING OR UNKNOWN ROLE (MUST RETURN 403)
    // =========================================================================
    @Test
    @DisplayName("P3-03: Token with missing or unauthorized/unknown role is rejected with HTTP 403 Forbidden")
    void test_missingOrUnknownRole_rejectedWith403() throws Exception {
        createTestUser("test_unknown_role", "Pass123!", "ROLE_UNKNOWN_ENTITY", true);
        String unknownRoleToken = jwtTokenProvider.generateToken(
                "test_unknown_role", "ROLE_UNKNOWN_ENTITY", 0L);

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + unknownRoleToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 4. DISABLED ACCOUNT (MUST RETURN 401)
    // =========================================================================
    @Test
    @DisplayName("P3-04: Token belonging to a disabled account is rejected with HTTP 401 Unauthorized")
    void test_disabledAccount_rejectedWith401() throws Exception {
        UserEntity user = createTestUser("test_disabled", "Pass123!", "ROLE_ADMIN", true);
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole(), user.getTokenVersion());

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Administrator disables the account
        user.setEnabled(false);
        userRepository.save(user);

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(status().reason("Unauthorized: Account is disabled"));
    }

    // =========================================================================
    // 5. DEMOTED ACCOUNT (MUST RETURN 401)
    // =========================================================================
    @Test
    @DisplayName("P3-05: Token with demoted role is rejected with HTTP 401 Unauthorized")
    void test_demotedAccount_rejectedWith401() throws Exception {
        UserEntity user = createTestUser("test_demoted", "Pass123!", "ROLE_ADMIN", true);
        String adminToken = jwtTokenProvider.generateToken(user.getUsername(), "ROLE_ADMIN", user.getTokenVersion());

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Demote in database from ADMIN to STAFF
        user.setRole("ROLE_STAFF");
        userRepository.save(user);

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 6. EXPIRED REFRESH TOKEN (MUST RETURN 401)
    // =========================================================================
    @Test
    @DisplayName("P3-06: Expired refresh token is rejected with HTTP 401 Unauthorized")
    void test_expiredRefreshToken_rejectedWith401() throws Exception {
        UserEntity user = createTestUser("test_refr_exp", "Pass123!", "ROLE_ADMIN", true);
        String rawToken = "raw_refresh_token_expired_12345678";
        String tokenHash = TokenHashUtil.hashToken(rawToken);

        RefreshTokenEntity entity = RefreshTokenEntity.builder()
                .tokenHash(tokenHash)
                .username(user.getUsername())
                .familyId(UUID.randomUUID().toString())
                .used(false)
                .revoked(false)
                .createdAt(LocalDateTime.now().minusDays(10))
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build();
        refreshTokenRepository.save(entity);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + rawToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token has expired"));
    }

    // =========================================================================
    // 7. VALID REFRESH TOKEN ROTATION (RTR)
    // =========================================================================
    @Test
    @DisplayName("P3-07: Valid refresh rotates token, marks previous token used, and preserves family")
    void test_validRefreshRotation_issuesNewTokensInSameFamily() throws Exception {
        createTestUser("test_rotate_user", "ValidPass123!", "ROLE_ADMIN", true);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_rotate_user\",\"password\":\"ValidPass123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String initialRefreshToken = loginJson.get("refreshToken").asText();

        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + initialRefreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        JsonNode refreshJson = objectMapper.readTree(refreshResult.getResponse().getContentAsString());
        String secondRefreshToken = refreshJson.get("refreshToken").asText();

        assertNotEquals(initialRefreshToken, secondRefreshToken, "New refresh token must be distinct from previous token");

        String initialHash = TokenHashUtil.hashToken(initialRefreshToken);
        String secondHash = TokenHashUtil.hashToken(secondRefreshToken);

        RefreshTokenEntity firstEntity = refreshTokenRepository.findByTokenHash(initialHash).orElseThrow();
        RefreshTokenEntity secondEntity = refreshTokenRepository.findByTokenHash(secondHash).orElseThrow();

        assertTrue(firstEntity.isUsed(), "Initial token must be marked as used");
        assertNotNull(firstEntity.getConsumedAt(), "Consumed timestamp must be recorded");
        assertFalse(firstEntity.isRevoked(), "Initial token should not be revoked");
        assertFalse(secondEntity.isUsed(), "Second token must be unused");
        assertEquals(firstEntity.getFamilyId(), secondEntity.getFamilyId(), "Both tokens must belong to the same family");
    }

    // =========================================================================
    // 8. REUSE DETECTION (REPLAY ATTACK AUTOMATIC REVOCATION)
    // =========================================================================
    @Test
    @DisplayName("P3-08: Refresh token replay outside concurrency window triggers family revocation")
    void test_reuseDetection_revokesEntireFamily() throws Exception {
        createTestUser("test_reuse_user", "ValidPass123!", "ROLE_ADMIN", true);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_reuse_user\",\"password\":\"ValidPass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String initialRefreshToken = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("refreshToken").asText();

        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + initialRefreshToken + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String secondRefreshToken = objectMapper.readTree(refreshResult.getResponse().getContentAsString()).get("refreshToken").asText();

        // Simulate replay attack outside concurrency window (consumed > 3s ago)
        String initialHash = TokenHashUtil.hashToken(initialRefreshToken);
        RefreshTokenEntity firstEntity = refreshTokenRepository.findByTokenHash(initialHash).orElseThrow();
        firstEntity.setConsumedAt(LocalDateTime.now().minusSeconds(10));
        refreshTokenRepository.save(firstEntity);

        // Attacker replays initialRefreshToken
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + initialRefreshToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token reuse detected. Token family invalidated"));

        String secondHash = TokenHashUtil.hashToken(secondRefreshToken);
        RefreshTokenEntity secondEntity = refreshTokenRepository.findByTokenHash(secondHash).orElseThrow();
        assertTrue(secondEntity.isRevoked(), "Second token in the family must be marked revoked");

        // Subsequent attempt to use secondRefreshToken must fail
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + secondRefreshToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token has been revoked"));
    }

    // =========================================================================
    // 9. REVOKED ACCESS TOKEN VIA JTI (MUST RETURN 401)
    // =========================================================================
    @Test
    @DisplayName("P3-09: Access token revoked by JTI is rejected with HTTP 401 Unauthorized")
    void test_revokedAccessToken_rejectedWith401() throws Exception {
        UserEntity user = createTestUser("test_jti_rev", "Pass123!", "ROLE_ADMIN", true);
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole(), user.getTokenVersion());

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        String jti = jwtTokenProvider.getJtiFromJwt(token);
        tokenRevocationService.revokeToken(jti, 60000L);

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 10. LOGOUT API & OWNERSHIP ENFORCEMENT
    // =========================================================================
    @Test
    @DisplayName("P3-10: Logout API revokes complete family and rejects cross-user token revocation")
    void test_logout_revokesFamilyAndEnforcesOwnership() throws Exception {
        UserEntity userAlice = createTestUser("test_logout_alice", "Pass123!", "ROLE_ADMIN", true);
        UserEntity userBob = createTestUser("test_logout_bob", "Pass123!", "ROLE_STAFF", true);

        // Alice logs in
        MvcResult aliceLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_logout_alice\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String aliceAccess = objectMapper.readTree(aliceLogin.getResponse().getContentAsString()).get("token").asText();
        String aliceRefresh = objectMapper.readTree(aliceLogin.getResponse().getContentAsString()).get("refreshToken").asText();

        // Bob logs in
        MvcResult bobLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_logout_bob\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String bobAccess = objectMapper.readTree(bobLogin.getResponse().getContentAsString()).get("token").asText();

        // Bob tries to revoke Alice's refresh token -> MUST RETURN 403 FORBIDDEN
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + bobAccess)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + aliceRefresh + "\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Cannot revoke refresh token belonging to another user"));

        // Alice legitimately logs out with her own token
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + aliceAccess)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + aliceRefresh + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));

        // Alice's access token is revoked
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + aliceAccess))
                .andExpect(status().isUnauthorized());

        // Alice's refresh token is revoked
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + aliceRefresh + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 11. LOGOUT ALL API (SUPERSEDES TOKEN VERSION & INVALIDATES SESSIONS)
    // =========================================================================
    @Test
    @DisplayName("P3-11: Logout All increments token version and invalidates all existing user tokens")
    void test_logoutAll_invalidatesAllUserSessions() throws Exception {
        createTestUser("test_logout_all", "Pass123!", "ROLE_ADMIN", true);

        MvcResult session1 = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_logout_all\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String token1 = objectMapper.readTree(session1.getResponse().getContentAsString()).get("token").asText();
        String refresh1 = objectMapper.readTree(session1.getResponse().getContentAsString()).get("refreshToken").asText();

        MvcResult session2 = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_logout_all\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String token2 = objectMapper.readTree(session2.getResponse().getContentAsString()).get("token").asText();
        String refresh2 = objectMapper.readTree(session2.getResponse().getContentAsString()).get("refreshToken").asText();

        mockMvc.perform(post("/api/auth/logout-all")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("All sessions terminated successfully"));

        // Both access tokens fail
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isUnauthorized());

        // Both refresh tokens fail
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh1 + "\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh2 + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 12. FAIL-CLOSED ON REVOCATION STORE OUTAGE (HTTP 401, NEVER BYPASS)
    // =========================================================================
    @Test
    @DisplayName("P3-12: Redis outage triggers fail-closed security: HTTP 401 Unauthorized, never bypasses")
    void test_redisUnavailable_failClosedReturns401() throws Exception {
        StringRedisTemplate failingRedisTemplate = mock(StringRedisTemplate.class);
        when(failingRedisTemplate.hasKey(anyString())).thenThrow(new RedisConnectionFailureException("Unable to connect to Redis on localhost:6379"));

        RedisTokenRevocationService redisRevocationService = new RedisTokenRevocationService(failingRedisTemplate);

        assertThrows(TokenRevocationUnavailableException.class, () -> {
            redisRevocationService.isTokenRevoked("some-jti");
        });

        UserEntity user = createTestUser("test_outage_user", "Pass123!", "ROLE_ADMIN", true);
        String validToken = jwtTokenProvider.generateToken(user.getUsername(), user.getRole(), user.getTokenVersion());

        Object originalService = ReflectionTestUtils.getField(jwtAuthenticationFilter, "tokenRevocationService");
        try {
            ReflectionTestUtils.setField(jwtAuthenticationFilter, "tokenRevocationService", redisRevocationService);

            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/leads");
            request.addHeader("Authorization", "Bearer " + validToken);
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain filterChain = new MockFilterChain();

            jwtAuthenticationFilter.doFilter(request, response, filterChain);

            assertEquals(401, response.getStatus(), "Filter must return 401 Unauthorized when revocation service is unavailable");
            assertTrue(response.getErrorMessage().contains("Revocation service unavailable"),
                    "Error message must clearly cite revocation service unavailability");
        } finally {
            ReflectionTestUtils.setField(jwtAuthenticationFilter, "tokenRevocationService", originalService);
        }
    }

    // =========================================================================
    // 13. SESSION MANAGEMENT API & OWNERSHIP ENFORCEMENT
    // =========================================================================
    @Test
    @DisplayName("P3-13: Session management lists active sessions and prevents cross-user revocation (BOLA)")
    void test_sessionManagementAndCrossUserRevocationProtection() throws Exception {
        createTestUser("session_alice", "Pass123!", "ROLE_STAFF", true);
        createTestUser("session_bob", "Pass123!", "ROLE_STAFF", true);

        MvcResult aliceLogin1 = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"session_alice\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String aliceToken1 = objectMapper.readTree(aliceLogin1.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"session_alice\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk());

        MvcResult bobLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"session_bob\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String bobToken = objectMapper.readTree(bobLogin.getResponse().getContentAsString()).get("token").asText();

        MvcResult sessionsResult = mockMvc.perform(get("/api/auth/sessions")
                        .header("Authorization", "Bearer " + aliceToken1))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode sessionArray = objectMapper.readTree(sessionsResult.getResponse().getContentAsString());
        assertEquals(2, sessionArray.size(), "Alice should have 2 active session families");
        String aliceFamilyId1 = sessionArray.get(0).get("familyId").asText();

        // Cross-tenant revocation attempt
        mockMvc.perform(post("/api/auth/sessions/" + aliceFamilyId1 + "/revoke")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Cannot revoke session belonging to another user"));

        // Legitimate revocation
        mockMvc.perform(post("/api/auth/sessions/" + aliceFamilyId1 + "/revoke")
                        .header("Authorization", "Bearer " + aliceToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Session revoked successfully"));

        List<RefreshTokenEntity> revokedTokens = refreshTokenRepository.findByFamilyId(aliceFamilyId1);
        assertFalse(revokedTokens.isEmpty());
        assertTrue(revokedTokens.stream().allMatch(RefreshTokenEntity::isRevoked));
    }

    // =========================================================================
    // 14. P3-01: DETERMINISTIC CONCURRENT REFRESH TESTS (EXACTLY ONE ROTATION SUCCEEDS)
    // =========================================================================
    @Test
    @DisplayName("P3-14: Simultaneous concurrent refresh attempts with same token result in exactly one success and one conflict")
    void test_concurrentRefreshAttempts_onlyOneSucceeds() throws Exception {
        createTestUser("conc_refresh_user", "Pass123!", "ROLE_ADMIN", true);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"conc_refresh_user\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String initialRefreshToken = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("refreshToken").asText();

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        List<String> nextRefreshTokens = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    MvcResult res = mockMvc.perform(post("/api/auth/refresh")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("{\"refreshToken\":\"" + initialRefreshToken + "\"}"))
                            .andReturn();

                    int status = res.getResponse().getStatus();
                    if (status == 200) {
                        successCount.incrementAndGet();
                        String responseBody = res.getResponse().getContentAsString();
                        String nextToken = objectMapper.readTree(responseBody).get("refreshToken").asText();
                        nextRefreshTokens.add(nextToken);
                    } else if (status == 409) {
                        conflictCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(doneLatch.await(10, TimeUnit.SECONDS), "Concurrent refresh requests did not complete in time");
        executor.shutdown();

        // Exactly one rotation succeeded, and the other was rejected with HTTP 409 Conflict
        assertEquals(1, successCount.get(), "Exactly one concurrent refresh rotation must succeed");
        assertEquals(1, conflictCount.get(), "The concurrent conflict must be rejected with HTTP 409 Conflict");
        assertEquals(1, nextRefreshTokens.size(), "Only one successor refresh token should have been issued");

        // Verify that the surviving token family remains valid and can be refreshed subsequently
        String survivingToken = nextRefreshTokens.get(0);
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + survivingToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    // =========================================================================
    // 15. P3-03: DELETED ACCOUNT REJECTION
    // =========================================================================
    @Test
    @DisplayName("P3-15: JWT token for a deleted user account is rejected with HTTP 401 Unauthorized")
    void test_deletedUserAccount_rejectedWith401() throws Exception {
        UserEntity user = createTestUser("test_deleted_user", "Pass123!", "ROLE_ADMIN", true);
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole(), user.getTokenVersion());

        // Token works initially
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Delete user completely from database
        userRepository.delete(user);
        assertFalse(userRepository.findByUsername("test_deleted_user").isPresent());

        // Subsequent request must be rejected with 401 Unauthorized (never fall through to trust claims)
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 16. P3-04: MANDATORY JWT CLAIMS VALIDATION
    // =========================================================================
    @Test
    @DisplayName("P3-16: Mandatory JWT claims: reject missing or incorrect issuer and audience")
    void test_mandatoryClaims_issuerAndAudienceEnforced() throws Exception {
        createTestUser("test_claims_user", "Pass123!", "ROLE_ADMIN", true);

        // 1. Missing issuer (null)
        String noIssuerToken = jwtTokenProvider.generateCustomToken(
                "test_claims_user", "ROLE_ADMIN", 0L, null, "archeon-web", 60000L);
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + noIssuerToken))
                .andExpect(status().isUnauthorized());

        // 2. Incorrect issuer ("rogue-api")
        String wrongIssuerToken = jwtTokenProvider.generateCustomToken(
                "test_claims_user", "ROLE_ADMIN", 0L, "rogue-api", "archeon-web", 60000L);
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + wrongIssuerToken))
                .andExpect(status().isUnauthorized());

        // 3. Missing audience (null)
        String noAudToken = jwtTokenProvider.generateCustomToken(
                "test_claims_user", "ROLE_ADMIN", 0L, "archeon-api", null, 60000L);
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + noAudToken))
                .andExpect(status().isUnauthorized());

        // 4. Incorrect audience ("rogue-client")
        String wrongAudToken = jwtTokenProvider.generateCustomToken(
                "test_claims_user", "ROLE_ADMIN", 0L, "archeon-api", "rogue-client", 60000L);
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + wrongAudToken))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 17. P3-07: IMMEDIATE IN-FLIGHT ACCESS TOKEN INVALIDATION UPON FAMILY REVOCATION
    // =========================================================================
    @Test
    @DisplayName("P3-17: Revoking a session family immediately invalidates existing in-flight access tokens")
    void test_sessionFamilyRevocation_immediatelyInvalidatesInFlightAccessToken() throws Exception {
        UserEntity user = createTestUser("test_flight_user", "Pass123!", "ROLE_ADMIN", true);

        // Login to get access token carrying family ID ('fid')
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_flight_user\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String accessToken = loginJson.get("token").asText();

        // Access token works initially
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        // Get familyId from session listing
        MvcResult sessionsRes = mockMvc.perform(get("/api/auth/sessions")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andReturn();
        String familyId = objectMapper.readTree(sessionsRes.getResponse().getContentAsString()).get(0).get("familyId").asText();

        // Revoke the session family
        mockMvc.perform(post("/api/auth/sessions/" + familyId + "/revoke")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        // The in-flight access token MUST BE IMMEDIATELY REJECTED on its next request!
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized());
    }
}
