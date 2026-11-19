package com.webui.backend.repository;

import com.webui.backend.model.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentEntity, UUID> {

    Optional<DocumentEntity> findByDocumentReference(String documentReference);

    List<DocumentEntity> findByClientId(UUID clientId);

    List<DocumentEntity> findByProjectId(UUID projectId);

    List<DocumentEntity> findByStatus(String status);

    long countByDocumentReferenceStartingWith(String prefix);
}
