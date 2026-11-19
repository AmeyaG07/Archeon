package com.webui.backend.config;

import com.webui.backend.model.UserEntity;
import com.webui.backend.repository.*;
import com.webui.backend.service.FinancialOperationsService;
import com.webui.backend.service.MakerCheckerApprovalService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ProductionBootstrapHardeningTest {

    // 256-bit (32 bytes) strong random key in Base64
    private static final String VALID_PROD_SECRET_256 = Base64.getEncoder().encodeToString(
            "12345678901234567890123456789012".getBytes()
    );

    // 384-bit (48 bytes) strong random key in Base64
    private static final String VALID_PROD_SECRET_384 = Base64.getEncoder().encodeToString(
            "123456789012345678901234567890123456789012345678".getBytes()
    );

    // =========================================================================
    // TASK B: JWT SECRET AND SECURITY CONFIG VALIDATION TESTS
    // =========================================================================

    @Test
    @DisplayName("P3.2-01: Production fails startup when JWT secret is missing")
    void test_productionFailsWhenSecretMissing() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("production");
        env.setProperty("app.security.revocation-strategy", "redis");
        // app.jwt.secret not set

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SecurityConfigValidator.validateEnvironment(env)
        );
        assertTrue(ex.getMessage().contains("app.jwt.secret is missing or blank in production"));
        assertFalse(ex.getMessage().contains("secret="));
    }

    @Test
    @DisplayName("P3.2-02: Production fails startup when JWT secret is blank")
    void test_productionFailsWhenSecretBlank() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.security.revocation-strategy", "redis");
        env.setProperty("app.jwt.secret", "   ");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SecurityConfigValidator.validateEnvironment(env)
        );
        assertTrue(ex.getMessage().contains("app.jwt.secret is missing or blank in production"));
    }

    @Test
    @DisplayName("P3.2-03: Production fails startup when default development secret is used")
    void test_productionFailsWhenDefaultDevSecretUsed() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("production");
        env.setProperty("app.security.revocation-strategy", "redis");
        env.setProperty("app.jwt.secret", SecurityConfigValidator.DEFAULT_DEV_SECRET);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SecurityConfigValidator.validateEnvironment(env)
        );
        assertTrue(ex.getMessage().contains("must not use known default or development secrets in production"));
        assertFalse(ex.getMessage().contains(SecurityConfigValidator.DEFAULT_DEV_SECRET));
    }

    @Test
    @DisplayName("P3.2-04: Production fails startup when known insecure dummy secret is used")
    void test_productionFailsWhenKnownDummySecretUsed() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.security.revocation-strategy", "redis");
        env.setProperty("app.jwt.secret", "changeme");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SecurityConfigValidator.validateEnvironment(env)
        );
        assertTrue(ex.getMessage().contains("must not use known default or development secrets in production"));
    }

    @Test
    @DisplayName("P3.2-05: Production fails startup when secret is not valid Base64")
    void test_productionFailsWhenSecretNotBase64() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.security.revocation-strategy", "redis");
        env.setProperty("app.jwt.secret", "This is clearly not valid base-64!!! %%%");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SecurityConfigValidator.validateEnvironment(env)
        );
        assertTrue(ex.getMessage().contains("must be a valid Base64-encoded string in production"));
    }

    @Test
    @DisplayName("P3.2-06: Production fails startup when secret is shorter than 256 bits (32 bytes)")
    void test_productionFailsWhenSecretTooShort() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("production");
        env.setProperty("app.security.revocation-strategy", "redis");
        // 16 bytes (128 bits) - insufficient for HMAC-SHA256/384
        String shortSecret = Base64.getEncoder().encodeToString("1234567890123456".getBytes());
        env.setProperty("app.jwt.secret", shortSecret);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SecurityConfigValidator.validateEnvironment(env)
        );
        assertTrue(ex.getMessage().contains("minimum key length requirement"));
    }

    @Test
    @DisplayName("P3.2-07: Production fails startup when in-memory revocation is configured")
    void test_productionFailsWhenInMemoryRevocationConfigured() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.security.revocation-strategy", "in-memory");
        env.setProperty("app.jwt.secret", VALID_PROD_SECRET_256);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SecurityConfigValidator.validateEnvironment(env)
        );
        assertTrue(ex.getMessage().contains("In-memory token revocation strategy is strictly forbidden in production"));
    }

    @Test
    @DisplayName("P3.2-08: Production succeeds when strong secret, Redis revocation, and ClamAV are configured")
    void test_productionSucceedsWithValidSecretAndRedis() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.security.revocation-strategy", "redis");
        env.setProperty("app.jwt.secret", VALID_PROD_SECRET_384);
        env.setProperty("app.dms.malware-scan-mode", "CLAMAV");
        env.setProperty("app.dms.clamav.host", "clamav.internal.archeon.io");

        assertDoesNotThrow(() -> SecurityConfigValidator.validateEnvironment(env));
    }

    @Test
    @DisplayName("P4.3.1-07: Production fails startup when malware scan mode is mock or pass-through")
    void test_productionFailsWhenMalwareScannerIsMock() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.security.revocation-strategy", "redis");
        env.setProperty("app.jwt.secret", VALID_PROD_SECRET_384);
        env.setProperty("app.dms.malware-scan-mode", "DETERMINISTIC_MOCK");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SecurityConfigValidator.validateEnvironment(env)
        );
        assertTrue(ex.getMessage().contains("app.dms.malware-scan-mode must be set to 'CLAMAV' in production"));
    }

    @Test
    @DisplayName("P4.3.1-08: Production fails startup when ClamAV host is missing")
    void test_productionFailsWhenClamAvHostMissing() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("production");
        env.setProperty("app.security.revocation-strategy", "redis");
        env.setProperty("app.jwt.secret", VALID_PROD_SECRET_384);
        env.setProperty("app.dms.malware-scan-mode", "CLAMAV");
        // app.dms.clamav.host not set

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SecurityConfigValidator.validateEnvironment(env)
        );
        assertTrue(ex.getMessage().contains("app.dms.clamav.host is missing or blank in production"));
    }

    @Test
    @DisplayName("P3.2-09: Development and test environments succeed with default secret and in-memory revocation")
    void test_developmentSucceedsWithDefaultSecret() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        env.setProperty("app.security.revocation-strategy", "in-memory");
        env.setProperty("app.jwt.secret", SecurityConfigValidator.DEFAULT_DEV_SECRET);

        assertDoesNotThrow(() -> SecurityConfigValidator.validateEnvironment(env));

        // Test with empty (default) profile
        MockEnvironment defaultEnv = new MockEnvironment();
        defaultEnv.setProperty("app.security.revocation-strategy", "in-memory");
        defaultEnv.setProperty("app.jwt.secret", SecurityConfigValidator.DEFAULT_DEV_SECRET);

        assertDoesNotThrow(() -> SecurityConfigValidator.validateEnvironment(defaultEnv));
    }

    // =========================================================================
    // TASK A: DATA INITIALIZER PROFILE ISOLATION TESTS
    // =========================================================================

    @Test
    @DisplayName("P3.2-10: DataInitializer.run() aborts without executing if production profile is active")
    void test_dataInitializerAbortsUnderProductionProfile() throws Exception {
        UserRepository mockUserRepo = mock(UserRepository.class);
        ProjectRepository mockProjRepo = mock(ProjectRepository.class);
        ManifestoRepository mockManifestoRepo = mock(ManifestoRepository.class);
        BillApprovalRepository mockBillRepo = mock(BillApprovalRepository.class);
        CashSettlementRepository mockCashRepo = mock(CashSettlementRepository.class);
        PasswordEncoder mockEncoder = mock(PasswordEncoder.class);
        MakerCheckerApprovalService mockApprovalService = mock(MakerCheckerApprovalService.class);
        FinancialOperationsService mockFinancialOpsService = mock(FinancialOperationsService.class);

        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("production");

        DataInitializer initializer = new DataInitializer();
        ReflectionTestUtils.setField(initializer, "environment", env);
        ReflectionTestUtils.setField(initializer, "userRepository", mockUserRepo);
        ReflectionTestUtils.setField(initializer, "projectRepository", mockProjRepo);
        ReflectionTestUtils.setField(initializer, "manifestoRepository", mockManifestoRepo);
        ReflectionTestUtils.setField(initializer, "billApprovalRepository", mockBillRepo);
        ReflectionTestUtils.setField(initializer, "cashSettlementRepository", mockCashRepo);
        ReflectionTestUtils.setField(initializer, "passwordEncoder", mockEncoder);
        ReflectionTestUtils.setField(initializer, "approvalService", mockApprovalService);
        ReflectionTestUtils.setField(initializer, "financialOperationsService", mockFinancialOpsService);

        // Execute run
        initializer.run();

        // Verify zero interactions with any repository
        verifyNoInteractions(mockUserRepo);
        verifyNoInteractions(mockProjRepo);
        verifyNoInteractions(mockManifestoRepo);
        verifyNoInteractions(mockBillRepo);
        verifyNoInteractions(mockCashRepo);
        verifyNoInteractions(mockApprovalService);
        verifyNoInteractions(mockFinancialOpsService);
    }

    @Test
    @DisplayName("P3.2-11: DataInitializer.run() executes seeding when running under default profile")
    void test_dataInitializerExecutesUnderDefaultProfile() throws Exception {
        UserRepository mockUserRepo = mock(UserRepository.class);
        ProjectRepository mockProjRepo = mock(ProjectRepository.class);
        ManifestoRepository mockManifestoRepo = mock(ManifestoRepository.class);
        BillApprovalRepository mockBillRepo = mock(BillApprovalRepository.class);
        CashSettlementRepository mockCashRepo = mock(CashSettlementRepository.class);
        PasswordEncoder mockEncoder = mock(PasswordEncoder.class);
        when(mockEncoder.encode(anyString())).thenReturn("hashed_pass");

        MakerCheckerApprovalService mockApprovalService = mock(MakerCheckerApprovalService.class);
        FinancialOperationsService mockFinancialOpsService = mock(FinancialOperationsService.class);

        MockEnvironment env = new MockEnvironment(); // empty active profiles = default

        DataInitializer initializer = new DataInitializer();
        ReflectionTestUtils.setField(initializer, "environment", env);
        ReflectionTestUtils.setField(initializer, "userRepository", mockUserRepo);
        ReflectionTestUtils.setField(initializer, "projectRepository", mockProjRepo);
        ReflectionTestUtils.setField(initializer, "manifestoRepository", mockManifestoRepo);
        ReflectionTestUtils.setField(initializer, "billApprovalRepository", mockBillRepo);
        ReflectionTestUtils.setField(initializer, "cashSettlementRepository", mockCashRepo);
        ReflectionTestUtils.setField(initializer, "passwordEncoder", mockEncoder);
        ReflectionTestUtils.setField(initializer, "approvalService", mockApprovalService);
        ReflectionTestUtils.setField(initializer, "financialOperationsService", mockFinancialOpsService);

        // Execute run
        initializer.run();

        // Verify that user seeding was attempted
        verify(mockUserRepo, atLeastOnce()).existsByUsername(anyString());
    }
}
