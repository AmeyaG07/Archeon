package com.webui.backend.security.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * JPA AttributeConverter for VendorEntity.bankDetailsJson.
 * Transparently encrypts sensitive vendor bank details before database write
 * and decrypts upon entity load using AES-256-GCM.
 */
@Slf4j
@Component
@Converter
public class VendorBankDetailsEncryptionConverter implements AttributeConverter<String, String> {

    private static AesGcmEncryptionService staticEncryptionService;
    private final AesGcmEncryptionService encryptionService;

    @Autowired
    public VendorBankDetailsEncryptionConverter(AesGcmEncryptionService encryptionService) {
        this.encryptionService = encryptionService;
        staticEncryptionService = encryptionService;
    }

    public VendorBankDetailsEncryptionConverter() {
        this.encryptionService = staticEncryptionService;
    }

    public static void setStaticEncryptionService(AesGcmEncryptionService service) {
        staticEncryptionService = service;
    }

    private AesGcmEncryptionService getService() {
        if (this.encryptionService != null) {
            return this.encryptionService;
        }
        if (staticEncryptionService != null) {
            return staticEncryptionService;
        }
        throw new IllegalStateException("AesGcmEncryptionService is not initialized for JPA AttributeConverter");
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        return getService().encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return getService().decrypt(dbData);
    }
}
