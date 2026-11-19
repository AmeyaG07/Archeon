package com.webui.backend.security.crypto;

import io.jsonwebtoken.io.Decoders;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Enterprise AES-256-GCM Authenticated Encryption Service.
 * Protects sensitive business identity and financial data at rest.
 * Uses 12-byte random nonces per operation and 128-bit authentication tags.
 */
@Slf4j
@Service
public class AesGcmEncryptionService {

    public static final String ENVELOPE_PREFIX = "enc:v1:";
    public static final int GCM_IV_LENGTH_BYTES = 12;
    public static final int GCM_TAG_LENGTH_BITS = 128;
    public static final int REQUIRED_KEY_LENGTH_BYTES = 32; // 256 bits

    private final SecureRandom secureRandom = new SecureRandom();
    private final String rawSecretKey;
    private SecretKey secretKey;

    @Autowired
    public AesGcmEncryptionService(
            @Value("${app.security.encryption.secret-key:MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=}") String rawSecretKey) {
        this.rawSecretKey = rawSecretKey;
        initKey(rawSecretKey);
    }

    /**
     * Programmatic constructor for unit testing with explicit key strings.
     */
    public AesGcmEncryptionService(String rawSecretKey, boolean initializeImmediately) {
        this.rawSecretKey = rawSecretKey;
        if (initializeImmediately) {
            initKey(rawSecretKey);
        }
    }

    @PostConstruct
    public void init() {
        if (this.secretKey == null) {
            initKey(this.rawSecretKey);
        }
    }

    private void initKey(String keyString) {
        if (keyString == null || keyString.trim().isEmpty()) {
            throw new IllegalStateException("FATAL: AES-256 encryption key configuration is missing or blank");
        }
        byte[] decodedKey;
        try {
            decodedKey = Base64.getDecoder().decode(keyString.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("FATAL: AES-256 encryption key is not a valid Base64-encoded string", e);
        }
        if (decodedKey.length != REQUIRED_KEY_LENGTH_BYTES) {
            throw new IllegalStateException("FATAL: AES-256 requires exactly a 256-bit (32-byte) key. Provided key length: " + decodedKey.length + " bytes");
        }
        this.secretKey = new SecretKeySpec(decodedKey, "AES");
        VendorBankDetailsEncryptionConverter.setStaticEncryptionService(this);
    }

    /**
     * Encrypts plaintext string using AES-256-GCM with a fresh 12-byte cryptographically secure IV.
     *
     * @param plaintext Sensitive data string to encrypt
     * @return Versioned envelope: enc:v1:<base64(iv)>:<base64(ciphertext+tag)>
     */
    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, this.secretKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));

            byte[] cipherBytes = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            String ivBase64 = Base64.getEncoder().encodeToString(iv);
            String cipherBase64 = Base64.getEncoder().encodeToString(cipherBytes);

            return ENVELOPE_PREFIX + ivBase64 + ":" + cipherBase64;
        } catch (GeneralSecurityException e) {
            log.error("Failed to encrypt sensitive data payload: {}", e.getMessage());
            throw new SecurityException("Cryptographic failure during sensitive data encryption: " + e.getMessage(), e);
        }
    }

    /**
     * Decrypts an authenticated AES-256-GCM envelope.
     * If the input is legacy plaintext (does not start with enc:v1:), returns it as-is for backward compatibility.
     *
     * @param envelope Ciphertext envelope: enc:v1:<base64(iv)>:<base64(ciphertext+tag)>
     * @return Decrypted UTF-8 plaintext string
     */
    public String decrypt(String envelope) {
        if (envelope == null) {
            return null;
        }
        if (!envelope.startsWith(ENVELOPE_PREFIX)) {
            // Backward compatibility for existing plaintext records prior to Phase 4.4.1
            log.debug("Encountered unencrypted legacy data representation; returning plaintext");
            return envelope;
        }

        String[] parts = envelope.split(":", 4);
        if (parts.length != 4) {
            throw new SecurityException("Malformed ciphertext envelope: expected 4 colon-delimited tokens");
        }

        try {
            byte[] iv = Base64.getDecoder().decode(parts[2]);
            byte[] cipherBytes = Base64.getDecoder().decode(parts[3]);

            if (iv.length != GCM_IV_LENGTH_BYTES) {
                throw new SecurityException("Invalid GCM IV length in envelope: " + iv.length + " bytes (expected 12)");
            }

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, this.secretKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));

            byte[] plainBytes = cipher.doFinal(cipherBytes);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (AEADBadTagException e) {
            log.error("Authentication tag verification failed: ciphertext or tag has been tampered with or corrupted");
            throw new SecurityException("Decryption rejected: GCM authentication tag mismatch (tampered ciphertext or invalid key)", e);
        } catch (GeneralSecurityException e) {
            log.error("Cryptographic error during decryption: {}", e.getMessage());
            throw new SecurityException("Decryption failed: " + e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            throw new SecurityException("Malformed Base64 payload in ciphertext envelope", e);
        }
    }
}
