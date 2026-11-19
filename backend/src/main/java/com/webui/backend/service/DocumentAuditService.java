package com.webui.backend.service;

import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Isolated audit logging service for Document Management System.
 * Uses REQUIRES_NEW propagation to ensure security audit events survive
 * transaction rollbacks on validation, integrity, or antivirus failures.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentAuditService {

    private final AuditEventRepository auditEventRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAuditEvent(Authentication auth, String action, String entityId, String detailsJson) {
        try {
            auditEventRepository.save(AuditEventEntity.builder()
                    .actorId(auth != null ? auth.getName() : "SYSTEM")
                    .actorRole(auth != null && !auth.getAuthorities().isEmpty()
                            ? auth.getAuthorities().iterator().next().getAuthority()
                            : "UNKNOWN")
                    .action(action)
                    .entityName("DOCUMENT")
                    .entityId(entityId)
                    .detailsJson(detailsJson)
                    .build());
        } catch (Exception ex) {
            log.error("Failed to record document audit event for action: {}", action, ex);
        }
    }
}
