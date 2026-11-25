"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  FileText,
  Image as ImageIcon,
  FolderOpen,
  Download,
  Eye,
  Filter,
  ShieldCheck,
  AlertCircle,
  File,
  X,
  Loader2,
} from "lucide-react";

export type ClientLibraryCategory =
  | "Drawing"
  | "Render"
  | "Agreement"
  | "Invoice"
  | "Other";

export interface ClientLibraryDocument {
  id: string;
  documentReference?: string;
  title: string;
  description?: string;
  projectName: string;
  projectReference?: string;
  category: ClientLibraryCategory;
  fileType: "PDF" | "IMAGE" | "OTHER";
  mimeType?: string;
  originalFilename?: string;
  fileSizeLabel: string;
  uploadedAt: string;
  uploadedBy?: string;
  version?: string;
}

export interface DocumentPreviewPayload {
  url: string;
  mimeType: string;
  filename: string;
}

interface ClientDocumentLibraryProps {
  documents: ClientLibraryDocument[];
  loading?: boolean;
  error?: string;
  onOpenDocument: (
    document: ClientLibraryDocument
  ) => void | Promise<void>;
  onPreviewDocument?: (
    document: ClientLibraryDocument
  ) => Promise<DocumentPreviewPayload>;
  onRetry?: () => void;
}

type CategoryFilter = "All" | ClientLibraryCategory;

const CATEGORIES: CategoryFilter[] = [
  "All",
  "Drawing",
  "Render",
  "Agreement",
  "Invoice",
  "Other",
];

