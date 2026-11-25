package com.webui.backend.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.OperationalProjectEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.ClientRepository;
import com.webui.backend.repository.OperationalProjectRepository;
import com.webui.backend.repository.VendorPaymentMethodRepository;
import com.webui.backend.repository.VendorRepository;
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

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class BillUploadAndPaymentMethodRegressionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private OperationalProjectRepository projectRepository;

    @Autowired
    private BillApprovalRepository billApprovalRepository;

    @Autowired
    private VendorPaymentMethodRepository paymentMethodRepository;

    private String createdBillId;
    private UUID createdProjectId;
    private UUID createdClientId;
    private UUID createdVendorId;

    @AfterEach
    void cleanup() {
        if (createdBillId != null) {
            billApprovalRepository.findByBillId(createdBillId).ifPresent(billApprovalRepository::delete);
            createdBillId = null;
        }
        if (createdProjectId != null) {
            projectRepository.findById(createdProjectId).ifPresent(projectRepository::delete);
            createdProjectId = null;
        }
        if (createdVendorId != null) {
            paymentMethodRepository.findByVendorId(createdVendorId).ifPresent(paymentMethodRepository::delete);
            vendorRepository.findById(createdVendorId).ifPresent(vendorRepository::delete);
            createdVendorId = null;
        }
        if (createdClientId != null) {
            clientRepository.findById(createdClientId).ifPresent(clientRepository::delete);
            createdClientId = null;
        }
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void submitBillWithLargeBase64PhotoAndPaymentProofSucceeds() throws Exception {
        ClientEntity client = clientRepository.save(ClientEntity.builder()
                .clientReference("CLI-REG-" + System.currentTimeMillis())
                .fullName("Regression Client")
                .email("reg-cli@example.com")
                .phone("+919999999901")
                .build());
        createdClientId = client.getId();

        VendorEntity vendor = vendorRepository.save(VendorEntity.builder()
                .vendorReference("VEN-REG-" + System.currentTimeMillis())
                .businessName("Regression Plumbing")
                .contactPerson("Plumber")
                .email("reg-ven@example.com")
                .phone("+919999999902")
                .category("PLUMBING")
                .build());
        createdVendorId = vendor.getId();

        OperationalProjectEntity project = projectRepository.save(OperationalProjectEntity.builder()
                .projectReference("OPR-REG-" + System.currentTimeMillis())
                .name("INDIA Gate 2")
                .clientId(client.getId())
                .projectType("RESIDENTIAL_ARCHITECTURE")
                .status("EXECUTION")
                .contractValue(new BigDecimal("1000000.00"))
                .build());
        createdProjectId = project.getId();

        String largeBillPhotoDataUrl = "data:image/jpeg;base64," + "A".repeat(320_000);

        MvcResult createResult = mockMvc.perform(post("/api/billing/bills")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "clientId", client.getId().toString(),
                                "projectId", project.getId().toString(),
                                "vendorId", vendor.getVendorReference(),
                                "amount", 50000,
                                "tradeCategory", "PLUMBING",
                                "invoiceNumber", "INV-REG-500",
                                "billPhotoUrl", largeBillPhotoDataUrl
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.billId").exists())
                .andReturn();

        createdBillId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("billId").asText();

        String largeProofDataUrl = "data:image/png;base64," + "B".repeat(120_000);
        mockMvc.perform(post("/api/billing/bills/" + createdBillId + "/payment-proof")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "paymentProofUrl", largeProofDataUrl
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID_ONLINE"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void saveVendorPaymentMethodWithNullBankNameAndLargeQrCodeSucceeds() throws Exception {
        VendorEntity vendor = vendorRepository.save(VendorEntity.builder()
                .vendorReference("VEN-VPM-" + System.currentTimeMillis())
                .businessName("UPI Only Vendor")
                .contactPerson("Payee")
                .email("upi-ven@example.com")
                .phone("+919999999903")
                .category("OTHER")
                .build());
        createdVendorId = vendor.getId();

        String qrDataUrl = "data:image/png;base64," + "Q".repeat(60_000);

        mockMvc.perform(put("/api/vendor-payment-methods/vendor/" + vendor.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "accountHolderName", "UPI Only Vendor",
                                "upiId", "vendor@okaxis",
                                "qrCodeUrl", qrDataUrl
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upiId").value("vendor@okaxis"));
    }
}
