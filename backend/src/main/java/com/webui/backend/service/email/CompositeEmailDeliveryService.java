package com.webui.backend.service.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Primary
public class CompositeEmailDeliveryService implements EmailDeliveryService {

    private final EmailDeliveryService smtpService;
    private final EmailDeliveryService mockService;
    private final boolean mailEnabled;
    private final String configuredProvider;

    @Autowired
    public CompositeEmailDeliveryService(
            @Qualifier("smtpEmailDeliveryService") EmailDeliveryService smtpService,
            @Qualifier("mockEmailDeliveryService") EmailDeliveryService mockService,
            @Value("${app.mail.enabled:true}") boolean mailEnabled,
            @Value("${app.mail.provider:mock}") String configuredProvider) {
        this.smtpService = smtpService;
        this.mockService = mockService;
        this.mailEnabled = mailEnabled;
        this.configuredProvider = configuredProvider != null ? configuredProvider.trim().toLowerCase() : "mock";
        log.info("Initialized CompositeEmailDeliveryService (enabled={}, configuredProvider={})",
                this.mailEnabled, this.configuredProvider);
    }

    @Override
    public EmailDispatchResult sendInvitationEmail(InvitationEmailPayload payload) {
        if (!mailEnabled) {
            log.info("Email delivery is globally disabled. Suppressing invitation email to '{}'",
                    payload.getRecipientEmail());
            return EmailDispatchResult.failure(
                    "DISABLED", payload.getRecipientEmail(), "Email delivery is disabled in application configuration"
            );
        }

        if ("smtp".equalsIgnoreCase(configuredProvider)) {
            log.debug("Routing invitation email to SMTP provider for '{}'", payload.getRecipientEmail());
            return smtpService.sendInvitationEmail(payload);
        } else {
            log.debug("Routing invitation email to MOCK provider for '{}'", payload.getRecipientEmail());
            return mockService.sendInvitationEmail(payload);
        }
    }

    @Override
    public String getActiveProviderName() {
        if (!mailEnabled) {
            return "DISABLED";
        }
        return "smtp".equalsIgnoreCase(configuredProvider) ? "SMTP" : "MOCK";
    }
}
