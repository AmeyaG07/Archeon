package com.webui.backend.service;

import com.webui.backend.security.TokenRevocationUnavailableException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Date;

@Service
@ConditionalOnProperty(name = "app.security.revocation-strategy", havingValue = "redis")
public class RedisTokenRevocationService implements TokenRevocationService {

    private final StringRedisTemplate redisTemplate;

    private static final String JTI_KEY_PREFIX = "archeon:revoked_token:";
    private static final String USER_KEY_PREFIX = "archeon:user_revoked_at:";
    private static final String FAMILY_KEY_PREFIX = "archeon:revoked_family:";

    @Autowired
    public RedisTokenRevocationService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void revokeToken(String jti, long ttlMs) {
        if (jti == null) {
            return;
        }
        try {
            long effectiveTtl = Math.max(ttlMs, 1000L);
            redisTemplate.opsForValue().set(
                    JTI_KEY_PREFIX + jti,
                    "revoked",
                    Duration.ofMillis(effectiveTtl)
            );
        } catch (Exception ex) {
            throw new TokenRevocationUnavailableException("Redis unavailable during token revocation: " + ex.getMessage(), ex);
        }
    }

    @Override
    public boolean isTokenRevoked(String jti) {
        if (jti == null) {
            return false;
        }
        try {
            Boolean hasKey = redisTemplate.hasKey(JTI_KEY_PREFIX + jti);
            return Boolean.TRUE.equals(hasKey);
        } catch (Exception ex) {
            // FAIL CLOSED: If Redis is unavailable, must NOT allow request through
            throw new TokenRevocationUnavailableException("Redis unavailable during token revocation check: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void revokeAllForUser(String username) {
        if (username == null) {
            return;
        }
        try {
            String nowEpoch = String.valueOf(System.currentTimeMillis());
            // Keep user revocation marker for at least 7 days (matching max refresh window)
            redisTemplate.opsForValue().set(
                    USER_KEY_PREFIX + username,
                    nowEpoch,
                    Duration.ofDays(7)
            );
        } catch (Exception ex) {
            throw new TokenRevocationUnavailableException("Redis unavailable during user revocation: " + ex.getMessage(), ex);
        }
    }

    @Override
    public boolean isUserRevoked(String username, Date tokenIssuedAt) {
        if (username == null || tokenIssuedAt == null) {
            return false;
        }
        try {
            String revokedAtStr = redisTemplate.opsForValue().get(USER_KEY_PREFIX + username);
            if (revokedAtStr == null) {
                return false;
            }
            long revokedAt = Long.parseLong(revokedAtStr);
            return tokenIssuedAt.getTime() <= revokedAt;
        } catch (Exception ex) {
            // FAIL CLOSED
            throw new TokenRevocationUnavailableException("Redis unavailable during user revocation check: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void revokeFamily(String familyId) {
        if (familyId == null) {
            return;
        }
        try {
            // Blacklist session family for at least 24 hours
            redisTemplate.opsForValue().set(
                    FAMILY_KEY_PREFIX + familyId,
                    "revoked",
                    Duration.ofHours(24)
            );
        } catch (Exception ex) {
            throw new TokenRevocationUnavailableException("Redis unavailable during family revocation: " + ex.getMessage(), ex);
        }
    }

    @Override
    public boolean isFamilyRevoked(String familyId) {
        if (familyId == null) {
            return false;
        }
        try {
            Boolean hasKey = redisTemplate.hasKey(FAMILY_KEY_PREFIX + familyId);
            return Boolean.TRUE.equals(hasKey);
        } catch (Exception ex) {
            // FAIL CLOSED
            throw new TokenRevocationUnavailableException("Redis unavailable during family revocation check: " + ex.getMessage(), ex);
        }
    }
}
