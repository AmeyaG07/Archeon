package com.webui.backend.invoicing;

import com.webui.backend.dto.dashboard.DashboardDto;
import com.webui.backend.dto.invoice.InvoiceDto;
import com.webui.backend.dto.notification.NotificationDto;
import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.InvoiceEntity;
import com.webui.backend.model.NotificationEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.ClientRepository;
import com.webui.backend.repository.InvoiceRepository;
import com.webui.backend.repository.NotificationRepository;
import com.webui.backend.service.DashboardService;
import com.webui.backend.service.InvoiceService;
import com.webui.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class InvoicingNotificationsAndDashboardsTest {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private AuditEventRepository auditEventRepository;

    private ClientEntity maharashtraClient;
    private ClientEntity karnatakaClient;
    private Authentication adminAuth;
    private Authentication clientAuth;
    private Authentication otherClientAuth;

    @BeforeEach
    public void setup() {
        // Setup Clients
        maharashtraClient = clientRepository.save(ClientEntity.builder()
                .clientReference("CLI-TEST-MH-" + UUID.randomUUID().toString().substring(0, 5))
                .fullName("Pune Luxury Villa Client")
                .email("mh.client." + UUID.randomUUID().toString().substring(0, 5) + "@example.com")
                .phone("+919822011223")
                .organization("Bhalekar Estates")
                .location("Koregaon Park, Pune, Maharashtra")
                .status("ACTIVE")
                .portalAccess("ACTIVE")
                .build());

        karnatakaClient = clientRepository.save(ClientEntity.builder()
                .clientReference("CLI-TEST-KA-" + UUID.randomUUID().toString().substring(0, 5))
                .fullName("Bengaluru Penthouse Client")
                .email("ka.client." + UUID.randomUUID().toString().substring(0, 5) + "@example.com")
                .phone("+919845011224")
                .organization("Bengaluru Urban Tech")
                .location("Indiranagar, Bengaluru, Karnataka")
                .status("ACTIVE")
                .portalAccess("ACTIVE")
                .build());

        adminAuth = new UsernamePasswordAuthenticationToken(
                "admin_user", "n/a", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        clientAuth = new UsernamePasswordAuthenticationToken(
                maharashtraClient.getEmail(), "n/a", List.of(new SimpleGrantedAuthority("ROLE_CLIENT"))
        );

        otherClientAuth = new UsernamePasswordAuthenticationToken(
                karnatakaClient.getEmail(), "n/a", List.of(new SimpleGrantedAuthority("ROLE_CLIENT"))
        );
    }

    // ==========================================
    // 1. INVOICING & INDIAN GST TAX TESTS
    // ==========================================

    @Test
    @DisplayName("INV-01: Create Intra-State Maharashtra Invoice with 9% CGST + 9% SGST")
    public void testCreateInvoice_IntraStateMaharashtra() {
        InvoiceDto.CreateInvoiceRequest request = InvoiceDto.CreateInvoiceRequest.builder()
                .clientId(maharashtraClient.getId())
                .projectId("PRJ-MH-01")
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .clientGstin("27ABCDE1234F1Z5") // State Code 27 = Maharashtra
                .notes("Architectural Concept and Schematic Design Phase")
                .items(List.of(
                        InvoiceDto.LineItemRequest.builder()
                                .description("Schematic Architectural Layout & Space Planning")
                                .sacCode("998321")
                                .quantity(BigDecimal.ONE)
                                .unitRate(BigDecimal.valueOf(100000.00))
                                .build(),
                        InvoiceDto.LineItemRequest.builder()
                                .description("3D Exterior Visualisation Renders (2 views)")
                                .sacCode("998321")
                                .quantity(BigDecimal.valueOf(2))
                                .unitRate(BigDecimal.valueOf(25000.00))
                                .build()
                ))
                .build();

        InvoiceDto.InvoiceResponse response = invoiceService.createInvoice(request, adminAuth);

        assertNotNull(response.getId());
        assertTrue(response.getInvoiceNumber().startsWith("INV-"));
        assertEquals(maharashtraClient.getId(), response.getClientId());
        assertEquals(BigDecimal.valueOf(150000.00).setScale(2), response.getSubtotal());

        // CGST (9%) & SGST (9%)
        assertEquals(BigDecimal.valueOf(9.00).setScale(2), response.getCgstRate());
        assertEquals(BigDecimal.valueOf(13500.00).setScale(2), response.getCgstAmount());
        assertEquals(BigDecimal.valueOf(9.00).setScale(2), response.getSgstRate());
        assertEquals(BigDecimal.valueOf(13500.00).setScale(2), response.getSgstAmount());

        // IGST (0%)
        assertEquals(BigDecimal.ZERO.setScale(2), response.getIgstRate().setScale(2));
        assertEquals(BigDecimal.ZERO.setScale(2), response.getIgstAmount().setScale(2));

        // Total = 150000 + 13500 + 13500 = 177000
        assertEquals(BigDecimal.valueOf(177000.00).setScale(2), response.getTotalAmount());
        assertEquals(BigDecimal.ZERO.setScale(2), response.getPaidAmount().setScale(2));
        assertEquals(BigDecimal.valueOf(177000.00).setScale(2), response.getOutstandingAmount());
        assertEquals("ISSUED", response.getStatus());
        assertEquals("998321", response.getSacCode());
        assertEquals("27AABCU9603R1ZM", response.getStudioGstin());
        assertEquals(2, response.getItems().size());
    }

    @Test
    @DisplayName("INV-02: Create Inter-State Invoice with 18% IGST")
    public void testCreateInvoice_InterStateKarnataka() {
        InvoiceDto.CreateInvoiceRequest request = InvoiceDto.CreateInvoiceRequest.builder()
                .clientId(karnatakaClient.getId())
                .projectId("PRJ-KA-01")
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(15))
                .clientGstin("29AABCT1332L1ZV") // State Code 29 = Karnataka
                .notes("Turnkey Interior Specification & BOQ Formulation")
                .items(List.of(
                        InvoiceDto.LineItemRequest.builder()
                                .description("Turnkey Interior Consultation & Execution Monitoring")
                                .sacCode("998321")
                                .quantity(BigDecimal.ONE)
                                .unitRate(BigDecimal.valueOf(200000.00))
                                .build()
                ))
                .build();

        InvoiceDto.InvoiceResponse response = invoiceService.createInvoice(request, adminAuth);

        assertEquals(BigDecimal.valueOf(200000.00).setScale(2), response.getSubtotal());
        // CGST & SGST must be 0
        assertEquals(BigDecimal.ZERO.setScale(2), response.getCgstAmount().setScale(2));
        assertEquals(BigDecimal.ZERO.setScale(2), response.getSgstAmount().setScale(2));

        // IGST must be 18% (36000.00)
        assertEquals(BigDecimal.valueOf(18.00).setScale(2), response.getIgstRate());
        assertEquals(BigDecimal.valueOf(36000.00).setScale(2), response.getIgstAmount());

        // Total = 200000 + 36000 = 236000
        assertEquals(BigDecimal.valueOf(236000.00).setScale(2), response.getTotalAmount());
    }

    @Test
    @DisplayName("INV-03: Record Partial and Full Payments with Accurate Running Balances")
    public void testRecordPayment_Lifecycle() {
        InvoiceDto.CreateInvoiceRequest request = InvoiceDto.CreateInvoiceRequest.builder()
                .clientId(maharashtraClient.getId())
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .clientGstin("27ABCDE1234F1Z5")
                .items(List.of(InvoiceDto.LineItemRequest.builder()
                        .description("Landscape Design Masterplan")
                        .quantity(BigDecimal.ONE)
                        .unitRate(BigDecimal.valueOf(100000.00))
                        .build()))
                .build();

        InvoiceDto.InvoiceResponse created = invoiceService.createInvoice(request, adminAuth);
        // Total = 100,000 + 18% GST = 118,000.00
        assertEquals(BigDecimal.valueOf(118000.00).setScale(2), created.getTotalAmount());

        // Partial payment 1: 50,000 INR
        InvoiceDto.RecordPaymentRequest p1 = InvoiceDto.RecordPaymentRequest.builder()
                .amount(BigDecimal.valueOf(50000.00))
                .paymentMode("BANK_TRANSFER")
                .transactionReference("UTR1234567890")
                .build();

        InvoiceDto.InvoiceResponse afterP1 = invoiceService.recordPayment(created.getId(), p1, adminAuth);
        assertEquals("PARTIALLY_PAID", afterP1.getStatus());
        assertEquals(BigDecimal.valueOf(50000.00).setScale(2), afterP1.getPaidAmount());
        assertEquals(BigDecimal.valueOf(68000.00).setScale(2), afterP1.getOutstandingAmount());

        // Final payment 2: 68,000 INR
        InvoiceDto.RecordPaymentRequest p2 = InvoiceDto.RecordPaymentRequest.builder()
                .amount(BigDecimal.valueOf(68000.00))
                .paymentMode("UPI")
                .transactionReference("UPI-HDFC-998877")
                .build();

        InvoiceDto.InvoiceResponse afterP2 = invoiceService.recordPayment(created.getId(), p2, adminAuth);
        assertEquals("PAID", afterP2.getStatus());
        assertEquals(BigDecimal.valueOf(118000.00).setScale(2), afterP2.getPaidAmount());
        assertEquals(BigDecimal.ZERO.setScale(2), afterP2.getOutstandingAmount());
    }

    @Test
    @DisplayName("INV-04: PDF Invoice Generation Produces Valid Standard PDF Structure")
    public void testInvoicePdfGeneration() {
        InvoiceDto.CreateInvoiceRequest request = InvoiceDto.CreateInvoiceRequest.builder()
                .clientId(maharashtraClient.getId())
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .clientGstin("27ABCDE1234F1Z5")
                .items(List.of(InvoiceDto.LineItemRequest.builder()
                        .description("Architectural Consultation")
                        .quantity(BigDecimal.ONE)
                        .unitRate(BigDecimal.valueOf(50000.00))
                        .build()))
                .build();

        InvoiceDto.InvoiceResponse created = invoiceService.createInvoice(request, adminAuth);
        byte[] pdfBytes = invoiceService.generatePdf(created.getId(), adminAuth);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "PDF size must be substantial");

        String pdfPrefix = new String(Arrays.copyOfRange(pdfBytes, 0, 8), StandardCharsets.US_ASCII);
        assertTrue(pdfPrefix.startsWith("%PDF-1.4"), "Must start with %PDF-1.4 header");

        String pdfString = new String(pdfBytes, StandardCharsets.ISO_8859_1);
        assertTrue(pdfString.contains("%%EOF"), "Must terminate with %%EOF marker");
        assertTrue(pdfString.contains("ARCHEON DESIGN STUDIO"), "Must contain studio title");
        assertTrue(pdfString.contains(created.getInvoiceNumber()), "Must contain invoice number");
        assertTrue(pdfString.contains("27AABCU9603R1ZM"), "Must contain studio GSTIN");
        assertTrue(pdfString.contains("998321"), "Must contain SAC code");
    }

    @Test
    @DisplayName("INV-05: Client Can Access Own Invoice but Cannot Access Another Client's Invoice")
    public void testInvoiceSecurity_BOLAIsolation() {
        InvoiceDto.CreateInvoiceRequest request = InvoiceDto.CreateInvoiceRequest.builder()
                .clientId(maharashtraClient.getId())
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .items(List.of(InvoiceDto.LineItemRequest.builder()
                        .description("Private Drawing Delivery")
                        .quantity(BigDecimal.ONE)
                        .unitRate(BigDecimal.valueOf(75000.00))
                        .build()))
                .build();

        InvoiceDto.InvoiceResponse created = invoiceService.createInvoice(request, adminAuth);

        // Owner Client can access
        assertDoesNotThrow(() -> invoiceService.getInvoiceById(created.getId(), clientAuth));

        // Foreign Client is blocked with AccessDeniedException
        assertThrows(AccessDeniedException.class, () ->
                invoiceService.getInvoiceById(created.getId(), otherClientAuth)
        );

        // Foreign Client PDF download is also blocked
        assertThrows(AccessDeniedException.class, () ->
                invoiceService.generatePdf(created.getId(), otherClientAuth)
        );
    }

    // ==========================================
    // 2. IN-APP NOTIFICATION CENTER TESTS
    // ==========================================

    @Test
    @DisplayName("NOTIF-01: Send, Query, and Mark Notification as Read")
    public void testNotification_SendAndReadLifecycle() {
        String testUser = "client.user.1@example.com";

        NotificationEntity notif = notificationService.sendNotification(
                testUser, "Bill Approved", "Your drawing bill has been verified.", "BILLING", "/client/invoices"
        );

        assertNotNull(notif.getId());
        assertFalse(notif.getReadStatus());

        NotificationDto.UnreadCountResponse count1 = notificationService.getUnreadCount(testUser);
        assertEquals(1, count1.getUnreadCount());

        NotificationDto.NotificationResponse read = notificationService.markAsRead(notif.getId(), testUser);
        assertTrue(read.getReadStatus());

        NotificationDto.UnreadCountResponse count2 = notificationService.getUnreadCount(testUser);
        assertEquals(0, count2.getUnreadCount());
    }

    @Test
    @DisplayName("NOTIF-02: Mark All Notifications as Read for User")
    public void testNotification_MarkAllAsRead() {
        String testUser = "client.user.bulk@example.com";

        notificationService.sendNotification(testUser, "Notice 1", "Msg 1", "SYSTEM", null);
        notificationService.sendNotification(testUser, "Notice 2", "Msg 2", "BILLING", null);
        notificationService.sendNotification(testUser, "Notice 3", "Msg 3", "PROJECT", null);

        assertEquals(3, notificationService.getUnreadCount(testUser).getUnreadCount());

        int marked = notificationService.markAllAsRead(testUser);
        assertEquals(3, marked);
        assertEquals(0, notificationService.getUnreadCount(testUser).getUnreadCount());
    }

    @Test
    @DisplayName("NOTIF-03: User Cannot Mark Another User's Notification as Read")
    public void testNotification_OwnershipSecurity() {
        String owner = "owner@example.com";
        String attacker = "attacker@example.com";

        NotificationEntity notif = notificationService.sendNotification(owner, "Secret", "Private Info", "SYSTEM", null);

        assertThrows(AccessDeniedException.class, () ->
                notificationService.markAsRead(notif.getId(), attacker)
        );
    }

    // ==========================================
    // 3. DASHBOARDS & AGING METRICS TESTS
    // ==========================================

    @Test
    @DisplayName("DASH-01: Admin Dashboard Aggregates Receivables, Aging, and Activity Stream")
    public void testAdminDashboard_Aggregations() {
        // Create an overdue invoice (due yesterday)
        InvoiceDto.CreateInvoiceRequest overdueReq = InvoiceDto.CreateInvoiceRequest.builder()
                .clientId(maharashtraClient.getId())
                .issueDate(LocalDate.now().minusDays(40))
                .dueDate(LocalDate.now().minusDays(10))
                .items(List.of(InvoiceDto.LineItemRequest.builder()
                        .description("Overdue Inspection Milestone")
                        .quantity(BigDecimal.ONE)
                        .unitRate(BigDecimal.valueOf(100000.00))
                        .build()))
                .build();
        invoiceService.createInvoice(overdueReq, adminAuth);

        DashboardDto.AdminDashboardResponse adminDash = dashboardService.getAdminDashboard();

        assertNotNull(adminDash);
        assertTrue(adminDash.getTotalClientsCount() >= 2);
        assertTrue(adminDash.getTotalReceivables().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(adminDash.getOverdueReceivables().compareTo(BigDecimal.ZERO) > 0);
        assertNotNull(adminDash.getAging());
        assertTrue(adminDash.getAging().getDays1To30().compareTo(BigDecimal.ZERO) > 0);
        assertNotNull(adminDash.getRecentActivities());
    }

    @Test
    @DisplayName("DASH-02: Client Dashboard Returns Client-Scoped Projects and Bills")
    public void testClientDashboard_Scoping() {
        DashboardDto.ClientDashboardResponse clientDash = dashboardService.getClientDashboard(clientAuth);

        assertNotNull(clientDash);
        assertEquals("Pune Luxury Villa Client", clientDash.getClientName());
        assertTrue(clientDash.getClientReference().startsWith("CLI-TEST-MH-"));
    }

    // ==========================================
    // 4. GLOBAL AUDIT CENTER QUERY TESTS
    // ==========================================

    @Test
    @DisplayName("AUDIT-01: Global Audit Center Filter Queries")
    public void testGlobalAuditCenter_Filtering() {
        auditEventRepository.save(AuditEventEntity.builder()
                .actorId("admin_user")
                .actorRole("ROLE_ADMIN")
                .action("SYSTEM_CONFIG_UPDATED")
                .entityName("Configuration")
                .entityId("CONF-001")
                .timestamp(LocalDateTime.now())
                .build());

        Page<AuditEventEntity> page = auditEventRepository.queryAuditEvents(
                "Configuration", "admin_user", "SYSTEM_CONFIG_UPDATED",
                LocalDateTime.now().minusHours(1), LocalDateTime.now().plusHours(1),
                PageRequest.of(0, 10)
        );

        assertNotNull(page);
        assertTrue(page.getTotalElements() >= 1);
        assertEquals("Configuration", page.getContent().get(0).getEntityName());
    }
}
