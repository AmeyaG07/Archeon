package com.webui.backend.security;

import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.service.MakerCheckerApprovalService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SecurityAndRbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private MakerCheckerApprovalService approvalService;

    @Autowired
    private BillApprovalRepository billApprovalRepository;

    @Autowired
    private com.webui.backend.service.FinancialOperationsService financialOperationsService;

    @Autowired
    private com.webui.backend.repository.CashSettlementRepository cashSettlementRepository;

    @Autowired
    private com.webui.backend.repository.PaymentTransactionRepository paymentTransactionRepository;

    private String randomBillId() {
        return "SEC-BILL-" + UUID.randomUUID().toString().substring(0, 8);
    }

    // =========================================================================
    // 1. ANONYMOUS REQUEST TESTS (MUST RETURN 401)
    // =========================================================================

    @Test
    @DisplayName("SEC-01: Anonymous financial approval requests are rejected with HTTP 401")
    void test_anonymousFinancialApprovalRequests_rejectedWith401() throws Exception {
        String billId = randomBillId();

        // Initiate
        mockMvc.perform(post("/api/approvals/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"billId\":\"" + billId + "\",\"amount\":50000,\"vendorId\":\"V-1\",\"projectId\":\"P-1\"}"))
                .andExpect(status().isUnauthorized());

        // Approve Primary
        mockMvc.perform(post("/api/approvals/" + billId + "/approve-primary"))
                .andExpect(status().isUnauthorized());

        // Approve Secondary
        mockMvc.perform(post("/api/approvals/" + billId + "/approve-secondary"))
                .andExpect(status().isUnauthorized());

        // Reject
        mockMvc.perform(post("/api/approvals/" + billId + "/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Fraudulent invoice\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-02: Anonymous financial operations mutations are rejected with HTTP 401")
    void test_anonymousFinancialOperations_rejectedWith401() throws Exception {
        // Payment proof submission
        mockMvc.perform(post("/api/finance/payment-proof")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"billId\":\"BILL-01\",\"amount\":10000}"))
                .andExpect(status().isUnauthorized());

        // Payment verification
        mockMvc.perform(post("/api/finance/verify-payment/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Reconciled\"}"))
                .andExpect(status().isUnauthorized());

        // Cash register approval
        mockMvc.perform(post("/api/finance/cash/CSH-REF-01/approve"))
                .andExpect(status().isUnauthorized());

        // Cash register initiation
        mockMvc.perform(post("/api/finance/cash/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"settlementRef\":\"CSH-01\",\"amount\":5000}"))
                .andExpect(status().isUnauthorized());

        // CSV export
        mockMvc.perform(get("/api/finance/reports/export-bills-csv"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-03: Anonymous lead harvest and tampering are rejected with HTTP 401")
    void test_anonymousLeadAccess_rejectedWith401() throws Exception {
        // Harvesting all leads
        mockMvc.perform(get("/api/leads"))
                .andExpect(status().isUnauthorized());

        // Tampering with lead status
        mockMvc.perform(patch("/api/leads/" + UUID.randomUUID() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"Lost\"}"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 2. PUBLIC ENDPOINT PRESERVATION (MUST RETURN 200)
    // =========================================================================

    @Test
    @DisplayName("SEC-04: Public consultation enquiry submission remains functional (HTTP 200)")
    void test_publicLeadSubmission_remainsFunctional() throws Exception {
        String leadJson = """
                {
                    "clientName": "Devendra Fadnavis",
                    "phone": "+919822001122",
                    "email": "devendra@example.com",
                    "serviceDiscipline": "ARCHITECTURE",
                    "location": "Nagpur, Maharashtra",
                    "budgetBand": "CR_1_TO_3",
                    "estimatedTimeline": "MONTHS_6_TO_12",
                    "projectBrief": "Civic library pavilion in Ramdaspeth",
                    "whatsappOptIn": true
                }
                """;

        mockMvc.perform(post("/api/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(leadJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.leadId").isNotEmpty());
    }

    @Test
    @DisplayName("SEC-05: Public portfolio, manifesto, and approval config remain functional (HTTP 200)")
    void test_publicReadEndpoints_remainFunctional() throws Exception {
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/manifesto"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/approvals/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.brandName").isNotEmpty())
                .andExpect(jsonPath("$.highValueThreshold").value(100000.0));
    }

    // =========================================================================
    // 3. ROLE-BASED ACCESS CONTROL (RBAC) & LEAST PRIVILEGE TESTS (403 FORBIDDEN)
    // =========================================================================

    @Test
    @WithMockUser(username = "client_sharma", roles = {"CLIENT"})
    @DisplayName("SEC-06: CLIENT role attempting primary approval is rejected with HTTP 403 Forbidden")
    void test_clientRoleAttemptingApproval_rejectedWith403() throws Exception {
        mockMvc.perform(post("/api/approvals/BILL-100/approve-primary"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "vendor_patel", roles = {"VENDOR"})
    @DisplayName("SEC-07: VENDOR role attempting cash settlement approval is rejected with HTTP 403 Forbidden")
    void test_vendorRoleAttemptingCashApproval_rejectedWith403() throws Exception {
        mockMvc.perform(post("/api/finance/cash/CSH-REF-01/approve"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "client_sharma", roles = {"CLIENT"})
    @DisplayName("SEC-08: CLIENT role attempting to query lead database is rejected with HTTP 403 Forbidden")
    void test_clientRoleAttemptingLeadHarvest_rejectedWith403() throws Exception {
        mockMvc.perform(get("/api/leads"))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 4. JWT VALIDATION & ROLE EXTRACTION (NEVER BLANKET ROLE_ADMIN)
    // =========================================================================

    @Test
    @DisplayName("SEC-09: Valid CLIENT token extracts ROLE_CLIENT and is blocked from ADMIN endpoints")
    void test_clientTokenDoesNotReceiveAdminRole() throws Exception {
        String clientToken = jwtTokenProvider.generateToken("client_user", "ROLE_CLIENT");

        // Client token accessing admin project creation -> MUST be 403 Forbidden
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"fake-proj\",\"title\":\"Fake\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-10: Valid ADMIN token extracts ROLE_ADMIN and successfully accesses admin endpoints")
    void test_adminTokenAccessesAdminEndpoints() throws Exception {
        String adminToken = jwtTokenProvider.generateToken("admin_mandar", "ROLE_ADMIN");

        // Admin token querying leads -> 200 OK
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("SEC-11: Invalid or malformed JWT token is rejected with HTTP 401 Unauthorized")
    void test_invalidJwtToken_rejectedWith401() throws Exception {
        mockMvc.perform(get("/api/leads")
                        .header("Authorization", "Bearer corrupted.token.payload"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 5. MAKER-CHECKER SEPARATION OF DUTIES ENFORCEMENT OVER HTTP
    // =========================================================================

    @Test
    @WithMockUser(username = "maker_vikas", roles = {"ADMIN"})
    @DisplayName("SEC-12: Maker cannot approve their own bill (Maker != Checker HTTP 400 enforcement)")
    void test_makerCannotApproveOwnBill_httpEnforcement() throws Exception {
        String billId = randomBillId();

        // 1. Initiate bill as maker_vikas
        mockMvc.perform(post("/api/approvals/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"billId\":\"" + billId + "\",\"amount\":40000,\"vendorId\":\"V-01\",\"projectId\":\"P-01\"}"))
                .andExpect(status().isOk());

        // 2. maker_vikas attempts to self-approve as primary checker
        mockMvc.perform(post("/api/approvals/" + billId + "/approve-primary"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Security Invariant Violation: Transaction initiator cannot approve their own bill (Maker != Checker)."));
    }

    @Test
    @DisplayName("SEC-13: High-Value bill requires two distinct checkers (Primary != Secondary)")
    void test_twoDistinctCheckersRequiredForHighValueBill() throws Exception {
        String billId = randomBillId();
        BigDecimal amount = new BigDecimal("250000.00");

        // 1. Initiated by maker_vikas
        approvalService.initiateBillApproval(billId, amount, "V-01", "P-01", "maker_vikas");

        // 2. Primary approval by checker_anita (as ADMIN)
        String anitaToken = jwtTokenProvider.generateToken("checker_anita", "ROLE_ADMIN");
        mockMvc.perform(post("/api/approvals/" + billId + "/approve-primary")
                        .header("Authorization", "Bearer " + anitaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_SECONDARY"));

        // 3. checker_anita attempts secondary approval on the same bill -> BLOCKED (HTTP 400)
        mockMvc.perform(post("/api/approvals/" + billId + "/approve-secondary")
                        .header("Authorization", "Bearer " + anitaToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Security Invariant Violation: Secondary approver must be distinct from primary approver."));

        // 4. Distinct checker_rahul approves secondary -> APPROVED (HTTP 200)
        String rahulToken = jwtTokenProvider.generateToken("checker_rahul", "ROLE_ADMIN");
        mockMvc.perform(post("/api/approvals/" + billId + "/approve-secondary")
                        .header("Authorization", "Bearer " + rahulToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    // =========================================================================
    // 6. AUTHORIZED FINANCE & OPERATIONS ACCESS TESTS
    // =========================================================================

    @Test
    @WithMockUser(username = "finance_director", roles = {"ADMIN"})
    @DisplayName("SEC-14: Authorized staff can access approvals, cash entries, and aging reports")
    void test_authorizedFinanceAccess_succeeds() throws Exception {
        mockMvc.perform(get("/api/approvals/all"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/finance/cash/all"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/finance/reports/aging-receivables"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currency").value("INR"));
    }

    // =========================================================================
    // 7. FINDING-02: GLOBAL CASH REGISTER ACCESS RBAC (CLIENT & VENDOR BLOCKED)
    // =========================================================================

    @Test
    @WithMockUser(username = "client_rohit", roles = {"CLIENT"})
    @DisplayName("FINDING-02: Client role is strictly blocked (HTTP 403) from global cash registers")
    void test_clientRoleBlockedFromGlobalCashRegister_returns403() throws Exception {
        mockMvc.perform(get("/api/finance/cash/all"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/finance/cash/site-ledger"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "vendor_marbles", roles = {"VENDOR"})
    @DisplayName("FINDING-02: Vendor role is strictly blocked (HTTP 403) from global cash registers")
    void test_vendorRoleBlockedFromGlobalCashRegister_returns403() throws Exception {
        mockMvc.perform(get("/api/finance/cash/all"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/finance/cash/site-ledger"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "finance_mgr", roles = {"FINANCE_MANAGER"})
    @DisplayName("FINDING-02: FINANCE_MANAGER role successfully accesses cash registers")
    void test_financeManagerCanAccessCashRegister_returns200() throws Exception {
        mockMvc.perform(get("/api/finance/cash/all"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "supervisor_site", roles = {"SITE_SUPERVISOR"})
    @DisplayName("FINDING-02: SITE_SUPERVISOR role successfully accesses cash registers")
    void test_siteSupervisorCanAccessCashRegister_returns200() throws Exception {
        mockMvc.perform(get("/api/finance/cash/all"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 8. FINDING-03: BILL OWNERSHIP / BOLA (BROKEN OBJECT-LEVEL AUTHORIZATION)
    // =========================================================================

    @Test
    @DisplayName("FINDING-03: Unauthorized cross-client cannot dispute bill (HTTP 403), authorized owner can (HTTP 200)")
    void test_billDispute_bolaEnforcement() throws Exception {
        String billId = randomBillId();
        // Bill assigned to CLIENT-ALPHA and VENDOR-ALPHA
        approvalService.initiateBillApproval(billId, new BigDecimal("10000.00"), "VENDOR-ALPHA", "CLIENT-ALPHA", "PROJ-101", "maker_user");

        // 1. Cross-client (CLIENT-BETA) attempts to dispute CLIENT-ALPHA's bill -> 403 Forbidden
        String clientBetaToken = jwtTokenProvider.generateToken("CLIENT-BETA", "ROLE_CLIENT");
        mockMvc.perform(post("/api/finance/dispute")
                        .header("Authorization", "Bearer " + clientBetaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"billId\":\"" + billId + "\",\"reason\":\"Unauthorized cross-client dispute\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: Principal 'CLIENT-BETA' is not authorized to access or mutate bill " + billId));

        // 2. Legitimate owner (CLIENT-ALPHA) disputes their own bill -> 200 OK
        String clientAlphaToken = jwtTokenProvider.generateToken("CLIENT-ALPHA", "ROLE_CLIENT");
        mockMvc.perform(post("/api/finance/dispute")
                        .header("Authorization", "Bearer " + clientAlphaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"billId\":\"" + billId + "\",\"reason\":\"Discrepancy in square footage billing\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.disputed").value(true))
                .andExpect(jsonPath("$.disputeReason").value("Discrepancy in square footage billing"));
    }

    @Test
    @DisplayName("FINDING-03: Unauthorized vendor cannot view bill transactions (HTTP 403), assigned vendor can (HTTP 200)")
    void test_billTransactions_bolaEnforcement() throws Exception {
        String billId = randomBillId();
        approvalService.initiateBillApproval(billId, new BigDecimal("25000.00"), "VENDOR-ALPHA", "CLIENT-ALPHA", "PROJ-102", "maker_user");

        // 1. Cross-vendor (VENDOR-BETA) queries transactions -> 403 Forbidden
        String vendorBetaToken = jwtTokenProvider.generateToken("VENDOR-BETA", "ROLE_VENDOR");
        mockMvc.perform(get("/api/finance/bills/" + billId + "/transactions")
                        .header("Authorization", "Bearer " + vendorBetaToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: Principal 'VENDOR-BETA' is not authorized to access or mutate bill " + billId));

        // 2. Assigned vendor (VENDOR-ALPHA) queries transactions -> 200 OK
        String vendorAlphaToken = jwtTokenProvider.generateToken("VENDOR-ALPHA", "ROLE_VENDOR");
        mockMvc.perform(get("/api/finance/bills/" + billId + "/transactions")
                        .header("Authorization", "Bearer " + vendorAlphaToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("FINDING-03: Unauthorized client cannot submit payment proof for another client's bill (HTTP 403)")
    void test_paymentProof_crossClientBlocked() throws Exception {
        String billId = randomBillId();
        approvalService.initiateBillApproval(billId, new BigDecimal("50000.00"), "VENDOR-ALPHA", "CLIENT-ALPHA", "PROJ-103", "maker_user");

        String clientBetaToken = jwtTokenProvider.generateToken("CLIENT-BETA", "ROLE_CLIENT");
        mockMvc.perform(post("/api/finance/payment-proof")
                        .header("Authorization", "Bearer " + clientBetaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"billId\":\"" + billId + "\",\"amount\":50000.00,\"paymentMode\":\"NEFT\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: Principal 'CLIENT-BETA' is not authorized to access or mutate bill " + billId));
    }

    // =========================================================================
    // 9. FINDING-04: SETTLED CASH VOUCHER MUTATION & DUPLICATE ACKNOWLEDGEMENT
    // =========================================================================

    @Test
    @DisplayName("FINDING-04: Cannot mutate settled cash voucher or submit duplicate acknowledgement (HTTP 400)")
    void test_settledCashVoucherMutation_blocked() throws Exception {
        String ref = "CSH-TEST-" + UUID.randomUUID().toString().substring(0, 6);
        String counterparty = "CP-VENDOR-01";

        // 1. Initiate cash settlement
        financialOperationsService.initiateCashSettlement(
                ref, "BILL-TEST", "PROJ-1", "supervisor_raj", counterparty,
                new BigDecimal("5000.00"), "Cement bag delivery", "RCPT-999"
        );

        String cpToken = jwtTokenProvider.generateToken(counterparty, "ROLE_VENDOR");

        // 2. Counterparty acknowledges voucher -> 200 OK
        mockMvc.perform(post("/api/finance/cash/" + ref + "/respond")
                        .header("Authorization", "Bearer " + cpToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"acknowledge\":true,\"notes\":\"Received cash\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counterpartyStatus").value("ACKNOWLEDGED"));

        // 3. Counterparty attempts duplicate acknowledgement -> 400 Bad Request
        mockMvc.perform(post("/api/finance/cash/" + ref + "/respond")
                        .header("Authorization", "Bearer " + cpToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"acknowledge\":true,\"notes\":\"Duplicate click\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Cash settlement is already in status: ACKNOWLEDGED"));

        // 4. Finance approves and finalizes the settlement
        String adminToken = jwtTokenProvider.generateToken("finance_lead", "ROLE_ADMIN");
        mockMvc.perform(post("/api/finance/cash/" + ref + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.financeApprovalStatus").value("SETTLED_VERIFIED"));

        // 5. Counterparty attempts to contest or alter an already finalized/settled voucher -> 400 Bad Request
        mockMvc.perform(post("/api/finance/cash/" + ref + "/respond")
                        .header("Authorization", "Bearer " + cpToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"acknowledge\":false,\"notes\":\"I changed my mind\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Cash settlement is already finalized and settled; counterparty response cannot be altered."));
    }

    // =========================================================================
    // 10. UNASSIGNED LEGACY BILLS & NO TRUST-ON-FIRST-USE (TOFU)
    // =========================================================================

    @Test
    @DisplayName("FINDING-03-HARDEN: Unassigned legacy bill is inaccessible to clients/vendors, accessible to internal staff")
    void test_unassignedLegacyBill_blockedFromClientAndVendor_allowedForInternalStaff() throws Exception {
        String billId = randomBillId();
        // Create an unassigned legacy bill (clientId is null)
        approvalService.initiateBillApproval(billId, new BigDecimal("45000.00"), "VND-LEGACY-01", "PROJ-LEGACY", "maker_legacy");

        // 1. Client attempts to access unassigned bill -> 403 Forbidden
        String clientToken = jwtTokenProvider.generateToken("client_random", "ROLE_CLIENT");
        mockMvc.perform(get("/api/finance/bills/" + billId + "/transactions")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: Principal 'client_random' is not authorized to access or mutate bill " + billId));

        // 2. Unrelated Vendor attempts to access unassigned bill -> 403 Forbidden
        String vendorToken = jwtTokenProvider.generateToken("vnd_random", "ROLE_VENDOR");
        mockMvc.perform(get("/api/finance/bills/" + billId + "/transactions")
                        .header("Authorization", "Bearer " + vendorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: Principal 'vnd_random' is not authorized to access or mutate bill " + billId));

        // 3. Authorized Internal Staff (FINANCE_MANAGER) accesses unassigned legacy bill -> 200 OK
        String financeToken = jwtTokenProvider.generateToken("finance_mgr", "ROLE_FINANCE_MANAGER");
        mockMvc.perform(get("/api/finance/bills/" + billId + "/transactions")
                        .header("Authorization", "Bearer " + financeToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("FINDING-03-HARDEN: Client cannot claim unassigned bill via first access (Zero TOFU)")
    void test_invalidOwnershipClaims_cannotClaimViaFirstAccess() throws Exception {
        String billId = randomBillId();
        approvalService.initiateBillApproval(billId, new BigDecimal("60000.00"), "VND-LEGACY-02", "PROJ-LEGACY", "maker_legacy");

        // Attacker attempts to claim bill via dispute endpoint
        String attackerToken = jwtTokenProvider.generateToken("client_attacker", "ROLE_CLIENT");
        mockMvc.perform(post("/api/finance/dispute")
                        .header("Authorization", "Bearer " + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"billId\":\"" + billId + "\",\"reason\":\"Claiming unassigned bill\"}"))
                .andExpect(status().isForbidden());

        // Verify that bill in repository STILL has null clientId (ownership was NOT established on first access)
        BillApprovalEntity bill = billApprovalRepository.findByBillId(billId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertNull(bill.getClientId(), "Legacy bill clientId MUST remain null; first access must never establish ownership.");
    }

    // =========================================================================
    // 11. FINANCIAL CSV EXPORT AUTHORIZATION RESTRICTIONS
    // =========================================================================

    @Test
    @DisplayName("CSV-01: Anonymous and client/vendor roles blocked from financial CSV export; staff/admin allowed")
    void test_exportBillsCsv_authorizationRestrictions() throws Exception {
        // 1. Anonymous -> 401 Unauthorized
        mockMvc.perform(get("/api/finance/reports/export-bills-csv"))
                .andExpect(status().isUnauthorized());

        // 2. Client role -> 403 Forbidden
        String clientToken = jwtTokenProvider.generateToken("client_user", "ROLE_CLIENT");
        mockMvc.perform(get("/api/finance/reports/export-bills-csv")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden());

        // 3. Vendor role -> 403 Forbidden
        String vendorToken = jwtTokenProvider.generateToken("vendor_user", "ROLE_VENDOR");
        mockMvc.perform(get("/api/finance/reports/export-bills-csv")
                        .header("Authorization", "Bearer " + vendorToken))
                .andExpect(status().isForbidden());

        // 4. Admin role -> 200 OK with CSV text
        String adminToken = jwtTokenProvider.generateToken("admin_user", "ROLE_ADMIN");
        mockMvc.perform(get("/api/finance/reports/export-bills-csv")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("text/csv")));
    }

    // =========================================================================
    // 12. CONFLICTING / DUPLICATE PRIMARY APPROVAL STATE ENFORCEMENT
    // =========================================================================

    @Test
    @DisplayName("CONCUR-01: Conflicting or duplicate primary approval is rejected with HTTP 400")
    void test_conflictingPrimaryApproval_stateValidationEnforced() throws Exception {
        String billId = randomBillId();
        approvalService.initiateBillApproval(billId, new BigDecimal("150000.00"), "VND-CONCUR", "CLIENT-CONCUR", "PRJ-CONCUR", "maker_user");

        String checker1Token = jwtTokenProvider.generateToken("checker_1", "ROLE_FINANCE_CHECKER");
        String checker2Token = jwtTokenProvider.generateToken("checker_2", "ROLE_FINANCE_CHECKER");

        // First approval succeeds
        mockMvc.perform(post("/api/approvals/" + billId + "/approve-primary")
                        .header("Authorization", "Bearer " + checker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_SECONDARY"));

        // Second conflicting primary approval on the same bill is rejected (HTTP 400)
        mockMvc.perform(post("/api/approvals/" + billId + "/approve-primary")
                        .header("Authorization", "Bearer " + checker2Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bill is not in PENDING_PRIMARY status: PENDING_SECONDARY"));
    }
}
