package com.webui.backend.repository;

import com.webui.backend.model.ProjectPhaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectPhaseRepository extends JpaRepository<ProjectPhaseEntity, UUID> {
    List<ProjectPhaseEntity> findByProjectIdOrderBySequenceOrderAsc(UUID projectId);
    Optional<ProjectPhaseEntity> findByProjectIdAndSequenceOrder(UUID projectId, Integer sequenceOrder);
    boolean existsByProjectIdAndSequenceOrder(UUID projectId, Integer sequenceOrder);
}
