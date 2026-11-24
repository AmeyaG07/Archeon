package com.webui.backend.config;

import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.ManifestoEntity;
import com.webui.backend.model.ProjectEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.ManifestoRepository;
import com.webui.backend.repository.ProjectRepository;
import com.webui.backend.repository.UserRepository;
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
