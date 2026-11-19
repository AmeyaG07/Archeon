package com.webui.backend.repository;

import com.webui.backend.model.AuditEventEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEventEntity, Long> {

    List<AuditEventEntity> findByEntityNameAndEntityIdOrderByTimestampDesc(String entityName, String entityId);

    Page<AuditEventEntity> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("SELECT a FROM AuditEventEntity a WHERE " +
           "(:entityName IS NULL OR a.entityName = :entityName) AND " +
           "(:actorId IS NULL OR a.actorId = :actorId) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:startDate IS NULL OR a.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR a.timestamp <= :endDate) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditEventEntity> queryAuditEvents(
            @Param("entityName") String entityName,
            @Param("actorId") String actorId,
            @Param("action") String action,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
