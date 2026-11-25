"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClientDocumentLibrary,
  type ClientLibraryDocument,
  type ClientLibraryCategory,
  type DocumentPreviewPayload,
} from "@/components/portal/client/ClientDocumentLibrary";
import { apiFetch, resolveApiBaseUrl, getAuthToken } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface ProjectLookupItem {
  id: string;
  name?: string;
  projectReference?: string;
}

function mapCategory(rawCategory?: string): ClientLibraryCategory {
  const cat = (rawCategory || "").toUpperCase();
  if (cat.includes("DRAWING")) return "Drawing";
  if (cat.includes("RENDER") || cat.includes("PHOTO")) return "Render";
  if (cat.includes("AGREEMENT") || cat.includes("CONTRACT") || cat.includes("PERMIT")) {
    return "Agreement";
  }
  if (cat.includes("INVOICE")) return "Invoice";
  return "Other";
}

function resolveFileType(mimeType: string, filename?: string): "PDF" | "IMAGE" | "OTHER" {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedName = (filename || "").toLowerCase();
  if (normalizedMime.includes("pdf") || normalizedName.endsWith(".pdf")) {
    return "PDF";
  }
  if (
    normalizedMime.includes("image") ||
    /\.(png|jpe?g|webp|gif)$/i.test(normalizedName)
  ) {
    return "IMAGE";
  }
  return "OTHER";
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "Size unavailable";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1048576) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1048576).toFixed(1)} MB`;
}

function extractFilenameFromHeader(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const match = headerValue.match(/filename\*?=(?:UTF-8''|")?([^";\r\n]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1].trim()) : null;
}

export default function ClientDocumentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [documents, setDocuments] = useState<ClientLibraryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docsRes, projectsRes] = await Promise.all([
        apiFetch("/api/documents"),
        apiFetch("/api/operational-projects").catch(() => null),
      ]);

      const list = await docsRes.json();
      const projectMap = new Map<string, ProjectLookupItem>();

      if (projectsRes && projectsRes.ok) {
        const projectsJson = await projectsRes.json();
        if (Array.isArray(projectsJson)) {
          for (const proj of projectsJson) {
            if (proj?.id) {
              projectMap.set(String(proj.id), {
                id: String(proj.id),
                name: proj.name,
                projectReference: proj.projectReference,
              });
            }
          }
        }
      }

      if (Array.isArray(list)) {
        const records: ClientLibraryDocument[] = list.map((d: any) => {
          const currentVersion = d.currentVersion || {};
          const mimeType = String(
            currentVersion.mimeType || d.currentVersionMimeType || ""
          );
          const originalFilename =
            currentVersion.originalFilename || d.originalFilename || undefined;
          const sizeBytes = Number(
            currentVersion.fileSizeBytes ?? d.currentVersionSizeBytes ?? 0
          );
          const versionNum =
            currentVersion.versionNumber ?? d.currentVersionNumber ?? d.version;
          const linkedProject = d.projectId
            ? projectMap.get(String(d.projectId))
            : undefined;

          return {
            id: d.id || "",
            documentReference: d.documentReference || undefined,
            title: d.title || "Architectural Document",
            description: d.description || undefined,
            projectName:
              linkedProject?.name || d.projectName || "Studio Project",
            projectReference: linkedProject?.projectReference,
            category: mapCategory(d.category),
            fileType: resolveFileType(mimeType, originalFilename),
            mimeType,
            originalFilename,
            fileSizeLabel: formatFileSize(sizeBytes),
            uploadedAt:
              currentVersion.uploadedAt ||
              d.createdAt ||
              new Date().toISOString(),
            uploadedBy: currentVersion.uploadedBy || d.createdBy || undefined,
            version: versionNum ? `v${versionNum}` : "v1",
          };
        });
        setDocuments(records);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load project documents"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadDocuments();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadDocuments, router]);

  const fetchDocumentBlob = async (doc: ClientLibraryDocument) => {
    const baseUrl = resolveApiBaseUrl();
    const token = getAuthToken();
    const res = await fetch(`${baseUrl}/api/documents/${doc.id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Document retrieval failed");

    const blob = await res.blob();
    const headerFilename = extractFilenameFromHeader(
      res.headers.get("Content-Disposition")
    );
    const mimeType =
      res.headers.get("Content-Type") || doc.mimeType || blob.type || "application/octet-stream";
    const fallbackExt =
      doc.fileType === "PDF" ? "pdf" : doc.fileType === "IMAGE" ? "png" : "bin";
    const filename =
      headerFilename || doc.originalFilename || `${doc.title}.${fallbackExt}`;

    return { blob, mimeType, filename };
  };

  const handleDownload = async (doc: ClientLibraryDocument) => {
    const { blob, filename } = await fetchDocumentBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handlePreview = async (
    doc: ClientLibraryDocument
  ): Promise<DocumentPreviewPayload> => {
    const { blob, mimeType, filename } = await fetchDocumentBlob(doc);
    const typedBlob = new Blob([blob], { type: mimeType });
    const url = window.URL.createObjectURL(typedBlob);
    return { url, mimeType, filename };
  };

  return (
    <ClientDocumentLibrary
      documents={documents}
      loading={loading}
      error={error ?? undefined}
      onRetry={loadDocuments}
      onOpenDocument={handleDownload}
      onPreviewDocument={handlePreview}
    />
  );
}
