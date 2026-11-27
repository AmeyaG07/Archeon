package com.webui.backend.controller;

import com.webui.backend.model.ArchitectAuditReportEntity;
import com.webui.backend.model.ArchitectLedgerEntryEntity;
import com.webui.backend.model.BillApprovalEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.repository.ArchitectAuditReportRepository;
import com.webui.backend.repository.ArchitectLedgerEntryRepository;
import com.webui.backend.repository.BillApprovalRepository;
import com.webui.backend.repository.ClientRepository;
import com.webui.backend.repository.VendorRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;

@RestController
@RequestMapping("/api/architect-ledger")
public class ArchitectLedgerController {

    @Autowired
    private ArchitectLedgerEntryRepository ledgerRepository;

    @Autowired
    private ArchitectAuditReportRepository reportRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired(required = false)
    private BillApprovalRepository billApprovalRepository;

    @Data
    public static class CreateEntryRequest {
        private String entryType; // REVENUE | EXPENSE
        private String sourceType; // CLIENT | VENDOR | DIRECT
        private String sourceId;
        private String sourceName;
        private BigDecimal amount;
        private String transactionDate; // YYYY-MM-DD
        private String paymentMode; // BANK_TRANSFER | UPI | CASH | CHEQUE
        private String category;
        private String referenceNumber;
        private String notes;
    }

    @Data
    public static class GenerateReportRequest {
        private String periodFilter; // MONTHLY | QUARTERLY | YEARLY | ALL
        private Integer year;
        private Integer month; // 1-12
        private Integer quarter; // 1-4
        private String title;
    }

    @GetMapping("/entries")
    public ResponseEntity<List<ArchitectLedgerEntryEntity>> getAllEntries() {
        return ResponseEntity.ok(ledgerRepository.findAllByOrderByTransactionDateDescCreatedAtDesc());
    }

