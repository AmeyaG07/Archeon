package com.webui.backend.service;

import com.webui.backend.dto.dashboard.DashboardDto;
import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.InvoiceEntity;
import com.webui.backend.model.OperationalProjectEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final OperationalProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final VendorRepository vendorRepository;
    private final BillApprovalRepository billApprovalRepository;
    private final CashSettlementRepository cashSettlementRepository;
    private final LeadRepository leadRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuditEventRepository auditEventRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public DashboardDto.AdminDashboardResponse getAdminDashboard() {
        long activeProjects = projectRepository.findAll().stream()
                .filter(p -> !"COMPLETED".equalsIgnoreCase(p.getStatus()) && !"ARCHIVED".equalsIgnoreCase(p.getStatus()))
                .count();

        long completedProjects = projectRepository.findAll().stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus()))
                .count();

        long totalClients = clientRepository.count();
        long totalVendors = vendorRepository.count();
        long newLeads = leadRepository.findAll().stream()
                .filter(l -> "NEW".equalsIgnoreCase(l.getStatus()))
                .count();

        long pendingApprovals = billApprovalRepository.countByStatusIn(
                Arrays.asList("PENDING_PRIMARY", "PENDING_SECONDARY")
        );

        long pendingCashSettlements = cashSettlementRepository.countByCounterpartyStatus("PENDING_COUNTERPARTY_ACK")
                + cashSettlementRepository.countByFinanceApprovalStatus("PENDING_FINANCE_REVIEW");

        // Compute Receivables & Aging from Invoices
        LocalDate today = LocalDate.now();
        List<InvoiceEntity> openInvoices = invoiceRepository.findAll().stream()
                .filter(i -> "ISSUED".equalsIgnoreCase(i.getStatus()) || "PARTIALLY_PAID".equalsIgnoreCase(i.getStatus()))
                .collect(Collectors.toList());

        BigDecimal totalReceivables = BigDecimal.ZERO;
        BigDecimal overdueReceivables = BigDecimal.ZERO;
        BigDecimal currentBucket = BigDecimal.ZERO;
        BigDecimal days1To30 = BigDecimal.ZERO;
        BigDecimal days31To60 = BigDecimal.ZERO;
        BigDecimal daysOver60 = BigDecimal.ZERO;

        for (InvoiceEntity inv : openInvoices) {
            BigDecimal outstanding = inv.getOutstandingAmount();
            totalReceivables = totalReceivables.add(outstanding);

            if (inv.getDueDate().isBefore(today)) {
                overdueReceivables = overdueReceivables.add(outstanding);
                long daysPast = ChronoUnit.DAYS.between(inv.getDueDate(), today);
                if (daysPast <= 30) {
                    days1To30 = days1To30.add(outstanding);
                } else if (daysPast <= 60) {
                    days31To60 = days31To60.add(outstanding);
                } else {
                    daysOver60 = daysOver60.add(outstanding);
                }
            } else {
                currentBucket = currentBucket.add(outstanding);
            }
        }

        DashboardDto.ReceivablesAging aging = DashboardDto.ReceivablesAging.builder()
                .current(currentBucket)
                .days1To30(days1To30)
                .days31To60(days31To60)
                .daysOver60(daysOver60)
                .build();

        // Recent Activity Stream (last 10 events)
        List<AuditEventEntity> events = auditEventRepository.findAllByOrderByTimestampDesc(PageRequest.of(0, 10)).getContent();
        List<DashboardDto.ActivityEventSummary> activitySummaries = events.stream()
                .map(e -> DashboardDto.ActivityEventSummary.builder()
                        .eventId(String.valueOf(e.getId()))
                        .actor(e.getActorId())
                        .role(e.getActorRole())
                        .action(e.getAction())
                        .entityName(e.getEntityName())
                        .summary(e.getAction() + " on " + e.getEntityName() + " (" + e.getEntityId() + ")")
                        .timestamp(e.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        return DashboardDto.AdminDashboardResponse.builder()
                .activeProjectsCount(activeProjects)
                .completedProjectsCount(completedProjects)
                .totalClientsCount(totalClients)
                .totalVendorsCount(totalVendors)
                .pendingApprovalsCount(pendingApprovals)
                .pendingCashSettlementsCount(pendingCashSettlements)
                .newLeadsCount(newLeads)
                .totalReceivables(totalReceivables)
                .overdueReceivables(overdueReceivables)
                .aging(aging)
                .recentActivities(activitySummaries)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardDto.ClientDashboardResponse getClientDashboard(Authentication auth) {
        String username = auth != null ? auth.getName() : "anonymous";
        ClientEntity client = clientRepository.findByEmail(username).orElse(null);

        String clientName = client != null ? client.getFullName() : username;
        String clientRef = client != null ? client.getClientReference() : "CLI-N/A";

        List<OperationalProjectEntity> projects = client != null
                ? projectRepository.findAll().stream().filter(p -> p.getClientId() != null && p.getClientId().equals(client.getId())).collect(Collectors.toList())
                : new ArrayList<>();

        List<DashboardDto.ClientProjectSummary> projectSummaries = projects.stream()
                .map(p -> DashboardDto.ClientProjectSummary.builder()
                        .projectId(p.getProjectReference())
                        .projectTitle(p.getName())
                        .projectType(p.getProjectType())
                        .status(p.getStatus())
                        .progressPercentage(p.getProgressPercentage() != null ? p.getProgressPercentage() : 0)
                        .projectManager(p.getProjectManagerUsername())
                        .build())
                .collect(Collectors.toList());

        List<InvoiceEntity> outstandingInvoices = client != null
                ? invoiceRepository.findOutstandingByClientId(client.getId())
                : new ArrayList<>();

        BigDecimal totalOutstanding = outstandingInvoices.stream()
                .map(InvoiceEntity::getOutstandingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDate nextDueDate = outstandingInvoices.stream()
                .map(InvoiceEntity::getDueDate)
                .min(LocalDate::compareTo)
                .orElse(null);

        long unreadNotifications = notificationRepository.countByRecipientUsernameAndReadStatus(username, false);

        return DashboardDto.ClientDashboardResponse.builder()
                .clientName(clientName)
                .clientReference(clientRef)
                .activeProjectsCount(projectSummaries.size())
                .totalOutstandingBills(totalOutstanding)
                .pendingBillsCount(outstandingInvoices.size())
                .nextDueBillDate(nextDueDate)
                .unreadNotificationsCount(unreadNotifications)
                .projects(projectSummaries)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardDto.VendorDashboardResponse getVendorDashboard(Authentication auth) {
        String username = auth != null ? auth.getName() : "anonymous";
        VendorEntity vendor = vendorRepository.findByEmail(username).orElse(null);

        String vendorName = vendor != null ? vendor.getBusinessName() : username;
        String vendorRef = vendor != null ? vendor.getVendorReference() : "VEN-N/A";
        String category = vendor != null ? vendor.getCategory() : "General";

        String vendorIdStr = vendor != null ? vendor.getVendorReference() : username;
        long pendingReview = billApprovalRepository.countByVendorIdAndStatus(vendorIdStr, "PENDING_PRIMARY");
        long approvedAwaitingPayment = billApprovalRepository.countByVendorIdAndStatus(vendorIdStr, "APPROVED");
        BigDecimal pendingPaymentAmount = billApprovalRepository.sumPendingAmountForVendor(vendorIdStr);

        long pendingCashVouchers = cashSettlementRepository.countByCounterpartyIdAndCounterpartyStatus(
                vendorIdStr, "PENDING_COUNTERPARTY_ACK"
        );

        long unreadNotifications = notificationRepository.countByRecipientUsernameAndReadStatus(username, false);

        return DashboardDto.VendorDashboardResponse.builder()
                .vendorBusinessName(vendorName)
                .vendorReference(vendorRef)
                .category(category)
                .activeProjectsCount(0)
                .pendingBillsReviewCount(pendingReview)
                .approvedAwaitingPaymentCount(approvedAwaitingPayment)
                .totalPendingPaymentAmount(pendingPaymentAmount != null ? pendingPaymentAmount : BigDecimal.ZERO)
                .pendingCashVouchersCount(pendingCashVouchers)
                .unreadNotificationsCount(unreadNotifications)
                .build();
    }
}
