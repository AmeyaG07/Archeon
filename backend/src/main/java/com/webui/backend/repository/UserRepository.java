package com.webui.backend.repository;

import com.webui.backend.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
    boolean existsByUsername(String username);

    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);

    List<UserEntity> findByClientId(UUID clientId);
    List<UserEntity> findByVendorId(UUID vendorId);
    List<UserEntity> findByRole(String role);
    List<UserEntity> findAllByOrderByUsernameAsc();
}
