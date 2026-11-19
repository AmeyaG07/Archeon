"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClientDocumentLibrary,
  type ClientLibraryDocument,
  type ClientLibraryCategory,
} from "@/components/portal/client/ClientDocumentLibrary";
import { apiFetch, resolveApiBaseUrl, getAuthToken } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

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
      const res = await apiFetch("/api/documents");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: ClientLibraryDocument[] = list.map((d: any) => {
          const cat = (d.category || "").toUpperCase();
          let category: ClientLibraryCategory = "Other";
          if (cat.includes("DRAWING")) category = "Drawing";
          else if (cat.includes("RENDER")) category = "Render";
          else if (cat.includes("AGREEMENT") || cat.includes("CONTRACT")) category = "Agreement";
          else if (cat.includes("INVOICE")) category = "Invoice";

          const mime = (d.currentVersionMimeType || "").toLowerCase();
          const fileType: "PDF" | "IMAGE" | "OTHER" = mime.includes("pdf")
            ? "PDF"
            : mime.includes("image")
            ? "IMAGE"
            : "OTHER";

          const sizeBytes = Number(d.currentVersionSizeBytes || 0);
          const sizeLabel =
            sizeBytes > 1048576
              ? `${(sizeBytes / 1048576).toFixed(1)} MB`
              : `${Math.round(sizeBytes / 1024)} KB`;

          return {
            id: d.id || "",
            title: d.title || "Architectural Drawing",
            projectName: d.projectName || "Studio Project",
            category,
            fileType,
            fileSizeLabel: sizeLabel,
            uploadedAt: d.createdAt || new Date().toISOString(),
            version: d.currentVersionNumber ? `v${d.currentVersionNumber}` : "v1.0",
          };
        });
        setDocuments(records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project documents");
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

  const handleDownload = async (doc: ClientLibraryDocument) => {
    try {
      const baseUrl = resolveApiBaseUrl();
      const token = getAuthToken();
      const res = await fetch(`${baseUrl}/api/documents/${doc.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Document download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title}.${doc.fileType.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading file: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <ClientDocumentLibrary
      documents={documents}
      loading={loading}
      error={error ?? undefined}
      onRetry={loadDocuments}
      onOpenDocument={handleDownload}
    />
  );
}
