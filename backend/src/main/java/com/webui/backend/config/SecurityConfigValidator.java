package com.webui.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class SecurityConfigValidator {

    @Autowired
    private Environment environment;

    @PostConstruct
    public void validateSecurityConfiguration() {
        String[] activeProfiles = environment.getActiveProfiles();
        boolean isProduction = Arrays.asList(activeProfiles).contains("prod") ||
                Arrays.asList(activeProfiles).contains("production");

        String strategy = environment.getProperty("app.security.revocation-strategy", "in-memory");

        if (isProduction && !"redis".equalsIgnoreCase(strategy)) {
            throw new IllegalStateException(
                    "FATAL SECURITY MISCONFIGURATION: In-memory token revocation strategy is strictly forbidden in production. " +
                    "Set APP_SECURITY_REVOCATION_STRATEGY=redis"
            );
        }
    }
}
