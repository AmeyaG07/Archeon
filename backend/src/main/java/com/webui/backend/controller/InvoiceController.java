package com.webui.backend.controller;

import com.webui.backend.dto.invoice.InvoiceDto;
import com.webui.backend.service.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Client Invoicing", description = "Statutory GST Invoicing, SAC 998321, Line Items, and PDF Generation")
@SecurityRequirement(name = "bearerAuth")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Create client tax invoice with automatic CGST/SGST or IGST computation")
    public ResponseEntity<InvoiceDto.InvoiceResponse> createInvoice(
            @Valid @RequestBody InvoiceDto.CreateInvoiceRequest request,
            Authentication auth
    ) {
        InvoiceDto.InvoiceResponse response = invoiceService.createInvoice(request, auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'STAFF', 'CLIENT')")
    @Operation(summary = "Get invoice by ID (Client access restricted to own invoices)")
    public ResponseEntity<InvoiceDto.InvoiceResponse> getInvoiceById(
            @PathVariable UUID id,
            Authentication auth
    ) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id, auth));
    }

    @GetMapping("/ref/{invoiceNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'STAFF', 'CLIENT')")
    @Operation(summary = "Get invoice by invoice number")
    public ResponseEntity<InvoiceDto.InvoiceResponse> getInvoiceByNumber(
            @PathVariable String invoiceNumber,
            Authentication auth
    ) {
        return ResponseEntity.ok(invoiceService.getInvoiceByNumber(invoiceNumber, auth));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'STAFF', 'CLIENT')")
    @Operation(summary = "List invoices with filtering by client, project, or status")
    public ResponseEntity<Page<InvoiceDto.InvoiceResponse>> listInvoices(
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication auth
    ) {
        return ResponseEntity.ok(invoiceService.listInvoices(clientId, projectId, status, pageable, auth));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Record verified payment against tax invoice and update balance")
    public ResponseEntity<InvoiceDto.InvoiceResponse> recordPayment(
            @PathVariable UUID id,
            @Valid @RequestBody InvoiceDto.RecordPaymentRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(invoiceService.recordPayment(id, request, auth));
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'STAFF', 'CLIENT', 'VENDOR')")
    @Operation(summary = "Download printable PDF of statutory tax invoice or contractor bill voucher")
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @PathVariable String id,
            Authentication auth
    ) {
        byte[] pdfBytes = null;
        String filename = "Document-" + id + ".pdf";

        try {
            UUID uuid = UUID.fromString(id);
            try {
                pdfBytes = invoiceService.generatePdf(uuid, auth);
                InvoiceDto.InvoiceResponse invoice = invoiceService.getInvoiceById(uuid, auth);
                filename = (invoice != null && invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : id) + ".pdf";
            } catch (Exception notAnInvoice) {
                pdfBytes = invoiceService.generateBillPdf(id, auth);
                filename = "Bill-" + id + ".pdf";
            }
        } catch (IllegalArgumentException notUuid) {
            // Numeric or reference ID - handle as Contractor Bill Voucher
            pdfBytes = invoiceService.generateBillPdf(id, auth);
            filename = "Bill-" + id + ".pdf";
        }

        if (pdfBytes == null) {
            pdfBytes = invoiceService.generateBillPdf(id, auth);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", filename);
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }
}
