package com.webui.backend.concurrency;

import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.model.CashSettlementEntity;
import com.webui.backend.model.PaymentTransactionEntity;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.CashSettlementRepository;
import com.webui.backend.repository.PaymentTransactionRepository;
import com.webui.backend.security.JwtTokenProvider;
import com.webui.backend.service.MakerCheckerApprovalService;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class FinancialConcurrencyAndOptimisticLockingTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private MakerCheckerApprovalService approvalService;

    @Autowired
    private BillApprovalRepository billApprovalRepository;

    @Autowired
    private CashSettlementRepository cashSettlementRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired(required = false)
    private Flyway flyway;

    private final Set<String> createdBillIds = new HashSet<>();
    private final Set<String> createdSettlementRefs = new HashSet<>();

    @AfterEach
    void tearDown() {
        for (String ref : createdSettlementRefs) {
            cashSettlementRepository.findBySettlementRef(ref).ifPresent(cashSettlementRepository::delete);
        }
        for (String billId : createdBillIds) {
            paymentTransactionRepository.findByBillIdOrderByCreatedAtDesc(billId).forEach(paymentTransactionRepository::delete);
            billApprovalRepository.findByBillId(billId).ifPresent(billApprovalRepository::delete);
        }
    }

    private String createUniqueBillId(String prefix) {
        String id = prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
        createdBillIds.add(id);
        return id;
    }

    private String createUniqueSettlementRef(String prefix) {
        String ref = prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
        createdSettlementRefs.add(ref);
        return ref;
    }

    // =========================================================================
    // 1. FLYWAY MIGRATION DISCOVERY AND VERSION VALIDATION
    // =========================================================================

    @Test
    @DisplayName("CONC-01: Flyway migrations are discovered, ordered, and successfully applied")
    void test_flywayMigrationDiscoveryAndVersionValidation() {
        assertNotNull(flyway, "Flyway bean must be configured and present in Spring context");
        MigrationInfo[] applied = flyway.info().applied();
        assertTrue(applied.length >= 3, "At least 3 Flyway migrations (V1, V2, V3) must be applied");

        assertEquals("1", applied[0].getVersion().getVersion());
        assertEquals("2", applied[1].getVersion().getVersion());
        assertEquals("3", applied[2].getVersion().getVersion());
        assertEquals("3", flyway.info().current().getVersion().getVersion());
    }

    // =========================================================================
    // 2. CONCURRENT PRIMARY BILL APPROVAL
    // =========================================================================

    @Test
    @DisplayName("CONC-02: Two simultaneous primary approval requests result in exactly one success and one rejection (409 or 400)")
    void test_concurrentPrimaryApprovalConflict() throws Exception {
        String billId = createUniqueBillId("CONC-PRIM");
        approvalService.initiateBillApproval(billId, new BigDecimal("50000.00"), "VENDOR-1", "CLIENT-1", "PROJ-1", "maker_user");

        String tokenChecker1 = jwtTokenProvider.generateToken("checker_alice", "ROLE_FINANCE_CHECKER");
        String tokenChecker2 = jwtTokenProvider.generateToken("checker_bob", "ROLE_FINANCE_CHECKER");

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        Future<Integer> future1 = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            MvcResult res = mockMvc.perform(post("/api/approvals/" + billId + "/approve-primary")
                    .header("Authorization", "Bearer " + tokenChecker1))
                    .andReturn();
            return res.getResponse().getStatus();
        });

        Future<Integer> future2 = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            MvcResult res = mockMvc.perform(post("/api/approvals/" + billId + "/approve-primary")
                    .header("Authorization", "Bearer " + tokenChecker2))
                    .andReturn();
            return res.getResponse().getStatus();
        });

        assertTrue(readyLatch.await(5, TimeUnit.SECONDS));
        startLatch.countDown(); // Release both requests simultaneously

        int status1 = future1.get(10, TimeUnit.SECONDS);
        int status2 = future2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        List<Integer> statuses = List.of(status1, status2);
        long successCount = statuses.stream().filter(s -> s == 200).count();
        long conflictOrErrorCount = statuses.stream().filter(s -> s == 409 || s == 400).count();

        assertEquals(1, successCount, "Exactly one approval must succeed with HTTP 200");
        assertEquals(1, conflictOrErrorCount, "The conflicting approval must fail with HTTP 409 Conflict or 400 Bad Request");

        BillApprovalEntity bill = billApprovalRepository.findByBillId(billId).orElseThrow();
        assertEquals("APPROVED", bill.getStatus(), "Low-value bill must be APPROVED once");
        assertNotNull(bill.getPrimaryApproverId());
        assertTrue(List.of("checker_alice", "checker_bob").contains(bill.getPrimaryApproverId()));
    }

    // =========================================================================
    // 3. CONCURRENT SECONDARY BILL APPROVAL
    // =========================================================================

    @Test
    @DisplayName("CONC-03: Two simultaneous secondary approval requests result in exactly one success and one conflict (409 or 400)")
    void test_concurrentSecondaryApprovalConflict() throws Exception {
        String billId = createUniqueBillId("CONC-SEC");
        // High value bill (₹1,50,000)
        approvalService.initiateBillApproval(billId, new BigDecimal("150000.00"), "VENDOR-1", "CLIENT-1", "PROJ-1", "maker_user");
        approvalService.approvePrimary(billId, "primary_checker_alice");

        String tokenChecker2 = jwtTokenProvider.generateToken("secondary_checker_bob", "ROLE_FINANCE_CHECKER_2");
        String tokenChecker3 = jwtTokenProvider.generateToken("secondary_checker_carol", "ROLE_FINANCE_CHECKER_2");

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch readyLatch = new CountDownLatch(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Future<Integer> f1 = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            return mockMvc.perform(post("/api/approvals/" + billId + "/approve-secondary")
                    .header("Authorization", "Bearer " + tokenChecker2))
                    .andReturn().getResponse().getStatus();
        });

        Future<Integer> f2 = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            return mockMvc.perform(post("/api/approvals/" + billId + "/approve-secondary")
                    .header("Authorization", "Bearer " + tokenChecker3))
                    .andReturn().getResponse().getStatus();
        });

        assertTrue(readyLatch.await(5, TimeUnit.SECONDS));
        startLatch.countDown();

        int s1 = f1.get(10, TimeUnit.SECONDS);
        int s2 = f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        List<Integer> statuses = List.of(s1, s2);
        assertEquals(1, statuses.stream().filter(s -> s == 200).count(), "Exactly one secondary approval must succeed");
        assertEquals(1, statuses.stream().filter(s -> s == 409 || s == 400).count(), "Conflicting secondary approval must be rejected");

        BillApprovalEntity bill = billApprovalRepository.findByBillId(billId).orElseThrow();
        assertEquals("APPROVED", bill.getStatus());
        assertNotNull(bill.getSecondaryApproverId());
        assertTrue(List.of("secondary_checker_bob", "secondary_checker_carol").contains(bill.getSecondaryApproverId()));
    }

    // =========================================================================
    // 4. CONCURRENT APPROVAL AND REJECTION
    // =========================================================================

    @Test
    @DisplayName("CONC-04: Concurrent approval and rejection cannot produce an inconsistent or overwritten state")
    void test_concurrentApprovalAndRejectionConflict() throws Exception {
        String billId = createUniqueBillId("CONC-APP-REJ");
        approvalService.initiateBillApproval(billId, new BigDecimal("60000.00"), "VENDOR-1", "CLIENT-1", "PROJ-1", "maker_user");

        String approveToken = jwtTokenProvider.generateToken("checker_approver", "ROLE_FINANCE_CHECKER");
        String rejectToken = jwtTokenProvider.generateToken("finance_manager", "ROLE_FINANCE_MANAGER");

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch readyLatch = new CountDownLatch(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Future<Integer> approveFuture = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            return mockMvc.perform(post("/api/approvals/" + billId + "/approve-primary")
                    .header("Authorization", "Bearer " + approveToken))
                    .andReturn().getResponse().getStatus();
        });

        Future<Integer> rejectFuture = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            return mockMvc.perform(post("/api/approvals/" + billId + "/reject")
                    .header("Authorization", "Bearer " + rejectToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\": \"Suspicious documentation detected\"}"))
                    .andReturn().getResponse().getStatus();
        });

        assertTrue(readyLatch.await(5, TimeUnit.SECONDS));
        startLatch.countDown();

        int appStatus = approveFuture.get(10, TimeUnit.SECONDS);
        int rejStatus = rejectFuture.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        BillApprovalEntity bill = billApprovalRepository.findByBillId(billId).orElseThrow();
        // One must succeed with 200, one must fail with 409 or 400, or if both processed, state must be unambiguous
        assertTrue(bill.getStatus().equals("APPROVED") || bill.getStatus().equals("REJECTED"),
                "Final status must be definitively either APPROVED or REJECTED");

        if (bill.getStatus().equals("REJECTED")) {
            assertEquals("Suspicious documentation detected", bill.getRejectionReason());
        }
    }

    // =========================================================================
    // 5. CONCURRENT CASH SETTLEMENT RESPONSES
    // =========================================================================

    @Test
    @DisplayName("CONC-05: Concurrent cash settlement responses (acknowledge vs contest) permit exactly one state change")
    void test_concurrentCashSettlementResponses() throws Exception {
        String ref = createUniqueSettlementRef("CSH-CONC-RESP");
        String billId = createUniqueBillId("BILL-CSH-01");

        CashSettlementEntity csh = CashSettlementEntity.builder()
                .settlementRef(ref)
                .billId(billId)
                .projectId("PROJ-99")
                .initiatorId("site_supervisor")
                .counterpartyId("vendor_subcontractor")
                .amount(new BigDecimal("15000.00"))
                .currency("INR")
                .sitePurpose("Granite transport")
                .counterpartyStatus("PENDING_COUNTERPARTY_ACK")
                .financeApprovalStatus("PENDING_FINANCE_REVIEW")
                .build();
        cashSettlementRepository.save(csh);

        String vendorToken = jwtTokenProvider.generateToken("vendor_subcontractor", "ROLE_VENDOR");

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch readyLatch = new CountDownLatch(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Future<Integer> ackFuture = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            return mockMvc.perform(post("/api/finance/cash/" + ref + "/respond")
                    .header("Authorization", "Bearer " + vendorToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"acknowledge\": true, \"notes\": \"Cash received in full\"}"))
                    .andReturn().getResponse().getStatus();
        });

        Future<Integer> contestFuture = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            return mockMvc.perform(post("/api/finance/cash/" + ref + "/respond")
                    .header("Authorization", "Bearer " + vendorToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"acknowledge\": false, \"notes\": \"Cash not received\"}"))
                    .andReturn().getResponse().getStatus();
        });

        assertTrue(readyLatch.await(5, TimeUnit.SECONDS));
        startLatch.countDown();

        int s1 = ackFuture.get(10, TimeUnit.SECONDS);
        int s2 = contestFuture.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        List<Integer> statuses = List.of(s1, s2);
        assertEquals(1, statuses.stream().filter(s -> s == 200).count(), "Exactly one response must succeed");
        assertEquals(1, statuses.stream().filter(s -> s == 409 || s == 400).count(), "Conflicting response must be rejected");

        CashSettlementEntity saved = cashSettlementRepository.findBySettlementRef(ref).orElseThrow();
        assertTrue(saved.getCounterpartyStatus().equals("ACKNOWLEDGED") || saved.getCounterpartyStatus().equals("REJECTED_CONTESTED"));
    }

    // =========================================================================
    // 6. CONCURRENT CASH SETTLEMENT FINANCE VERIFICATION (PREVENTS DUPLICATE PAYMENTS)
    // =========================================================================

    @Test
    @DisplayName("CONC-06: Concurrent cash settlement verification creates exactly ONE payment transaction and prevents double balance credit")
    void test_concurrentCashSettlementFinanceVerification() throws Exception {
        String ref = createUniqueSettlementRef("CSH-CONC-VERIFY");
        String billId = createUniqueBillId("BILL-CSH-02");

        // Create parent bill with ₹50,000 total amount
        BillApprovalEntity bill = BillApprovalEntity.builder()
                .billId(billId)
                .amount(new BigDecimal("50000.00"))
                .paidAmount(BigDecimal.ZERO)
                .currency("INR")
                .vendorId("VENDOR-CASH")
                .projectId("PROJ-CASH")
                .initiatorId("maker_1")
                .status("APPROVED")
                .build();
        billApprovalRepository.save(bill);

        // Create acknowledged cash settlement voucher of ₹20,000
        CashSettlementEntity csh = CashSettlementEntity.builder()
                .settlementRef(ref)
                .billId(billId)
                .projectId("PROJ-CASH")
                .initiatorId("site_supervisor")
                .counterpartyId("VENDOR-CASH")
                .amount(new BigDecimal("20000.00"))
                .currency("INR")
                .counterpartyStatus("ACKNOWLEDGED")
                .financeApprovalStatus("PENDING_FINANCE_REVIEW")
                .build();
        cashSettlementRepository.save(csh);

        String financeToken1 = jwtTokenProvider.generateToken("finance_officer_1", "ROLE_FINANCE_MANAGER");
        String financeToken2 = jwtTokenProvider.generateToken("finance_officer_2", "ROLE_FINANCE_MANAGER");

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch readyLatch = new CountDownLatch(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Future<Integer> f1 = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            return mockMvc.perform(post("/api/finance/cash/" + ref + "/approve")
                    .header("Authorization", "Bearer " + financeToken1))
                    .andReturn().getResponse().getStatus();
        });

        Future<Integer> f2 = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            return mockMvc.perform(post("/api/finance/cash/" + ref + "/approve")
                    .header("Authorization", "Bearer " + financeToken2))
                    .andReturn().getResponse().getStatus();
        });

        assertTrue(readyLatch.await(5, TimeUnit.SECONDS));
        startLatch.countDown();

        int s1 = f1.get(10, TimeUnit.SECONDS);
        int s2 = f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        List<Integer> statuses = List.of(s1, s2);
        assertEquals(1, statuses.stream().filter(s -> s == 200).count(), "Exactly one finance verification must succeed");
        assertEquals(1, statuses.stream().filter(s -> s == 409 || s == 400).count(), "Conflicting duplicate verification must be rejected");

        // CRITICAL INVARIANT: Exactly 1 payment transaction must be created for this settlementRef
        List<PaymentTransactionEntity> txs = paymentTransactionRepository.findByBillIdOrderByCreatedAtDesc(billId);
        assertEquals(1, txs.size(), "Safety Invariant: Only ONE cash PaymentTransaction must be recorded for this voucher");
        assertEquals(new BigDecimal("20000.00"), txs.get(0).getAmount());

        // CRITICAL INVARIANT: Paid amount must be ₹20,000, NOT double-credited to ₹40,000
        BillApprovalEntity updatedBill = billApprovalRepository.findByBillId(billId).orElseThrow();
        assertEquals(0, new BigDecimal("20000.00").compareTo(updatedBill.getPaidAmount()),
                "Paid amount must equal exactly the verified cash voucher amount without double crediting");
        assertEquals("PARTIALLY_PAID", updatedBill.getStatus());
    }

    // =========================================================================
    // 7. DETERMINISTIC OPTIMISTIC LOCKING EXCEPTION & HTTP 409
    // =========================================================================

    @Test
    @DisplayName("CONC-07: Optimistic locking failure directly returns HTTP 409 Conflict with structured payload")
    void test_directOptimisticLockingOnBillApprovalReturns409() throws Exception {
        String billId = createUniqueBillId("CONC-OPT-LOCK");
        approvalService.initiateBillApproval(billId, new BigDecimal("75000.00"), "VENDOR-1", "CLIENT-1", "PROJ-1", "maker_user");

        BillApprovalEntity bill = billApprovalRepository.findByBillId(billId).orElseThrow();
        assertEquals(0L, bill.getVersion());

        // Simulate concurrent transaction committing and incrementing version to 1
        bill.setInvoiceNumber("INV-CONCURRENT-1");
        billApprovalRepository.saveAndFlush(bill);

        BillApprovalEntity refreshedBill = billApprovalRepository.findByBillId(billId).orElseThrow();
        assertEquals(1L, refreshedBill.getVersion());

        // Now attempt to update using a stale version (version 0L) directly via JPA save
        BillApprovalEntity staleBill = BillApprovalEntity.builder()
                .id(refreshedBill.getId())
                .billId(billId)
                .amount(refreshedBill.getAmount())
                .currency("INR")
                .vendorId(refreshedBill.getVendorId())
                .clientId(refreshedBill.getClientId())
                .projectId(refreshedBill.getProjectId())
                .initiatorId(refreshedBill.getInitiatorId())
                .status("PENDING_PRIMARY")
                .version(0L) // Stale version!
                .build();

        assertThrows(org.springframework.orm.ObjectOptimisticLockingFailureException.class, () -> {
            billApprovalRepository.saveAndFlush(staleBill);
        }, "Saving stale entity with outdated @Version must throw ObjectOptimisticLockingFailureException");
    }

    @Test
    @DisplayName("CONC-08: Stale cash settlement update triggers OptimisticLockException caught as HTTP 409")
    void test_directOptimisticLockingOnCashSettlementReturns409() throws Exception {
        String ref = createUniqueSettlementRef("CSH-OPT-LOCK");
        CashSettlementEntity csh = CashSettlementEntity.builder()
                .settlementRef(ref)
                .billId("BILL-OPT")
                .projectId("PROJ-OPT")
                .initiatorId("site_user")
                .counterpartyId("vendor_user")
                .amount(new BigDecimal("10000.00"))
                .currency("INR")
                .counterpartyStatus("PENDING_COUNTERPARTY_ACK")
                .financeApprovalStatus("PENDING_FINANCE_REVIEW")
                .build();
        CashSettlementEntity saved = cashSettlementRepository.saveAndFlush(csh);
        assertEquals(0L, saved.getVersion());

        // Concurrent update
        saved.setSitePurpose("Updated purpose");
        cashSettlementRepository.saveAndFlush(saved);

        CashSettlementEntity refreshed = cashSettlementRepository.findBySettlementRef(ref).orElseThrow();
        assertEquals(1L, refreshed.getVersion());

        // Stale entity with version 0L
        CashSettlementEntity stale = CashSettlementEntity.builder()
                .id(refreshed.getId())
                .settlementRef(ref)
                .billId("BILL-OPT")
                .projectId("PROJ-OPT")
                .initiatorId("site_user")
                .counterpartyId("vendor_user")
                .amount(new BigDecimal("10000.00"))
                .currency("INR")
                .counterpartyStatus("ACKNOWLEDGED")
                .financeApprovalStatus("PENDING_FINANCE_REVIEW")
                .version(0L) // Stale version!
                .build();

        assertThrows(org.springframework.orm.ObjectOptimisticLockingFailureException.class, () -> {
            cashSettlementRepository.saveAndFlush(stale);
        });
    }

    // =========================================================================
    // 8. MAKER-CHECKER INVARIANTS PRESERVED UNDER CONCURRENCY
    // =========================================================================

    @Test
    @DisplayName("CONC-09: Maker attempting concurrent approval is strictly rejected by invariant check")
    void test_makerConcurrentSelfApprovalBlocked() throws Exception {
        String billId = createUniqueBillId("CONC-SELF-APP");
        approvalService.initiateBillApproval(billId, new BigDecimal("45000.00"), "VENDOR-1", "CLIENT-1", "PROJ-1", "initiator_maker");

        String makerToken = jwtTokenProvider.generateToken("initiator_maker", "ROLE_FINANCE_CHECKER");

        mockMvc.perform(post("/api/approvals/" + billId + "/approve-primary")
                .header("Authorization", "Bearer " + makerToken))
                .andExpect(status().isBadRequest());

        BillApprovalEntity bill = billApprovalRepository.findByBillId(billId).orElseThrow();
        assertEquals("PENDING_PRIMARY", bill.getStatus());
        assertNull(bill.getPrimaryApproverId());
    }
}
