package com.webui.backend.service.email;

public interface EmailDeliveryService {

    /**
     * Dispatch an authenticated transactional invitation email.
     *
     * @param payload Full context of the invitation
     * @return EmailDispatchResult indicating success, provider name, and messageId or failure details
     */
    EmailDispatchResult sendInvitationEmail(InvitationEmailPayload payload);

    /**
     * Returns the name of the active email provider (e.g. SMTP, MOCK).
     */
    String getActiveProviderName();
}
