package com.webui.backend.repository;

import com.webui.backend.model.DocumentVersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersionEntity, UUID> {

    List<DocumentVersionEntity> findByDocumentIdOrderByVersionNumberDesc(UUID documentId);

    Optional<DocumentVersionEntity> findByDocumentIdAndVersionNumber(UUID documentId, Integer versionNumber);

    Optional<DocumentVersionEntity> findFirstByDocumentIdOrderByVersionNumberDesc(UUID documentId);

    long countByDocumentId(UUID documentId);
}
