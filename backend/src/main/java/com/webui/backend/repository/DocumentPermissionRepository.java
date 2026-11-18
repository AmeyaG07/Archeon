package com.webui.backend.repository;

import com.webui.backend.model.DocumentPermissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentPermissionRepository extends JpaRepository<DocumentPermissionEntity, UUID> {

    List<DocumentPermissionEntity> findByDocumentId(UUID documentId);

    Optional<DocumentPermissionEntity> findByDocumentIdAndGranteeTypeAndGranteeId(UUID documentId, String granteeType, UUID granteeId);

    boolean existsByDocumentIdAndGranteeTypeAndGranteeId(UUID documentId, String granteeType, UUID granteeId);

    List<DocumentPermissionEntity> findByGranteeTypeAndGranteeId(String granteeType, UUID granteeId);
}
