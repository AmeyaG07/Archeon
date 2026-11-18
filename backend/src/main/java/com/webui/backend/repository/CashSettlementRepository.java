package com.webui.backend.repository;

import com.webui.backend.model.CashSettlementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CashSettlementRepository extends JpaRepository<CashSettlementEntity, UUID> {
    Optional<CashSettlementEntity> findBySettlementRef(String settlementRef);
    List<CashSettlementEntity> findByCounterpartyIdOrderByCreatedAtDesc(String counterpartyId);
    List<CashSettlementEntity> findAllByOrderByCreatedAtDesc();
}
