package com.webui.backend.security.dms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration for DMS Malware Scanner subsystem.
 * Selects between enterprise ClamAV TCP scanner and deterministic mock scanner.
 */
@Slf4j
@Configuration
public class DmsScannerConfig {

    @Bean
    @Primary
    public MalwareScanner malwareScanner(
            @Value("${app.dms.malware-scan-mode:DETERMINISTIC_MOCK}") String scanMode,
            ClamAvMalwareScanner clamAvScanner,
            DeterministicMockMalwareScanner mockScanner) {

        String normalized = scanMode != null ? scanMode.trim().toUpperCase() : "DETERMINISTIC_MOCK";
        log.info("Configuring DMS MalwareScanner with active scan mode: {}", normalized);

        if ("CLAMAV".equals(normalized)) {
            log.info("Using ClamAvMalwareScanner as primary MalwareScanner bean");
            return clamAvScanner;
        } else if ("DETERMINISTIC_MOCK".equals(normalized) || "MOCK".equals(normalized)) {
            log.info("Using DeterministicMockMalwareScanner as primary MalwareScanner bean (NON-PRODUCTION ONLY)");
            return mockScanner;
        } else {
            log.error("Invalid malware scan mode '{}'. Supported modes: CLAMAV, DETERMINISTIC_MOCK", scanMode);
            throw new IllegalArgumentException(
                    "Invalid app.dms.malware-scan-mode: '" + scanMode + "'. Supported modes: CLAMAV, DETERMINISTIC_MOCK"
            );
        }
    }
}
