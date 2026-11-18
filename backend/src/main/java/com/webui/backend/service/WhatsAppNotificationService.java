package com.webui.backend.service;

import java.math.BigDecimal;

public interface WhatsAppNotificationService {

    enum NotificationResult {
        SENT,
        DISABLED,
        SUPPRESSED_QUIET_HOURS,
        SUPPRESSED_ALREADY_SETTLED_OR_DISPUTED,
        SUPPRESSED_OPT_OUT,
        SUPPRESSED_MAX_CAP_REACHED,
        FAILED
    }

    /**
     * Dispatch an approved utility template reminder for an outstanding bill.
     */
    NotificationResult sendBillReminder(
            String recipientPhone,
            boolean isOptedIn,
            String billId,
            String invoiceNumber,
            BigDecimal outstandingBalance,
            String billStatus,
            int previousReminderCount
    );

    /**
     * Handle inbound webhook proof attachment event idempotently.
     */
    boolean processInboundEvidenceWebhook(String senderPhone, String messageId, String mediaId, String caption);
}
