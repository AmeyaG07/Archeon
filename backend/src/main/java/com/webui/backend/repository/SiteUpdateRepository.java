package com.webui.backend.repository;

import com.webui.backend.model.SiteUpdateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SiteUpdateRepository extends JpaRepository<SiteUpdateEntity, UUID> {
    List<SiteUpdateEntity> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    List<SiteUpdateEntity> findByProjectIdAndAuthorRoleOrderByCreatedAtDesc(UUID projectId, String authorRole);
    List<SiteUpdateEntity> findByAuthorRoleOrderByCreatedAtDesc(String authorRole);
}
