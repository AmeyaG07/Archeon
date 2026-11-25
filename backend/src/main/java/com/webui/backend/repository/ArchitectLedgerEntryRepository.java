package com.webui.backend.repository;

import com.webui.backend.model.ArchitectLedgerEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ArchitectLedgerEntryRepository extends JpaRepository<ArchitectLedgerEntryEntity, UUID> {
    List<ArchitectLedgerEntryEntity> findAllByOrderByTransactionDateDescCreatedAtDesc();
}
