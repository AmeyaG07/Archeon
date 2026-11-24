package com.webui.backend.service;

import com.webui.backend.model.OperationalProjectEntity;
import com.webui.backend.model.SiteUpdateEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.repository.OperationalProjectRepository;
import com.webui.backend.repository.SiteUpdateRepository;
import com.webui.backend.repository.UserRepository;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SiteUpdateService {

    @Autowired
    private SiteUpdateRepository siteUpdateRepository;

    @Autowired
    private OperationalProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateSiteUpdateRequest {
        private UUID projectId;
        private String note;
        private String photoUrl;
        private LocalDate siteVisitDate; // Optional: if provided by architect, updates project's last_visit_date
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LogSiteVisitRequest {
        private LocalDate visitDate;
        private String notes;
        private String photoUrl;
    }

    @Transactional
    public SiteUpdateEntity createSiteUpdate(CreateSiteUpdateRequest req, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        OperationalProjectEntity project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + req.getProjectId()));

        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        String role = (user != null && user.getRole() != null) ? user.getRole() : "ROLE_STAFF";

        String authorRole = "ARCHITECT";
        if (role.equals("ROLE_VENDOR")) {
            authorRole = "VENDOR";
        } else if (role.equals("ROLE_CLIENT")) {
            authorRole = "CLIENT";
        }

        String authorName = (user != null && user.getFullName() != null && !user.getFullName().isBlank())
                ? user.getFullName()
                : username;

        SiteUpdateEntity update = SiteUpdateEntity.builder()
                .projectId(project.getId())
                .authorRole(authorRole)
                .authorName(authorName)
                .photoUrl(req.getPhotoUrl())
                .note(req.getNote())
                .createdAt(LocalDateTime.now())
                .build();

        SiteUpdateEntity saved = siteUpdateRepository.save(update);

        // If architect logs site visit date, update project's last_visit_date
        if ("ARCHITECT".equals(authorRole)) {
            LocalDate visitDate = req.getSiteVisitDate() != null ? req.getSiteVisitDate() : LocalDate.now();
            project.setLastVisitDate(visitDate);
            projectRepository.save(project);
        }

        return saved;
    }

    @Transactional
    public OperationalProjectEntity logSiteVisit(UUID projectId, LogSiteVisitRequest req, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        OperationalProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        LocalDate visitDate = req.getVisitDate() != null ? req.getVisitDate() : LocalDate.now();
        project.setLastVisitDate(visitDate);
        OperationalProjectEntity savedProject = projectRepository.save(project);

        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        String authorName = (user != null && user.getFullName() != null && !user.getFullName().isBlank())
                ? user.getFullName()
                : "Ar. Mandar Bhalekar";

        if ((req.getNotes() != null && !req.getNotes().isBlank()) || (req.getPhotoUrl() != null && !req.getPhotoUrl().isBlank())) {
            SiteUpdateEntity update = SiteUpdateEntity.builder()
                    .projectId(project.getId())
                    .authorRole("ARCHITECT")
                    .authorName(authorName)
                    .photoUrl(req.getPhotoUrl())
                    .note(req.getNotes() != null ? req.getNotes() : "Architect site visit logged on " + visitDate)
                    .createdAt(LocalDateTime.now())
                    .build();
            siteUpdateRepository.save(update);
        }

        return savedProject;
    }

    @Transactional(readOnly = true)
    public List<SiteUpdateEntity> getProjectUpdates(UUID projectId) {
        return siteUpdateRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    @Transactional(readOnly = true)
    public List<SiteUpdateEntity> getProjectVendorUpdates(UUID projectId) {
        return siteUpdateRepository.findByProjectIdAndAuthorRoleOrderByCreatedAtDesc(projectId, "VENDOR");
    }

    @Transactional(readOnly = true)
    public List<SiteUpdateEntity> getIncomingVendorUpdates() {
        return siteUpdateRepository.findByAuthorRoleOrderByCreatedAtDesc("VENDOR");
    }
}
