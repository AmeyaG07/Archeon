package com.webui.backend.security.crypto;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Enterprise Maintenance Migration Utility for Vendor Banking Data.
 * Safely scans for and encrypts legacy plaintext banking records at rest.
 * Features batching, pre-commit integrity round-trip verification,
 * sanitized operational logging, and idempotent re-execution.
 */
@Slf4j
@Service
public class VendorBankingDataMigrationService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AesGcmEncryptionService encryptionService;

    @Getter
    @Builder
    public static class MigrationReport {
        private final int totalScanned;
        private final int alreadyEncrypted;
        private final int migratedCount;
        private final int failedCount;
        private final boolean dryRun;
        private final boolean allPlaintextEliminated;
    }

    /**
     * Executes the maintenance migration in controlled batches.
     *
     * @param batchSize Number of records to process per batch (default 50)
     * @param dryRun    If true, counts unencrypted records without mutating database
     * @return MigrationReport summarizing execution statistics
     */
    @Transactional
    public MigrationReport executeMigration(int batchSize, boolean dryRun) {
        int safeBatchSize = batchSize > 0 ? batchSize : 50;

        // Query total vendor records with non-null banking details
        Integer totalWithBankDetails = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vendors WHERE bank_details_json IS NOT NULL", Integer.class);
        int totalScanned = totalWithBankDetails != null ? totalWithBankDetails : 0;

        // Query count already starting with enc:v1:
        Integer alreadyEncryptedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vendors WHERE bank_details_json IS NOT NULL AND bank_details_json LIKE 'enc:v1:%'", Integer.class);
        int alreadyEncrypted = alreadyEncryptedCount != null ? alreadyEncryptedCount : 0;

        // Select candidates without enc:v1: prefix
        List<Map<String, Object>> candidates = jdbcTemplate.queryForList(
                "SELECT id, vendor_reference, bank_details_json FROM vendors " +
                "WHERE bank_details_json IS NOT NULL AND bank_details_json NOT LIKE 'enc:v1:%' " +
                "LIMIT ?", safeBatchSize);

        log.info("Vendor Banking Migration: scanned={}, alreadyEncrypted={}, candidatesFound={}, dryRun={}",
                totalScanned, alreadyEncrypted, candidates.size(), dryRun);

        if (dryRun || candidates.isEmpty()) {
            return MigrationReport.builder()
                    .totalScanned(totalScanned)
                    .alreadyEncrypted(alreadyEncrypted)
                    .migratedCount(0)
                    .failedCount(0)
                    .dryRun(dryRun)
                    .allPlaintextEliminated(candidates.isEmpty())
                    .build();
        }

        int migrated = 0;
        int failed = 0;

        for (Map<String, Object> row : candidates) {
            UUID vendorId = (UUID) row.get("id");
            String vendorRef = (String) row.get("vendor_reference");
            String plaintext = (String) row.get("bank_details_json");

            try {
                // 1. Encrypt with AES-256-GCM
                String ciphertext = encryptionService.encrypt(plaintext);

                // 2. Integrity Verification: verify that decrypt(ciphertext) equals plaintext
                String roundTrip = encryptionService.decrypt(ciphertext);
                if (!plaintext.equals(roundTrip)) {
                    throw new IllegalStateException("Pre-commit cryptographic integrity check failed for vendor " + vendorRef);
                }

                // 3. Persist update directly
                int updatedRows = jdbcTemplate.update(
                        "UPDATE vendors SET bank_details_json = ? WHERE id = ? AND bank_details_json = ?",
                        ciphertext, vendorId, plaintext);

                if (updatedRows == 1) {
                    migrated++;
                    log.debug("Successfully migrated banking data for vendor: {}", vendorRef);
                } else {
                    failed++;
                    log.warn("Concurrent update detected during migration for vendor: {}", vendorRef);
                }
            } catch (Exception ex) {
                failed++;
                log.error("Failed to migrate banking details for vendor {}: {}", vendorRef, ex.getMessage());
            }
        }

        Integer remainingUnencrypted = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vendors WHERE bank_details_json IS NOT NULL AND bank_details_json NOT LIKE 'enc:v1:%'", Integer.class);
        boolean allEliminated = (remainingUnencrypted != null && remainingUnencrypted == 0);

        log.info("Vendor Banking Migration Complete: migrated={}, failed={}, remainingUnencrypted={}",
                migrated, failed, remainingUnencrypted);

        return MigrationReport.builder()
                .totalScanned(totalScanned)
                .alreadyEncrypted(alreadyEncrypted)
                .migratedCount(migrated)
                .failedCount(failed)
                .dryRun(false)
                .allPlaintextEliminated(allEliminated)
                .build();
    }
}
