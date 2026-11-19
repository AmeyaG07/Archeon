package com.webui.backend.repository;

import com.webui.backend.model.ProjectMilestoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestoneEntity, UUID> {
    List<ProjectMilestoneEntity> findByProjectIdOrderByDueDateAsc(UUID projectId);
    List<ProjectMilestoneEntity> findByPhaseIdOrderByDueDateAsc(UUID phaseId);
}
