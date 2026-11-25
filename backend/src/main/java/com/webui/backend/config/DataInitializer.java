package com.webui.backend.config;

import com.webui.backend.controller.ArchitectLedgerController;
import com.webui.backend.dto.document.DocumentDto.CreateDocumentRequest;
import com.webui.backend.model.ArchitectLedgerEntryEntity;
import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.LeadEntity;
import com.webui.backend.model.ManifestoEntity;
import com.webui.backend.model.NotificationEntity;
import com.webui.backend.model.OperationalProjectEntity;
import com.webui.backend.model.ProjectEntity;
import com.webui.backend.model.ProjectVendorAssignmentEntity;
import com.webui.backend.model.SiteUpdateEntity;
import com.webui.backend.model.StudioProfileEntity;
import com.webui.backend.model.SupportTicketEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.model.VendorPaymentMethodEntity;
import com.webui.backend.repository.ArchitectAuditReportRepository;
import com.webui.backend.repository.ArchitectLedgerEntryRepository;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.CashSettlementRepository;
import com.webui.backend.repository.ClientRepository;
import com.webui.backend.repository.DocumentRepository;
import com.webui.backend.repository.LeadRepository;
import com.webui.backend.repository.ManifestoRepository;
import com.webui.backend.repository.NotificationRepository;
import com.webui.backend.repository.OperationalProjectRepository;
import com.webui.backend.repository.ProjectRepository;
import com.webui.backend.repository.ProjectVendorAssignmentRepository;
import com.webui.backend.repository.SiteUpdateRepository;
import com.webui.backend.repository.StudioProfileRepository;
import com.webui.backend.repository.SupportTicketRepository;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.repository.VendorPaymentMethodRepository;
import com.webui.backend.repository.VendorRepository;
import com.webui.backend.service.DocumentService;
import com.webui.backend.service.FinancialOperationsService;
import com.webui.backend.service.MakerCheckerApprovalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
@Profile({"dev", "development", "test", "local", "default"})
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private Environment environment;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ManifestoRepository manifestoRepository;

    @Autowired(required = false)
    private StudioProfileRepository studioProfileRepository;

    @Autowired
    private BillApprovalRepository billApprovalRepository;

    @Autowired
    private MakerCheckerApprovalService approvalService;

    @Autowired
    private FinancialOperationsService financialOperationsService;

    @Autowired
    private CashSettlementRepository cashSettlementRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired(required = false)
    private VendorPaymentMethodRepository vendorPaymentMethodRepository;

    @Autowired(required = false)
    private OperationalProjectRepository operationalProjectRepository;

    @Autowired(required = false)
    private ProjectVendorAssignmentRepository projectVendorAssignmentRepository;

    @Autowired(required = false)
    private SiteUpdateRepository siteUpdateRepository;

    @Autowired(required = false)
    private ArchitectLedgerEntryRepository architectLedgerEntryRepository;

    @Autowired(required = false)
    private ArchitectAuditReportRepository architectAuditReportRepository;

    @Autowired(required = false)
    private ArchitectLedgerController architectLedgerController;

    @Autowired(required = false)
    private LeadRepository leadRepository;

    @Autowired(required = false)
    private SupportTicketRepository supportTicketRepository;

    @Autowired(required = false)
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private DocumentRepository documentRepository;

    @Autowired(required = false)
    private DocumentService documentService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (!isSeedingPermitted()) {
            return;
        }

        // 1. Seed Studio Personnel & Operational Role Users
        seedUserIfMissing("admin", "ROLE_ADMIN");
        seedUserIfMissing("admin_mandar", "ROLE_ADMIN");
        seedUserIfMissing("admin_user", "ROLE_ADMIN");
        seedUserIfMissing("finance_lead", "ROLE_ADMIN");
        seedUserIfMissing("finance_mgr", "ROLE_FINANCE_MANAGER");
        seedUserIfMissing("finance_manager", "ROLE_FINANCE_MANAGER");
        seedUserIfMissing("finance_officer_1", "ROLE_FINANCE_MANAGER");
        seedUserIfMissing("finance_officer_2", "ROLE_FINANCE_MANAGER");
        seedUserIfMissing("checker_anita", "ROLE_ADMIN");
        seedUserIfMissing("checker_rahul", "ROLE_ADMIN");
        seedUserIfMissing("checker_1", "ROLE_FINANCE_CHECKER");
        seedUserIfMissing("checker_2", "ROLE_FINANCE_CHECKER");
        seedUserIfMissing("checker_alice", "ROLE_FINANCE_CHECKER");
        seedUserIfMissing("checker_bob", "ROLE_FINANCE_CHECKER");
        seedUserIfMissing("checker_approver", "ROLE_FINANCE_CHECKER");
        seedUserIfMissing("secondary_checker_bob", "ROLE_FINANCE_CHECKER_2");
        seedUserIfMissing("secondary_checker_carol", "ROLE_FINANCE_CHECKER_2");
        seedUserIfMissing("maker_user", "ROLE_FINANCE_MAKER");
        seedUserIfMissing("initiator_maker", "ROLE_FINANCE_CHECKER");
        seedUserIfMissing("supervisor_raj", "ROLE_SITE_SUPERVISOR");

        // Seed Client & Vendor Identified Entities
        seedUserIfMissing("client_user", "ROLE_CLIENT");
        seedUserIfMissing("CLIENT-ALPHA", "ROLE_CLIENT");
        seedUserIfMissing("CLIENT-BETA", "ROLE_CLIENT");
        seedUserIfMissing("client_random", "ROLE_CLIENT");
        seedUserIfMissing("client_attacker", "ROLE_CLIENT");
        seedUserIfMissing("vendor_user", "ROLE_VENDOR");
        seedUserIfMissing("VENDOR-ALPHA", "ROLE_VENDOR");
        seedUserIfMissing("VENDOR-BETA", "ROLE_VENDOR");
        seedUserIfMissing("vendor_subcontractor", "ROLE_VENDOR");
        seedUserIfMissing("vnd_random", "ROLE_VENDOR");
        seedUserIfMissing("CP-VENDOR-01", "ROLE_VENDOR");

        List<String> activeList = environment != null ? Arrays.asList(environment.getActiveProfiles()) : List.of();
        if (activeList.contains("test") || isJUnitPresent()) {
            seedTestBaseline();
        } else {
            seedManualTwoRecordDataset();
        }
    }

    private boolean isJUnitPresent() {
        try {
            Class.forName("org.junit.jupiter.api.Test", false, getClass().getClassLoader());
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }

    private void seedManualTwoRecordDataset() throws Exception {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        // 1. Seed 2 Clients
        ClientEntity client1 = null;
        ClientEntity client2 = null;
        if (clientRepository.count() == 0) {
            client1 = clientRepository.save(ClientEntity.builder()
                    .clientReference("CLI-2026-01")
                    .fullName("Rohan Kulkarni")
                    .email("client_user@studioarcheon.com")
                    .phone("+91 9820112233")
                    .organization("Kulkarni Private Residences")
                    .location("Khandala, Maharashtra")
                    .status("ACTIVE")
                    .portalAccess("ACTIVE")
                    .createdAt(now.minusDays(20))
                    .build());

            client2 = clientRepository.save(ClientEntity.builder()
                    .clientReference("CLI-2026-02")
                    .fullName("Meera Deshmukh")
                    .email("meera.deshmukh@studioarcheon.com")
                    .phone("+91 9820445566")
                    .organization("Deshmukh Heritage Holdings")
                    .location("Worli, Mumbai")
                    .status("ACTIVE")
                    .portalAccess("ACTIVE")
                    .createdAt(now.minusDays(14))
                    .build());

            final ClientEntity c1Ref = client1;
            userRepository.findByUsername("client_user").ifPresent(u -> {
                u.setClientId(c1Ref.getId());
                u.setEmail(c1Ref.getEmail());
                u.setFullName(c1Ref.getFullName());
                userRepository.save(u);
            });
            final ClientEntity c2Ref = client2;
            userRepository.findByUsername("CLIENT-BETA").ifPresent(u -> {
                u.setClientId(c2Ref.getId());
                u.setEmail(c2Ref.getEmail());
                u.setFullName(c2Ref.getFullName());
                userRepository.save(u);
            });
        } else {
            List<ClientEntity> existingClients = clientRepository.findAll();
            if (!existingClients.isEmpty()) client1 = existingClients.get(0);
            if (existingClients.size() > 1) client2 = existingClients.get(1);
        }

        // 2. Seed 2 Vendors + Bank / UPI Payment Methods
        VendorEntity vendor1 = null;
        VendorEntity vendor2 = null;
        if (vendorRepository.count() == 0) {
            vendor1 = vendorRepository.save(VendorEntity.builder()
                    .vendorReference("VEN-2026-01")
                    .businessName("Stellar Joinery & Architectural Millwork")
                    .contactPerson("Vikram Sharma")
                    .email("vendor_user@studioarcheon.com")
                    .phone("+91 9820778899")
                    .category("CARPENTRY")
                    .location("Pune, Maharashtra")
                    .gstin("27AABCS1429B1Z5")
                    .pan("AABCS1429B")
                    .status("ACTIVE")
                    .portalAccess("ACTIVE")
                    .createdAt(now.minusDays(22))
                    .build());

            vendor2 = vendorRepository.save(VendorEntity.builder()
                    .vendorReference("VEN-2026-02")
                    .businessName("Deccan Basalt & Travertine Studio")
                    .contactPerson("Kavita Nair")
                    .email("kavita@deccanbasalt.in")
                    .phone("+91 9820889900")
                    .category("STONE_MASONRY")
                    .location("Nagpur, Maharashtra")
                    .gstin("27AABCD8841M1Z2")
                    .pan("AABCD8841M")
                    .status("ACTIVE")
                    .portalAccess("ACTIVE")
                    .createdAt(now.minusDays(18))
                    .build());

            final VendorEntity v1Ref = vendor1;
            userRepository.findByUsername("vendor_user").ifPresent(u -> {
                u.setVendorId(v1Ref.getId());
                u.setEmail(v1Ref.getEmail());
                u.setFullName(v1Ref.getBusinessName());
                userRepository.save(u);
            });
            final VendorEntity v2Ref = vendor2;
            userRepository.findByUsername("VENDOR-BETA").ifPresent(u -> {
                u.setVendorId(v2Ref.getId());
                u.setEmail(v2Ref.getEmail());
                u.setFullName(v2Ref.getBusinessName());
                userRepository.save(u);
            });

            if (vendorPaymentMethodRepository != null) {
                vendorPaymentMethodRepository.save(VendorPaymentMethodEntity.builder()
                        .vendorId(vendor1.getId())
                        .accountHolderName("Stellar Joinery & Architectural Millwork Pvt Ltd")
                        .bankName("HDFC Bank")
                        .accountNumber("50200044198231")
                        .ifscCode("HDFC0000142")
                        .upiId("stellar.joinery@okicici")
                        .qrCodeUrl("/projects/monolith-sanctuary.png")
                        .build());
                vendorPaymentMethodRepository.save(VendorPaymentMethodEntity.builder()
                        .vendorId(vendor2.getId())
                        .accountHolderName("Deccan Basalt & Travertine Studio LLP")
                        .bankName("ICICI Bank")
                        .accountNumber("000905018734")
                        .ifscCode("ICIC0000009")
                        .upiId("deccan.basalt@okaxis")
                        .qrCodeUrl("/projects/travertine-penthouse.png")
                        .build());
            }
        } else {
            List<VendorEntity> existingVendors = vendorRepository.findAll();
            if (!existingVendors.isEmpty()) vendor1 = existingVendors.get(0);
            if (existingVendors.size() > 1) vendor2 = existingVendors.get(1);
        }

        // 3. Seed Philosophy & 2 Studio Office Addresses
        if (manifestoRepository.count() == 0) {
            manifestoRepository.save(ManifestoEntity.builder()
                    .title("/// ARCHEON DESIGN PHILOSOPHY")
                    .headline("Sculpting spaces from raw earth, monolithic stone, and controlled light. Where elemental purity meets precision execution.")
                    .paragraphsJson("[\"We design and build considered spatial environments that harmonize architectural form, interior craft, landscape, and turnkey engineering.\", \"Rooted in geographic context and geological permanence, every commission moves seamlessly from working drawings to site execution.\"]")
                    .build());
        }

        if (studioProfileRepository != null && studioProfileRepository.count() == 0) {
            studioProfileRepository.save(StudioProfileEntity.builder()
                    .principalName("Ar. Mandar Bhalekar")
                    .phone("+91 9834653481")
                    .email("dsarcheon@gmail.com")
                    .socialHandle("@mbs_archeon_ds")
                    .officesJson("[" +
                            "{\"id\":\"office-nagpur-hq\",\"label\":\"Nagpur Headquarters\",\"address\":\"1st Floor, Krishna-Kunj, 90, Dharampeth Layout, opposite Aaji Aajoba Park, Deendayal Nagar, Nagpur, Maharashtra 440022\",\"mapsUrl\":\"https://maps.app.goo.gl/wLidaC62gQLccoNY8\",\"isPrimary\":true}," +
                            "{\"id\":\"office-mumbai-atelier\",\"label\":\"Mumbai Design Atelier\",\"address\":\"Suite 402, Heritage Courtyard, Kala Ghoda, Fort, Mumbai, Maharashtra 400001\",\"mapsUrl\":\"https://maps.app.goo.gl/wLidaC62gQLccoNY8\",\"isPrimary\":false}" +
                            "]")
                    .build());
        }

        // 4. Seed 2 Website Showcase Projects
        if (projectRepository.count() == 0) {
            projectRepository.save(ProjectEntity.builder()
                    .id("the-monolith-sanctuary")
                    .code("PRJ_ARCH_2026_01")
                    .title("The Monolith Sanctuary")
                    .image("/projects/monolith-sanctuary.png")
                    .category("Residential")
                    .location("Khandala, Maharashtra")
                    .area("8,500 sq.ft")
                    .status("Completed")
                    .projectYear("2026")
                    .releaseDate("15/02/2026")
                    .temperature(24)
                    .summaryTitle("////// RESIDENTIAL ARCHITECTURE")
                    .summary("A subterranean cliffside retreat sculpted into basalt rock, featuring central travertine light-wells and reflecting water pools in Khandala, Maharashtra.")
                    .tagsJson("[\"BRUTALIST STONE\",\"CANTILEVER\"]")
                    .linksJson("[{\"name\":\"Portfolio Case Study\",\"url\":\"#the-monolith-sanctuary\"}]")
                    .socialsJson("[{\"platform\":\"Instagram\",\"url\":\"https://instagram.com/mbs_archeon_ds\"}]")
                    .accentColor("#d97706")
                    .build());

            projectRepository.save(ProjectEntity.builder()
                    .id("carrara-stone-penthouse")
                    .code("PRJ_INT_2025_04")
                    .title("The Travertine Penthouse")
                    .image("/projects/travertine-penthouse.png")
                    .category("Interior")
                    .location("Worli, Mumbai")
                    .area("4,200 sq.ft")
                    .status("Under Execution")
                    .projectYear("2026")
                    .releaseDate("10/11/2026")
                    .temperature(28)
                    .summaryTitle("////// INTERIOR ARCHITECTURE")
                    .summary("A minimalist coastal residence finished with monolithic travertine wall planes, brushed bronze joinery, and concealed circadian lighting channels in Worli, Mumbai.")
                    .tagsJson("[\"WARM MINIMALISM\",\"TRAVERTINE\"]")
                    .linksJson("[{\"name\":\"Portfolio Case Study\",\"url\":\"#carrara-stone-penthouse\"}]")
                    .socialsJson("[{\"platform\":\"Instagram\",\"url\":\"https://instagram.com/mbs_archeon_ds\"}]")
                    .accentColor("#ea580c")
                    .build());
        }

        // 5. Seed 2 Operational Projects & Vendor Assignments
        OperationalProjectEntity opProj1 = null;
        OperationalProjectEntity opProj2 = null;
        if (operationalProjectRepository != null && operationalProjectRepository.count() == 0 && client1 != null && client2 != null) {
            opProj1 = operationalProjectRepository.save(OperationalProjectEntity.builder()
                    .projectReference("OPR-2026-01")
                    .name("Khandala Cliffside Residence")
                    .description("Complete architectural structure, basalt stonework, and bespoke teakwood interior execution.")
                    .projectType("RESIDENTIAL_ARCHITECTURE")
                    .clientId(client1.getId())
                    .projectManagerUsername("Ar. Mandar Bhalekar")
                    .siteAddress("Plot 14, Duke Ridge, Khandala, Maharashtra")
                    .contractValue(new BigDecimal("8500000.00"))
                    .budgetAllocated(new BigDecimal("7200000.00"))
                    .status("IN_PROGRESS")
                    .progressPercentage(62)
                    .startDate(today.minusMonths(3))
                    .lastVisitDate(today.minusDays(2))
                    .expectedCompletionDate(today.plusMonths(5))
                    .notes("Plinth waterproofing and atrium shuttering inspected on site.")
                    .createdAt(now.minusDays(15))
                    .build());

            opProj2 = operationalProjectRepository.save(OperationalProjectEntity.builder()
                    .projectReference("OPR-2026-02")
                    .name("Worli Sky Penthouse")
                    .description("Full-floor luxury interior fit-out, acoustic ceiling systems, and Italian marble cladding.")
                    .projectType("COMMERCIAL_INTERIOR")
                    .clientId(client2.getId())
                    .projectManagerUsername("Ar. Mandar Bhalekar")
                    .siteAddress("Level 38, Seaface Enclave, Worli, Mumbai")
                    .contractValue(new BigDecimal("4800000.00"))
                    .budgetAllocated(new BigDecimal("4000000.00"))
                    .status("IN_PROGRESS")
                    .progressPercentage(38)
                    .startDate(today.minusMonths(2))
                    .lastVisitDate(today.minusDays(5))
                    .expectedCompletionDate(today.plusMonths(4))
                    .notes("Travertine bookmatch mock-up approved by client.")
                    .createdAt(now.minusDays(10))
                    .build());

            if (projectVendorAssignmentRepository != null && vendor1 != null && vendor2 != null) {
                projectVendorAssignmentRepository.save(ProjectVendorAssignmentEntity.builder()
                        .projectId(opProj1.getId())
                        .vendorId(vendor1.getId())
                        .scopeOfWork("Teakwood Joinery, Pivot Doors & Architectural Millwork")
                        .status("ACTIVE")
                        .contractAmount(new BigDecimal("1850000.00"))
                        .assignedBy("admin")
                        .notes("Shop drawings approved")
                        .build());
                projectVendorAssignmentRepository.save(ProjectVendorAssignmentEntity.builder()
                        .projectId(opProj1.getId())
                        .vendorId(vendor2.getId())
                        .scopeOfWork("Hand-Dressed Basalt Masonry & Atrium Travertine")
                        .status("ACTIVE")
                        .contractAmount(new BigDecimal("1420000.00"))
                        .assignedBy("admin")
                        .notes("Dry-lay inspection scheduled")
                        .build());
                projectVendorAssignmentRepository.save(ProjectVendorAssignmentEntity.builder()
                        .projectId(opProj2.getId())
                        .vendorId(vendor1.getId())
                        .scopeOfWork("Concealed Wardrobe Paneling & Lounge Fluted Timbers")
                        .status("ACTIVE")
                        .contractAmount(new BigDecimal("1120000.00"))
                        .assignedBy("admin")
                        .notes("Veneer flitches locked")
                        .build());
                projectVendorAssignmentRepository.save(ProjectVendorAssignmentEntity.builder()
                        .projectId(opProj2.getId())
                        .vendorId(vendor2.getId())
                        .scopeOfWork("Honed Travertine Living Floor & Vanity Slabs")
                        .status("ACTIVE")
                        .contractAmount(new BigDecimal("960000.00"))
                        .assignedBy("admin")
                        .notes("Slab thickness verified")
                        .build());
            }
        }

        // 6. Seed 2 Site Updates per Operational Project (Architect Notes + Progress Photos)
        if (siteUpdateRepository != null && siteUpdateRepository.count() == 0 && opProj1 != null && opProj2 != null) {
            siteUpdateRepository.save(SiteUpdateEntity.builder()
                    .projectId(opProj1.getId())
                    .authorRole("ARCHITECT")
                    .authorName("Ar. Mandar Bhalekar")
                    .photoUrl("/projects/monolith-sanctuary.png")
                    .note("Basalt plinth retaining wall cured cleanly; double-height sky-well shuttering aligned to structural grid.")
                    .createdAt(now.minusDays(5))
                    .build());
            siteUpdateRepository.save(SiteUpdateEntity.builder()
                    .projectId(opProj1.getId())
                    .authorRole("ARCHITECT")
                    .authorName("Ar. Mandar Bhalekar")
                    .photoUrl("/projects/travertine-penthouse.png")
                    .note("Interior joinery sub-frames fixed in Living Pavilion; circadian cove lighting conduits pressure-tested.")
                    .createdAt(now.minusDays(2))
                    .build());

            siteUpdateRepository.save(SiteUpdateEntity.builder()
                    .projectId(opProj2.getId())
                    .authorRole("ARCHITECT")
                    .authorName("Ar. Mandar Bhalekar")
                    .photoUrl("/projects/travertine-penthouse.png")
                    .note("Travertine bookmatch dry-lay inspected in studio bay; acoustic ceiling suspension grids leveled.")
                    .createdAt(now.minusDays(4))
                    .build());
            siteUpdateRepository.save(SiteUpdateEntity.builder()
                    .projectId(opProj2.getId())
                    .authorRole("ARCHITECT")
                    .authorName("Ar. Mandar Bhalekar")
                    .photoUrl("/projects/monolith-sanctuary.png")
                    .note("Master suite bronze framing hardware delivered; glazing tolerance check cleared.")
                    .createdAt(now.minusDays(1))
                    .build());
        }

        // 7. Seed 2 Bills / Invoices (Linked to Project 1 & Client 1)
        if (billApprovalRepository.count() == 0 && opProj1 != null && client1 != null) {
            billApprovalRepository.save(BillApprovalEntity.builder()
                    .billId("BILL-2026-01")
                    .invoiceNumber("INV-SJ-2026-01")
                    .billType("VENDOR_TO_STUDIO")
                    .amount(new BigDecimal("125000.00"))
                    .paidAmount(BigDecimal.ZERO)
                    .tradeCategory("CARPENTRY")
                    .currency("INR")
                    .vendorId("VEN-2026-01")
                    .clientId(client1.getId().toString())
                    .projectId(opProj1.getId().toString())
                    .initiatorId("vendor_user")
                    .billPhotoUrl("/projects/monolith-sanctuary.png")
                    .status("PENDING_PRIMARY")
                    .isHighValue(true)
                    .createdAt(now.minusDays(3))
                    .build());

            billApprovalRepository.save(BillApprovalEntity.builder()
                    .billId("BILL-2026-02")
                    .invoiceNumber("INV-DB-2026-02")
                    .billType("VENDOR_TO_STUDIO")
                    .amount(new BigDecimal("85000.00"))
                    .paidAmount(new BigDecimal("85000.00"))
                    .tradeCategory("STONE_MASONRY")
                    .currency("INR")
                    .vendorId("VEN-2026-02")
                    .clientId(client1.getId().toString())
                    .projectId(opProj1.getId().toString())
                    .initiatorId("admin")
                    .primaryApproverId("checker_anita")
                    .primaryApprovedAt(now.minusDays(2))
                    .paidAt(now.minusDays(1))
                    .billPhotoUrl("/projects/travertine-penthouse.png")
                    .paymentProofUtr("UTR9948201122")
                    .status("APPROVED")
                    .isHighValue(false)
                    .createdAt(now.minusDays(6))
                    .build());
        }

        // 8. Seed 2 Two-Party Cash Settlements
        if (cashSettlementRepository.count() == 0 && opProj1 != null) {
            financialOperationsService.initiateCashSettlement(
                    "CSH-2026-01",
                    "BILL-2026-01",
                    opProj1.getId().toString(),
                    "supervisor_raj",
                    "VEN-2026-01",
                    new BigDecimal("35000.00"),
                    "Seasoned Burma teakwood hardware site delivery & unloading",
                    "RCPT-SJ-401"
            );
            financialOperationsService.initiateCashSettlement(
                    "CSH-2026-02",
                    "BILL-2026-02",
                    opProj1.getId().toString(),
                    "supervisor_raj",
                    "VEN-2026-02",
                    new BigDecimal("18500.00"),
                    "Hand-dressed basalt coping stone site dressing crew advance",
                    "RCPT-DB-402"
            );
        }

        // 9. Seed 2 Architect Revenue & Expense Ledger Entries + 2 Stored CA Audit Reports
        if (architectLedgerEntryRepository != null && architectLedgerEntryRepository.count() == 0 && client1 != null && vendor1 != null) {
            architectLedgerEntryRepository.save(ArchitectLedgerEntryEntity.builder()
                    .entryType("REVENUE")
                    .sourceType("CLIENT")
                    .sourceId(client1.getId().toString())
                    .sourceName(client1.getFullName())
                    .amount(new BigDecimal("350000.00"))
                    .transactionDate(today.minusDays(12))
                    .paymentMode("BANK_TRANSFER")
                    .category("Architectural Design Retainer")
                    .referenceNumber("NEFT-ARC-2026-01")
                    .notes("Stage II Concept & Working Drawings Milestone Payment")
                    .recordedBy("admin")
                    .createdAt(now.minusDays(12))
                    .build());

            architectLedgerEntryRepository.save(ArchitectLedgerEntryEntity.builder()
                    .entryType("EXPENSE")
                    .sourceType("VENDOR")
                    .sourceId(vendor1.getId().toString())
                    .sourceName(vendor1.getBusinessName())
                    .amount(new BigDecimal("68000.00"))
                    .transactionDate(today.minusDays(4))
                    .paymentMode("UPI")
                    .category("Structural & Site Consultation")
                    .referenceNumber("UPI-ARC-2026-02")
                    .notes("Mock-up sample fabrication and site survey travel")
                    .recordedBy("admin")
                    .createdAt(now.minusDays(4))
                    .build());

            if (architectLedgerController != null && architectAuditReportRepository != null && architectAuditReportRepository.count() == 0) {
                Authentication adminAuth = new UsernamePasswordAuthenticationToken(
                        "admin",
                        "N/A",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
                ArchitectLedgerController.GenerateReportRequest r1 = new ArchitectLedgerController.GenerateReportRequest();
                r1.setPeriodFilter("MONTHLY");
                r1.setYear(today.getYear());
                r1.setMonth(today.getMonthValue());
                r1.setTitle("Monthly CA Audit Summary — " + today.getMonth().name() + " " + today.getYear());
                architectLedgerController.generateAndStoreAuditReport(r1, adminAuth);

                Thread.sleep(5);

                ArchitectLedgerController.GenerateReportRequest r2 = new ArchitectLedgerController.GenerateReportRequest();
                r2.setPeriodFilter("YEARLY");
                r2.setYear(today.getYear());
                r2.setTitle("Annual CA Audit Ledger FY " + today.getYear());
                architectLedgerController.generateAndStoreAuditReport(r2, adminAuth);
            }
        }

        // 10. Seed 2 Public Consultation Leads
        if (leadRepository != null && leadRepository.count() == 0) {
            LeadEntity l1 = new LeadEntity(
                    "Vikramaditya Joshi",
                    "+91 9823011223",
                    "v.joshi@khandalahomes.in",
                    "ARCHITECTURE",
                    "Lonavala, Maharashtra",
                    "₹1.5Cr+",
                    "9 - 12 Months",
                    "Hilltop monolithic weekend residence on a 1.2 acre basalt plot.",
                    true
            );
            leadRepository.save(l1);

            LeadEntity l2 = new LeadEntity(
                    "Ananya Rao",
                    "+91 9819445522",
                    "ananya.rao@studioatelier.in",
                    "INTERIOR",
                    "Bandra West, Mumbai",
                    "₹50L – ₹1Cr",
                    "4 - 6 Months",
                    "Complete interior architecture and bespoke furniture for sea-facing duplex.",
                    true
            );
            l2.setStatus("CONTACTED");
            leadRepository.save(l2);
        }

        // 11. Seed 2 Client Support Inquiries
        if (supportTicketRepository != null && supportTicketRepository.count() == 0) {
            supportTicketRepository.save(SupportTicketEntity.builder()
                    .ticketReference("TKT-2026-01")
                    .username("client_user")
                    .userRole("CLIENT")
                    .subject("Travertine slab sample finish confirmation")
                    .category("Material Selection")
                    .priority("Normal")
                    .status("Open")
                    .relatedReference("OPR-2026-01 / Living Pavilion")
                    .assignedTeam("Studio Architecture Desk")
                    .description("Please confirm if the honed unfilled travertine sample matches our atrium daylight mood board.")
                    .messagesJson("[{\"id\":\"m1\",\"message\":\"Please confirm if the honed unfilled travertine sample matches our atrium daylight mood board.\",\"senderLabel\":\"client_user\",\"sentAt\":\"" + now.minusDays(2) + "\",\"isStaff\":false}]")
                    .createdAt(now.minusDays(2))
                    .updatedAt(now.minusDays(2))
                    .build());

            supportTicketRepository.save(SupportTicketEntity.builder()
                    .ticketReference("TKT-2026-02")
                    .username("client_user")
                    .userRole("CLIENT")
                    .subject("Revised concealed lighting circuit layout")
                    .category("Drawings & Renders")
                    .priority("High")
                    .status("Resolved")
                    .relatedReference("OPR-2026-01 / R1 Electrical")
                    .assignedTeam("Principal Studio Review")
                    .description("Requesting updated dimmer zone schedule for the master courtyard pergola.")
                    .messagesJson("[{\"id\":\"m2\",\"message\":\"Updated electrical dimming circuit sheet R2 uploaded to Document Library.\",\"senderLabel\":\"ArcheOn Studio\",\"sentAt\":\"" + now.minusDays(1) + "\",\"isStaff\":true}]")
                    .createdAt(now.minusDays(5))
                    .updatedAt(now.minusDays(1))
                    .build());
        }

        // 12. Seed 2 Client Notifications & 2 Vendor Notifications
        if (notificationRepository != null && notificationRepository.count() == 0) {
            notificationRepository.save(NotificationEntity.builder()
                    .recipientUsername("client_user")
                    .title("Site Inspection Progress Updated")
                    .message("Ar. Mandar Bhalekar posted 2 site photos and notes for Khandala Cliffside Residence.")
                    .category("PROJECT")
                    .readStatus(false)
                    .actionUrl("/client/projects")
                    .createdAt(now.minusHours(4))
                    .build());
            notificationRepository.save(NotificationEntity.builder()
                    .recipientUsername("client_user")
                    .title("New Vendor Invoice Logged")
                    .message("Stellar Joinery bill BILL-2026-01 (₹1,25,000.00) is listed in your Invoices & Bills queue.")
                    .category("INVOICE")
                    .readStatus(true)
                    .actionUrl("/client/invoices")
                    .createdAt(now.minusDays(1))
                    .build());

            notificationRepository.save(NotificationEntity.builder()
                    .recipientUsername("vendor_user")
                    .title("Assigned to Khandala Cliffside Residence")
                    .message("Active scope issued for Teakwood Joinery, Pivot Doors & Architectural Millwork.")
                    .category("PROJECT")
                    .readStatus(false)
                    .actionUrl("/vendor/projects")
                    .createdAt(now.minusDays(2))
                    .build());
            notificationRepository.save(NotificationEntity.builder()
                    .recipientUsername("vendor_user")
                    .title("Cash Settlement Request Logged")
                    .message("Cash settlement CSH-2026-01 (₹35,000.00) is awaiting acknowledgement.")
                    .category("PAYMENT")
                    .readStatus(true)
                    .actionUrl("/vendor/cash-settlements")
                    .createdAt(now.minusDays(1))
                    .build());
        }

        // 13. Seed 2 Shared Documents (Valid PDF bytes stored cleanly via DocumentService)
        if (documentRepository != null && documentService != null && documentRepository.count() == 0 && client1 != null && opProj1 != null) {
            Authentication adminAuth = new UsernamePasswordAuthenticationToken(
                    "admin",
                    "N/A",
                    List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
            byte[] samplePdf = ("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n" +
                    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n" +
                    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj\n" +
                    "trailer << /Root 1 0 R >>\n%%EOF\n").getBytes(StandardCharsets.UTF_8);

            documentService.uploadDocument(
                    CreateDocumentRequest.builder()
                            .title("GF Architectural Working Drawing Rev-02")
                            .category("BLUEPRINT_DRAWING")
                            .description("Approved ground floor structural & joinery working drawing set.")
                            .securityClassification("PUBLIC_CLIENT")
                            .clientId(client1.getId())
                            .projectId(opProj1.getId())
                            .build(),
                    new InMemoryMultipartFile("file", "GF-Working-Drawing-Rev02.pdf", "application/pdf", samplePdf),
                    adminAuth
            );

            documentService.uploadDocument(
                    CreateDocumentRequest.builder()
                            .title("Turnkey Architecture & Supervision Agreement")
                            .category("CONTRACT")
                            .description("Signed project execution scope, milestones, and payment schedule.")
                            .securityClassification("PUBLIC_CLIENT")
                            .clientId(client1.getId())
                            .projectId(opProj1.getId())
                            .build(),
                    new InMemoryMultipartFile("file", "Turnkey-Agreement-2026.pdf", "application/pdf", samplePdf),
                    adminAuth
            );
        }
    }

    private void seedTestBaseline() {
        // Seed Demo Client & Vendor Organizations
        if (clientRepository != null && clientRepository.count() == 0) {
            ClientEntity demoClient = clientRepository.save(ClientEntity.builder()
                    .clientReference("CLI-DEMO-01")
                    .fullName("Studio Client")
                    .email("client_user@studioarcheon.com")
                    .phone("+919876543210")
                    .organization("ArcheOn Private Client")
                    .location("Mumbai, Maharashtra")
                    .status("ACTIVE")
                    .portalAccess("ACTIVE")
                    .createdAt(java.time.LocalDateTime.now())
                    .build());
            userRepository.findByUsername("client_user").ifPresent(u -> {
                u.setClientId(demoClient.getId());
                u.setEmail(demoClient.getEmail());
                u.setFullName(demoClient.getFullName());
                userRepository.save(u);
            });
        }

        if (vendorRepository != null && vendorRepository.count() == 0) {
            VendorEntity demoVendor = vendorRepository.save(VendorEntity.builder()
                    .vendorReference("VEN-DEMO-01")
                    .businessName("Stellar Joinery & Architectural Millwork")
                    .contactPerson("Trade Contractor")
                    .email("vendor_user@studioarcheon.com")
                    .phone("+919123456789")
                    .category("CARPENTRY")
                    .location("Pune, Maharashtra")
                    .gstin("27AABCU9603R1ZM")
                    .pan("ABCDE1234F")
                    .status("ACTIVE")
                    .portalAccess("ACTIVE")
                    .createdAt(java.time.LocalDateTime.now())
                    .build());
            userRepository.findByUsername("vendor_user").ifPresent(u -> {
                u.setVendorId(demoVendor.getId());
                u.setEmail(demoVendor.getEmail());
                userRepository.save(u);
            });
        }

        // 2. Seed ArcheOn Philosophy & Mission (PDF Section 1.1)
        if (manifestoRepository.count() == 0) {
            manifestoRepository.save(ManifestoEntity.builder()
                    .title("/// ARCHEON DESIGN PHILOSOPHY")
                    .headline("Sculpting spaces from raw earth, monolithic stone, and controlled light. Where elemental purity meets precision execution.")
                    .paragraphsJson("[\"We design and build considered spatial environments that seamlessly harmonize architectural form, interior craft, natural landscape, and turnkey engineering.\", \"Rooted in geographic context, climate responsiveness, and geological permanence, every project is an individual response to natural terrain.\", \"By integrating architectural design with single-window turnkey execution, we eliminate the friction between concept drawings and on-site material craftsmanship.\"]")
                    .build());
        }

        if (studioProfileRepository != null && studioProfileRepository.count() == 0) {
            studioProfileRepository.save(StudioProfileEntity.builder()
                    .principalName("Ar. Mandar Bhalekar")
                    .phone("+91 9834653481")
                    .email("dsarcheon@gmail.com")
                    .socialHandle("@mbs_archeon_ds")
                    .officesJson("[{\"id\":\"office-nagpur-hq\",\"label\":\"Nagpur Headquarters\",\"address\":\"1st Floor, Krishna-Kunj, 90, Dharampeth Layout, opposite Aaji Aajoba Park, Deendayal Nagar, Nagpur, Maharashtra 440022\",\"mapsUrl\":\"https://maps.app.goo.gl/wLidaC62gQLccoNY8\",\"isPrimary\":true}]")
                    .build());
        }

        // 3. Seed ArcheOn Built Case Studies (PDF Section 4.2 & 4.3)
        if (projectRepository.count() == 0) {
            projectRepository.save(ProjectEntity.builder()
                    .id("the-monolith-sanctuary")
                    .code("PRJ_ARCH_2026_01")
                    .title("The Monolith Sanctuary")
                    .image("/projects/monolith-sanctuary.png")
                    .category("Residential")
                    .location("Khandala, Maharashtra")
                    .area("8,500 sq.ft")
                    .status("Completed")
                    .projectYear("2026")
                    .releaseDate("15/02/2026")
                    .temperature(24)
                    .summaryTitle("////// RESIDENTIAL ARCHITECTURE")
                    .summary("A subterranean cliffside retreat sculpted into basalt rock, featuring central travertine light-wells and reflecting water pools in Khandala, Maharashtra.")
                    .tagsJson("[\"BRUTALIST STONE\",\"CANTILEVER\",\"SUSTAINABLE GEOLOGY\"]")
                    .linksJson("[{\"name\":\"Portfolio Case Study\",\"url\":\"#the-monolith-sanctuary\"}]")
                    .socialsJson("[{\"platform\":\"Instagram\",\"url\":\"https://instagram.com/mbs_archeon_ds\"}]")
                    .accentColor("#d97706")
                    .build());

            projectRepository.save(ProjectEntity.builder()
                    .id("carrara-stone-penthouse")
                    .code("PRJ_INT_2025_04")
                    .title("The Travertine Penthouse")
                    .image("/projects/travertine-penthouse.png")
                    .category("Interior")
                    .location("Worli, Mumbai")
                    .area("4,200 sq.ft")
                    .status("Completed")
                    .projectYear("2025")
                    .releaseDate("10/11/2025")
                    .temperature(28)
                    .summaryTitle("////// INTERIOR ARCHITECTURE")
                    .summary("A minimalist coastal residence finished with monolithic travertine wall planes, brushed bronze joinery, and concealed circadian lighting channels in Worli, Mumbai.")
                    .tagsJson("[\"WARM MINIMALISM\",\"TRAVERTINE\",\"BESPOKE JOINERY\"]")
                    .linksJson("[{\"name\":\"Portfolio Case Study\",\"url\":\"#carrara-stone-penthouse\"}]")
                    .socialsJson("[{\"platform\":\"Instagram\",\"url\":\"https://instagram.com/mbs_archeon_ds\"}]")
                    .accentColor("#ea580c")
                    .build());

            projectRepository.save(ProjectEntity.builder()
                    .id("terracotta-courtyard-estate")
                    .code("PRJ_LAND_2026_02")
                    .title("Terracotta Courtyard Estate")
                    .image("/projects/terracotta-courtyard-estate.png")
                    .category("Landscape")
                    .location("Alibaug, Maharashtra")
                    .area("2.5 Acres")
                    .status("Under Execution")
                    .projectYear("2026")
                    .releaseDate("05/04/2026")
                    .temperature(30)
                    .summaryTitle("////// LANDSCAPE ARCHITECTURE")
                    .summary("A multi-tiered coastal landscape ecosystem with stepped rainwater bio-swales, endemic tropical groves, and earthen water bodies in Alibaug, Maharashtra.")
                    .tagsJson("[\"ECO-LANDSCAPE\",\"RAINWATER HARVESTING\",\"NATIVE FLORA\"]")
                    .linksJson("[{\"name\":\"Portfolio Case Study\",\"url\":\"#terracotta-courtyard-estate\"}]")
                    .socialsJson("[{\"platform\":\"Instagram\",\"url\":\"https://instagram.com/mbs_archeon_ds\"}]")
                    .accentColor("#059669")
                    .build());
        }

        // 4. Seed Initial Maker-Checker Bills (PDF Decision 2)
        if (billApprovalRepository.count() == 0) {
            // Bill 1: Below ₹1,00,000 threshold (Needs 1 checker)
            approvalService.initiateBillApproval(
                    "BILL-2026-081",
                    new BigDecimal("45000.00"),
                    "VND-GEOTECH-01",
                    "the-monolith-sanctuary",
                    "site_engineer_rahul"
            );

            // Bill 2: High Value >= ₹1,00,000 (Needs 2 checkers)
            approvalService.initiateBillApproval(
                    "BILL-2026-094",
                    new BigDecimal("385000.00"),
                    "VND-BASALT-STONE-04",
                    "the-monolith-sanctuary",
                    "procurement_lead_vikas"
            );

            // Bill 3: High Value with 1st Approval Completed (Pending Checker 2)
            approvalService.initiateBillApproval(
                    "BILL-2026-102",
                    new BigDecimal("120000.00"),
                    "VND-GLAZING-02",
                    "carrara-stone-penthouse",
                    "ar_mandar_lead"
            );
            approvalService.approvePrimary("BILL-2026-102", "finance_checker_anita");
        }

        // 5. Seed Two-Party Cash Settlement Request (Section 11)
        if (cashSettlementRepository.count() == 0) {
            financialOperationsService.initiateCashSettlement(
                    "CSH-SETTLE-409",
                    "BILL-2026-081",
                    "the-monolith-sanctuary",
                    "site_supervisor_arun",
                    "VND-082",
                    new BigDecimal("35000.00"),
                    "Raw granite unloading and manual site transit (Khandala Project)",
                    "RCPT-GRANITE-881"
            );
        }
    }

    private static class InMemoryMultipartFile implements MultipartFile {
        private final String name;
        private final String originalFilename;
        private final String contentType;
        private final byte[] content;

        InMemoryMultipartFile(String name, String originalFilename, String contentType, byte[] content) {
            this.name = name;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
            this.content = content;
        }

        @Override public String getName() { return name; }
        @Override public String getOriginalFilename() { return originalFilename; }
        @Override public String getContentType() { return contentType; }
        @Override public boolean isEmpty() { return content.length == 0; }
        @Override public long getSize() { return content.length; }
        @Override public byte[] getBytes() { return content; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(content); }
        @Override public void transferTo(File dest) throws IOException { Files.write(dest.toPath(), content); }
    }

    private boolean isSeedingPermitted() {
        if (environment == null) {
            return false;
        }

        String[] activeProfiles = environment.getActiveProfiles();
        List<String> activeList = Arrays.asList(activeProfiles);

        // Strictly reject if any production, staging, or live profile is active
        if (activeList.contains("prod") ||
                activeList.contains("production") ||
                activeList.contains("staging") ||
                activeList.contains("live")) {
            return false;
        }

        // Allowlist verification: seeding is only permitted in dev, test, local, or default profiles
        return activeList.isEmpty() ||
                activeList.contains("default") ||
                activeList.contains("dev") ||
                activeList.contains("development") ||
                activeList.contains("test") ||
                activeList.contains("local");
    }

    private void seedUserIfMissing(String username, String role) {
        if (!userRepository.existsByUsername(username)) {
            userRepository.save(UserEntity.builder()
                    .username(username)
                    .password(passwordEncoder.encode("Password123!"))
                    .role(role)
                    .enabled(true)
                    .tokenVersion(0L)
                    .build());
        }
    }
}