    @PostMapping("/entries")
    public ResponseEntity<?> createEntry(@RequestBody CreateEntryRequest req, Authentication auth) {
        if (req.getAmount() == null || req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than zero"));
        }

        String entryType = "EXPENSE".equalsIgnoreCase(req.getEntryType()) ? "EXPENSE" : "REVENUE";
        String sourceType = normalizeSourceType(req.getSourceType());
        String sourceId = trimToNull(req.getSourceId());
        String sourceName = trimToNull(req.getSourceName());

        if ("CLIENT".equals(sourceType) && sourceId != null && sourceName == null) {
            try {
                Optional<ClientEntity> client = clientRepository.findById(UUID.fromString(sourceId));
                if (client.isPresent()) {
                    sourceName = client.get().getFullName();
                }
            } catch (Exception ignored) {}
        } else if ("VENDOR".equals(sourceType) && sourceId != null && sourceName == null) {
            try {
                Optional<VendorEntity> vendor = vendorRepository.findById(UUID.fromString(sourceId));
                if (vendor.isPresent()) {
                    sourceName = vendor.get().getBusinessName();
                }
            } catch (Exception ignored) {}
        }

        if ("DIRECT".equals(sourceType) && sourceName == null) {
            sourceName = "Direct / Unspecified";
        }

        LocalDate txDate = LocalDate.now();
        if (req.getTransactionDate() != null && !req.getTransactionDate().isBlank()) {
            try {
                txDate = LocalDate.parse(req.getTransactionDate().trim());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid transaction date format (use YYYY-MM-DD)"));
            }
        }

        String paymentMode = trimToNull(req.getPaymentMode());
        if (paymentMode == null) paymentMode = "BANK_TRANSFER";

        String category = trimToNull(req.getCategory());
        if (category == null) {
            category = "REVENUE".equals(entryType) ? "Architectural Fee" : "Studio Expense";
        }

        ArchitectLedgerEntryEntity saved = ledgerRepository.save(ArchitectLedgerEntryEntity.builder()
                .entryType(entryType)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .sourceName(sourceName)
                .amount(req.getAmount())
                .transactionDate(txDate)
                .paymentMode(paymentMode)
                .category(category)
                .referenceNumber(trimToNull(req.getReferenceNumber()))
                .notes(trimToNull(req.getNotes()))
                .recordedBy(auth != null ? auth.getName() : "architect")
                .createdAt(LocalDateTime.now())
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/entries/{id}")
    public ResponseEntity<?> deleteEntry(@PathVariable UUID id) {
        if (!ledgerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        ledgerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearAllLedgerAndReports() {
        reportRepository.deleteAll();
        ledgerRepository.deleteAll();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reports")
    public ResponseEntity<List<Map<String, Object>>> listReports() {
        List<ArchitectAuditReportEntity> all = reportRepository.findAllByOrderByGeneratedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (ArchitectAuditReportEntity r : all) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", r.getId());
            row.put("reportCode", r.getReportCode());
            row.put("title", r.getTitle());
            row.put("periodFilter", r.getPeriodFilter());
            row.put("reportYear", r.getReportYear());
            row.put("totalRevenue", r.getTotalRevenue());
            row.put("totalExpenses", r.getTotalExpenses());
            row.put("netIncome", r.getNetIncome());
            row.put("entryCount", r.getEntryCount());
            row.put("generatedBy", r.getGeneratedBy());
            row.put("generatedAt", r.getGeneratedAt());
            result.add(row);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reports")
    public ResponseEntity<?> generateAndStoreAuditReport(@RequestBody(required = false) GenerateReportRequest req, Authentication auth) {
        int year = (req != null && req.getYear() != null) ? req.getYear() : LocalDate.now().getYear();
        String periodFilter = (req != null && req.getPeriodFilter() != null) ? req.getPeriodFilter().toUpperCase(Locale.ROOT) : "YEARLY";

        List<ArchitectLedgerEntryEntity> allEntries = ledgerRepository.findAllByOrderByTransactionDateDescCreatedAtDesc();
        List<ArchitectLedgerEntryEntity> filtered = allEntries.stream().filter(e -> {
            LocalDate d = e.getTransactionDate();
            if ("ALL".equals(periodFilter)) return true;
            if (d.getYear() != year) return false;
            if ("MONTHLY".equals(periodFilter) && req != null && req.getMonth() != null) {
                return d.getMonthValue() == req.getMonth();
            }
            if ("QUARTERLY".equals(periodFilter) && req != null && req.getQuarter() != null) {
                int q = ((d.getMonthValue() - 1) / 3) + 1;
                return q == req.getQuarter();
            }
            return true;
        }).toList();

        BigDecimal totalRev = BigDecimal.ZERO;
        BigDecimal totalExp = BigDecimal.ZERO;
        BigDecimal clientRev = BigDecimal.ZERO;
        BigDecimal vendorRev = BigDecimal.ZERO;
        BigDecimal directRev = BigDecimal.ZERO;

        for (ArchitectLedgerEntryEntity e : filtered) {
            if ("EXPENSE".equals(e.getEntryType())) {
                totalExp = totalExp.add(e.getAmount());
            } else {
                totalRev = totalRev.add(e.getAmount());
                if ("CLIENT".equals(e.getSourceType())) clientRev = clientRev.add(e.getAmount());
                else if ("VENDOR".equals(e.getSourceType())) vendorRev = vendorRev.add(e.getAmount());
                else directRev = directRev.add(e.getAmount());
            }
        }
        BigDecimal netIncome = totalRev.subtract(totalExp);

        String reportCode = "CA-AUD-" + year + "-" + String.valueOf(System.currentTimeMillis()).substring(8);
        String defaultTitle;
        if ("MONTHLY".equals(periodFilter) && req != null && req.getMonth() != null) {
            defaultTitle = "CA Audit Report — " + Month.of(req.getMonth()).getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + year;
        } else if ("QUARTERLY".equals(periodFilter) && req != null && req.getQuarter() != null) {
            defaultTitle = "CA Audit Report — Q" + req.getQuarter() + " " + year;
        } else if ("ALL".equals(periodFilter)) {
            defaultTitle = "CA Audit Report — Complete Architect Ledger";
        } else {
            defaultTitle = "CA Audit Report — Annual " + year;
        }
        String title = (req != null && req.getTitle() != null && !req.getTitle().isBlank()) ? req.getTitle().trim() : defaultTitle;

        List<BillApprovalEntity> allBills = billApprovalRepository != null
                ? billApprovalRepository.findAll()
                : List.of();
        Map<String, String> clientNameByKey = new HashMap<>();
        if (clientRepository != null) {
            for (ClientEntity c : clientRepository.findAll()) {
                String name = c.getFullName() != null && !c.getFullName().isBlank() ? c.getFullName() : c.getClientReference();
                if (c.getId() != null) clientNameByKey.put(c.getId().toString().toLowerCase(), name);
                if (c.getClientReference() != null) clientNameByKey.put(c.getClientReference().toLowerCase(), name);
            }
        }

        String workbookXml = buildExcelSpreadsheetXml(
                reportCode, title, year, filtered, allBills, clientNameByKey, totalRev, totalExp, netIncome, clientRev, vendorRev, directRev,
                auth != null ? auth.getName() : "architect"
        );

        ArchitectAuditReportEntity saved = reportRepository.save(ArchitectAuditReportEntity.builder()
                .reportCode(reportCode)
                .title(title)
                .periodFilter(periodFilter)
                .reportYear(year)
                .totalRevenue(totalRev)
                .totalExpenses(totalExp)
                .netIncome(netIncome)
                .entryCount(filtered.size())
                .workbookContent(workbookXml)
                .generatedBy(auth != null ? auth.getName() : "architect")
                .generatedAt(LocalDateTime.now())
                .build());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", saved.getId());
        resp.put("reportCode", saved.getReportCode());
        resp.put("title", saved.getTitle());
        resp.put("periodFilter", saved.getPeriodFilter());
        resp.put("reportYear", saved.getReportYear());
        resp.put("totalRevenue", saved.getTotalRevenue());
        resp.put("totalExpenses", saved.getTotalExpenses());
        resp.put("netIncome", saved.getNetIncome());
        resp.put("entryCount", saved.getEntryCount());
        resp.put("generatedBy", saved.getGeneratedBy());
        resp.put("generatedAt", saved.getGeneratedAt());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @GetMapping("/reports/{id}/download")
    public ResponseEntity<byte[]> downloadReport(@PathVariable UUID id) {
        return reportRepository.findById(id)
                .map(report -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType("application/vnd.ms-excel; charset=UTF-8"));
                    String safeFilename = report.getReportCode().replaceAll("[^a-zA-Z0-9_-]", "_") + "_CA_Audit.xls";
                    headers.setContentDispositionFormData("attachment", safeFilename);
                    return ResponseEntity.ok()
                            .headers(headers)
                            .body(report.getWorkbookContent().getBytes(StandardCharsets.UTF_8));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private String normalizeSourceType(String raw) {
        if ("CLIENT".equalsIgnoreCase(raw)) return "CLIENT";
        if ("VENDOR".equalsIgnoreCase(raw)) return "VENDOR";
        return "DIRECT";
    }

    private String trimToNull(String val) {
        if (val == null) return null;
        String t = val.trim();
        return t.isEmpty() ? null : t;
    }

    private String xmlEscape(String val) {
        if (val == null) return "";
        return val.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private String buildExcelSpreadsheetXml(
            String reportCode,
            String title,
            int year,
            List<ArchitectLedgerEntryEntity> entries,
            List<BillApprovalEntity> bills,
            Map<String, String> clientNameByKey,
            BigDecimal totalRev,
            BigDecimal totalExp,
            BigDecimal netIncome,
            BigDecimal clientRev,
            BigDecimal vendorRev,
            BigDecimal directRev,
            String generatedBy
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<?mso-application progid=\"Excel.Sheet\"?>\n");
        sb.append("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" ");
        sb.append("xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">\n");
        sb.append("<Styles>\n");
        sb.append("  <Style ss:ID=\"Title\"><Font ss:Bold=\"1\" ss:Size=\"14\"/></Style>\n");
        sb.append("  <Style ss:ID=\"Header\"><Font ss:Bold=\"1\" ss:Color=\"#FFFFFF\"/><Interior ss:Color=\"#171717\" ss:Pattern=\"Solid\"/></Style>\n");
        sb.append("  <Style ss:ID=\"Bold\"><Font ss:Bold=\"1\"/></Style>\n");
        sb.append("  <Style ss:ID=\"Currency\"><NumberFormat ss:Format=\"#,##0.00\"/></Style>\n");
        sb.append("</Styles>\n");

        // Sheet 1: CA Audit Summary
        sb.append("<Worksheet ss:Name=\"CA Audit Summary\">\n<Table>\n");
        sb.append("  <Column ss:Width=\"220\"/><Column ss:Width=\"180\"/><Column ss:Width=\"140\"/><Column ss:Width=\"150\"/><Column ss:Width=\"140\"/>\n");
        appendRow(sb, "Title", "ArcheOn Design Studio — Chartered Accountant Audit Statement");
        appendRow(sb, "Bold", title);
        appendPair(sb, "Audit Report Code", reportCode);
        appendPair(sb, "Generated By", generatedBy);
        appendPair(sb, "Generated Timestamp", LocalDateTime.now().toString());
        appendPair(sb, "Statement Year", String.valueOf(year));
        sb.append("  <Row></Row>\n");
        sb.append("  <Row><Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Revenue &amp; Expense Summary</Data></Cell>"
                + "<Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Amount (INR)</Data></Cell></Row>\n");
        appendCurrencyRow(sb, "Client Receipts (Architecture & Design)", clientRev);
        appendCurrencyRow(sb, "Vendor Payments / Trade Receipts", vendorRev);
        appendCurrencyRow(sb, "Direct / Other Revenue Receipts", directRev);
        appendCurrencyRow(sb, "TOTAL GROSS REVENUE RECEIVED", totalRev);
        appendCurrencyRow(sb, "TOTAL ARCHITECT / STUDIO EXPENSES", totalExp);
        appendCurrencyRow(sb, "NET REVENUE (REVENUE - EXPENSES)", netIncome);
        sb.append("  <Row></Row>\n");

        // Monthly Summary Table inside Sheet 1
        sb.append("  <Row><Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Month</Data></Cell>"
                + "<Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Revenue (INR)</Data></Cell>"
                + "<Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Expenses (INR)</Data></Cell>"
                + "<Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Net (INR)</Data></Cell></Row>\n");

        for (int m = 1; m <= 12; m++) {
            final int monthVal = m;
            BigDecimal mRev = entries.stream()
                    .filter(e -> !"EXPENSE".equals(e.getEntryType()) && e.getTransactionDate().getMonthValue() == monthVal)
                    .map(ArchitectLedgerEntryEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal mExp = entries.stream()
                    .filter(e -> "EXPENSE".equals(e.getEntryType()) && e.getTransactionDate().getMonthValue() == monthVal)
                    .map(ArchitectLedgerEntryEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            String mName = Month.of(m).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            sb.append("  <Row>")
                    .append(cellStr(mName))
                    .append(cellNum(mRev))
                    .append(cellNum(mExp))
                    .append(cellNum(mRev.subtract(mExp)))
                    .append("</Row>\n");
        }

        // Bill Entries Section inside Sheet 1
        sb.append("  <Row></Row>\n");
        appendRow(sb, "Bold", "Bill Entries");
        sb.append("  <Row><Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Bill Reference</Data></Cell>"
                + "<Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Client Name</Data></Cell>"
                + "<Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Expenses (INR)</Data></Cell>"
                + "<Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Amount Received (INR)</Data></Cell>"
                + "<Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">Amount (INR)</Data></Cell></Row>\n");

        BigDecimal totalBillExpenses = BigDecimal.ZERO;
        BigDecimal totalBillReceived = BigDecimal.ZERO;
        BigDecimal totalBillAmount = BigDecimal.ZERO;

        for (BillApprovalEntity b : bills) {
            String billRef = (b.getInvoiceNumber() != null && !b.getInvoiceNumber().isBlank())
                    ? b.getInvoiceNumber()
                    : (b.getBillId() != null ? b.getBillId() : "BILL");
            String cKey = b.getClientId() != null ? b.getClientId().trim().toLowerCase() : "";
            String clientName = !cKey.isEmpty()
                    ? clientNameByKey.getOrDefault(cKey, b.getClientId())
                    : "Studio / Unassigned";
            BigDecimal expenseAmt = b.getAmount() != null ? b.getAmount() : BigDecimal.ZERO;
            BigDecimal receivedAmt = b.getPaidAmount() != null ? b.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal billAmt = b.getAmount() != null ? b.getAmount() : BigDecimal.ZERO;

            totalBillExpenses = totalBillExpenses.add(expenseAmt);
            totalBillReceived = totalBillReceived.add(receivedAmt);
            totalBillAmount = totalBillAmount.add(billAmt);

            sb.append("  <Row>")
                    .append(cellStr(billRef))
                    .append(cellStr(clientName))
                    .append(cellNum(expenseAmt))
                    .append(cellNum(receivedAmt))
                    .append(cellNum(billAmt))
                    .append("</Row>\n");
        }

        sb.append("  <Row>")
                .append("<Cell ss:StyleID=\"Bold\"><Data ss:Type=\"String\">TOTAL BILL ENTRIES</Data></Cell>")
                .append(cellStr(""))
                .append(cellNum(totalBillExpenses))
                .append(cellNum(totalBillReceived))
                .append(cellNum(totalBillAmount))
                .append("</Row>\n");

        sb.append("</Table>\n</Worksheet>\n");

        // Sheet 2: Detailed Ledger Register
        sb.append("<Worksheet ss:Name=\"Ledger Transactions\">\n<Table>\n");
        sb.append("  <Column ss:Width=\"90\"/><Column ss:Width=\"85\"/><Column ss:Width=\"85\"/>"
                + "<Column ss:Width=\"180\"/><Column ss:Width=\"130\"/><Column ss:Width=\"105\"/>"
                + "<Column ss:Width=\"110\"/><Column ss:Width=\"110\"/><Column ss:Width=\"110\"/><Column ss:Width=\"220\"/>\n");
        sb.append("  <Row>");
        for (String h : List.of("Date", "Type", "Source", "Party / Source Name", "Category", "Mode", "Reference", "Revenue (INR)", "Expense (INR)", "Notes")) {
            sb.append("<Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">").append(xmlEscape(h)).append("</Data></Cell>");
        }
        sb.append("</Row>\n");

        for (ArchitectLedgerEntryEntity e : entries) {
            boolean isExp = "EXPENSE".equals(e.getEntryType());
            sb.append("  <Row>")
                    .append(cellStr(e.getTransactionDate().toString()))
                    .append(cellStr(e.getEntryType()))
                    .append(cellStr(e.getSourceType()))
                    .append(cellStr(e.getSourceName() != null ? e.getSourceName() : "Direct / Unspecified"))
                    .append(cellStr(e.getCategory() != null ? e.getCategory() : ""))
                    .append(cellStr(e.getPaymentMode() != null ? e.getPaymentMode() : ""))
                    .append(cellStr(e.getReferenceNumber() != null ? e.getReferenceNumber() : ""))
                    .append(cellNum(isExp ? BigDecimal.ZERO : e.getAmount()))
                    .append(cellNum(isExp ? e.getAmount() : BigDecimal.ZERO))
                    .append(cellStr(e.getNotes() != null ? e.getNotes() : ""))
                    .append("</Row>\n");
        }
        sb.append("</Table>\n</Worksheet>\n</Workbook>\n");
        return sb.toString();
    }

    private void appendRow(StringBuilder sb, String style, String text) {
        sb.append("  <Row><Cell ss:StyleID=\"").append(style).append("\"><Data ss:Type=\"String\">")
                .append(xmlEscape(text)).append("</Data></Cell></Row>\n");
    }

    private void appendPair(StringBuilder sb, String label, String val) {
        sb.append("  <Row>").append(cellStr(label)).append(cellStr(val)).append("</Row>\n");
    }

    private void appendCurrencyRow(StringBuilder sb, String label, BigDecimal val) {
        sb.append("  <Row>").append(cellStr(label)).append(cellNum(val)).append("</Row>\n");
    }

    private String cellStr(String s) {
        return "<Cell><Data ss:Type=\"String\">" + xmlEscape(s) + "</Data></Cell>";
    }

    private String cellNum(BigDecimal n) {
        return "<Cell ss:StyleID=\"Currency\"><Data ss:Type=\"Number\">" + n.toPlainString() + "</Data></Cell>";
    }
}
