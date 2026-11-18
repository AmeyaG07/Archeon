package com.webui.backend.repository;

import com.webui.backend.model.ProjectVendorAssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectVendorAssignmentRepository extends JpaRepository<ProjectVendorAssignmentEntity, UUID> {
    List<ProjectVendorAssignmentEntity> findByProjectId(UUID projectId);
    List<ProjectVendorAssignmentEntity> findByVendorId(UUID vendorId);
    Optional<ProjectVendorAssignmentEntity> findByProjectIdAndVendorId(UUID projectId, UUID vendorId);
    boolean existsByProjectIdAndVendorId(UUID projectId, UUID vendorId);
    boolean existsByProjectIdAndVendorIdAndStatus(UUID projectId, UUID vendorId, String status);
}
