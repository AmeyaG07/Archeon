package com.webui.backend.repository;

import com.webui.backend.model.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {

    Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);

    List<RefreshTokenEntity> findByFamilyId(String familyId);

    List<RefreshTokenEntity> findByUsername(String username);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RefreshTokenEntity r SET r.revoked = true WHERE r.familyId = :familyId")
    void revokeFamily(@Param("familyId") String familyId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RefreshTokenEntity r SET r.revoked = true WHERE r.username = :username")
    void revokeAllForUser(@Param("username") String username);

    /**
     * Atomically consumes a single refresh token if and only if it has not already been used or revoked.
     * Enforces single-use rotation invariant under concurrent execution.
     *
     * @param tokenHash  SHA-256 hash of the presented refresh token
     * @param consumedAt Timestamp of atomic consumption
     * @return 1 if consumed successfully by this transaction, 0 if already consumed or revoked
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RefreshTokenEntity r SET r.used = true, r.consumedAt = :consumedAt WHERE r.tokenHash = :tokenHash AND r.used = false AND r.revoked = false")
    int consumeTokenIfUnused(@Param("tokenHash") String tokenHash, @Param("consumedAt") LocalDateTime consumedAt);
}
