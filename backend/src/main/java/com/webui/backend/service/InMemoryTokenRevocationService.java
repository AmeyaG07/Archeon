package com.webui.backend.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnProperty(name = "app.security.revocation-strategy", havingValue = "in-memory", matchIfMissing = true)
public class InMemoryTokenRevocationService implements TokenRevocationService {

    // JTI -> expiration epoch timestamp
    private final Map<String, Long> revokedJtis = new ConcurrentHashMap<>();

    // Username -> revocation epoch timestamp
    private final Map<String, Long> userRevocationTimestamps = new ConcurrentHashMap<>();

    @Override
    public void revokeToken(String jti, long ttlMs) {
        if (jti != null) {
            revokedJtis.put(jti, System.currentTimeMillis() + Math.max(ttlMs, 1000L));
        }
    }

    @Override
    public boolean isTokenRevoked(String jti) {
        if (jti == null) {
            return false;
        }
        Long expiry = revokedJtis.get(jti);
        if (expiry == null) {
            return false;
        }
        if (System.currentTimeMillis() > expiry) {
            revokedJtis.remove(jti);
            return false;
        }
        return true;
    }

    @Override
    public void revokeAllForUser(String username) {
        if (username != null) {
            userRevocationTimestamps.put(username, System.currentTimeMillis());
        }
    }

    @Override
    public boolean isUserRevoked(String username, Date tokenIssuedAt) {
        if (username == null || tokenIssuedAt == null) {
            return false;
        }
        Long revokedAt = userRevocationTimestamps.get(username);
        if (revokedAt == null) {
            return false;
        }
        return tokenIssuedAt.getTime() <= revokedAt;
    }

    public void clear() {
        revokedJtis.clear();
        userRevocationTimestamps.clear();
    }
}
