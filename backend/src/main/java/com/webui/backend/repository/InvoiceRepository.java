package com.webui.backend.repository;

import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.InvoiceEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<InvoiceEntity, UUID> {

    Optional<InvoiceEntity> findByInvoiceNumber(String invoiceNumber);

    boolean existsByInvoiceNumber(String invoiceNumber);

    Page<InvoiceEntity> findByClient(ClientEntity client, Pageable pageable);

    Page<InvoiceEntity> findByClientId(UUID clientId, Pageable pageable);

    Page<InvoiceEntity> findByProjectId(String projectId, Pageable pageable);

    Page<InvoiceEntity> findByStatus(String status, Pageable pageable);

    List<InvoiceEntity> findByStatus(String status);

    @Query("SELECT COUNT(i) FROM InvoiceEntity i")
    long countTotalInvoices();

    @Query("SELECT COALESCE(SUM(i.totalAmount - i.paidAmount), 0) FROM InvoiceEntity i WHERE i.status IN ('ISSUED', 'PARTIALLY_PAID')")
    BigDecimal sumTotalOutstandingReceivables();

    @Query("SELECT COALESCE(SUM(i.totalAmount - i.paidAmount), 0) FROM InvoiceEntity i WHERE i.status IN ('ISSUED', 'PARTIALLY_PAID') AND i.dueDate < :currentDate")
    BigDecimal sumOverdueReceivables(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT i FROM InvoiceEntity i WHERE i.client.id = :clientId AND i.status IN ('ISSUED', 'PARTIALLY_PAID') ORDER BY i.dueDate ASC")
    List<InvoiceEntity> findOutstandingByClientId(@Param("clientId") UUID clientId);

    @Query("SELECT COUNT(i) FROM InvoiceEntity i WHERE i.invoiceNumber LIKE :prefix%")
    long countByInvoiceNumberPrefix(@Param("prefix") String prefix);
}
