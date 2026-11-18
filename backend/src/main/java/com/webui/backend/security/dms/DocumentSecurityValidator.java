package com.webui.backend.security.dms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

/**
 * Validates document upload security:
 * - Path traversal and filename sanitization
 * - File size boundary checks
 * - File extension and MIME type allowlisting
 * - Magic-byte / header signature verification
 * - Rejection of dangerous executable payloads
 * - Cryptographic SHA-256 calculation
 */
@Slf4j
@Component
public class DocumentSecurityValidator {

    private final long maxFileSizeBytes;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "dwg", "dxf", "png", "jpg", "jpeg", "xlsx", "csv"
    );

    private static final Set<String> FORBIDDEN_EXTENSIONS = Set.of(
            "exe", "bat", "cmd", "sh", "ps1", "vbs", "js", "jsp", "asp",
            "aspx", "php", "jar", "war", "py", "elf", "msi", "dll", "com", "scr"
    );

    public DocumentSecurityValidator(@Value("${app.storage.max-file-size-mb:25}") int maxFileSizeMb) {
        this.maxFileSizeBytes = (long) maxFileSizeMb * 1024 * 1024;
    }

    public record ValidatedFile(
            String sanitizedFilename,
            String extension,
            String verifiedMimeType,
            long sizeBytes,
            String sha256Checksum,
            byte[] fileBytes
    ) {}

    /**
     * Inspects, validates and hashes the uploaded file content.
     */
    public ValidatedFile validate(String originalFilename, String suppliedMimeType, InputStream inputStream, long declaredSize) throws IOException {
        // 1. Filename sanitization
        String sanitizedName = sanitizeFilename(originalFilename);
        String extension = extractExtension(sanitizedName).toLowerCase(Locale.ROOT);

        if (FORBIDDEN_EXTENSIONS.contains(extension)) {
            log.warn("Upload rejected: forbidden executable/script extension: {}", extension);
            throw new IllegalArgumentException("File type '" + extension + "' is strictly prohibited for security reasons");
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            log.warn("Upload rejected: extension not in allowlist: {}", extension);
            throw new IllegalArgumentException("Unsupported file type: '" + extension + "'. Allowed types: " + ALLOWED_EXTENSIONS);
        }

        // 2. Read bytes into memory for signature inspection and SHA-256 (up to maxFileSizeBytes)
        byte[] bytes = inputStream.readAllBytes();
        long actualSize = bytes.length;

        if (actualSize == 0) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }

        if (actualSize > maxFileSizeBytes) {
            log.warn("Upload rejected: size {} exceeds maximum allowed {}", actualSize, maxFileSizeBytes);
            throw new IllegalArgumentException("File size exceeds maximum allowed limit (" + (maxFileSizeBytes / (1024 * 1024)) + "MB)");
        }

        // 3. Dangerous executable signatures check
        checkDangerousSignatures(bytes, extension);

        // 4. Magic-byte verification
        String verifiedMime = verifyMagicBytes(extension, suppliedMimeType, bytes);

        // 5. SHA-256 Digest
        String sha256 = calculateSha256(bytes);

        return new ValidatedFile(
                sanitizedName,
                extension,
                verifiedMime,
                actualSize,
                sha256,
                bytes
        );
    }

    public String sanitizeFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be blank");
        }
        // Remove path components (protect against directory traversal)
        String cleaned = filename.replace('\\', '/');
        int lastSlash = cleaned.lastIndexOf('/');
        if (lastSlash >= 0) {
            cleaned = cleaned.substring(lastSlash + 1);
        }
        // Strip null bytes and control chars
        cleaned = cleaned.replaceAll("[\\p{Cntrl}]", "").trim();
        if (cleaned.isEmpty() || cleaned.equals(".") || cleaned.equals("..")) {
            throw new IllegalArgumentException("Invalid filename after sanitization");
        }
        return cleaned;
    }

    private String extractExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            throw new IllegalArgumentException("Uploaded file must have a valid file extension");
        }
        return filename.substring(dot + 1);
    }

    private void checkDangerousSignatures(byte[] bytes, String extension) {
        if (bytes.length >= 2) {
            // Check 'MZ' (DOS/Windows PE Executable)
            if (bytes[0] == 0x4D && bytes[1] == 0x5A) {
                throw new IllegalArgumentException("Security violation: Windows PE executable signature detected");
            }
            // Check '#!' (Shebang shell script)
            if (bytes[0] == 0x23 && bytes[1] == 0x21) {
                throw new IllegalArgumentException("Security violation: Script shebang header detected");
            }
        }
        if (bytes.length >= 4) {
            // Check '\x7fELF' (Linux ELF Binary)
            if (bytes[0] == 0x7F && bytes[1] == 0x45 && bytes[2] == 0x4C && bytes[3] == 0x46) {
                throw new IllegalArgumentException("Security violation: Linux ELF binary signature detected");
            }
            // Check Java Class bytecode CAFEBABE
            if ((bytes[0] & 0xFF) == 0xCA && (bytes[1] & 0xFF) == 0xFE && (bytes[2] & 0xFF) == 0xBA && (bytes[3] & 0xFF) == 0xBE) {
                throw new IllegalArgumentException("Security violation: Compiled Java bytecode detected");
            }
        }
    }

    private String verifyMagicBytes(String extension, String suppliedMime, byte[] bytes) {
        switch (extension) {
            case "pdf":
                // %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
                if (bytes.length < 5 || bytes[0] != 0x25 || bytes[1] != 0x50 || bytes[2] != 0x44 || bytes[3] != 0x46 || bytes[4] != 0x2D) {
                    throw new IllegalArgumentException("File content does not match standard PDF header signature (%PDF-)");
                }
                return "application/pdf";

            case "png":
                // 89 50 4E 47 0D 0A 1A 0A
                byte[] pngSig = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
                if (bytes.length < pngSig.length || !matchesPrefix(bytes, pngSig)) {
                    throw new IllegalArgumentException("File content does not match PNG signature");
                }
                return "image/png";

            case "jpg":
            case "jpeg":
                // FF D8 FF
                if (bytes.length < 3 || (bytes[0] & 0xFF) != 0xFF || (bytes[1] & 0xFF) != 0xD8 || (bytes[2] & 0xFF) != 0xFF) {
                    throw new IllegalArgumentException("File content does not match JPEG signature");
                }
                return "image/jpeg";

            case "dwg":
                // AC10 (0x41, 0x43, 0x31, 0x30)
                if (bytes.length < 4 || bytes[0] != 0x41 || bytes[1] != 0x43 || bytes[2] != 0x31 || bytes[3] != 0x30) {
                    throw new IllegalArgumentException("File content does not match AutoCAD DWG header signature (AC10)");
                }
                return "application/acad";

            case "dxf":
                // DXF ASCII files start with 0\r\nSECTION or contain SECTION in the first 128 bytes
                String headerStr = new String(bytes, 0, Math.min(bytes.length, 128), StandardCharsets.ISO_8859_1);
                if (!headerStr.contains("SECTION") && !headerStr.contains("HEADER")) {
                    throw new IllegalArgumentException("File content does not match AutoCAD DXF format signature");
                }
                return "application/dxf";

            case "xlsx":
                // PK\x03\x04 (ZIP signature for OpenXML)
                if (bytes.length < 4 || bytes[0] != 0x50 || bytes[1] != 0x4B || bytes[2] != 0x03 || bytes[3] != 0x04) {
                    throw new IllegalArgumentException("File content does not match Excel XLSX OpenXML signature (PK..)");
                }
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            case "csv":
                // Verify no null bytes or binary controls
                int checkLen = Math.min(bytes.length, 1024);
                for (int i = 0; i < checkLen; i++) {
                    if (bytes[i] == 0) {
                        throw new IllegalArgumentException("CSV file contains binary null bytes");
                    }
                }
                return "text/csv";

            default:
                return suppliedMime != null ? suppliedMime : "application/octet-stream";
        }
    }

    private boolean matchesPrefix(byte[] source, byte[] prefix) {
        for (int i = 0; i < prefix.length; i++) {
            if (source[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    public static String calculateSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
