package com.webui.backend.config;

import com.webui.backend.model.ManifestoEntity;
import com.webui.backend.model.ProjectEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.ManifestoRepository;
import com.webui.backend.repository.ProjectRepository;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.service.MakerCheckerApprovalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

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
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Admin User
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(UserEntity.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role("ROLE_ADMIN")
                    .build());
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
}
