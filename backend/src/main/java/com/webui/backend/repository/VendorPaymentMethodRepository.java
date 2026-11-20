package com.webui.backend.repository;

import com.webui.backend.model.VendorPaymentMethodEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorPaymentMethodRepository extends JpaRepository<VendorPaymentMethodEntity, UUID> {
    Optional<VendorPaymentMethodEntity> findByVendorId(UUID vendorId);
}
