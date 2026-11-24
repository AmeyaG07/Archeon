package com.webui.backend.controller;

import com.webui.backend.model.OperationalProjectEntity;
import com.webui.backend.model.SiteUpdateEntity;
import com.webui.backend.service.SiteUpdateService;
import com.webui.backend.service.SiteUpdateService.CreateSiteUpdateRequest;
import com.webui.backend.service.SiteUpdateService.LogSiteVisitRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/site-updates")
public class SiteUpdateController {

    @Autowired
    private SiteUpdateService siteUpdateService;

    @PostMapping
    public ResponseEntity<?> createSiteUpdate(@RequestBody CreateSiteUpdateRequest req, Authentication auth) {
        try {
            SiteUpdateEntity update = siteUpdateService.createSiteUpdate(req, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(update);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/projects/{projectId}/site-visit")
    public ResponseEntity<?> logSiteVisit(
            @PathVariable UUID projectId,
            @RequestBody LogSiteVisitRequest req,
            Authentication auth) {
        try {
            OperationalProjectEntity project = siteUpdateService.logSiteVisit(projectId, req, auth);
            return ResponseEntity.ok(project);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<List<SiteUpdateEntity>> getProjectUpdates(@PathVariable UUID projectId) {
        return ResponseEntity.ok(siteUpdateService.getProjectUpdates(projectId));
    }

    @GetMapping("/projects/{projectId}/vendor-updates")
    public ResponseEntity<List<SiteUpdateEntity>> getProjectVendorUpdates(@PathVariable UUID projectId) {
        return ResponseEntity.ok(siteUpdateService.getProjectVendorUpdates(projectId));
    }

    @GetMapping("/vendor-updates")
    public ResponseEntity<List<SiteUpdateEntity>> getVendorUpdates() {
        return ResponseEntity.ok(siteUpdateService.getIncomingVendorUpdates());
    }
}
