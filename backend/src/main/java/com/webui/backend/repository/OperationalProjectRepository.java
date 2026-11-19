package com.webui.backend.repository;

import com.webui.backend.model.OperationalProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OperationalProjectRepository extends JpaRepository<OperationalProjectEntity, UUID> {
    Optional<OperationalProjectEntity> findByProjectReference(String projectReference);
    boolean existsByProjectReference(String projectReference);
    List<OperationalProjectEntity> findByClientIdOrderByCreatedAtDesc(UUID clientId);
    List<OperationalProjectEntity> findByProjectManagerUsernameOrderByCreatedAtDesc(String projectManagerUsername);
    List<OperationalProjectEntity> findAllByOrderByCreatedAtDesc();
    List<OperationalProjectEntity> findByStatusOrderByCreatedAtDesc(String status);
}
