"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, FolderOpen, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface DocumentItem {
  id: string;
  title?: string;
  fileName?: string;
  category?: string;
  classification?: string;
  projectName?: string;
  createdAt?: string;
}

export default function ClientDocumentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/documents");
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
      setDocuments(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        void loadDocuments();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadDocuments, router]);

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-4 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D8D6D0] pb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
              Client Portal / Authorised Files
            </p>
            <h1 className="mt-2 font-serif text-3xl text-[#171717] md:text-4xl">
              Project Documents
            </h1>
            <p className="mt-1 text-xs text-[#77736C]">
              Drawings, specifications, and records shared with your account.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDocuments()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#55514A] hover:border-[#171717] disabled:opacity-40"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="border border-[#D8D6D0] bg-white p-10 text-center font-mono text-xs text-[#77736C]">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="border border-[#D8D6D0] bg-white p-12 text-center">
            <FolderOpen size={24} className="mx-auto text-[#A58A64]" />
            <h2 className="mt-3 font-serif text-xl text-[#171717]">
              No Documents Shared Yet
            </h2>
            <p className="mt-1 text-xs text-[#77736C]">
              Drawings and project documents shared by the studio will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E2DC] border border-[#D8D6D0] bg-white">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-[#FAF9F6]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={18} className="shrink-0 text-[#A58A64]" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#171717] truncate">
                      {doc.title || doc.fileName || "Project Document"}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-[#77736C]">
                      {doc.category || doc.classification || "DOCUMENT"}
                      {doc.projectName ? ` · ${doc.projectName}` : ""}
                      {doc.createdAt ? ` · ${new Date(doc.createdAt).toLocaleDateString("en-IN")}` : ""}
                    </p>
                  </div>
                </div>

                <a
                  href={`/api/documents/${doc.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 border border-[#D8D6D0] bg-white px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-[#55514A] hover:border-[#171717]"
                >
                  <Download size={12} />
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
