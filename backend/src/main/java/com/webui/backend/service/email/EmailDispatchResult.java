package com.webui.backend.service.email;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EmailDispatchResult {
    private final boolean success;
    private final String provider;
    private final String messageId;
    private final String recipient;
    private final String errorMessage;
    private final LocalDateTime dispatchedAt;

    public static EmailDispatchResult success(String provider, String messageId, String recipient) {
        return EmailDispatchResult.builder()
                .success(true)
                .provider(provider)
                .messageId(messageId)
                .recipient(recipient)
                .dispatchedAt(LocalDateTime.now())
                .build();
    }

    public static EmailDispatchResult failure(String provider, String recipient, String errorMessage) {
        return EmailDispatchResult.builder()
                .success(false)
                .provider(provider)
                .recipient(recipient)
                .errorMessage(errorMessage)
                .dispatchedAt(LocalDateTime.now())
                .build();
    }
}
