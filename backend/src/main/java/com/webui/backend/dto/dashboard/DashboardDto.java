package com.webui.backend.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DashboardDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminDashboardResponse {
        private long activeProjectsCount;
        private long completedProjectsCount;
        private long totalClientsCount;
        private long totalVendorsCount;
        private long pendingApprovalsCount;
        private long pendingCashSettlementsCount;
        private long newLeadsCount;

        // Receivables breakdown
        private BigDecimal totalReceivables;
        private BigDecimal overdueReceivables;
        private ReceivablesAging aging;

        // Activity stream
        private List<ActivityEventSummary> recentActivities;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReceivablesAging {
        private BigDecimal current;       // Due in future
        private BigDecimal days1To30;     // Overdue 1-30 days
        private BigDecimal days31To60;    // Overdue 31-60 days
        private BigDecimal daysOver60;    // Overdue > 60 days
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActivityEventSummary {
        private String eventId;
        private String actor;
        private String role;
        private String action;
        private String entityName;
        private String summary;
        private LocalDateTime timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClientDashboardResponse {
        private String clientName;
        private String clientReference;
        private long activeProjectsCount;
        private BigDecimal totalOutstandingBills;
        private long pendingBillsCount;
        private LocalDate nextDueBillDate;
        private long unreadNotificationsCount;
        private List<ClientProjectSummary> projects;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClientProjectSummary {
        private String projectId;
        private String projectTitle;
        private String projectType;
        private String status;
        private int progressPercentage;
        private String projectManager;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VendorDashboardResponse {
        private String vendorBusinessName;
        private String vendorReference;
        private String category;
        private long activeProjectsCount;
        private long pendingBillsReviewCount;
        private long approvedAwaitingPaymentCount;
        private BigDecimal totalPendingPaymentAmount;
        private long pendingCashVouchersCount;
        private long unreadNotificationsCount;
    }
}
