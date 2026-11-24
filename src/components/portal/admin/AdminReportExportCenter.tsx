
"use client";

import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

export type AdminReportCategory =
  | "finance"
  | "projects"
  | "clients"
  | "vendors"
  | "operations"
  | "audit";

export type AdminReportFormat = "pdf" | "csv" | "xlsx";

export type AdminReportDefinition = {
  id: string;
  name: string;
  description: string;
  category: AdminReportCategory;
  formats: AdminReportFormat[];
  requiresElevatedPermission: boolean;
  enabled: boolean;
};

export type AdminReportRequest = {
  id: string;
  reportName: string;
  category: AdminReportCategory;
  format: AdminReportFormat;
  requestedBy: string;
  requestedAt: string;
  status: "queued" | "processing" | "completed" | "failed" | "expired";
  completedAt?: string;
  expiresAt?: string;
  failureReason?: string;
};

type Props = {
  definitions: AdminReportDefinition[];
  requests: AdminReportRequest[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onGenerateReport?: (report: AdminReportDefinition, format: AdminReportFormat) => void;
  onDownloadReport?: (request: AdminReportRequest) => void;
  onOpenRequest?: (request: AdminReportRequest) => void;
};

const categoryLabels: Record<AdminReportCategory, string> = {
  finance: "Finance",
  projects: "Projects",
  clients: "Clients",
  vendors: "Vendors",
  operations: "Operations",
  audit: "Audit",
};

const requestStatusStyles: Record<AdminReportRequest["status"], string> = {
  queued: "bg-blue-50 text-blue-800",
  processing: "bg-amber-50 text-amber-800",
  completed: "bg-emerald-50 text-emerald-800",
  failed: "bg-red-50 text-red-800",
  expired: "bg-[#F2F0EB] text-[#77736D]",
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function FormatIcon({ format }: { format: AdminReportFormat }) {
  if (format === "pdf") return <FileText size={15} />;
  if (format === "xlsx") return <FileSpreadsheet size={15} />;
  return <BarChart3 size={15} />;
}

function StatusPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${className}`}>
      {children}
    </span>
  );
}

export default function AdminReportExportCenter({
  definitions,
  requests,
  loading = false,
  error = null,
  onRefresh,
  onGenerateReport,
  onDownloadReport,
  onOpenRequest,
}: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formatSelections, setFormatSelections] = useState<Record<string, AdminReportFormat>>({});

  const filteredDefinitions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return definitions.filter((report) => {
      const matchesSearch =
        !term ||
        report.name.toLowerCase().includes(term) ||
        report.description.toLowerCase().includes(term);

      const matchesCategory =
        categoryFilter === "all" || report.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [definitions, search, categoryFilter]);

  const completedCount = requests.filter(
    (request) => request.status === "completed"
  ).length;

  const processingCount = requests.filter(
    (request) =>
      request.status === "queued" || request.status === "processing"
  ).length;

  const failedCount = requests.filter(
    (request) => request.status === "failed"
  ).length;

  function selectedFormat(report: AdminReportDefinition) {
    const selected = formatSelections[report.id];

    return selected && report.formats.includes(selected)
      ? selected
      : report.formats[0];
  }

  function updateFormat(reportId: string, format: AdminReportFormat) {
    setFormatSelections((current) => ({
      ...current,
      [reportId]: format,
    }));
  }

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#D8D6D0] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9A7848]">
              Studio administration / Intelligence
            </p>
            <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">
              Reports & exports
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77736D]">
              Request authorised reports, monitor export processing and
              retrieve completed report files.
            </p>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-[#D8D6D0] bg-white px-4 py-2.5 text-xs font-medium text-[#33312E] hover:border-[#B68A4A] disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          )}
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Unable to load report information</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div role="status" className="mb-6 rounded-lg border border-[#D8D6D0] bg-white px-4 py-3 text-xs text-[#77736D]">
            Updating report information…
          </div>
        )}

        {/* Summary */}
        <section className="mb-9">
          <div className="mb-4">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9A7848]">
              01 / Overview
            </p>
            <h2 className="text-lg font-medium text-[#171717]">Export activity</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <CheckCircle2 size={18} className="text-emerald-700" />
              <p className="mt-4 text-xs text-[#77736D]">Completed requests</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">{completedCount}</p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <Clock3 size={18} className="text-amber-700" />
              <p className="mt-4 text-xs text-[#77736D]">In progress</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">{processingCount}</p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <AlertCircle size={18} className="text-red-700" />
              <p className="mt-4 text-xs text-[#77736D]">Failed requests</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">{failedCount}</p>
            </article>
          </div>
        </section>

        {/* Report catalogue */}
        <section className="mb-9">
          <div className="mb-4">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9A7848]">
              02 / Catalogue
            </p>
            <h2 className="text-lg font-medium text-[#171717]">Available reports</h2>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-[#E2E0DA] bg-white p-4 md:grid-cols-[minmax(220px,1fr)_220px]">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99958D]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reports"
                aria-label="Search reports"
                className="w-full rounded-lg border border-[#D8D6D0] bg-[#FAF9F6] py-2.5 pl-9 pr-3 text-xs text-[#252421] outline-none focus:border-[#B68A4A]"
              />
            </div>

            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99958D]" />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter report category"
                className="w-full rounded-lg border border-[#D8D6D0] bg-[#FAF9F6] py-2.5 pl-9 pr-3 text-xs text-[#55534F] outline-none focus:border-[#B68A4A]"
              >
                <option value="all">All categories</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredDefinitions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredDefinitions.map((report) => (
                <article key={report.id} className="rounded-xl border border-[#E2E0DA] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[#9A7848]">
                        {categoryLabels[report.category]}
                      </p>
                      <h3 className="mt-2 text-sm font-medium text-[#252421]">{report.name}</h3>
                      <p className="mt-1 text-xs leading-5 text-[#77736D]">{report.description}</p>
                    </div>

                    {report.requiresElevatedPermission && (
                      <span title="Requires elevated permission" className="rounded-lg bg-[#F2F0EB] p-2 text-[#77736D]">
                        <LockKeyhole size={16} />
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEECE7] pt-4">
                    <div className="flex flex-wrap gap-2">
                      {report.formats.map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => updateFormat(report.id, format)}
                          aria-pressed={selectedFormat(report) === format}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-medium uppercase ${
                            selectedFormat(report) === format
                              ? "border-[#B68A4A] bg-[#F7F2E9] text-[#76572E]"
                              : "border-[#E2E0DA] text-[#77736D]"
                          }`}
                        >
                          <FormatIcon format={format} />
                          {format}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!report.enabled || !onGenerateReport || report.formats.length === 0}
                      onClick={() => onGenerateReport?.(report, selectedFormat(report))}
                      className="rounded-lg bg-[#171717] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#33312E] disabled:cursor-not-allowed disabled:bg-[#D8D6D0] disabled:text-[#77736D]"
                    >
                      Request report
                    </button>
                  </div>

                  {!report.enabled && (
                    <p className="mt-3 text-[10px] text-amber-800">
                      This report is currently unavailable.
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8D6D0] bg-white px-5 py-12 text-center">
              <FileText size={24} className="mx-auto mb-3 text-[#99958D]" />
              <p className="text-sm font-medium text-[#33312E]">No matching reports</p>
              <p className="mt-1 text-xs text-[#77736D]">Change the search term or category filter.</p>
            </div>
          )}
        </section>

        {/* Request history */}
        <section>
          <div className="mb-4">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9A7848]">
              03 / History
            </p>
            <h2 className="text-lg font-medium text-[#171717]">Report requests</h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2E0DA] bg-white">
            {requests.length > 0 ? (
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-[#EEECE7] bg-[#FAF9F6]">
                  <tr className="text-[10px] uppercase tracking-wider text-[#77736D]">
                    <th className="px-5 py-3 font-medium">Report</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Format</th>
                    <th className="px-5 py-3 font-medium">Requested by</th>
                    <th className="px-5 py-3 font-medium">Requested</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Expiry</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-[#EEECE7] last:border-0">
                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-[#252421]">{request.reportName}</p>
                        <p className="mt-1 text-[10px] text-[#99958D]">{request.id}</p>
                        {request.failureReason && (
                          <p className="mt-1 max-w-[220px] text-[10px] text-red-700">{request.failureReason}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">{categoryLabels[request.category]}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs uppercase text-[#55534F]">
                          <FormatIcon format={request.format} />
                          {request.format}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">{request.requestedBy}</td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">{formatDate(request.requestedAt)}</td>
                      <td className="px-5 py-4">
                        <StatusPill className={requestStatusStyles[request.status]}>
                          {request.status}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">{formatDate(request.expiresAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {onOpenRequest && (
                            <button
                              type="button"
                              onClick={() => onOpenRequest(request)}
                              className="text-xs font-medium text-[#9A7848] hover:underline"
                            >
                              Details
                            </button>
                          )}

                          {request.status === "completed" && onDownloadReport && (
                            <button
                              type="button"
                              onClick={() => onDownloadReport(request)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#252421] hover:text-[#9A7848]"
                            >
                              <Download size={13} />
                              Download
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-12 text-center">
                <CalendarDays size={24} className="mx-auto mb-3 text-[#99958D]" />
                <p className="text-sm font-medium text-[#33312E]">No report requests yet</p>
                <p className="mt-1 text-xs text-[#77736D]">
                  Requested reports will appear here when returned by the backend.
                </p>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-9 border-t border-[#D8D6D0] pt-5">
          <div className="flex items-start gap-2">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-[#9A7848]" />
            <p className="text-[11px] leading-5 text-[#8B877F]">
              Reports may contain confidential financial, client, vendor and
              project information. The backend must enforce role permissions,
              project-level access, export auditing, secure file delivery and
              expiring download authorisation. Never expose permanent public
              file links or trust frontend permission checks.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
