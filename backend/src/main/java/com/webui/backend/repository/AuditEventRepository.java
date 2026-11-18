package com.webui.backend.repository;

import com.webui.backend.model.AuditEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEventEntity, Long> {
    List<AuditEventEntity> findByEntityNameAndEntityIdOrderByTimestampDesc(String entityName, String entityId);
}
