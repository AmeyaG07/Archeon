package com.webui.backend.service;

import com.webui.backend.model.InvoiceEntity;
import com.webui.backend.model.InvoiceItemEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class InvoicePdfGeneratorService {

    /**
     * Generates a fully standard, compliant PDF 1.4 document for an Indian GST Tax Invoice.
     * Uses direct PDF stream writing to ensure zero external dependency vulnerability.
     */
    public byte[] generateInvoicePdf(InvoiceEntity invoice) {
        try {
            ByteArrayOutputStream streamContent = new ByteArrayOutputStream();

            // Text stream commands
            StringBuilder sb = new StringBuilder();
            sb.append("BT\n");

            // Header - Studio Brand
            sb.append("/F1 18 Tf\n");
            sb.append("50 790 Td\n");
            sb.append("(").append(escapePdfText("ARCHEON DESIGN STUDIO")).append(") Tj\n");

            sb.append("/F1 9 Tf\n");
            sb.append("0 -15 Td\n");
            sb.append("(").append(escapePdfText("Principal Architect: Ar. Mandar Bhalekar")).append(") Tj\n");
            sb.append("0 -12 Td\n");
            sb.append("(").append(escapePdfText("Studio GSTIN: " + invoice.getStudioGstin() + "  |  State: Maharashtra (27)")).append(") Tj\n");
            sb.append("0 -12 Td\n");
            sb.append("(").append(escapePdfText("Service: Architectural & Design Services (SAC: " + invoice.getSacCode() + ")")).append(") Tj\n");

            // Invoice Title
            sb.append("/F1 14 Tf\n");
            sb.append("0 -28 Td\n");
            sb.append("(").append(escapePdfText("TAX INVOICE")).append(") Tj\n");

            // Invoice Details Box
            sb.append("/F1 9 Tf\n");
            sb.append("0 -18 Td\n");
            sb.append("(").append(escapePdfText("Invoice Number: " + invoice.getInvoiceNumber())).append(") Tj\n");
            sb.append("0 -13 Td\n");
            sb.append("(").append(escapePdfText("Issue Date: " + invoice.getIssueDate() + "     Due Date: " + invoice.getDueDate())).append(") Tj\n");
            sb.append("0 -13 Td\n");
            sb.append("(").append(escapePdfText("Status: " + invoice.getStatus() + "     Reverse Charge: No")).append(") Tj\n");

            // Bill To Box
            sb.append("0 -22 Td\n");
            sb.append("/F1 11 Tf\n");
            sb.append("(").append(escapePdfText("BILLED TO:")).append(") Tj\n");
            sb.append("/F1 9 Tf\n");
            sb.append("0 -14 Td\n");
            String clientName = invoice.getClient() != null ? invoice.getClient().getFullName() : "Valued Client";
            sb.append("(").append(escapePdfText("Client: " + clientName)).append(") Tj\n");
            sb.append("0 -13 Td\n");
            String clientEmail = invoice.getClient() != null ? invoice.getClient().getEmail() : "";
            sb.append("(").append(escapePdfText("Email: " + clientEmail)).append(") Tj\n");
            sb.append("0 -13 Td\n");
            String clientGstin = invoice.getClientGstin() != null ? invoice.getClientGstin() : "Unregistered / Consumer";
            sb.append("(").append(escapePdfText("Client GSTIN: " + clientGstin)).append(") Tj\n");

            // Line Items Table Header
            sb.append("0 -26 Td\n");
            sb.append("/F1 10 Tf\n");
            sb.append("(").append(escapePdfText("----------------------------------------------------------------------------------------------------------------")).append(") Tj\n");
            sb.append("0 -12 Td\n");
            sb.append("(").append(escapePdfText(String.format("%-4s  %-40s  %-10s  %6s  %12s  %14s", "#", "Description", "SAC", "Qty", "Rate (INR)", "Taxable (INR)"))).append(") Tj\n");
            sb.append("0 -12 Td\n");
            sb.append("(").append(escapePdfText("----------------------------------------------------------------------------------------------------------------")).append(") Tj\n");

            // Line Items
            sb.append("/F1 9 Tf\n");
            int index = 1;
            if (invoice.getItems() != null && !invoice.getItems().isEmpty()) {
                for (InvoiceItemEntity item : invoice.getItems()) {
                    sb.append("0 -14 Td\n");
                    String desc = item.getDescription();
                    if (desc.length() > 38) desc = desc.substring(0, 35) + "...";
                    String line = String.format("%-4d  %-40s  %-10s  %6.1f  %12.2f  %14.2f",
                            index++, desc, item.getSacCode(), item.getQuantity(), item.getUnitRate(), item.getTaxableAmount());
                    sb.append("(").append(escapePdfText(line)).append(") Tj\n");
                }
            } else {
                sb.append("0 -14 Td\n");
                String line = String.format("%-4d  %-40s  %-10s  %6.1f  %12.2f  %14.2f",
                        1, "Architectural Professional Consultancy", invoice.getSacCode(), 1.0, invoice.getSubtotal(), invoice.getSubtotal());
                sb.append("(").append(escapePdfText(line)).append(") Tj\n");
            }

            sb.append("0 -12 Td\n");
            sb.append("(").append(escapePdfText("----------------------------------------------------------------------------------------------------------------")).append(") Tj\n");

            // Financial Summary
            sb.append("/F1 9 Tf\n");
            sb.append("0 -18 Td\n");
            sb.append("(").append(escapePdfText(String.format("%70s:  INR %12.2f", "Subtotal", invoice.getSubtotal()))).append(") Tj\n");

            if (invoice.getCgstAmount().doubleValue() > 0 || invoice.getSgstAmount().doubleValue() > 0) {
                sb.append("0 -13 Td\n");
                sb.append("(").append(escapePdfText(String.format("%70s:  INR %12.2f", "CGST (" + invoice.getCgstRate() + "%)", invoice.getCgstAmount()))).append(") Tj\n");
                sb.append("0 -13 Td\n");
                sb.append("(").append(escapePdfText(String.format("%70s:  INR %12.2f", "SGST (" + invoice.getSgstRate() + "%)", invoice.getSgstAmount()))).append(") Tj\n");
            } else if (invoice.getIgstAmount().doubleValue() > 0) {
                sb.append("0 -13 Td\n");
                sb.append("(").append(escapePdfText(String.format("%70s:  INR %12.2f", "IGST (" + invoice.getIgstRate() + "%)", invoice.getIgstAmount()))).append(") Tj\n");
            }

            sb.append("/F1 10 Tf\n");
            sb.append("0 -15 Td\n");
            sb.append("(").append(escapePdfText(String.format("%70s:  INR %12.2f", "TOTAL PAYABLE", invoice.getTotalAmount()))).append(") Tj\n");

            sb.append("/F1 9 Tf\n");
            sb.append("0 -13 Td\n");
            sb.append("(").append(escapePdfText(String.format("%70s:  INR %12.2f", "Verified Paid", invoice.getPaidAmount()))).append(") Tj\n");
            sb.append("0 -13 Td\n");
            sb.append("(").append(escapePdfText(String.format("%70s:  INR %12.2f", "Balance Outstanding", invoice.getOutstandingAmount()))).append(") Tj\n");

            // Payment Instructions
            sb.append("/F1 8 Tf\n");
            sb.append("0 -30 Td\n");
            sb.append("(").append(escapePdfText("PAYMENT INSTRUCTIONS & REMITTANCE:")).append(") Tj\n");
            sb.append("0 -11 Td\n");
            sb.append("(").append(escapePdfText("Bank: HDFC Bank Ltd.  |  Account Name: ArcheOn Design Studio")).append(") Tj\n");
            sb.append("0 -11 Td\n");
            sb.append("(").append(escapePdfText("A/C No: 50200012345678  |  IFSC: HDFC0001234  |  Branch: Pune Main")).append(") Tj\n");
            sb.append("0 -11 Td\n");
            sb.append("(").append(escapePdfText("Please upload transfer receipt/UTR reference in your ArcheOn Client Portal for verification.")).append(") Tj\n");

            // Footer
            sb.append("0 -20 Td\n");
            sb.append("(").append(escapePdfText("This is an electronically generated statutory tax invoice from ArcheOn Design Studio.")).append(") Tj\n");

            sb.append("ET\n");

            byte[] contentBytes = sb.toString().getBytes(StandardCharsets.US_ASCII);

            // Assemble PDF 1.4 document structure
            ByteArrayOutputStream pdf = new ByteArrayOutputStream();
            pdf.write("%PDF-1.4\n".getBytes(StandardCharsets.US_ASCII));
            pdf.write("%\u00e2\u00e3\u00cf\u00d3\n".getBytes(StandardCharsets.ISO_8859_1)); // Binary marker

            List<Long> offsets = new ArrayList<>();

            // Object 1: Catalog
            offsets.add((long) pdf.size());
            pdf.write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // Object 2: Pages
            offsets.add((long) pdf.size());
            pdf.write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // Object 3: Page (A4: 595 x 842 points)
            offsets.add((long) pdf.size());
            pdf.write("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // Object 4: Content Stream
            offsets.add((long) pdf.size());
            String streamHeader = "4 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n";
            pdf.write(streamHeader.getBytes(StandardCharsets.US_ASCII));
            pdf.write(contentBytes);
            pdf.write("\nendstream\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // Object 5: Font (Standard Type1 Helvetica)
            offsets.add((long) pdf.size());
            pdf.write("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // Cross-Reference Table
            long xrefOffset = pdf.size();
            pdf.write("xref\n".getBytes(StandardCharsets.US_ASCII));
            pdf.write(("0 " + (offsets.size() + 1) + "\n").getBytes(StandardCharsets.US_ASCII));
            pdf.write("0000000000 65535 f \n".getBytes(StandardCharsets.US_ASCII));
            for (Long offset : offsets) {
                pdf.write(String.format("%010d 00000 n \n", offset).getBytes(StandardCharsets.US_ASCII));
            }

            // Trailer
            pdf.write("trailer\n<< /Size ".getBytes(StandardCharsets.US_ASCII));
            pdf.write(String.valueOf(offsets.size() + 1).getBytes(StandardCharsets.US_ASCII));
            pdf.write(" /Root 1 0 R >>\nstartxref\n".getBytes(StandardCharsets.US_ASCII));
            pdf.write(String.valueOf(xrefOffset).getBytes(StandardCharsets.US_ASCII));
            pdf.write("\n%%EOF\n".getBytes(StandardCharsets.US_ASCII));

            return pdf.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to generate invoice PDF", e);
        }
    }

    private String escapePdfText(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)");
    }
}
