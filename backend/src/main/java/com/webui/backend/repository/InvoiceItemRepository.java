package com.webui.backend.repository;

import com.webui.backend.model.InvoiceEntity;
import com.webui.backend.model.InvoiceItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItemEntity, UUID> {

    List<InvoiceItemEntity> findByInvoiceOrderBySequenceOrderAsc(InvoiceEntity invoice);

    List<InvoiceItemEntity> findByInvoiceIdOrderBySequenceOrderAsc(UUID invoiceId);
}
