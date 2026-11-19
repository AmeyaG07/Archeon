package com.webui.backend.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Local Private Disk implementation of DocumentStorageService.
 * Enforces strict sandbox isolation and path-traversal prevention.
 */
@Slf4j
@Service
public class LocalPrivateStorageService implements DocumentStorageService {

    private final Path rootStoragePath;

    public LocalPrivateStorageService(@Value("${app.storage.local.base-dir:./storage/private}") String baseDir) {
        this.rootStoragePath = Paths.get(baseDir).toAbsolutePath().normalize();
        try {
            if (!Files.exists(this.rootStoragePath)) {
                Files.createDirectories(this.rootStoragePath);
                log.info("Initialized local private storage directory at: {}", this.rootStoragePath);
            }
        } catch (IOException e) {
            log.error("Failed to initialize storage root directory: {}", this.rootStoragePath, e);
            throw new IllegalStateException("Could not initialize local document storage directory", e);
        }
    }

    private Path resolveSafePath(String storageKey) {
        if (storageKey == null || storageKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Storage key cannot be null or empty");
        }
        // Normalize and guard against path traversal attacks (e.g. ../ or ..\)
        Path resolved = this.rootStoragePath.resolve(storageKey).normalize();
        if (!resolved.startsWith(this.rootStoragePath)) {
            log.error("Directory traversal attempt detected! storageKey: {}", storageKey);
            throw new SecurityException("Invalid storage key path: outside configured storage root");
        }
        return resolved;
    }

    @Override
    public String storeFile(InputStream inputStream, long size, String mimeType, String storageKey) throws IOException {
        Path destination = resolveSafePath(storageKey);
        Path parentDir = destination.getParent();
        if (parentDir != null && !Files.exists(parentDir)) {
            Files.createDirectories(parentDir);
        }

        Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
        log.debug("Stored file at: {}", destination);
        return storageKey;
    }

    @Override
    public InputStream retrieveFile(String storageKey) throws IOException {
        Path target = resolveSafePath(storageKey);
        if (!Files.exists(target) || !Files.isRegularFile(target)) {
            throw new FileNotFoundException("Document file not found for storage key: " + storageKey);
        }
        return Files.newInputStream(target);
    }

    @Override
    public void deleteFile(String storageKey) throws IOException {
        Path target = resolveSafePath(storageKey);
        if (Files.exists(target)) {
            Files.delete(target);
            log.debug("Deleted stored file at: {}", target);
        }
    }

    @Override
    public boolean fileExists(String storageKey) {
        try {
            Path target = resolveSafePath(storageKey);
            return Files.exists(target) && Files.isRegularFile(target);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public long getFileSize(String storageKey) throws IOException {
        Path target = resolveSafePath(storageKey);
        if (!Files.exists(target) || !Files.isRegularFile(target)) {
            throw new FileNotFoundException("Document file not found for storage key: " + storageKey);
        }
        return Files.size(target);
    }

    public Path getRootStoragePath() {
        return rootStoragePath;
    }
}
