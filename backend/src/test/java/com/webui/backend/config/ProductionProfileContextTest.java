package com.webui.backend.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest(properties = {
        // Valid 384-bit random Base64 key for production validation
        "app.jwt.secret=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4",
        "app.security.revocation-strategy=redis",
        "app.security.encryption.secret-key=QWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=",
        "app.dms.malware-scan-mode=CLAMAV",
        "app.dms.clamav.host=localhost"
})
@ActiveProfiles("prod")
public class ProductionProfileContextTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("P3.2-12: DataInitializer bean is NOT instantiated under production profile")
    void test_dataInitializerNotInstantiatedInProductionContext() {
        assertFalse(
                applicationContext.containsBean("dataInitializer"),
                "DataInitializer bean must NOT be instantiated or present in the Spring ApplicationContext when 'prod' profile is active"
        );
    }
}
