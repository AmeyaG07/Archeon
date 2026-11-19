package com.webui.backend.service.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service("mockEmailDeliveryService")
public class MockEmailDeliveryService implements EmailDeliveryService {

    private final List<InvitationEmailPayload> dispatchedPayloads = new CopyOnWriteArrayList<>();
    private final List<EmailDispatchResult> dispatchResults = new CopyOnWriteArrayList<>();
    private volatile boolean simulateFailure = false;
    private volatile String simulatedFailureReason = "Simulated SMTP gateway timeout";

    @Override
    public EmailDispatchResult sendInvitationEmail(InvitationEmailPayload payload) {
        log.info("MockEmailDeliveryService: Dispatching invitation email to '{}' for role '{}' (URL: {})",
                payload.getRecipientEmail(), payload.getTargetRole(), payload.getInvitationUrl());

        if (simulateFailure) {
            log.warn("MockEmailDeliveryService: Simulated failure triggered for recipient: {}", payload.getRecipientEmail());
            EmailDispatchResult failure = EmailDispatchResult.failure(
                    "MOCK", payload.getRecipientEmail(), simulatedFailureReason
            );
            dispatchResults.add(failure);
            return failure;
        }

        dispatchedPayloads.add(payload);
        String messageId = "mock-msg-" + UUID.randomUUID();
        EmailDispatchResult result = EmailDispatchResult.success("MOCK", messageId, payload.getRecipientEmail());
        dispatchResults.add(result);
        return result;
    }

    @Override
    public String getActiveProviderName() {
        return "MOCK";
    }

    public List<InvitationEmailPayload> getDispatchedPayloads() {
        return Collections.unmodifiableList(dispatchedPayloads);
    }

    public List<EmailDispatchResult> getDispatchResults() {
        return Collections.unmodifiableList(dispatchResults);
    }

    public InvitationEmailPayload getLastDispatchedPayload() {
        if (dispatchedPayloads.isEmpty()) {
            return null;
        }
        return dispatchedPayloads.get(dispatchedPayloads.size() - 1);
    }

    public void clear() {
        dispatchedPayloads.clear();
        dispatchResults.clear();
        simulateFailure = false;
    }

    public void setSimulateFailure(boolean simulateFailure) {
        this.simulateFailure = simulateFailure;
    }

    public void setSimulatedFailureReason(String simulatedFailureReason) {
        this.simulatedFailureReason = simulatedFailureReason;
    }
}
