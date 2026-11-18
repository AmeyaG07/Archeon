package com.webui.backend.repository;

import com.webui.backend.model.PaymentTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionEntity, UUID> {
    List<PaymentTransactionEntity> findByBillIdOrderByCreatedAtDesc(String billId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentTransactionEntity p WHERE p.billId = :billId AND p.settlementStatus = 'VERIFIED_PAID'")
    BigDecimal sumVerifiedPaymentsForBill(String billId);
}
