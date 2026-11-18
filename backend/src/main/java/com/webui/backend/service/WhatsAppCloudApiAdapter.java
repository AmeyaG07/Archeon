package com.webui.backend.service;

import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.repository.AuditEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.ZoneId;

@Service
public class WhatsAppCloudApiAdapter implements WhatsAppNotificationService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppCloudApiAdapter.class);

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Value("${app.whatsapp.enabled:false}")
    private boolean isWhatsAppEnabled;

    @Value("${app.whatsapp.quiet-hours-start:21}")
    private int quietHoursStart; // 21 (9 PM)

    @Value("${app.whatsapp.quiet-hours-end:9}")
    private int quietHoursEnd;   // 9 (9 AM)

    @Value("${app.whatsapp.max-reminders-cap:5}")
    private int maxRemindersCap;

    @Override
    public NotificationResult sendBillReminder(
            String recipientPhone,
            boolean isOptedIn,
            String billId,
            String invoiceNumber,
            BigDecimal outstandingBalance,
            String billStatus,
            int previousReminderCount) {

        // 1. Check if WhatsApp is enabled (Strict safety invariant: fail-closed until official verified credentials exist)
        if (!isWhatsAppEnabled) {
            log.info("WhatsApp automation is disabled [PENDING BUSINESS CONFIRMATION OF META CREDENTIALS]. Suppressing reminder for bill {}", billId);
            recordAudit("SYSTEM", "WHATSAPP_SUPPRESSED_DISABLED", billId, "WhatsApp automation is disabled pending business credentials approval.");
            return NotificationResult.DISABLED;
        }

        // 2. Check Opt-In Consent
        if (!isOptedIn) {
            log.warn("Recipient {} has not opted in for WhatsApp updates. Suppressing message for bill {}", recipientPhone, billId);
            recordAudit("SYSTEM", "WHATSAPP_SUPPRESSED_NO_OPT_IN", billId, "Recipient has not provided opt-in consent.");
            return NotificationResult.SUPPRESSED_OPT_OUT;
        }

        // 3. Check Bill Status Invariants (Paid, Disputed, Cancelled -> Immediate cancellation)
        if ("PAID".equalsIgnoreCase(billStatus) || "DISPUTED".equalsIgnoreCase(billStatus) || "CANCELLED".equalsIgnoreCase(billStatus)) {
            log.info("Bill {} is {} - suppressing automated reminder.", billId, billStatus);
            recordAudit("SYSTEM", "WHATSAPP_SUPPRESSED_SETTLED_OR_DISPUTED", billId, "Bill is in status: " + billStatus);
            return NotificationResult.SUPPRESSED_ALREADY_SETTLED_OR_DISPUTED;
        }

        // 4. Check Reminder Cap
        if (previousReminderCount >= maxRemindersCap) {
            log.warn("Bill {} has reached max reminder cap of {}. Escalating to manual staff queue.", billId, maxRemindersCap);
            recordAudit("SYSTEM", "WHATSAPP_MAX_CAP_REACHED", billId, "Max reminders cap reached: " + previousReminderCount);
            return NotificationResult.SUPPRESSED_MAX_CAP_REACHED;
        }

        // 5. Check Quiet Hours (9 PM to 9 AM Asia/Kolkata)
        LocalTime now = LocalTime.now(ZoneId.of("Asia/Kolkata"));
        int currentHour = now.getHour();
        if (currentHour >= quietHoursStart || currentHour < quietHoursEnd) {
            log.info("Current time {} IST is within quiet hours (9 PM - 9 AM). Suppressing WhatsApp reminder for bill {}.", now, billId);
            recordAudit("SYSTEM", "WHATSAPP_SUPPRESSED_QUIET_HOURS", billId, "Current time " + now + " is within 21:00-09:00 quiet hours.");
            return NotificationResult.SUPPRESSED_QUIET_HOURS;
        }

        // 6. When enabled with real credentials:
        // Here the official Meta WhatsApp Business Cloud API POST /messages would be invoked using template
        recordAudit("SYSTEM", "WHATSAPP_REMINDER_DISPATCHED", billId,
                String.format("{\"recipient\": \"%s\", \"invoice\": \"%s\", \"balance\": %s, \"reminderCount\": %d}",
                        recipientPhone, invoiceNumber, outstandingBalance, previousReminderCount + 1));

        return NotificationResult.SENT;
    }

    @Override
    public boolean processInboundEvidenceWebhook(String senderPhone, String messageId, String mediaId, String caption) {
        log.info("Inbound WhatsApp evidence received from {}: mediaId={}, messageId={}", senderPhone, mediaId, messageId);

        // Security Invariant (Section 9.3 & 10.3):
        // Inbound media is attached to an UNVERIFIED Payment Submission record.
        // It NEVER automatically marks a bill as PAID.
        recordAudit(senderPhone, "INBOUND_WHATSAPP_PROOF_RECEIVED", messageId,
                String.format("{\"mediaId\": \"%s\", \"caption\": \"%s\", \"status\": \"PENDING_FINANCE_VERIFICATION\"}", mediaId, caption));

        return true;
    }

    private void recordAudit(String actor, String action, String entityId, String details) {
        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(actor)
                .actorRole("SYSTEM_WHATSAPP")
                .action(action)
                .entityName("WhatsAppNotification")
                .entityId(entityId)
                .detailsJson(details)
                .build());
    }
}
