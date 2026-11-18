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
import org.springframework.data.redis.core.ValueOperations;
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
import java.util.Date;
import java.util.List;
import java.util.UUID;

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
        userRepository.deleteAll();
    }

    private UserEntity createTestUser(String username, String rawPassword, String role, boolean enabled) {
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
        // 1. User with unknown/non-permitted role attempting to access protected admin endpoint
        createTestUser("test_unknown_role", "Pass123!", "ROLE_UNKNOWN_ENTITY", true);
        String unknownRoleToken = jwtTokenProvider.generateToken(
                "test_unknown_role", "ROLE_UNKNOWN_ENTITY", 0L);

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + unknownRoleToken))
                .andExpect(status().isForbidden());

        // 2. Token with completely empty role
        String noRoleToken = jwtTokenProvider.generateCustomToken(
                "test_ephemeral_user", "", 0L, "archeon-api", "archeon-web", 60000L);
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + noRoleToken))
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

        // Account is currently enabled -> 200 OK
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Administrator disables the account
        user.setEnabled(false);
        userRepository.save(user);

        // Immediate subsequent request must be rejected with 401 Unauthorized
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 5. DEMOTED ACCOUNT (MUST RETURN 401)
    // =========================================================================
    @Test
    @DisplayName("P3-05: Token with demoted role is rejected with HTTP 401 Unauthorized")
    void test_demotedAccount_rejectedWith401() throws Exception {
        UserEntity user = createTestUser("test_demoted", "Pass123!", "ROLE_ADMIN", true);
        String adminToken = jwtTokenProvider.generateToken(user.getUsername(), "ROLE_ADMIN", user.getTokenVersion());

        // Admin request succeeds
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // User role demoted from ADMIN to STAFF in database
        user.setRole("ROLE_STAFF");
        userRepository.save(user);

        // Old token presenting ROLE_ADMIN must be rejected due to role mismatch
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
                .expiresAt(LocalDateTime.now().minusDays(1)) // Expired
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

        // 1. Initial Login
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

        // 2. Perform Refresh
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

        // 3. Inspect Database State
        String initialHash = TokenHashUtil.hashToken(initialRefreshToken);
        String secondHash = TokenHashUtil.hashToken(secondRefreshToken);

        RefreshTokenEntity firstEntity = refreshTokenRepository.findByTokenHash(initialHash).orElseThrow();
        RefreshTokenEntity secondEntity = refreshTokenRepository.findByTokenHash(secondHash).orElseThrow();

        assertTrue(firstEntity.isUsed(), "Initial token must be marked as used");
        assertFalse(firstEntity.isRevoked(), "Initial token should not be revoked yet");
        assertFalse(secondEntity.isUsed(), "Second token must be unused");
        assertEquals(firstEntity.getFamilyId(), secondEntity.getFamilyId(), "Both tokens must belong to the same family");
    }

    // =========================================================================
    // 8. REUSE DETECTION (REPLAY ATTACK AUTOMATIC REVOCATION)
    // =========================================================================
    @Test
    @DisplayName("P3-08: Refresh token reuse triggers immediate revocation of the entire token family")
    void test_reuseDetection_revokesEntireFamily() throws Exception {
        createTestUser("test_reuse_user", "ValidPass123!", "ROLE_ADMIN", true);

        // 1. Login
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_reuse_user\",\"password\":\"ValidPass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String initialRefreshToken = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("refreshToken").asText();

        // 2. Legitimate Refresh -> moves to secondRefreshToken
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + initialRefreshToken + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String secondRefreshToken = objectMapper.readTree(refreshResult.getResponse().getContentAsString()).get("refreshToken").asText();

        // 3. Attacker replays initialRefreshToken (Already Used!)
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + initialRefreshToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token reuse detected. Token family invalidated"));

        // 4. Verify that the entire family was revoked in DB
        String secondHash = TokenHashUtil.hashToken(secondRefreshToken);
        RefreshTokenEntity secondEntity = refreshTokenRepository.findByTokenHash(secondHash).orElseThrow();
        assertTrue(secondEntity.isRevoked(), "Second token in the family must be marked revoked");

        // 5. Subsequent attempt to use secondRefreshToken must now also fail
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

        // Token works initially
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Revoke token JTI
        String jti = jwtTokenProvider.getJtiFromJwt(token);
        tokenRevocationService.revokeToken(jti, 60000L);

        // Immediate subsequent request rejected
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 10. LOGOUT API (REVOKES JTI & REFRESH TOKEN)
    // =========================================================================
    @Test
    @DisplayName("P3-10: Logout API revokes active access token and refresh token")
    void test_logout_revokesAccessTokenAndRefreshToken() throws Exception {
        createTestUser("test_logout_user", "Pass123!", "ROLE_ADMIN", true);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_logout_user\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String accessToken = json.get("token").asText();
        String refreshToken = json.get("refreshToken").asText();

        // Perform Logout
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));

        // Subsequent access with same access token is rejected
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized());

        // Subsequent refresh attempt is rejected
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 11. LOGOUT ALL API (SUPERSEDES TOKEN VERSION & INVALIDATES SESSIONS)
    // =========================================================================
    @Test
    @DisplayName("P3-11: Logout All increments token version and invalidates all existing user tokens")
    void test_logoutAll_invalidatesAllUserSessions() throws Exception {
        createTestUser("test_logout_all", "Pass123!", "ROLE_ADMIN", true);

        // Session 1
        MvcResult session1 = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_logout_all\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String token1 = objectMapper.readTree(session1.getResponse().getContentAsString()).get("token").asText();
        String refresh1 = objectMapper.readTree(session1.getResponse().getContentAsString()).get("refreshToken").asText();

        // Session 2
        MvcResult session2 = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_logout_all\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String token2 = objectMapper.readTree(session2.getResponse().getContentAsString()).get("token").asText();
        String refresh2 = objectMapper.readTree(session2.getResponse().getContentAsString()).get("refreshToken").asText();

        // Perform Logout All using session 1's token
        mockMvc.perform(post("/api/auth/logout-all")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("All sessions terminated successfully"));

        // Both access tokens must now fail
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isUnauthorized());

        // Both refresh tokens must also fail
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
        // Mock a failing RedisTemplate that simulates Redis outage / connection loss
        StringRedisTemplate failingRedisTemplate = mock(StringRedisTemplate.class);
        when(failingRedisTemplate.hasKey(anyString())).thenThrow(new RedisConnectionFailureException("Unable to connect to Redis on localhost:6379"));

        RedisTokenRevocationService redisRevocationService = new RedisTokenRevocationService(failingRedisTemplate);

        // Verify that RedisTokenRevocationService throws TokenRevocationUnavailableException
        assertThrows(TokenRevocationUnavailableException.class, () -> {
            redisRevocationService.isTokenRevoked("some-jti");
        });

        // Test filter behavior when revocation service fails
        UserEntity user = createTestUser("test_outage_user", "Pass123!", "ROLE_ADMIN", true);
        String validToken = jwtTokenProvider.generateToken(user.getUsername(), user.getRole(), user.getTokenVersion());

        // Temporarily inject the failing revocation service into JwtAuthenticationFilter
        Object originalService = ReflectionTestUtils.getField(jwtAuthenticationFilter, "tokenRevocationService");
        try {
            ReflectionTestUtils.setField(jwtAuthenticationFilter, "tokenRevocationService", redisRevocationService);

            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/leads");
            request.addHeader("Authorization", "Bearer " + validToken);
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain filterChain = new MockFilterChain();

            jwtAuthenticationFilter.doFilter(request, response, filterChain);

            // Fail-closed invariant: Must return HTTP 401 Unauthorized
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

        // Alice logs in twice (2 session families)
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

        // Bob logs in
        MvcResult bobLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"session_bob\",\"password\":\"Pass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String bobToken = objectMapper.readTree(bobLogin.getResponse().getContentAsString()).get("token").asText();

        // 1. Alice lists sessions -> exactly 2 sessions
        MvcResult sessionsResult = mockMvc.perform(get("/api/auth/sessions")
                        .header("Authorization", "Bearer " + aliceToken1))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode sessionArray = objectMapper.readTree(sessionsResult.getResponse().getContentAsString());
        assertEquals(2, sessionArray.size(), "Alice should have 2 active session families");
        String aliceFamilyId1 = sessionArray.get(0).get("familyId").asText();

        // 2. Bob attempts to revoke Alice's session family (Cross-tenant / BOLA attempt) -> MUST BE 403 FORBIDDEN
        mockMvc.perform(post("/api/auth/sessions/" + aliceFamilyId1 + "/revoke")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Cannot revoke session belonging to another user"));

        // 3. Alice legitimately revokes her own session family -> 200 OK
        mockMvc.perform(post("/api/auth/sessions/" + aliceFamilyId1 + "/revoke")
                        .header("Authorization", "Bearer " + aliceToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Session revoked successfully"));

        // Verify family was revoked in DB
        List<RefreshTokenEntity> revokedTokens = refreshTokenRepository.findByFamilyId(aliceFamilyId1);
        assertFalse(revokedTokens.isEmpty());
        assertTrue(revokedTokens.stream().allMatch(RefreshTokenEntity::isRevoked));
    }
}
