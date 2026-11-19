package com.webui.backend.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.webui.backend.dto.identity.VendorDto.*;
import com.webui.backend.model.UserEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.repository.VendorRepository;
import com.webui.backend.security.crypto.AesGcmEncryptionService;
import com.webui.backend.security.crypto.SensitiveDataMasker;
import com.webui.backend.security.crypto.VendorBankDetailsEncryptionConverter;
import com.webui.backend.security.crypto.VendorBankingDataMigrationService;
import com.webui.backend.service.VendorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class SensitiveDataProtectionTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Autowired
    private VendorService vendorService;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AesGcmEncryptionService aesGcmEncryptionService;

    @Autowired
    private SensitiveDataMasker sensitiveDataMasker;

    @Autowired
    private VendorBankingDataMigrationService migrationService;

    private Authentication adminAuth;
    private Authentication financeAuth;
    private Authentication staffAuth;
    private Authentication vendorAAuth;
    private Authentication vendorBAuth;
    private Authentication clientAuth;

    private final String RAW_PAN = "ABCDE1234F";
    private final String RAW_GSTIN = "27ABCDE1234F1Z5";
    private final String RAW_BANK_JSON = "{\"bankName\":\"HDFC Bank\",\"accountNumber\":\"987654321012\",\"ifsc\":\"HDFC0001234\",\"branch\":\"Nagpur\"}";

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM project_vendor_assignments");
        vendorRepository.deleteAll();

        List<String> cleanupUsers = List.of("admin_crypto", "finance_crypto", "staff_crypto", "vendor_a_crypto", "vendor_b_crypto", "client_crypto");
        for (String u : cleanupUsers) {
            userRepository.findByUsername(u).ifPresent(userRepository::delete);
        }

        adminAuth = new UsernamePasswordAuthenticationToken(
                "admin_crypto", "password", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        financeAuth = new UsernamePasswordAuthenticationToken(
                "finance_crypto", "password", List.of(new SimpleGrantedAuthority("ROLE_FINANCE_MANAGER")));
        staffAuth = new UsernamePasswordAuthenticationToken(
                "staff_crypto", "password", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        vendorAAuth = new UsernamePasswordAuthenticationToken(
                "vendor_a_crypto", "password", List.of(new SimpleGrantedAuthority("ROLE_VENDOR")));
        vendorBAuth = new UsernamePasswordAuthenticationToken(
                "vendor_b_crypto", "password", List.of(new SimpleGrantedAuthority("ROLE_VENDOR")));
        clientAuth = new UsernamePasswordAuthenticationToken(
                "client_crypto", "password", List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));

        userRepository.save(UserEntity.builder().username("admin_crypto").password(passwordEncoder.encode("p")).role("ROLE_ADMIN").build());
        userRepository.save(UserEntity.builder().username("finance_crypto").password(passwordEncoder.encode("p")).role("ROLE_FINANCE_MANAGER").build());
        userRepository.save(UserEntity.builder().username("staff_crypto").password(passwordEncoder.encode("p")).role("ROLE_STAFF").build());
    }

    // =========================================================================
    // SECTION 1: AES-256-GCM CRYPTOGRAPHIC INFRASTRUCTURE UNIT TESTS
    // =========================================================================

    @Test
    @DisplayName("CRYPTO-01: Encrypt and decrypt round-trip preserves UTF-8 data")
    void testAesGcm_RoundTrip() {
        String original = "{\"accountNumber\":\"123456789012\",\"ifsc\":\"SBIN0001234\"}";
        String ciphertext = aesGcmEncryptionService.encrypt(original);

        assertNotNull(ciphertext);
        assertTrue(ciphertext.startsWith(AesGcmEncryptionService.ENVELOPE_PREFIX));
        assertFalse(ciphertext.contains("123456789012"));

        String decrypted = aesGcmEncryptionService.decrypt(ciphertext);
        assertEquals(original, decrypted);
    }

    @Test
    @DisplayName("CRYPTO-02: Nonce uniqueness: repeated encryptions produce distinct ciphertexts")
    void testAesGcm_NonceUniqueness() {
        String data = "Sensitive Financial Data 12345";
        String ct1 = aesGcmEncryptionService.encrypt(data);
        String ct2 = aesGcmEncryptionService.encrypt(data);

        assertNotEquals(ct1, ct2, "AES-256-GCM must use distinct random IVs per encryption");
        assertEquals(data, aesGcmEncryptionService.decrypt(ct1));
        assertEquals(data, aesGcmEncryptionService.decrypt(ct2));
    }

    @Test
    @DisplayName("CRYPTO-03: Ciphertext tampering triggers AEADBadTagException / SecurityException")
    void testAesGcm_TamperedCiphertext_ThrowsSecurityException() {
        String original = "Authenticity Protected String";
        String envelope = aesGcmEncryptionService.encrypt(original);

        String[] parts = envelope.split(":", 4);
        byte[] cipherBytes = Base64.getDecoder().decode(parts[3]);
        // Flip one bit in the ciphertext
        cipherBytes[0] ^= 0x01;
        String tamperedCipher = Base64.getEncoder().encodeToString(cipherBytes);
        String tamperedEnvelope = parts[0] + ":" + parts[1] + ":" + parts[2] + ":" + tamperedCipher;

        SecurityException ex = assertThrows(SecurityException.class, () ->
                aesGcmEncryptionService.decrypt(tamperedEnvelope)
        );
        assertTrue(ex.getMessage().contains("tag mismatch") || ex.getMessage().contains("tampered"));
    }

    @Test
    @DisplayName("CRYPTO-04: Malformed envelope rejected fail-closed")
    void testAesGcm_MalformedEnvelope_ThrowsSecurityException() {
        assertThrows(SecurityException.class, () -> aesGcmEncryptionService.decrypt("enc:v1:only_two_parts"));
        assertThrows(SecurityException.class, () -> aesGcmEncryptionService.decrypt("enc:v1:not_base64:not_base64"));
    }

    @Test
    @DisplayName("CRYPTO-05: Legacy plaintext backward compatibility")
    void testAesGcm_LegacyPlaintext_Preserved() {
        String legacyPlaintext = "{\"accountNumber\":\"123456\"}";
        assertEquals(legacyPlaintext, aesGcmEncryptionService.decrypt(legacyPlaintext));
    }

    @Test
    @DisplayName("CRYPTO-06: Encryption service requires exactly 256-bit (32-byte) key")
    void testAesGcm_KeyLengthValidation() {
        // 16 bytes (128-bit)
        String key16 = Base64.getEncoder().encodeToString("1234567890123456".getBytes());
        assertThrows(IllegalStateException.class, () -> new AesGcmEncryptionService(key16, true));

        // 24 bytes (192-bit)
        String key24 = Base64.getEncoder().encodeToString("123456789012345678901234".getBytes());
        assertThrows(IllegalStateException.class, () -> new AesGcmEncryptionService(key24, true));

        // Missing / blank
        assertThrows(IllegalStateException.class, () -> new AesGcmEncryptionService("", true));
        assertThrows(IllegalStateException.class, () -> new AesGcmEncryptionService(null, true));

        // Valid 32 bytes (256-bit)
        String key32 = Base64.getEncoder().encodeToString("12345678901234567890123456789012".getBytes());
        assertDoesNotThrow(() -> new AesGcmEncryptionService(key32, true));
    }

    // =========================================================================
    // SECTION 2: SENSITIVE DATA MASKER UNIT TESTS
    // =========================================================================

    @Test
    @DisplayName("MASK-01: PAN masking format ABCDE****F")
    void testSensitiveDataMasker_Pan() {
        assertEquals("ABCDE****F", sensitiveDataMasker.maskPan("ABCDE1234F"));
        assertEquals("XXXXX****Y", sensitiveDataMasker.maskPan("XXXXX9999Y"));
        assertNull(sensitiveDataMasker.maskPan(null));
        assertEquals("", sensitiveDataMasker.maskPan(""));
    }

    @Test
    @DisplayName("MASK-02: GSTIN masking format 27ABCDE****F1Z5 preserves exact 15-character length and check chars")
    void testSensitiveDataMasker_Gstin() {
        String masked = sensitiveDataMasker.maskGstin("27ABCDE1234F1Z5");
        assertEquals("27ABCDE****F1Z5", masked);
        assertEquals(15, masked.length(), "Masked GSTIN must preserve exact 15-character length");
        assertEquals("27ABCDE", masked.substring(0, 7), "State code and 5 alpha PAN prefix must be preserved");
        assertEquals("****", masked.substring(7, 11), "4 numeric PAN digits must be masked with 4 asterisks");
        assertEquals('F', masked.charAt(11), "PAN final character must be preserved");
        assertEquals("1Z5", masked.substring(12), "Entity code, 'Z', and checksum characters must be preserved");

        // Another valid GSTIN
        assertEquals("07AAAAA****A1ZX", sensitiveDataMasker.maskGstin("07AAAAA0000A1ZX"));

        // Null and empty handling
        assertNull(sensitiveDataMasker.maskGstin(null));
        assertEquals("", sensitiveDataMasker.maskGstin(""));
        assertEquals("   ", sensitiveDataMasker.maskGstin("   "));

        // Malformed / non-standard inputs
        assertEquals("****", sensitiveDataMasker.maskGstin("1234"));
        assertEquals("12**56", sensitiveDataMasker.maskGstin("123456"));
    }

    @Test
    @DisplayName("MASK-03: Bank Account Number masking: last 4 digits visible")
    void testSensitiveDataMasker_BankAccountNumber() {
        assertEquals("********9012", sensitiveDataMasker.maskBankAccountNumber("123456789012"));
        assertEquals("****1234", sensitiveDataMasker.maskBankAccountNumber("98761234"));
        assertEquals("****", sensitiveDataMasker.maskBankAccountNumber("1234"));
        assertNull(sensitiveDataMasker.maskBankAccountNumber(null));
    }

    @Test
    @DisplayName("MASK-04: Bank Details JSON masking masks account number and preserves metadata")
    void testSensitiveDataMasker_BankDetailsJson() throws Exception {
        String json = "{\"bankName\":\"HDFC Bank\",\"accountNumber\":\"987654321012\",\"ifsc\":\"HDFC0001234\",\"branch\":\"Nagpur\"}";
        String masked = sensitiveDataMasker.maskBankDetailsJson(json);

        assertNotNull(masked);
        JsonNode root = OBJECT_MAPPER.readTree(masked);
        assertEquals("HDFC Bank", root.get("bankName").asText());
        assertEquals("HDFC0001234", root.get("ifsc").asText());
        assertEquals("Nagpur", root.get("branch").asText());
        assertEquals("********1012", root.get("accountNumber").asText());
        assertFalse(masked.contains("987654321012"));
    }

    // =========================================================================
    // SECTION 3: AT-REST ENCRYPTION INTEGRATION TESTS
    // =========================================================================

    @Test
    @DisplayName("AT-REST-01: Vendor bank details stored as enc:v1: ciphertext in database")
    void testVendorBankDetails_EncryptedAtRest() {
        CreateVendorRequest req = CreateVendorRequest.builder()
                .businessName("Encrypted Millwork Ltd")
                .contactPerson("Crypto Contact")
                .email("crypto.vendor@domain.test")
                .phone("+91-9898989898")
                .category("CARPENTRY")
                .pan(RAW_PAN)
                .gstin(RAW_GSTIN)
                .bankDetailsJson(RAW_BANK_JSON)
                .build();

        VendorResponse created = vendorService.createVendor(req, adminAuth);
        assertNotNull(created.getId());

        // Verify direct database representation
        Map<String, Object> row = jdbcTemplate.queryForMap(
                "SELECT bank_details_json FROM vendors WHERE id = ?", created.getId());
        String dbBankDetails = (String) row.get("bank_details_json");

        assertNotNull(dbBankDetails);
        assertTrue(dbBankDetails.startsWith("enc:v1:"), "Database record MUST start with enc:v1: envelope prefix");
        assertFalse(dbBankDetails.contains("987654321012"), "Raw account number MUST NOT appear in the database");
        assertFalse(dbBankDetails.contains("HDFC Bank"), "Plaintext bank details MUST NOT appear in raw database storage");

        // Verify transparent decryption via JPA entity load
        VendorEntity loaded = vendorRepository.findById(created.getId()).orElseThrow();
        assertEquals(RAW_BANK_JSON, loaded.getBankDetailsJson(), "JPA AttributeConverter must transparently decrypt on load");
    }

    // =========================================================================
    // SECTION 4: CONTEXTUAL SENSITIVE DATA MASKING DTO TESTS
    // =========================================================================

    @Test
    @DisplayName("MASK-DTO-01: Staff receives masked PAN, GSTIN, and Bank Details")
    void testStaffDto_MaskedSensitiveData() {
        CreateVendorRequest req = CreateVendorRequest.builder()
                .businessName("Staff Visibility Vendor")
                .contactPerson("Staff Test")
                .email("staff.test@vendor.test")
                .phone("+91-9123456789")
                .category("ELECTRICAL")
                .pan(RAW_PAN)
                .gstin(RAW_GSTIN)
                .bankDetailsJson(RAW_BANK_JSON)
                .build();

        VendorResponse created = vendorService.createVendor(req, adminAuth);

        // Staff views vendor profile
        VendorResponse staffView = vendorService.getVendorById(created.getId(), staffAuth);

        // Verify PAN is masked
        assertEquals("ABCDE****F", staffView.getPan());
        assertFalse(staffView.getPan().contains("1234"));

        // Verify GSTIN is masked
        assertEquals("27ABCDE****F1Z5", staffView.getGstin());
        assertFalse(staffView.getGstin().contains("1234"));

        // Verify Bank Details JSON is masked
        assertTrue(staffView.getBankDetailsJson().contains("********1012"));
        assertFalse(staffView.getBankDetailsJson().contains("987654321012"));
        assertTrue(staffView.getBankDetailsJson().contains("HDFC Bank"));
        assertTrue(staffView.getBankDetailsJson().contains("HDFC0001234"));
    }

    @Test
    @DisplayName("MASK-DTO-02: Staff roster list receives masked sensitive data across all items")
    void testStaffList_MaskedSensitiveData() {
        vendorService.createVendor(CreateVendorRequest.builder()
                .businessName("Roster Vendor 1").contactPerson("P1").email("roster1@v.test").phone("111")
                .category("HVAC").pan(RAW_PAN).gstin(RAW_GSTIN).bankDetailsJson(RAW_BANK_JSON).build(), adminAuth);

        List<VendorResponse> list = vendorService.listVendors(staffAuth);
        assertFalse(list.isEmpty());

        for (VendorResponse v : list) {
            assertEquals("ABCDE****F", v.getPan());
            assertEquals("27ABCDE****F1Z5", v.getGstin());
            assertTrue(v.getBankDetailsJson().contains("********1012"));
            assertFalse(v.getBankDetailsJson().contains("987654321012"));
        }
    }

    @Test
    @DisplayName("MASK-DTO-03: Admin and Finance receive UNMASKED sensitive data")
    void testAdminAndFinance_UnmaskedSensitiveData() {
        CreateVendorRequest req = CreateVendorRequest.builder()
                .businessName("Finance Audit Vendor")
                .contactPerson("Auditor")
                .email("finance.audit@vendor.test")
                .phone("+91-9123456788")
                .category("CIVIL_WORK")
                .pan(RAW_PAN)
                .gstin(RAW_GSTIN)
                .bankDetailsJson(RAW_BANK_JSON)
                .build();

        VendorResponse created = vendorService.createVendor(req, adminAuth);

        // Admin views vendor
        VendorResponse adminView = vendorService.getVendorById(created.getId(), adminAuth);
        assertEquals(RAW_PAN, adminView.getPan());
        assertEquals(RAW_GSTIN, adminView.getGstin());
        assertEquals(RAW_BANK_JSON, adminView.getBankDetailsJson());

        // Finance Manager views vendor
        VendorResponse financeView = vendorService.getVendorById(created.getId(), financeAuth);
        assertEquals(RAW_PAN, financeView.getPan());
        assertEquals(RAW_GSTIN, financeView.getGstin());
        assertEquals(RAW_BANK_JSON, financeView.getBankDetailsJson());
    }

    @Test
    @DisplayName("MASK-DTO-04: Authenticated Vendor views UNMASKED own profile")
    void testVendorSelf_UnmaskedSensitiveData() {
        CreateVendorRequest req = CreateVendorRequest.builder()
                .businessName("Vendor Self Org")
                .contactPerson("Owner")
                .email("owner@vendorself.test")
                .phone("+91-9123456787")
                .category("PLUMBING")
                .pan(RAW_PAN)
                .gstin(RAW_GSTIN)
                .bankDetailsJson(RAW_BANK_JSON)
                .build();

        VendorResponse created = vendorService.createVendor(req, adminAuth);

        // Link vendor_a_crypto user to this vendor
        userRepository.save(UserEntity.builder()
                .username("vendor_a_crypto")
                .password(passwordEncoder.encode("p"))
                .role("ROLE_VENDOR")
                .vendorId(created.getId())
                .build());

        // Vendor views own profile via getVendorById
        VendorResponse selfView = vendorService.getVendorById(created.getId(), vendorAAuth);
        assertEquals(RAW_PAN, selfView.getPan(), "Vendor must view their own unmasked PAN");
        assertEquals(RAW_GSTIN, selfView.getGstin(), "Vendor must view their own unmasked GSTIN");
        assertEquals(RAW_BANK_JSON, selfView.getBankDetailsJson(), "Vendor must view their own unmasked Bank Details");

        // Vendor views own profile via getCurrentVendorProfile (/me)
        VendorResponse meView = vendorService.getCurrentVendorProfile(vendorAAuth);
        assertEquals(RAW_PAN, meView.getPan());
        assertEquals(RAW_GSTIN, meView.getGstin());
        assertEquals(RAW_BANK_JSON, meView.getBankDetailsJson());
    }

    @Test
    @DisplayName("AUTH-01: Unauthorized access to vendor profile fails closed")
    void testUnauthorizedAccess_FailsClosed() {
        CreateVendorRequest req = CreateVendorRequest.builder()
                .businessName("Isolated Vendor")
                .contactPerson("Isolated")
                .email("isolated@vendor.test")
                .phone("+91-9123456786")
                .category("PAINTING")
                .pan(RAW_PAN)
                .gstin(RAW_GSTIN)
                .bankDetailsJson(RAW_BANK_JSON)
                .build();

        VendorResponse created = vendorService.createVendor(req, adminAuth);

        // Client cannot access vendor profile
        assertThrows(AccessDeniedException.class, () ->
                vendorService.getVendorById(created.getId(), clientAuth));

        // Different vendor cannot access vendor profile
        VendorEntity vendorB = vendorRepository.save(VendorEntity.builder()
                .vendorReference("VND-TEST-B")
                .businessName("Vendor B Org")
                .contactPerson("Person B")
                .email("vendor.b@vendor.test")
                .phone("1234567890")
                .category("CARPENTRY")
                .status("ACTIVE")
                .portalAccess("NOT_INVITED")
                .createdAt(java.time.LocalDateTime.now())
                .build());

        userRepository.save(UserEntity.builder()
                .username("vendor_b_crypto")
                .password(passwordEncoder.encode("p"))
                .role("ROLE_VENDOR")
                .vendorId(vendorB.getId()) // valid foreign key to vendor B
                .build());

        assertThrows(AccessDeniedException.class, () ->
                vendorService.getVendorById(created.getId(), vendorBAuth));
    }

    // =========================================================================
    // SECTION 5: CONVERTER INITIALIZATION, MEMORY VISIBILITY & CONCURRENCY TESTS
    // =========================================================================

    @Test
    @DisplayName("CONV-01: Converter supports default constructor via volatile static holder")
    void testConverter_DefaultConstructor_WithStaticHolder() {
        VendorBankDetailsEncryptionConverter converter = new VendorBankDetailsEncryptionConverter();
        String plaintext = "{\"accountNumber\":\"111222333\"}";
        String dbCol = converter.convertToDatabaseColumn(plaintext);
        assertNotNull(dbCol);
        assertTrue(dbCol.startsWith("enc:v1:"));
        assertEquals(plaintext, converter.convertToEntityAttribute(dbCol));
    }

    @Test
    @DisplayName("CONV-02: Converter fails closed when encryption service is uninitialized")
    void testConverter_FailsClosed_WhenUninitialized() {
        // Temporarily reset static holder
        VendorBankDetailsEncryptionConverter.resetStaticEncryptionService();
        try {
            VendorBankDetailsEncryptionConverter uninitializedConverter = new VendorBankDetailsEncryptionConverter();
            assertThrows(IllegalStateException.class, () ->
                    uninitializedConverter.convertToDatabaseColumn("{\"secret\":\"data\"}"));
            assertThrows(IllegalStateException.class, () ->
                    uninitializedConverter.convertToEntityAttribute("enc:v1:test:test"));
        } finally {
            // Restore static holder
            VendorBankDetailsEncryptionConverter.setStaticEncryptionService(aesGcmEncryptionService);
        }
    }

    @Test
    @DisplayName("CONV-03: Converter concurrent multi-threaded conversions are thread-safe")
    void testConverter_ConcurrentConversions_Safe() throws Exception {
        VendorBankDetailsEncryptionConverter converter = new VendorBankDetailsEncryptionConverter();
        int threads = 16;
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(threads);
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(threads);
        java.util.concurrent.atomic.AtomicInteger errors = new java.util.concurrent.atomic.AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    String plain = "{\"accountNumber\":\"ACC-" + index + "\"}";
                    String encrypted = converter.convertToDatabaseColumn(plain);
                    String decrypted = converter.convertToEntityAttribute(encrypted);
                    if (!plain.equals(decrypted)) {
                        errors.incrementAndGet();
                    }
                } catch (Exception e) {
                    errors.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(5, java.util.concurrent.TimeUnit.SECONDS);
        executor.shutdown();
        assertEquals(0, errors.get(), "Concurrent converter operations must produce zero errors");
    }

    // =========================================================================
    // SECTION 6: HISTORICAL PLAINTEXT DATA MAINTENANCE MIGRATION TESTS
    // =========================================================================

    @Test
    @DisplayName("MIGRATE-01: Migration utility detects, dry-runs, and safely migrates legacy plaintext records")
    void testMigrationUtility_FullLifecycle() {
        // 1. Insert 3 legacy plaintext vendors directly via JDBC (bypassing JPA converter)
        UUID v1 = UUID.randomUUID();
        UUID v2 = UUID.randomUUID();
        UUID v3 = UUID.randomUUID();

        String plain1 = "{\"accountNumber\":\"1001\",\"bank\":\"SBI\"}";
        String plain2 = "{\"accountNumber\":\"1002\",\"bank\":\"HDFC\"}";
        String plain3 = "{\"accountNumber\":\"1003\",\"bank\":\"ICICI\"}";

        jdbcTemplate.update("INSERT INTO vendors (id, vendor_reference, business_name, contact_person, email, phone, category, status, portal_access, bank_details_json, created_at, version) " +
                "VALUES (?, 'VND-LEG-1', 'Legacy 1', 'C1', 'leg1@test.com', '111', 'CARPENTRY', 'ACTIVE', 'NOT_INVITED', ?, CURRENT_TIMESTAMP, 0)", v1, plain1);
        jdbcTemplate.update("INSERT INTO vendors (id, vendor_reference, business_name, contact_person, email, phone, category, status, portal_access, bank_details_json, created_at, version) " +
                "VALUES (?, 'VND-LEG-2', 'Legacy 2', 'C2', 'leg2@test.com', '222', 'ELECTRICAL', 'ACTIVE', 'NOT_INVITED', ?, CURRENT_TIMESTAMP, 0)", v2, plain2);
        jdbcTemplate.update("INSERT INTO vendors (id, vendor_reference, business_name, contact_person, email, phone, category, status, portal_access, bank_details_json, created_at, version) " +
                "VALUES (?, 'VND-LEG-3', 'Legacy 3', 'C3', 'leg3@test.com', '333', 'HVAC', 'ACTIVE', 'NOT_INVITED', ?, CURRENT_TIMESTAMP, 0)", v3, plain3);

        // 2. Test Dry Run mode
        VendorBankingDataMigrationService.MigrationReport dryRunReport = migrationService.executeMigration(10, true);
        assertTrue(dryRunReport.isDryRun());
        assertEquals(0, dryRunReport.getMigratedCount(), "Dry run must NOT mutate database");
        assertFalse(dryRunReport.isAllPlaintextEliminated(), "Plaintext candidates must still exist");

        // Verify rows in DB are still plaintext
        String dbRow = jdbcTemplate.queryForObject("SELECT bank_details_json FROM vendors WHERE id = ?", String.class, v1);
        assertEquals(plain1, dbRow);

        // 3. Test Live Migration execution
        VendorBankingDataMigrationService.MigrationReport liveReport = migrationService.executeMigration(10, false);
        assertFalse(liveReport.isDryRun());
        assertTrue(liveReport.getMigratedCount() >= 3);
        assertEquals(0, liveReport.getFailedCount());
        assertTrue(liveReport.isAllPlaintextEliminated());

        // 4. Verify rows in DB now start with enc:v1:
        String encryptedDbRow1 = jdbcTemplate.queryForObject("SELECT bank_details_json FROM vendors WHERE id = ?", String.class, v1);
        assertNotNull(encryptedDbRow1);
        assertTrue(encryptedDbRow1.startsWith("enc:v1:"));
        assertFalse(encryptedDbRow1.contains("1001"));

        // 5. Verify transparent JPA read through repository
        VendorEntity loadedV1 = vendorRepository.findById(v1).orElseThrow();
        assertEquals(plain1, loadedV1.getBankDetailsJson());

        // 6. Test Idempotency (re-running on migrated DB produces 0 mutations)
        VendorBankingDataMigrationService.MigrationReport rerunReport = migrationService.executeMigration(10, false);
        assertEquals(0, rerunReport.getMigratedCount());
        assertEquals(0, rerunReport.getFailedCount());
        assertTrue(rerunReport.isAllPlaintextEliminated());
    }
}
