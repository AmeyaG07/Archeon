package com.webui.backend.repository;

import com.webui.backend.model.ArchitectAuditReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ArchitectAuditReportRepository extends JpaRepository<ArchitectAuditReportEntity, UUID> {
    List<ArchitectAuditReportEntity> findAllByOrderByGeneratedAtDesc();
}
