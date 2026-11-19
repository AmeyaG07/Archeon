package com.webui.backend.controller;

import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.repository.AuditEventRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@Tag(name = "Global Audit Viewer", description = "Query immutable system-wide audit trail with multi-criteria filtering")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

    private final AuditEventRepository auditEventRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Query immutable audit events with filtering by entity, actor, action, and date range")
    public ResponseEntity<Page<AuditEventEntity>> queryAuditEvents(
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 50) Pageable pageable
    ) {
        Page<AuditEventEntity> page = auditEventRepository.queryAuditEvents(
                entityName, actorId, action, startDate, endDate, pageable
        );
        return ResponseEntity.ok(page);
    }
}
