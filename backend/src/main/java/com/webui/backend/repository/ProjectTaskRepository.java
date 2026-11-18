package com.webui.backend.repository;

import com.webui.backend.model.ProjectTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectTaskRepository extends JpaRepository<ProjectTaskEntity, UUID> {
    List<ProjectTaskEntity> findByProjectIdOrderByDueDateAsc(UUID projectId);
    List<ProjectTaskEntity> findByProjectIdAndAssignedVendorIdOrderByDueDateAsc(UUID projectId, UUID assignedVendorId);
    List<ProjectTaskEntity> findByAssignedVendorIdOrderByDueDateAsc(UUID assignedVendorId);
    List<ProjectTaskEntity> findByPhaseIdOrderByDueDateAsc(UUID phaseId);
    List<ProjectTaskEntity> findByMilestoneIdOrderByDueDateAsc(UUID milestoneId);
    List<ProjectTaskEntity> findByAssignedToOrderByDueDateAsc(String assignedTo);
}
