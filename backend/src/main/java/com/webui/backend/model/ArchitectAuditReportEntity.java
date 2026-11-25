package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "architect_audit_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArchitectAuditReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "report_code", nullable = false, unique = true, length = 64)
    private String reportCode;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "period_filter", nullable = false, length = 32)
    private String periodFilter; // MONTHLY | QUARTERLY | YEARLY | ALL

    @Column(name = "report_year", nullable = false)
    private Integer reportYear;

    @Column(name = "total_revenue", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalRevenue;

    @Column(name = "total_expenses", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalExpenses;

    @Column(name = "net_income", nullable = false, precision = 15, scale = 2)
    private BigDecimal netIncome;

    @Column(name = "entry_count", nullable = false)
    private Integer entryCount;

    @Column(name = "workbook_content", columnDefinition = "TEXT", nullable = false)
    private String workbookContent;

    @Column(name = "generated_by", length = 100)
    private String generatedBy;

    @Builder.Default
    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt = LocalDateTime.now();
}
