package com.webui.backend.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webui.backend.repository.ArchitectAuditReportRepository;
import com.webui.backend.repository.ArchitectLedgerEntryRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ArchitectLedgerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ArchitectLedgerEntryRepository ledgerRepository;

    @Autowired
    private ArchitectAuditReportRepository reportRepository;

    @AfterEach
    void cleanup() {
        reportRepository.deleteAll();
        ledgerRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void adminCanLogClientVendorDirectRevenueAndExpensesAndStoreCaExcelReport() throws Exception {
        // 1. Direct Revenue (empty source)
        mockMvc.perform(post("/api/architect-ledger/entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "entryType", "REVENUE",
                                "sourceType", "DIRECT",
                                "amount", 125000,
                                "transactionDate", "2026-11-15",
                                "category", "Architectural Fee"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceName").value("Direct / Unspecified"));

        // 2. Vendor payment to Architect + Expense
        mockMvc.perform(post("/api/architect-ledger/entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "entryType", "REVENUE",
                                "sourceType", "VENDOR",
                                "sourceName", "Stellar Joinery",
                                "amount", 45000,
                                "transactionDate", "2026-11-20"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/architect-ledger/entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "entryType", "EXPENSE",
                                "sourceType", "DIRECT",
                                "amount", 18000,
                                "transactionDate", "2026-11-22",
                                "category", "Site Visit & Travel"
                        ))))
                .andExpect(status().isCreated());

        // 3. Generate & store CA Audit Excel Report
        MvcResult repRes = mockMvc.perform(post("/api/architect-ledger/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "periodFilter", "YEARLY",
                                "year", 2026
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.entryCount").value(3))
                .andReturn();

        String reportId = objectMapper.readTree(repRes.getResponse().getContentAsString())
                .get("id").asText();

        // 4. Download stored .xls workbook
        mockMvc.perform(get("/api/architect-ledger/reports/" + reportId + "/download"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("<Workbook")))
                .andExpect(content().string(containsString("CA Audit Summary")));
    }

    @Test
    @WithMockUser(username = "client_user", roles = {"CLIENT"})
    void clientForbiddenFromArchitectLedger() throws Exception {
        mockMvc.perform(get("/api/architect-ledger/entries"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "vendor_user", roles = {"VENDOR"})
    void vendorForbiddenFromArchitectLedger() throws Exception {
        mockMvc.perform(get("/api/architect-ledger/entries"))
                .andExpect(status().isForbidden());
    }
}
