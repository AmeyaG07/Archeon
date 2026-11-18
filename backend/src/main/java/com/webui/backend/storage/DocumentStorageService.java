package com.webui.backend.storage;

import java.io.IOException;
import java.io.InputStream;

/**
 * Pluggable Storage Abstraction for ArcheOn Document Management System.
 * Insulates backend business logic from physical filesystem or cloud object storage.
 */
public interface DocumentStorageService {

    /**
     * Stores file stream content under a server-generated storage key.
     *
     * @param inputStream File content stream
     * @param size        Content length in bytes
     * @param mimeType    Verified MIME type
     * @param storageKey  Deterministic safe server-side storage path
     * @return Canonical storage key where file was placed
     * @throws IOException If storage write fails
     */
    String storeFile(InputStream inputStream, long size, String mimeType, String storageKey) throws IOException;

    /**
     * Retrieves an input stream for reading the stored file.
     *
     * @param storageKey Canonical storage key
     * @return Readable InputStream of file contents
     * @throws IOException If retrieval fails or file does not exist
     */
    InputStream retrieveFile(String storageKey) throws IOException;

    /**
     * Safely deletes file from storage.
     *
     * @param storageKey Canonical storage key
     * @throws IOException If deletion fails
     */
    void deleteFile(String storageKey) throws IOException;

    /**
     * Checks if a file exists under the given storage key.
     *
     * @param storageKey Canonical storage key
     * @return true if exists as a valid regular file, false otherwise
     */
    boolean fileExists(String storageKey);

    /**
     * Gets file size in bytes.
     *
     * @param storageKey Canonical storage key
     * @return size in bytes
     * @throws IOException If file does not exist or cannot be read
     */
    long getFileSize(String storageKey) throws IOException;
}