function formatUploadedDate(value?: string): string {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function DocumentIcon({
  document,
}: {
  document: ClientLibraryDocument;
}) {
  if (document.category === "Render" || document.fileType === "IMAGE") {
    return <ImageIcon size={20} />;
  }

  if (document.category === "Drawing" || document.fileType === "PDF") {
    return <FileText size={20} />;
  }

  return <File size={20} />;
}

export function ClientDocumentLibrary({
  documents,
  loading = false,
  error,
  onOpenDocument,
  onPreviewDocument,
  onRetry,
}: ClientDocumentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>("All");
  const [activeProject, setActiveProject] = useState("All");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<{
    document: ClientLibraryDocument;
    payload: DocumentPreviewPayload;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && previewState) {
        setPreviewState(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewState]);

  useEffect(() => {
    const url = previewState?.payload.url;
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [previewState]);

  const projects = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(documents.map((document) => document.projectName))
      ).sort(),
    ],
    [documents]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      All: documents.length,
      Drawing: 0,
      Render: 0,
      Agreement: 0,
      Invoice: 0,
      Other: 0,
    };
    for (const doc of documents) {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    }
    return counts;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        document.title.toLowerCase().includes(query) ||
        document.projectName.toLowerCase().includes(query) ||
        (document.documentReference || "").toLowerCase().includes(query) ||
        (document.description || "").toLowerCase().includes(query) ||
        (document.originalFilename || "").toLowerCase().includes(query);

      const matchesCategory =
        activeCategory === "All" ||
        document.category === activeCategory;

      const matchesProject =
        activeProject === "All" ||
        document.projectName === activeProject;

      return matchesSearch && matchesCategory && matchesProject;
    });
  }, [documents, searchQuery, activeCategory, activeProject]);

  const assignedProjectCount = Math.max(0, projects.length - 1);

  async function handleDownloadClick(document: ClientLibraryDocument) {
    setActionError(null);
    setDownloadingId(document.id);
    try {
      await onOpenDocument(document);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to download document."
      );
    } finally {
      setDownloadingId((current) => (current === document.id ? null : current));
    }
  }

  async function handlePreviewClick(document: ClientLibraryDocument) {
    if (!onPreviewDocument) {
      await handleDownloadClick(document);
      return;
    }
    setActionError(null);
    setPreviewingId(document.id);
    try {
      const payload = await onPreviewDocument(document);
      setPreviewState({ document, payload });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to preview document."
      );
    } finally {
      setPreviewingId((current) => (current === document.id ? null : current));
    }
  }

  function closePreviewModal() {
    setPreviewState(null);
  }

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-6 sm:p-10">
        <p className="text-sm text-[#77736C]">
          Loading your document library...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F2F0EB] p-5 sm:p-10">
        <section
          role="alert"
          className="mx-auto max-w-7xl border border-[#E3C9C5] bg-[#FAF3F1] p-7"
        >
          <AlertCircle size={22} className="text-[#9A5147]" />

          <h2 className="mt-4 font-serif text-2xl text-[#773B34]">
            Document library unavailable
          </h2>

          <p className="mt-3 text-sm leading-7 text-[#805B55]">
            {error}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 text-xs uppercase tracking-widest text-[#773B34] underline"
            >
              Try Again
            </button>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="bg-[#F2F0EB] px-4 py-7 sm:px-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Page Section Header */}
        <header className="border-b border-[#D8D6D0] pb-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Client Portal / Shared Resources
          </p>

          <h2 className="mt-3 font-serif text-3xl text-[#171717] md:text-4xl">
            Document Library
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#77736C]">
            Find, preview, and download working drawings, visualisations,
            agreements, and handover records shared with you by the studio.
          </p>
        </header>

        {/* Action Error Banner */}
        {actionError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 border border-[#E3C9C5] bg-[#FAF3F1] px-5 py-3.5 text-xs text-[#773B34]"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="font-mono text-[10px] uppercase tracking-wider underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Library Summary */}
        <section className="flex flex-col justify-between gap-5 border border-[#D8D6D0] bg-white p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#F2F0EB] text-[#A58A64]">
              <FolderOpen size={22} />
            </div>

            <div>
              <p className="font-serif text-2xl text-[#171717]">
                {documents.length} Shared {documents.length === 1 ? "File" : "Files"}
              </p>

              <p className="mt-1 text-xs text-[#99958D]">
                Across {assignedProjectCount} assigned{" "}
                {assignedProjectCount === 1 ? "project" : "projects"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#77736C]">
            <ShieldCheck size={17} className="shrink-0 text-[#A58A64]" />
            <span className="font-mono text-[9px] uppercase tracking-widest">
              Client-authorised documents
            </span>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="space-y-5 border border-[#D8D6D0] bg-white p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className={projects.length > 2 ? "lg:col-span-8" : "lg:col-span-12"}>
              <label
                htmlFor="document-search"
                className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-[#99958D]"
              >
                Search Library
              </label>

              <div className="flex items-center gap-3 border border-[#D8D6D0] bg-[#FAF9F5] px-4">
                <Search size={17} className="shrink-0 text-[#A58A64]" />

                <input
                  id="document-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title, document reference, project, or filename..."
                  className="w-full bg-transparent py-3 text-sm text-[#171717] outline-none placeholder:text-[#AAA69E]"
                />
              </div>
            </div>

            {projects.length > 2 && (
              <div className="lg:col-span-4">
                <label
                  htmlFor="project-filter"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-[#99958D]"
                >
                  Filter by Project
                </label>

                <select
                  id="project-filter"
                  value={activeProject}
                  onChange={(event) => setActiveProject(event.target.value)}
                  className="w-full border border-[#D8D6D0] bg-[#FAF9F5] px-4 py-3 text-sm text-[#33312D] outline-none focus:border-[#A58A64]"
                >
                  {projects.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="border-t border-[#EAE8E2] pt-4">
            <div className="mb-3 flex items-center gap-2.5">
              <Filter size={14} className="text-[#A58A64]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
                Filter by Category
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={`border px-3.5 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                    activeCategory === category
                      ? "border-[#171717] bg-[#171717] text-white"
                      : "border-[#D8D6D0] bg-[#FAF9F5] text-[#77736C] hover:border-[#A58A64] hover:text-[#171717]"
                  }`}
                >
                  {category} ({categoryCounts[category]})
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section>
          <div className="flex items-end justify-between gap-4 border-b border-[#D8D6D0] pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Available Resources
              </p>

              <h3 className="mt-2 font-serif text-2xl text-[#171717]">
                Shared Documents
              </h3>
            </div>

            <span className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              {filteredDocuments.length}{" "}
              {filteredDocuments.length === 1 ? "Result" : "Results"}
            </span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="mt-6 border border-[#D8D6D0] bg-white px-6 py-14 text-center">
              <FolderOpen
                size={29}
                strokeWidth={1.3}
                className="mx-auto text-[#A58A64]"
              />

              <h4 className="mt-4 font-serif text-2xl text-[#171717]">
                No documents found
              </h4>

              <p className="mt-2 text-sm leading-7 text-[#77736C]">
                Try another search term or reset your active filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                  setActiveProject("All");
                }}
                className="mt-5 text-xs uppercase tracking-widest text-[#A58A64] underline underline-offset-4"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredDocuments.map((document) => {
                const canPreview =
                  Boolean(onPreviewDocument) &&
                  (document.fileType === "PDF" || document.fileType === "IMAGE");
                const isDownloading = downloadingId === document.id;
                const isPreviewing = previewingId === document.id;

                return (
                  <article
                    key={document.id}
                    className="flex flex-col justify-between gap-5 border border-[#D8D6D0] bg-white p-5 transition-colors hover:border-[#C7B79B] lg:flex-row lg:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-[#EAE8E2] bg-[#FAF9F5] text-[#A58A64]">
                        <DocumentIcon document={document} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {document.documentReference && (
                            <span className="border border-[#D8D6D0] bg-[#FAF9F5] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                              {document.documentReference}
                            </span>
                          )}
                          <span className="border border-[#E5DEC9] bg-[#FAF7EE] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#8C6D3B]">
                            {document.category}
                          </span>
                        </div>

                        <h4 className="mt-2 text-base font-medium text-[#171717]">
                          {document.title}
                        </h4>

                        <p className="mt-1 text-xs font-medium text-[#55534F]">
                          {document.projectName}
                          {document.projectReference
                            ? ` (${document.projectReference})`
                            : ""}
                        </p>

                        {document.description && (
                          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#77736C]">
                            {document.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8E8A83]">
                          {document.originalFilename && (
                            <span className="normal-case tracking-normal text-[#55534F]">
                              {document.originalFilename}
                            </span>
                          )}
                          <span>{document.fileType}</span>
                          <span>{document.fileSizeLabel}</span>
                          {document.version && <span>{document.version}</span>}
                          <span>Shared {formatUploadedDate(document.uploadedAt)}</span>
                          {document.uploadedBy && (
                            <span>By {document.uploadedBy}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                      {canPreview && (
                        <button
                          type="button"
                          disabled={isPreviewing}
                          onClick={() => handlePreviewClick(document)}
                          className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-[#FAF9F5] px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#33312D] transition-colors hover:border-[#A58A64] hover:text-[#171717] disabled:opacity-60"
                        >
                          {isPreviewing ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Eye size={14} />
                          )}
                          Preview
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isDownloading}
                        onClick={() => handleDownloadClick(document)}
                        className="inline-flex items-center gap-2 border border-[#171717] bg-[#171717] px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[#33312D] disabled:opacity-60"
                      >
                        {isDownloading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                        Download
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Security Notice */}
        <div className="flex items-start gap-4 border border-[#D8D6D0] bg-white p-5">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-[#A58A64]"
          />

          <p className="text-xs leading-6 text-[#77736C]">
            Documents are made available strictly according to your project access
            permissions. Integrity and authorisation are verified by the server
            whenever a document is previewed or downloaded.
          </p>
        </div>
      </div>

      {/* Secure Document Preview Modal */}
      {previewState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePreviewModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-preview-title"
            className="flex h-[85vh] w-full max-w-5xl flex-col border border-[#D8D6D0] bg-[#FAF9F5] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#D8D6D0] bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  {previewState.document.documentReference || previewState.document.category}
                  {previewState.document.version ? ` • ${previewState.document.version}` : ""}
                </p>
                <h3
                  id="document-preview-title"
                  className="truncate font-serif text-lg text-[#171717]"
                >
                  {previewState.document.title}
                </h3>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadClick(previewState.document)}
                  className="inline-flex items-center gap-2 border border-[#171717] bg-[#171717] px-3.5 py-2 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#33312D]"
                >
                  <Download size={13} />
                  Download
                </button>
                <button
                  type="button"
                  onClick={closePreviewModal}
                  aria-label="Close preview"
                  className="flex h-9 w-9 items-center justify-center border border-[#D8D6D0] bg-white text-[#55534F] hover:border-[#171717] hover:text-[#171717]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#EBE8E1] p-4">
              {previewState.payload.mimeType.includes("image") ? (
                <div className="flex h-full items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewState.payload.url}
                    alt={previewState.document.title}
                    className="max-h-full max-w-full border border-[#D8D6D0] bg-white object-contain"
                  />
                </div>
              ) : (
                <iframe
                  title={previewState.document.title}
                  src={previewState.payload.url}
                  className="h-full w-full border border-[#D8D6D0] bg-white"
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
