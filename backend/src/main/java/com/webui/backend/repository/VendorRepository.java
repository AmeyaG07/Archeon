package com.webui.backend.repository;

import com.webui.backend.model.VendorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorRepository extends JpaRepository<VendorEntity, UUID> {
    Optional<VendorEntity> findByVendorReference(String vendorReference);
    Optional<VendorEntity> findByEmail(String email);
    boolean existsByVendorReference(String vendorReference);
    boolean existsByEmail(String email);
    List<VendorEntity> findByCategory(String category);
    List<VendorEntity> findByStatus(String status);
    List<VendorEntity> findAllByOrderByCreatedAtDesc();
}
