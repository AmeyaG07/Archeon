
"use client";

import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  FolderOpen,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";

export type AdminDocumentStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "rejected"
  | "archived";

export type AdminDocumentVisibility =
  | "internal"
  | "client"
  | "vendor"
  | "restricted";

export type AdminDocument = {
  id: string;
  name: string;
  projectName: string;
  projectId: string;
  category:
    | "drawing"
    | "render"
    | "contract"
    | "invoice"
    | "payment_proof"
    | "report"
    | "other";
  fileType: string;
  fileSizeBytes?: number;
  revision?: string;
  status: AdminDocumentStatus;
  visibility: AdminDocumentVisibility;
  uploadedBy: string;
  uploadedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  description?: string;
};

type Props = {
  documents: AdminDocument[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onUpload?: () => void;
  onOpenDocument?: (document: AdminDocument) => void;
  onDownloadDocument?: (document: AdminDocument) => void;
  onReviewDocument?: (document: AdminDocument) => void;
  onChangeVisibility?: (document: AdminDocument) => void;
  onArchiveDocument?: (document: AdminDocument) => void;
};

const statusStyles: Record<AdminDocumentStatus, string> = {
  draft: "bg-[#F2F0EB] text-[#55534F]",
  under_review: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-800",
  archived: "bg-[#EAE8E2] text-[#77736D]",
};

const visibilityStyles: Record<AdminDocumentVisibility, string> = {
  internal: "bg-blue-50 text-blue-800",
  client: "bg-emerald-50 text-emerald-800",
  vendor: "bg-amber-50 text-amber-800",
  restricted: "bg-red-50 text-red-800",
};

const categoryLabels: Record<AdminDocument["category"], string> = {
  drawing: "Drawing",
  render: "3D render",
  contract: "Contract",
  invoice: "Invoice",
  payment_proof: "Payment proof",
  report: "Report",
  other: "Other",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatFileSize(bytes?: number) {
  if (bytes === undefined || bytes < 0) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentIcon({ category }: { category: AdminDocument["category"] }) {
  if (category === "drawing" || category === "render") {
    return <FileImage size={18} />;
  }

  if (category === "invoice" || category === "payment_proof") {
    return <FileText size={18} />;
  }

  return <File size={18} />;
}

function StatusPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export default function AdminDocumentManagement({
  documents,
  loading = false,
  error = null,
  onRefresh,
  onUpload,
  onOpenDocument,
  onDownloadDocument,
  onReviewDocument,
  onChangeVisibility,
  onArchiveDocument,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        !term ||
        [
          document.name,
          document.projectName,
          document.projectId,
          document.uploadedBy,
          document.description ?? "",
          document.revision ?? "",
        ].some((value) => value.toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === "all" || document.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || document.category === categoryFilter;

      const matchesVisibility =
        visibilityFilter === "all" ||
        document.visibility === visibilityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesVisibility
      );
    });
  }, [documents, search, statusFilter, categoryFilter, visibilityFilter]);

  const pendingReviewCount = documents.filter(
    (document) => document.status === "under_review"
  ).length;

  const approvedCount = documents.filter(
    (document) => document.status === "approved"
  ).length;

  const restrictedCount = documents.filter(
    (document) => document.visibility === "restricted"
  ).length;

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#D8D6D0] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9A7848]">
              Studio administration / Records
            </p>

            <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">
              Document management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77736D]">
              Review project records, control document classifications
              and monitor approval status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D8D6D0] bg-white px-4 py-2.5 text-xs font-medium text-[#33312E] hover:border-[#B68A4A] disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            )}

            {onUpload && (
              <button
                type="button"
                onClick={onUpload}
                className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#33312E]"
              >
                <Upload size={14} />
                Upload document
              </button>
            )}
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Unable to load documents</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-[#D8D6D0] bg-white px-4 py-3 text-xs text-[#77736D]"
          >
            Loading document records…
          </div>
        )}

        {/* Summary */}
        <section className="mb-8">
          <div className="mb-4">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9A7848]">
              01 / Overview
            </p>
            <h2 className="text-lg font-medium text-[#171717]">
              Document inventory
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <FolderOpen size={18} className="text-[#9A7848]" />
              <p className="mt-4 text-xs text-[#77736D]">
                Total documents
              </p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {documents.length}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <Clock3 size={18} className="text-amber-700" />
              <p className="mt-4 text-xs text-[#77736D]">
                Awaiting review
              </p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {pendingReviewCount}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <CheckCircle2 size={18} className="text-emerald-700" />
              <p className="mt-4 text-xs text-[#77736D]">
                Approved
              </p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {approvedCount}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <LockKeyhole size={18} className="text-red-700" />
              <p className="mt-4 text-xs text-[#77736D]">
                Restricted records
              </p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {restrictedCount}
              </p>
            </article>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-5 rounded-xl border border-[#E2E0DA] bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_180px_180px]">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99958D]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search documents or projects"
                aria-label="Search documents or projects"
                className="w-full rounded-lg border border-[#D8D6D0] bg-[#FAF9F6] py-2.5 pl-9 pr-3 text-xs text-[#252421] outline-none focus:border-[#B68A4A]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by document status"
              className="rounded-lg border border-[#D8D6D0] bg-[#FAF9F6] px-3 py-2.5 text-xs text-[#55534F] outline-none focus:border-[#B68A4A]"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by document category"
              className="rounded-lg border border-[#D8D6D0] bg-[#FAF9F6] px-3 py-2.5 text-xs text-[#55534F] outline-none focus:border-[#B68A4A]"
            >
              <option value="all">All categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value)}
              aria-label="Filter by document visibility"
              className="rounded-lg border border-[#D8D6D0] bg-[#FAF9F6] px-3 py-2.5 text-xs text-[#55534F] outline-none focus:border-[#B68A4A]"
            >
              <option value="all">All visibility levels</option>
              <option value="internal">Internal</option>
              <option value="client">Client</option>
              <option value="vendor">Vendor</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>

          <p className="mt-3 text-[10px] text-[#99958D]">
            Showing {filteredDocuments.length} of {documents.length} records
          </p>
        </section>

        {/* Document table */}
        <section className="overflow-hidden rounded-xl border border-[#E2E0DA] bg-white">
          {filteredDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="border-b border-[#EEECE7] bg-[#FAF9F6]">
                  <tr className="text-[10px] uppercase tracking-wider text-[#77736D]">
                    <th className="px-5 py-3 font-medium">Document</th>
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Revision</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Visibility</th>
                    <th className="px-5 py-3 font-medium">Uploaded</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDocuments.map((document) => (
                    <tr
                      key={document.id}
                      className="border-b border-[#EEECE7] last:border-0 hover:bg-[#FAF9F6]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <span className="rounded-lg bg-[#F2F0EB] p-2 text-[#77736D]">
                            <DocumentIcon category={document.category} />
                          </span>
                          <div className="max-w-[220px]">
                            <p className="truncate text-xs font-medium text-[#252421]">
                              {document.name}
                            </p>
                            <p className="mt-1 text-[10px] text-[#99958D]">
                              {document.fileType} ·{" "}
                              {formatFileSize(document.fileSizeBytes)}
                            </p>
                            {document.description && (
                              <p className="mt-1 line-clamp-2 text-[10px] text-[#77736D]">
                                {document.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs text-[#252421]">
                          {document.projectName}
                        </p>
                        <p className="mt-1 text-[10px] text-[#99958D]">
                          {document.projectId}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {categoryLabels[document.category]}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {document.revision ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusPill className={statusStyles[document.status]}>
                          {document.status.replace("_", " ")}
                        </StatusPill>
                      </td>

                      <td className="px-5 py-4">
                        <StatusPill
                          className={visibilityStyles[document.visibility]}
                        >
                          {document.visibility}
                        </StatusPill>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs text-[#55534F]">
                          {formatDate(document.uploadedAt)}
                        </p>
                        <p className="mt-1 text-[10px] text-[#99958D]">
                          {document.uploadedBy}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {onOpenDocument && (
                            <button
                              type="button"
                              onClick={() => onOpenDocument(document)}
                              title="View document details"
                              aria-label={`View ${document.name}`}
                              className="rounded-md border border-[#E2E0DA] p-2 text-[#77736D] hover:border-[#B68A4A] hover:text-[#9A7848]"
                            >
                              <Eye size={14} />
                            </button>
                          )}

                          {onDownloadDocument && (
                            <button
                              type="button"
                              onClick={() => onDownloadDocument(document)}
                              title="Download document"
                              aria-label={`Download ${document.name}`}
                              className="rounded-md border border-[#E2E0DA] p-2 text-[#77736D] hover:border-[#B68A4A] hover:text-[#9A7848]"
                            >
                              <Download size={14} />
                            </button>
                          )}

                          {document.status === "under_review" &&
                            onReviewDocument && (
                              <button
                                type="button"
                                onClick={() => onReviewDocument(document)}
                                className="text-[10px] font-medium text-[#9A7848] hover:underline"
                              >
                                Review
                              </button>
                            )}

                          {onChangeVisibility && (
                            <button
                              type="button"
                              onClick={() => onChangeVisibility(document)}
                              title="Change visibility"
                              aria-label={`Change visibility for ${document.name}`}
                              className="rounded-md border border-[#E2E0DA] p-2 text-[#77736D] hover:border-[#B68A4A] hover:text-[#9A7848]"
                            >
                              <LockKeyhole size={14} />
                            </button>
                          )}

                          {document.status !== "archived" &&
                            onArchiveDocument && (
                              <button
                                type="button"
                                onClick={() => onArchiveDocument(document)}
                                title="Archive document"
                                aria-label={`Archive ${document.name}`}
                                className="rounded-md border border-[#E2E0DA] p-2 text-[#77736D] hover:border-red-300 hover:text-red-700"
                              >
                                <Archive size={14} />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-10 text-center">
              <FolderOpen size={25} className="mb-3 text-[#99958D]" />
              <p className="text-sm font-medium text-[#33312E]">
                No matching documents
              </p>
              <p className="mt-1 text-xs text-[#77736D]">
                Try changing the search term or filters.
              </p>
            </div>
          )}
        </section>

        <footer className="mt-8 border-t border-[#D8D6D0] pt-5">
          <p className="text-[11px] leading-5 text-[#8B877F]">
            Document access must be enforced by the backend using
            authenticated identity, project ownership, role permissions
            and server-side file authorization. Never expose permanent
            private storage URLs. Payment proofs, contracts and restricted
            records require additional access controls and audit logging.
          </p>
        </footer>
      </div>
    </main>
  );
}
