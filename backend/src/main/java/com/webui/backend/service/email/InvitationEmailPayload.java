package com.webui.backend.service.email;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class InvitationEmailPayload {
    private final UUID invitationId;
    private final String recipientEmail;
    private final String recipientName;
    private final String targetRole;
    private final String invitationUrl;
    private final LocalDateTime expiresAt;
    private final String invitedBy;
}
