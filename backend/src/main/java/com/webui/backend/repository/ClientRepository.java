package com.webui.backend.repository;

import com.webui.backend.model.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<ClientEntity, UUID> {
    Optional<ClientEntity> findByClientReference(String clientReference);
    Optional<ClientEntity> findByEmail(String email);
    boolean existsByClientReference(String clientReference);
    boolean existsByEmail(String email);
    List<ClientEntity> findAllByOrderByCreatedAtDesc();
    List<ClientEntity> findByStatus(String status);
}
