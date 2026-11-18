package com.webui.backend.repository;

import com.webui.backend.model.BillApprovalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface BillApprovalRepository extends JpaRepository<BillApprovalEntity, Long> {
    Optional<BillApprovalEntity> findByBillId(String billId);

    // Anti-split check: calculate cumulative pending amount for same vendor and project within a rolling window
    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM BillApprovalEntity b " +
           "WHERE b.vendorId = :vendorId AND b.projectId = :projectId " +
           "AND b.createdAt >= :since AND b.status IN ('PENDING_PRIMARY', 'PENDING_SECONDARY', 'APPROVED')")
    BigDecimal sumRecentBillsForVendorAndProject(
            @Param("vendorId") String vendorId,
            @Param("projectId") String projectId,
            @Param("since") LocalDateTime since);
}
