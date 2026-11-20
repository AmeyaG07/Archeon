package com.webui.backend.service;

import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.ClientRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class WhatsAppAutomationService {

    @Autowired
    private BillApprovalRepository billRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired(required = false)
    private com.webui.backend.repository.AutomationSettingsRepository automationSettingsRepository;

    // Trigger 1 — New Bill Notification
    public void sendNewBillAlert(ClientEntity client, String vendorName, BigDecimal amount, String billPhotoUrl) {
        String senderNumber = "+91 9876543210";
        String senderName = "MB's ArcheOn Design Studio (Ar. Mandar Bhalekar)";
        if (automationSettingsRepository != null) {
            var opt = automationSettingsRepository.findFirstByOrderByIdAsc();
            if (opt.isPresent()) {
                senderNumber = opt.get().getWhatsappSenderNumber();
                senderName = opt.get().getWhatsappSenderName();
            }
        }
        log.info("[WhatsApp Notification - Trigger 1] From {} ({}) to Client {} ({}) for ₹{} from vendor {}. Photo URL: {}",
                senderName, senderNumber, client.getFullName(), client.getPhone(), amount, vendorName, billPhotoUrl);
        // Note: Strict constraint per Section 4.2: NO in-WhatsApp payment prompting or gateway flows.
        // Pure record-keeping notification.
    }

    // Trigger 2 — 3-Day Automated Reminder
    @Scheduled(cron = "0 0 9 * * *") // Runs daily at 9:00 AM
    @Transactional
    public void checkPendingBillsAndSendReminders() {
        log.info("[WhatsApp Reminders - Trigger 2] Executing daily scan for pending bills >= 3 days...");
        List<BillApprovalEntity> pendingBills = billRepository.findByStatusIn(List.of("PENDING"));

        LocalDateTime now = LocalDateTime.now();
        int remindersSent = 0;

        for (BillApprovalEntity bill : pendingBills) {
            LocalDateTime referenceTime = bill.getLastReminderSentAt() != null
                    ? bill.getLastReminderSentAt()
                    : bill.getCreatedAt();

            if (referenceTime != null && ChronoUnit.DAYS.between(referenceTime, now) >= 3) {
                // Find client
                String clientName = "Client";
                String clientPhone = null;
                if (bill.getClientId() != null) {
                    try {
                        ClientEntity client = clientRepository.findById(UUID.fromString(bill.getClientId())).orElse(null);
                        if (client != null) {
                            clientName = client.getFullName();
                            clientPhone = client.getPhone();
                        }
                    } catch (Exception ignored) {}
                }

                log.info("[WhatsApp Reminders - Trigger 2] Sending polite 3-day reminder for bill {} to {} ({})",
                        bill.getBillId(), clientName, clientPhone);

                bill.setLastReminderSentAt(now);
                billRepository.save(bill);
                remindersSent++;
            }
        }

        log.info("[WhatsApp Reminders - Trigger 2] Scan complete. Reminders dispatched: {}", remindersSent);
    }

    // Trigger 3 — Payment Screenshot Reconciliation
    @Transactional
    public BillApprovalEntity reconcilePaymentScreenshot(String billId, String screenshotUrl) {
        BillApprovalEntity bill = billRepository.findByBillId(billId).orElse(null);
        if (bill == null) {
            try {
                Long id = Long.parseLong(billId);
                bill = billRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {}
        }
        if (bill == null) {
            throw new IllegalArgumentException("Bill not found: " + billId);
        }

        log.info("[WhatsApp Webhook - Trigger 3] Reconciling payment screenshot for bill {}: {}", billId, screenshotUrl);
        bill.setPaymentProofUrl(screenshotUrl);
        bill.setStatus("PAID_ONLINE");
        bill.setPaidAmount(bill.getAmount());
        bill.setPaidAt(LocalDateTime.now());
        bill.setUpdatedAt(LocalDateTime.now());

        return billRepository.save(bill);
    }
}
