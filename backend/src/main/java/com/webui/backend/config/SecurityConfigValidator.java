package com.webui.backend.config;

import io.jsonwebtoken.io.Decoders;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Component
public class SecurityConfigValidator {

    public static final String DEFAULT_DEV_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private static final Set<String> KNOWN_INSECURE_SECRETS = Set.of(
            DEFAULT_DEV_SECRET.toLowerCase(),
            "secret",
            "secretkey",
            "changeme",
            "default",
            "password",
            "admin123",
            "archeon",
            "archeon-secret",
            "archeon-jwt-secret"
    );

    @Autowired
    private Environment environment;

    @PostConstruct
    public void validateSecurityConfiguration() {
        validateEnvironment(this.environment);
    }

    public static void validateEnvironment(Environment env) {
        if (env == null) {
            return;
        }

        String[] activeProfiles = env.getActiveProfiles();
        List<String> activeList = Arrays.asList(activeProfiles);
        boolean isProduction = activeList.contains("prod") ||
                activeList.contains("production") ||
                activeList.contains("staging") ||
                activeList.contains("live");

        if (!isProduction) {
            // Local development and test environments may use default dev configuration
            return;
        }

        // 1. Enforce Clustered Redis Token Revocation in Production
        String strategy = env.getProperty("app.security.revocation-strategy", "in-memory");
        if (!"redis".equalsIgnoreCase(strategy)) {
            throw new IllegalStateException(
                    "FATAL SECURITY MISCONFIGURATION: In-memory token revocation strategy is strictly forbidden in production. " +
                    "Set APP_SECURITY_REVOCATION_STRATEGY=redis"
            );
        }

        // 2. Enforce Mandatory, Non-Default, High-Entropy JWT Secret in Production
        String secret = env.getProperty("app.jwt.secret");
        if (!StringUtils.hasText(secret)) {
            throw new IllegalStateException(
                    "FATAL SECURITY MISCONFIGURATION: app.jwt.secret is missing or blank in production. " +
                    "Set APP_JWT_SECRET environment variable."
            );
        }

        String trimmedSecret = secret.trim();

        // 2a. Reject known default and development secrets
        if (KNOWN_INSECURE_SECRETS.contains(trimmedSecret.toLowerCase())) {
            throw new IllegalStateException(
                    "FATAL SECURITY MISCONFIGURATION: app.jwt.secret must not use known default or development secrets in production. " +
                    "Generate a cryptographically secure, random 256-bit or 384-bit Base64 secret."
            );
        }

        // 2b. Enforce valid Base64 decoding and minimum key length (256 bits / 32 bytes)
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(trimmedSecret);
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "FATAL SECURITY MISCONFIGURATION: app.jwt.secret must be a valid Base64-encoded string in production."
            );
        }

        if (keyBytes == null || keyBytes.length < 32) {
            throw new IllegalStateException(
                    "FATAL SECURITY MISCONFIGURATION: app.jwt.secret does not meet the minimum key length requirement " +
                    "(minimum 256 bits / 32 bytes required for HMAC signing)."
            );
        }
    }
}
