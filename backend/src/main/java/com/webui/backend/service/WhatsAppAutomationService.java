package com.webui.backend.service;

import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.AutomationSettingsEntity;
import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.ClientRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
public class WhatsAppAutomationService {

    @Autowired
    private BillApprovalRepository billRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired(required = false)
    private com.webui.backend.repository.AutomationSettingsRepository automationSettingsRepository;

    @Autowired(required = false)
    private WhatsAppNotificationService whatsAppNotificationService;

    @Autowired(required = false)
    private AuditEventRepository auditEventRepository;

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
        runThreeDayPendingBillReminders(false);
    }

    /**
     * Scans all unpaid vendor bills and dispatches an automated WhatsApp payment reminder
     * to each client every N days (default: 3 days, configurable in AutomationSettingsEntity).
     */
    @Transactional
    public Map<String, Object> runThreeDayPendingBillReminders(boolean forceAllPending) {
        AutomationSettingsEntity settings = automationSettingsRepository != null
                ? automationSettingsRepository.findFirstByOrderByIdAsc().orElse(null)
                : null;
        boolean enabled = settings == null || !Boolean.FALSE.equals(settings.getWhatsappEnabled());
        int reminderIntervalDays = (settings != null && settings.getWhatsappReminderDays() != null && settings.getWhatsappReminderDays() > 0)
                ? settings.getWhatsappReminderDays()
                : 3;

        LocalDateTime now = LocalDateTime.now();
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("whatsappEnabled", enabled);
        summary.put("reminderIntervalDays", reminderIntervalDays);
        summary.put("executedAt", now.toString());

        if (!enabled && !forceAllPending) {
            log.info("[WhatsApp Reminders - Trigger 2] Automated WhatsApp reminders are disabled in settings.");
            summary.put("remindersDispatched", 0);
            summary.put("clientsNotified", 0);
            summary.put("dispatches", List.of());
            return summary;
        }

        log.info("[WhatsApp Reminders - Trigger 2] Scanning unpaid vendor bills (interval >= {} days, force={})...",
                reminderIntervalDays, forceAllPending);

        Set<String> settledOrCancelled = Set.of("PAID", "PAID_CASH", "PAID_ONLINE", "REJECTED", "CANCELLED");
        List<BillApprovalEntity> allBills = billRepository.findAll();

        // Group due unpaid bills by clientId
        Map<String, List<BillApprovalEntity>> dueBillsByClient = new LinkedHashMap<>();
        for (BillApprovalEntity bill : allBills) {
            if (bill.isDisputed()) continue;
            String st = bill.getStatus() != null ? bill.getStatus().toUpperCase() : "PENDING";
            if (settledOrCancelled.contains(st)) continue;

            BigDecimal paid = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal amount = bill.getAmount() != null ? bill.getAmount() : BigDecimal.ZERO;
            if (amount.subtract(paid).compareTo(BigDecimal.ZERO) <= 0) continue;

            LocalDateTime referenceTime = bill.getLastReminderSentAt() != null
                    ? bill.getLastReminderSentAt()
                    : bill.getCreatedAt();

            boolean isDue = forceAllPending
                    || (referenceTime != null && ChronoUnit.DAYS.between(referenceTime, now) >= reminderIntervalDays);
            if (!isDue) continue;

            String clientKey = bill.getClientId() != null && !bill.getClientId().isBlank()
                    ? bill.getClientId()
                    : "UNASSIGNED";
            dueBillsByClient.computeIfAbsent(clientKey, k -> new ArrayList<>()).add(bill);
        }

        List<Map<String, Object>> dispatches = new ArrayList<>();
        int billsReminded = 0;

        for (Map.Entry<String, List<BillApprovalEntity>> entry : dueBillsByClient.entrySet()) {
            String clientKey = entry.getKey();
            List<BillApprovalEntity> clientBills = entry.getValue();

            ClientEntity client = resolveClient(clientKey);
            String clientName = client != null ? client.getFullName() : "Client";
            String rawPhone = client != null && client.getPhone() != null ? client.getPhone() : "+919876543210";
            String phone = rawPhone.replaceAll("[^0-9+]", "");
            if (!phone.startsWith("+") && phone.length() == 10) {
                phone = "+91" + phone;
            }

            BigDecimal totalOutstanding = BigDecimal.ZERO;
            List<String> billRefs = new ArrayList<>();
            for (BillApprovalEntity bill : clientBills) {
                BigDecimal paid = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
                BigDecimal bal = bill.getAmount().subtract(paid);
                totalOutstanding = totalOutstanding.add(bal);
                String ref = bill.getInvoiceNumber() != null ? bill.getInvoiceNumber() : bill.getBillId();
                billRefs.add(ref + " (₹" + bal.toPlainString() + ")");

                if (whatsAppNotificationService != null) {
                    whatsAppNotificationService.sendBillReminder(
                            phone,
                            true,
                            bill.getBillId(),
                            ref,
                            bal,
                            bill.getStatus(),
                            0
                    );
                }

                bill.setLastReminderSentAt(now);
                billRepository.save(bill);
                billsReminded++;
            }

            String message = String.format(
                    "Studio ArcheOn · %d-Day Payment Reminder\n\nNamaste %s,\nThis is an automated reminder that %d pending vendor bill(s) totaling ₹%,.2f are awaiting payment.\n\nPending Bills: %s\n\nPlease review and settle in the Client Portal: http://localhost:3000/client/invoices\n\n— MB's ArcheOn Design Studio",
                    reminderIntervalDays,
                    clientName,
                    clientBills.size(),
                    totalOutstanding,
                    String.join(", ", billRefs)
            );

            String waLink = "https://wa.me/" + phone.replace("+", "") + "?text=" + URLEncoder.encode(message, StandardCharsets.UTF_8);

            if (auditEventRepository != null) {
                auditEventRepository.save(AuditEventEntity.builder()
                        .actorId("SYSTEM_SCHEDULER")
                        .actorRole("SYSTEM_WHATSAPP")
                        .action("WHATSAPP_3DAY_REMINDER_DISPATCHED")
                        .entityName("ClientBillingReminder")
                        .entityId(clientKey)
                        .detailsJson(String.format("{\"client\": \"%s\", \"phone\": \"%s\", \"billCount\": %d, \"outstanding\": %s}",
                                clientName, phone, clientBills.size(), totalOutstanding.toPlainString()))
                        .build());
            }

            log.info("[WhatsApp Reminders - Trigger 2] Dispatched {}-day reminder to {} ({}) for {} bill(s), total ₹{}",
                    reminderIntervalDays, clientName, phone, clientBills.size(), totalOutstanding);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("clientId", client != null ? client.getId() : clientKey);
            item.put("clientName", clientName);
            item.put("phone", phone);
            item.put("billCount", clientBills.size());
            item.put("totalOutstanding", totalOutstanding);
            item.put("whatsappMessage", message);
            item.put("whatsappLink", waLink);
            item.put("status", "REMINDER_DISPATCHED");
            dispatches.add(item);
        }

        log.info("[WhatsApp Reminders - Trigger 2] Scan complete. Clients notified: {}, bills reminded: {}",
                dispatches.size(), billsReminded);

        summary.put("remindersDispatched", billsReminded);
        summary.put("clientsNotified", dispatches.size());
        summary.put("dispatches", dispatches);
        return summary;
    }

    private ClientEntity resolveClient(String clientKey) {
        if (clientKey == null || clientKey.isBlank() || "UNASSIGNED".equals(clientKey)) return null;
        try {
            return clientRepository.findById(UUID.fromString(clientKey)).orElse(null);
        } catch (Exception ignored) {
            return clientRepository.findByClientReference(clientKey).orElse(null);
        }
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
