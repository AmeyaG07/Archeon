package com.webui.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Set;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:3153600000000}")
    private long jwtExpirationMs; // 100 years persistent session until explicit logout

    @Value("${app.jwt.refresh-expiration-ms:3153600000000}")
    private long refreshExpirationMs; // 100 years persistent refresh until explicit logout

    @Value("${app.jwt.issuer:archeon-api}")
    private String expectedIssuer;

    @Value("${app.jwt.audience:archeon-web}")
    private String expectedAudience;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String username, String role) {
        return generateToken(username, role, 0L, null);
    }

    public String generateToken(String username, String role, Long tokenVersion) {
        return generateToken(username, role, tokenVersion, null);
    }

    public String generateToken(String username, String role, Long tokenVersion, String familyId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);
        String jti = UUID.randomUUID().toString();

        JwtBuilder builder = Jwts.builder()
                .issuer(expectedIssuer)
                .audience().add(expectedAudience).and()
                .subject(username)
                .id(jti)
                .claim("role", role)
                .claim("ver", tokenVersion != null ? tokenVersion : 0L)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey());

        if (familyId != null) {
            builder.claim("fid", familyId);
        }

        return builder.compact();
    }

    public String generateCustomToken(String username, String role, Long tokenVersion,
                                      String issuer, String audience, long ttlMs) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + ttlMs);
        String jti = UUID.randomUUID().toString();

        JwtBuilder builder = Jwts.builder()
                .subject(username)
                .id(jti)
                .claim("role", role)
                .claim("ver", tokenVersion != null ? tokenVersion : 0L)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey());

        if (issuer != null) {
            builder.issuer(issuer);
        }
        if (audience != null) {
            builder.audience().add(audience);
        }

        return builder.compact();
    }

    public Claims getClaimsSafely(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }

    public String getUsernameFromJwt(String token) {
        Claims claims = getClaimsSafely(token);
        return claims != null ? claims.getSubject() : null;
    }

    public String getRoleFromJwt(String token) {
        Claims claims = getClaimsSafely(token);
        return claims != null ? claims.get("role", String.class) : null;
    }

    public String getJtiFromJwt(String token) {
        Claims claims = getClaimsSafely(token);
        return claims != null ? claims.getId() : null;
    }

    public String getFamilyIdFromJwt(String token) {
        Claims claims = getClaimsSafely(token);
        return claims != null ? claims.get("fid", String.class) : null;
    }

    public Long getTokenVersionFromJwt(String token) {
        Claims claims = getClaimsSafely(token);
        if (claims != null) {
            Object ver = claims.get("ver");
            if (ver instanceof Number) {
                return ((Number) ver).longValue();
            }
        }
        return 0L;
    }

    public Date getIssuedAtFromJwt(String token) {
        Claims claims = getClaimsSafely(token);
        return claims != null ? claims.getIssuedAt() : null;
    }

    public Date getExpirationFromJwt(String token) {
        Claims claims = getClaimsSafely(token);
        return claims != null ? claims.getExpiration() : null;
    }

    public long getRemainingTtlMs(String token) {
        Date expiry = getExpirationFromJwt(token);
        if (expiry == null) {
            return 0L;
        }
        long diff = expiry.getTime() - System.currentTimeMillis();
        return Math.max(diff, 0L);
    }

    public boolean validateToken(String authToken) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(authToken)
                    .getPayload();

            // P3-04: Mandatory Issuer Validation (Must be exactly expectedIssuer)
            String issuer = claims.getIssuer();
            if (!StringUtils.hasText(issuer) || !expectedIssuer.equals(issuer)) {
                return false;
            }

            // P3-04: Mandatory Audience Validation (Must contain expectedAudience)
            Set<String> audience = claims.getAudience();
            if (audience == null || audience.isEmpty() || !audience.contains(expectedAudience)) {
                return false;
            }

            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    public String getExpectedIssuer() {
        return expectedIssuer;
    }

    public String getExpectedAudience() {
        return expectedAudience;
    }
}
