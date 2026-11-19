package com.webui.backend.dto.invoice;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class InvoiceDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateInvoiceRequest {
        @NotNull(message = "Client ID is required")
        private UUID clientId;

        private String projectId;

        @NotNull(message = "Issue date is required")
        private LocalDate issueDate;

        @NotNull(message = "Due date is required")
        private LocalDate dueDate;

        private String clientGstin;

        private String notes;

        @NotEmpty(message = "At least one invoice line item is required")
        private List<LineItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LineItemRequest {
        @NotBlank(message = "Description is required")
        private String description;

        private String sacCode; // Defaults to 998321

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private BigDecimal quantity;

        @NotNull(message = "Unit rate is required")
        @Positive(message = "Unit rate must be positive")
        private BigDecimal unitRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LineItemResponse {
        private UUID id;
        private String description;
        private String sacCode;
        private BigDecimal quantity;
        private BigDecimal unitRate;
        private BigDecimal taxableAmount;
        private Integer sequenceOrder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceResponse {
        private UUID id;
        private String invoiceNumber;
        private UUID clientId;
        private String clientName;
        private String clientEmail;
        private String clientGstin;
        private String projectId;
        private LocalDate issueDate;
        private LocalDate dueDate;
        private BigDecimal subtotal;
        private BigDecimal cgstRate;
        private BigDecimal cgstAmount;
        private BigDecimal sgstRate;
        private BigDecimal sgstAmount;
        private BigDecimal igstRate;
        private BigDecimal igstAmount;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
        private BigDecimal outstandingAmount;
        private String status;
        private String sacCode;
        private String studioGstin;
        private String notes;
        private List<LineItemResponse> items;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long version;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecordPaymentRequest {
        @NotNull(message = "Payment amount is required")
        @Positive(message = "Payment amount must be positive")
        private BigDecimal amount;

        @NotBlank(message = "Payment mode is required")
        private String paymentMode; // UPI, BANK_TRANSFER, CHEQUE, CASH

        private String transactionReference; // UTR or cheque number

        private String notes;
    }
}
