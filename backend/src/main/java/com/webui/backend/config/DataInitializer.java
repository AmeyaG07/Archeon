package com.webui.backend.config;

import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.InvoiceEntity;
import com.webui.backend.model.InvoiceItemEntity;
import com.webui.backend.model.LeadEntity;
import com.webui.backend.model.ManifestoEntity;
import com.webui.backend.model.OperationalProjectEntity;
import com.webui.backend.model.ProjectEntity;
import com.webui.backend.model.ProjectVendorAssignmentEntity;
import com.webui.backend.model.SiteUpdateEntity;
import com.webui.backend.model.StudioProfileEntity;
import com.webui.backend.model.SupportTicketEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.model.VendorPaymentMethodEntity;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.InvoiceRepository;
import com.webui.backend.repository.LeadRepository;
import com.webui.backend.repository.ManifestoRepository;
import com.webui.backend.repository.OperationalProjectRepository;
import com.webui.backend.repository.ProjectRepository;
import com.webui.backend.repository.ProjectVendorAssignmentRepository;
import com.webui.backend.repository.SiteUpdateRepository;
import com.webui.backend.repository.StudioProfileRepository;
import com.webui.backend.repository.SupportTicketRepository;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.repository.VendorPaymentMethodRepository;
import com.webui.backend.service.MakerCheckerApprovalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
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
    private com.webui.backend.service.FinancialOperationsService financialOperationsService;

    @Autowired
    private com.webui.backend.repository.CashSettlementRepository cashSettlementRepository;

    @Autowired
    private com.webui.backend.repository.ClientRepository clientRepository;

    @Autowired
    private com.webui.backend.repository.VendorRepository vendorRepository;

    @Autowired(required = false)
    private OperationalProjectRepository operationalProjectRepository;

    @Autowired(required = false)
    private ProjectVendorAssignmentRepository projectVendorAssignmentRepository;

    @Autowired(required = false)
    private InvoiceRepository invoiceRepository;

    @Autowired(required = false)
    private LeadRepository leadRepository;

    @Autowired(required = false)
    private SupportTicketRepository supportTicketRepository;

    @Autowired(required = false)
    private SiteUpdateRepository siteUpdateRepository;

    @Autowired(required = false)
    private VendorPaymentMethodRepository vendorPaymentMethodRepository;

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

        // Seed Demo Client & Vendor Organizations
        ClientEntity demoClient1 = null;
        ClientEntity demoClient2 = null;
        if (clientRepository != null && clientRepository.count() == 0) {
            demoClient1 = clientRepository.save(ClientEntity.builder()
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
            final ClientEntity c1 = demoClient1;
            userRepository.findByUsername("client_user").ifPresent(u -> {
                u.setClientId(c1.getId());
                u.setEmail(c1.getEmail());
                u.setFullName(c1.getFullName());
                userRepository.save(u);
            });

            demoClient2 = clientRepository.save(ClientEntity.builder()
                    .clientReference("CLI-DEMO-02")
                    .fullName("Aarav Mehta")
                    .email("aarav.mehta@mehtaestates.in")
                    .phone("+919823011223")
                    .organization("Mehta Heritage Estates")
                    .location("Pune, Maharashtra")
                    .status("ACTIVE")
                    .portalAccess("ACTIVE")
                    .createdAt(java.time.LocalDateTime.now())
                    .build());
            final ClientEntity c2 = demoClient2;
            userRepository.findByUsername("CLIENT-ALPHA").ifPresent(u -> {
                u.setClientId(c2.getId());
                u.setEmail(c2.getEmail());
                u.setFullName(c2.getFullName());
                userRepository.save(u);
            });
        } else if (clientRepository != null) {
            List<ClientEntity> existingClients = clientRepository.findAll();
            if (!existingClients.isEmpty()) demoClient1 = existingClients.get(0);
            if (existingClients.size() > 1) demoClient2 = existingClients.get(1);
        }

        VendorEntity demoVendor1 = null;
        VendorEntity demoVendor2 = null;
        if (vendorRepository != null && vendorRepository.count() == 0) {
            demoVendor1 = vendorRepository.save(VendorEntity.builder()
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
            final VendorEntity v1 = demoVendor1;
            userRepository.findByUsername("vendor_user").ifPresent(u -> {
                u.setVendorId(v1.getId());
                u.setEmail(v1.getEmail());
                userRepository.save(u);
            });

            demoVendor2 = vendorRepository.save(VendorEntity.builder()
                    .vendorReference("VEN-DEMO-02")
                    .businessName("Deccan Basalt & Stoneworks")
                    .contactPerson("Vikram Deshpande")
                    .email("vikram@deccanbasalt.in")
                    .phone("+919890123456")
                    .category("STONEWORK")
                    .location("Nagpur, Maharashtra")
                    .gstin("27AADCD4512K1Z5")
                    .pan("AADCD4512K")
                    .status("ACTIVE")
                    .portalAccess("ACTIVE")
                    .createdAt(java.time.LocalDateTime.now())
                    .build());
            final VendorEntity v2 = demoVendor2;
            userRepository.findByUsername("VENDOR-ALPHA").ifPresent(u -> {
                u.setVendorId(v2.getId());
                u.setEmail(v2.getEmail());
                userRepository.save(u);
            });
        } else if (vendorRepository != null) {
            List<VendorEntity> existingVendors = vendorRepository.findAll();
            if (!existingVendors.isEmpty()) demoVendor1 = existingVendors.get(0);
            if (existingVendors.size() > 1) demoVendor2 = existingVendors.get(1);
        }

        if (vendorPaymentMethodRepository != null && vendorPaymentMethodRepository.count() == 0) {
            if (demoVendor1 != null) {
                vendorPaymentMethodRepository.save(VendorPaymentMethodEntity.builder()
                        .vendorId(demoVendor1.getId())
                        .accountHolderName("Stellar Joinery & Architectural Millwork")
                        .bankName("HDFC Bank · Koregaon Park Branch")
                        .accountNumber("50200048912345")
                        .ifscCode("HDFC0001428")
                        .upiId("stellar.joinery@okhdfcbank")
                        .build());
            }
            if (demoVendor2 != null) {
                vendorPaymentMethodRepository.save(VendorPaymentMethodEntity.builder()
                        .vendorId(demoVendor2.getId())
                        .accountHolderName("Deccan Basalt & Stoneworks")
                        .bankName("ICICI Bank · Civil Lines Nagpur")
                        .accountNumber("031905008742")
                        .ifscCode("ICIC0000319")
                        .upiId("deccan.basalt@okicici")
                        .build());
            }
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

        // 4. Seed Operational Projects & Vendor Assignments (before bills so bills reference real project UUIDs)
        OperationalProjectEntity op1 = null;
        OperationalProjectEntity op2 = null;
        if (operationalProjectRepository != null && operationalProjectRepository.count() == 0 && demoClient1 != null) {
            op1 = operationalProjectRepository.save(OperationalProjectEntity.builder()
                    .projectReference("OPJ-2026-001")
                    .name("The Monolith Sanctuary")
                    .description("Cliffside basalt residence with travertine light-wells and reflecting pools.")
                    .projectType("RESIDENTIAL_ARCHITECTURE")
                    .clientId(demoClient1.getId())
                    .projectManagerUsername("admin_mandar")
                    .siteAddress("Plot 14, Khandala Ridge, Maharashtra")
                    .contractValue(new BigDecimal("18500000.00"))
                    .budgetAllocated(new BigDecimal("14200000.00"))
                    .status("IN_PROGRESS")
                    .progressPercentage(68)
                    .startDate(java.time.LocalDate.now().minusMonths(4))
                    .lastVisitDate(java.time.LocalDate.now().minusDays(3))
                    .expectedCompletionDate(java.time.LocalDate.now().plusMonths(5))
                    .notes("Structural shell complete; bespoke joinery and stone cladding underway.")
                    .build());

            op2 = operationalProjectRepository.save(OperationalProjectEntity.builder()
                    .projectReference("OPJ-2026-002")
                    .name("Mehta Heritage Courtyard")
                    .description("Turnkey courtyard residence with native landscape bioswales and custom teak millwork.")
                    .projectType("TURNKEY_EXECUTION")
                    .clientId(demoClient2 != null ? demoClient2.getId() : demoClient1.getId())
                    .projectManagerUsername("admin_mandar")
                    .siteAddress("Lane 7, Koregaon Park, Pune, Maharashtra")
                    .contractValue(new BigDecimal("12400000.00"))
                    .budgetAllocated(new BigDecimal("9800000.00"))
                    .status("PLANNING")
                    .progressPercentage(25)
                    .startDate(java.time.LocalDate.now().minusMonths(1))
                    .lastVisitDate(java.time.LocalDate.now().minusDays(7))
                    .expectedCompletionDate(java.time.LocalDate.now().plusMonths(8))
                    .notes("Excavation and foundation layout finalized.")
                    .build());

            if (projectVendorAssignmentRepository != null && demoVendor1 != null) {
                projectVendorAssignmentRepository.save(ProjectVendorAssignmentEntity.builder()
                        .projectId(op1.getId())
                        .vendorId(demoVendor1.getId())
                        .scopeOfWork("Architectural Joinery & Custom Teak Millwork")
                        .status("ACTIVE")
                        .contractAmount(new BigDecimal("2450000.00"))
                        .assignedBy("admin_mandar")
                        .build());
                if (demoVendor2 != null) {
                    projectVendorAssignmentRepository.save(ProjectVendorAssignmentEntity.builder()
                            .projectId(op1.getId())
                            .vendorId(demoVendor2.getId())
                            .scopeOfWork("Hand-dressed Deccan Basalt Cladding & Stonework")
                            .status("ACTIVE")
                            .contractAmount(new BigDecimal("3100000.00"))
                            .assignedBy("admin_mandar")
                            .build());
                    projectVendorAssignmentRepository.save(ProjectVendorAssignmentEntity.builder()
                            .projectId(op2.getId())
                            .vendorId(demoVendor2.getId())
                            .scopeOfWork("Courtyard Plinth & Natural Stone Paving")
                            .status("ACTIVE")
                            .contractAmount(new BigDecimal("1650000.00"))
                            .assignedBy("admin_mandar")
                            .build());
                }
            }
        } else if (operationalProjectRepository != null) {
            List<OperationalProjectEntity> existingOps = operationalProjectRepository.findAll();
            if (!existingOps.isEmpty()) op1 = existingOps.get(0);
            if (existingOps.size() > 1) op2 = existingOps.get(1);
        }

        // 5. Seed Initial Maker-Checker Bills linked to seeded Operational Projects
        String c1Id = demoClient1 != null ? demoClient1.getId().toString() : null;
        String c2Id = demoClient2 != null ? demoClient2.getId().toString() : c1Id;
        String v1Id = demoVendor1 != null ? demoVendor1.getId().toString() : "VEN-DEMO-01";
        String v2Id = demoVendor2 != null ? demoVendor2.getId().toString() : "VEN-DEMO-02";
        String p1Id = op1 != null ? op1.getId().toString() : "the-monolith-sanctuary";
        String p2Id = op2 != null ? op2.getId().toString() : "carrara-stone-penthouse";

        if (billApprovalRepository.count() == 0) {
            // Bill 1: Below ₹1,00,000 threshold (Pending payment with bill photo)
            var b1 = approvalService.initiateBillApproval(
                    "BILL-2026-081",
                    new BigDecimal("45000.00"),
                    v1Id,
                    c1Id,
                    p1Id,
                    "site_engineer_rahul"
            );
            b1.setTradeCategory("CARPENTRY");
            b1.setInvoiceNumber("VND-INV-081");
            b1.setBillPhotoUrl("/architectural-cad-villa.jpg");
            billApprovalRepository.save(b1);

            // Bill 2: High Value >= ₹1,00,000 (Needs 2 checkers)
            var b2 = approvalService.initiateBillApproval(
                    "BILL-2026-094",
                    new BigDecimal("385000.00"),
                    v2Id,
                    c1Id,
                    p1Id,
                    "procurement_lead_vikas"
            );
            b2.setTradeCategory("STONEWORK");
            b2.setInvoiceNumber("VND-INV-094");
            b2.setBillPhotoUrl("/projects/monolith-sanctuary.png");
            billApprovalRepository.save(b2);

            // Bill 3: Paid Stonework Tranche on The Monolith Sanctuary
            var bPaid = approvalService.initiateBillApproval(
                    "BILL-2026-099",
                    new BigDecimal("175000.00"),
                    v2Id,
                    c1Id,
                    p1Id,
                    "procurement_lead_vikas"
            );
            bPaid.setTradeCategory("STONEWORK");
            bPaid.setInvoiceNumber("VND-INV-099");
            bPaid.setBillPhotoUrl("/projects/monolith-sanctuary.png");
            bPaid.setPaidAmount(new BigDecimal("175000.00"));
            bPaid.setStatus("PAID");
            bPaid.setPaidAt(java.time.LocalDateTime.now().minusDays(6));
            bPaid.setPaymentProofUtr("UTR431209876541");
            billApprovalRepository.save(bPaid);

            // Bill 4: High Value with 1st Approval Completed (Pending Checker 2) on Project 2
            var b3 = approvalService.initiateBillApproval(
                    "BILL-2026-102",
                    new BigDecimal("120000.00"),
                    v1Id,
                    c2Id,
                    p2Id,
                    "ar_mandar_lead"
            );
            b3.setTradeCategory("CARPENTRY");
            b3.setInvoiceNumber("VND-INV-102");
            b3.setBillPhotoUrl("/projects/travertine-penthouse.png");
            billApprovalRepository.save(b3);
            approvalService.approvePrimary("BILL-2026-102", "finance_checker_anita");
        }

        // 5b. Seed Two-Party Cash Settlement Requests (Section 11)
        if (cashSettlementRepository.count() == 0) {
            financialOperationsService.initiateCashSettlement(
                    "CSH-SETTLE-409",
                    "BILL-2026-081",
                    p1Id,
                    "site_supervisor_arun",
                    v1Id,
                    new BigDecimal("35000.00"),
                    "Raw granite unloading and manual site transit (Khandala Project)",
                    "RCPT-GRANITE-881"
            );
            financialOperationsService.initiateCashSettlement(
                    "CSH-SETTLE-410",
                    "BILL-2026-094",
                    p2Id,
                    "supervisor_raj",
                    v2Id,
                    new BigDecimal("18500.00"),
                    "On-site basalt dressing and edge chamfering labour",
                    "RCPT-BASALT-882"
            );
        }

        // 6. Seed Site Progress Updates & Architect Notes with Photos
        if (siteUpdateRepository != null && siteUpdateRepository.count() == 0 && op1 != null) {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            siteUpdateRepository.save(SiteUpdateEntity.builder()
                    .projectId(op1.getId())
                    .authorRole("ARCHITECT")
                    .authorName("Ar. Mandar Bhalekar")
                    .photoUrl("/projects/monolith-sanctuary.png")
                    .note("Cantilevered basalt terrace slab cured and formwork stripped. North light-well travertine cladding mock-up approved on site.")
                    .createdAt(now.minusDays(5))
                    .build());
            siteUpdateRepository.save(SiteUpdateEntity.builder()
                    .projectId(op1.getId())
                    .authorRole("VENDOR")
                    .authorName("Stellar Joinery & Architectural Millwork")
                    .photoUrl("/architectural-cad-villa.jpg")
                    .note("Burma teak pivot door frames and concealed acoustic mullions delivered to Khandala site; moisture check passed at 9.2%.")
                    .createdAt(now.minusDays(2))
                    .build());
            siteUpdateRepository.save(SiteUpdateEntity.builder()
                    .projectId(op1.getId())
                    .authorRole("ARCHITECT")
                    .authorName("Ar. Mandar Bhalekar")
                    .photoUrl("/projects/travertine-penthouse.png")
                    .note("Atrium reflecting pool waterproofing hydro-test completed (72 hrs zero drop). Lighting channel conduits positioned.")
                    .createdAt(now.minusHours(14))
                    .build());
            if (op2 != null) {
                siteUpdateRepository.save(SiteUpdateEntity.builder()
                        .projectId(op2.getId())
                        .authorRole("ARCHITECT")
                        .authorName("Ar. Mandar Bhalekar")
                        .photoUrl("/projects/terracotta-courtyard-estate.png")
                        .note("Courtyard plinth marking and rainwater bioswale excavation verified on site.")
                        .createdAt(now.minusDays(1))
                        .build());
            }
        }

        // 7. Seed Client Tax Invoices
        if (invoiceRepository != null && invoiceRepository.count() == 0 && demoClient1 != null) {
            InvoiceEntity inv1 = InvoiceEntity.builder()
                    .invoiceNumber("INV-2026-0001")
                    .client(demoClient1)
                    .projectId("OPJ-2026-001")
                    .issueDate(java.time.LocalDate.now().minusDays(15))
                    .dueDate(java.time.LocalDate.now().plusDays(15))
                    .subtotal(new BigDecimal("500000.00"))
                    .cgstRate(new BigDecimal("9.00"))
                    .cgstAmount(new BigDecimal("45000.00"))
                    .sgstRate(new BigDecimal("9.00"))
                    .sgstAmount(new BigDecimal("45000.00"))
                    .totalAmount(new BigDecimal("590000.00"))
                    .paidAmount(BigDecimal.ZERO)
                    .status("ISSUED")
                    .notes("Stage 2 Architectural Design & Site Supervision Fee")
                    .build();
            inv1.getItems().add(InvoiceItemEntity.builder()
                    .invoice(inv1)
                    .description("Architectural Design Development & GFC Drawings")
                    .quantity(BigDecimal.ONE)
                    .unitRate(new BigDecimal("350000.00"))
                    .taxableAmount(new BigDecimal("350000.00"))
                    .sequenceOrder(1)
                    .build());
            inv1.getItems().add(InvoiceItemEntity.builder()
                    .invoice(inv1)
                    .description("Site Engineering & Material Specification Audit")
                    .quantity(BigDecimal.ONE)
                    .unitRate(new BigDecimal("150000.00"))
                    .taxableAmount(new BigDecimal("150000.00"))
                    .sequenceOrder(2)
                    .build());
            invoiceRepository.save(inv1);

            ClientEntity inv2Client = demoClient2 != null ? demoClient2 : demoClient1;
            InvoiceEntity inv2 = InvoiceEntity.builder()
                    .invoiceNumber("INV-2026-0002")
                    .client(inv2Client)
                    .projectId("OPJ-2026-002")
                    .issueDate(java.time.LocalDate.now().minusDays(25))
                    .dueDate(java.time.LocalDate.now().plusDays(5))
                    .subtotal(new BigDecimal("300000.00"))
                    .cgstRate(new BigDecimal("9.00"))
                    .cgstAmount(new BigDecimal("27000.00"))
                    .sgstRate(new BigDecimal("9.00"))
                    .sgstAmount(new BigDecimal("27000.00"))
                    .totalAmount(new BigDecimal("354000.00"))
                    .paidAmount(new BigDecimal("150000.00"))
                    .status("PARTIALLY_PAID")
                    .notes("Concept Design & Turnkey Mobilisation Retainer")
                    .build();
            inv2.getItems().add(InvoiceItemEntity.builder()
                    .invoice(inv2)
                    .description("Concept Masterplan & 3D Architectural Visualisation")
                    .quantity(BigDecimal.ONE)
                    .unitRate(new BigDecimal("300000.00"))
                    .taxableAmount(new BigDecimal("300000.00"))
                    .sequenceOrder(1)
                    .build());
            invoiceRepository.save(inv2);
        }

        // 8. Seed Consultation Leads
        if (leadRepository != null && leadRepository.count() == 0) {
            leadRepository.save(new LeadEntity(
                    "Rohan Deshmukh",
                    "+919822044556",
                    "rohan.deshmukh@example.com",
                    "ARCHITECTURE",
                    "Nagpur, Maharashtra",
                    "₹1.5 Cr - ₹3.0 Cr",
                    "12-18 Months",
                    "Contemporary courtyard villa on a 6,500 sq.ft corner plot in Civil Lines.",
                    true
            ));
            leadRepository.save(new LeadEntity(
                    "Ananya Kulkarni",
                    "+919765088991",
                    "ananya.k@example.com",
                    "INTERIOR",
                    "Bandra, Mumbai",
                    "₹75L - ₹1.2 Cr",
                    "6-9 Months",
                    "Warm minimalist apartment interior with natural stone and concealed lighting.",
                    true
            ));
        }

        // 9. Seed Support Tickets
        if (supportTicketRepository != null && supportTicketRepository.count() == 0) {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            supportTicketRepository.save(SupportTicketEntity.builder()
                    .ticketReference("TKT-2026-1001")
                    .username("client_user")
                    .userRole("CLIENT")
                    .subject("Clarification on travertine slab finish schedule")
                    .category("PROJECT_QUERY")
                    .priority("Normal")
                    .status("Open")
                    .relatedReference("OPJ-2026-001")
                    .assignedTeam("Studio Architecture")
                    .description("Please confirm whether honed or brushed travertine is scheduled for the double-height atrium wall.")
                    .messagesJson("[]")
                    .createdAt(now.minusDays(2))
                    .updatedAt(now.minusDays(2))
                    .build());
            supportTicketRepository.save(SupportTicketEntity.builder()
                    .ticketReference("TKT-2026-1002")
                    .username("vendor_user")
                    .userRole("VENDOR")
                    .subject("Site gate pass & material hoist slot for teak frames")
                    .category("SITE_LOGISTICS")
                    .priority("High")
                    .status("In Progress")
                    .relatedReference("BILL-2026-081")
                    .assignedTeam("Site Operations")
                    .description("Requesting crane and material hoist clearance for 18 custom teak door frames arriving Thursday morning.")
                    .messagesJson("[]")
                    .createdAt(now.minusDays(1))
                    .updatedAt(now.minusHours(5))
                    .build());
        }
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
