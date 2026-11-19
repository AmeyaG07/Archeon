package com.webui.backend.repository;

import com.webui.backend.model.UserInvitationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserInvitationRepository extends JpaRepository<UserInvitationEntity, UUID> {
    Optional<UserInvitationEntity> findByTokenHash(String tokenHash);
    List<UserInvitationEntity> findByEmail(String email);
    List<UserInvitationEntity> findByClientId(UUID clientId);
    List<UserInvitationEntity> findByVendorId(UUID vendorId);
    List<UserInvitationEntity> findByStatusOrderByCreatedAtDesc(String status);
    List<UserInvitationEntity> findAllByOrderByCreatedAtDesc();
}
