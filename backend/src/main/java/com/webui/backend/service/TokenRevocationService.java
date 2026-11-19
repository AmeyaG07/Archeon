package com.webui.backend.service;

import java.util.Date;

public interface TokenRevocationService {

    void revokeToken(String jti, long ttlMs);

    boolean isTokenRevoked(String jti);

    void revokeAllForUser(String username);

    boolean isUserRevoked(String username, Date tokenIssuedAt);

    void revokeFamily(String familyId);

    boolean isFamilyRevoked(String familyId);
}
