package com.webui.backend.security.crypto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

/**
 * Enterprise Sensitive Financial and Identity Data Masker.
 * Enforces contextual masking for staff-facing DTOs in accordance with
 * Requirement 4.1-E (Principle of Least Privilege).
 */
@Slf4j
@Component
public class SensitiveDataMasker {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static final Set<String> PRIVILEGED_FINANCE_ROLES = Set.of(
            "ROLE_ADMIN",
            "ROLE_FINANCE_MANAGER",
            "ROLE_FINANCE_CHECKER",
            "ROLE_FINANCE_CHECKER_2",
            "ROLE_FINANCE_MAKER"
    );

    private static final Set<String> ACCOUNT_NUMBER_FIELD_NAMES = Set.of(
            "accountnumber",
            "account_number",
            "accountno",
            "account_no",
            "bankaccountnumber",
            "bank_account_number"
    );

    /**
     * Determines whether the given caller authorities are authorized for unmasked full sensitive data.
     *
     * @param authorities Caller granted authorities
     * @return true if caller has administrative or finance privileges; false otherwise
     */
    public boolean isPrivilegedFinancialUser(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) {
            return false;
        }
        return authorities.stream().anyMatch(a ->
                PRIVILEGED_FINANCE_ROLES.contains(a.getAuthority()) ||
                a.getAuthority().startsWith("ROLE_FINANCE_")
        );
    }

    /**
     * Masks an Indian Permanent Account Number (PAN).
     * Standard format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F -> ABCDE****F).
     *
     * @param pan Raw PAN string
     * @return Masked PAN string
     */
    public String maskPan(String pan) {
        if (pan == null || pan.trim().isEmpty()) {
            return pan;
        }
        String trimmed = pan.trim();
        if (trimmed.length() == 10) {
            return trimmed.substring(0, 5) + "****" + trimmed.substring(9);
        }
        if (trimmed.length() > 4) {
            return trimmed.substring(0, 2) + "*".repeat(trimmed.length() - 4) + trimmed.substring(trimmed.length() - 2);
        }
        return "****";
    }

    /**
     * Masks an Indian Goods & Services Tax Identification Number (GSTIN).
     * Standard format: 2 state digits + 10-char PAN + 3 entity/check characters (e.g. 27ABCDE1234F1Z5 -> 27ABCDE****1Z5).
     *
     * @param gstin Raw GSTIN string
     * @return Masked GSTIN string
     */
    public String maskGstin(String gstin) {
        if (gstin == null || gstin.trim().isEmpty()) {
            return gstin;
        }
        String trimmed = gstin.trim();
        if (trimmed.length() == 15) {
            return trimmed.substring(0, 7) + "****" + trimmed.substring(12);
        }
        if (trimmed.length() > 6) {
            return trimmed.substring(0, 4) + "*".repeat(trimmed.length() - 8) + trimmed.substring(trimmed.length() - 4);
        }
        return "****";
    }

    /**
     * Masks a bank account number, preserving only the last 4 digits.
     *
     * @param accountNumber Raw bank account number
     * @return Masked account number (e.g. 123456789012 -> ********9012)
     */
    public String maskBankAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.trim().isEmpty()) {
            return accountNumber;
        }
        String trimmed = accountNumber.trim();
        if (trimmed.length() <= 4) {
            return "****";
        }
        int maskLength = Math.max(4, trimmed.length() - 4);
        return "*".repeat(maskLength) + trimmed.substring(trimmed.length() - 4);
    }

    /**
     * Masks sensitive bank details inside a JSON string while preserving structural routing data
     * (e.g. IFSC, Bank Name, Branch) for project coordination.
     *
     * @param bankDetailsJson Raw JSON string
     * @return JSON string with account numbers masked
     */
    public String maskBankDetailsJson(String bankDetailsJson) {
        if (bankDetailsJson == null || bankDetailsJson.trim().isEmpty()) {
            return bankDetailsJson;
        }
        String trimmed = bankDetailsJson.trim();
        try {
            JsonNode root = OBJECT_MAPPER.readTree(trimmed);
            if (root.isObject()) {
                ObjectNode objectNode = (ObjectNode) root;
                maskObjectNode(objectNode);
                return OBJECT_MAPPER.writeValueAsString(objectNode);
            }
            return maskBankAccountNumber(trimmed);
        } catch (Exception ex) {
            // If not valid JSON, treat as raw account number / identifier
            return maskBankAccountNumber(trimmed);
        }
    }

    private void maskObjectNode(ObjectNode node) {
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            String fieldName = entry.getKey().toLowerCase().replace("-", "").replace("_", "");
            if (ACCOUNT_NUMBER_FIELD_NAMES.contains(fieldName) && entry.getValue().isTextual()) {
                node.put(entry.getKey(), maskBankAccountNumber(entry.getValue().asText()));
            } else if (entry.getValue().isObject()) {
                maskObjectNode((ObjectNode) entry.getValue());
            }
        }
    }
}
