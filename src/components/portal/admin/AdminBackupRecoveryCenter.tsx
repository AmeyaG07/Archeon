
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Eye,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";

export type BackupStatus =
  | "SUCCESS"
  | "FAILED"
  | "IN_PROGRESS"
  | "PARTIAL"
  | "UNKNOWN";

export type BackupVerification =
  | "VERIFIED"
  | "FAILED"
  | "PENDING"
  | "NOT_TESTED";

export type RecoveryRequestStatus =
  | "REQUESTED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

export type BackupRecord = {
  id: string;
  name: string;
  backupType: "FULL" | "INCREMENTAL" | "DIFFERENTIAL" | "UNKNOWN";
  status: BackupStatus;
  verification: BackupVerification;
  createdAt: string;
  completedAt?: string;
  sizeBytes?: number;
  retentionUntil?: string;
  coveredSystems: string[];
  reference?: string;
};

export type RecoveryRequest = {
  id: string;
  backupId: string;
  targetDescription: string;
  requestedBy: string;
  requestedAt: string;
  status: RecoveryRequestStatus;
  reviewedBy?: string;
  completedAt?: string;
  reason: string;
};

type Props = {
  backups: BackupRecord[];
  recoveryRequests: RecoveryRequest[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenBackup?: (backup: BackupRecord) => void;
  onOpenRecoveryRequest?: (request: RecoveryRequest) => void;
  onReviewRecoveryRequest?: (
    request: RecoveryRequest,
    decision: "APPROVE" | "REJECT"
  ) => void;
};

const backupStatusStyles: Record<BackupStatus, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  PARTIAL: "bg-amber-50 text-amber-800",
  UNKNOWN: "bg-stone-100 text-stone-600",
};

const verificationStyles: Record<BackupVerification, string> = {
  VERIFIED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  PENDING: "bg-amber-50 text-amber-800",
  NOT_TESTED: "bg-stone-100 text-stone-600",
};

const recoveryStatusStyles: Record<RecoveryRequestStatus, string> = {
  REQUESTED: "bg-blue-50 text-blue-700",
  PENDING_APPROVAL: "bg-amber-50 text-amber-800",
  APPROVED: "bg-indigo-50 text-indigo-700",
  REJECTED: "bg-red-50 text-red-700",
  IN_PROGRESS: "bg-orange-50 text-orange-800",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
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

function formatBytes(value?: number) {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    return "Not recorded";
  }

  if (value === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  return `${(value / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-500">{label}</p>
        <span className="text-stone-400">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminBackupRecoveryCenter({
  backups,
  recoveryRequests,
  loading = false,
  error,
  onRefresh,
  onOpenBackup,
  onOpenRecoveryRequest,
  onReviewRecoveryRequest,
}: Props) {
  const [activeTab, setActiveTab] = useState<"backups" | "recovery">(
    "backups"
  );
  const [search, setSearch] = useState("");
  const [backupStatusFilter, setBackupStatusFilter] = useState("ALL");
  const [verificationFilter, setVerificationFilter] = useState("ALL");
  const [recoveryFilter, setRecoveryFilter] = useState("ALL");

  const metrics = useMemo(
    () => ({
      total: backups.length,
      successful: backups.filter((item) => item.status === "SUCCESS").length,
      failed: backups.filter((item) => item.status === "FAILED").length,
      unverified: backups.filter(
        (item) =>
          item.verification === "PENDING" ||
          item.verification === "NOT_TESTED"
      ).length,
    }),
    [backups]
  );

  const filteredBackups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return backups.filter((backup) => {
      const searchable = [
        backup.id,
        backup.name,
        backup.backupType,
        ...backup.coveredSystems,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (backupStatusFilter === "ALL" ||
          backup.status === backupStatusFilter) &&
        (verificationFilter === "ALL" ||
          backup.verification === verificationFilter)
      );
    });
  }, [backups, search, backupStatusFilter, verificationFilter]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return recoveryRequests.filter((request) => {
      const searchable = [
        request.id,
        request.backupId,
        request.targetDescription,
        request.requestedBy,
        request.reason,
        request.reviewedBy ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (recoveryFilter === "ALL" || request.status === recoveryFilter)
      );
    });
  }, [recoveryRequests, search, recoveryFilter]);

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs text-stone-500">
              <Database size={14} />
              Administration / Backup & Recovery
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Backup & Recovery
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Review backup records, verification evidence, and recovery
              requests.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh records
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Backup records"
            value={metrics.total}
            icon={<Archive size={18} />}
          />
          <Metric
            label="Successful records"
            value={metrics.successful}
            icon={<CheckCircle2 size={18} />}
          />
          <Metric
            label="Failed records"
            value={metrics.failed}
            icon={<AlertTriangle size={18} />}
          />
          <Metric
            label="Not fully verified"
            value={metrics.unverified}
            icon={<ShieldCheck size={18} />}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("backups")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "backups"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Backup records
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("recovery")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "recovery"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Recovery requests
                {recoveryRequests.filter(
                  (item) => item.status === "PENDING_APPROVAL"
                ).length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                    {
                      recoveryRequests.filter(
                        (item) => item.status === "PENDING_APPROVAL"
                      ).length
                    }
                  </span>
                )}
              </button>
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search records..."
                className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {activeTab === "backups" ? (
            <>
              <div className="flex flex-wrap gap-3 border-b border-stone-100 bg-stone-50/60 p-4">
                <select
                  aria-label="Filter backup status"
                  value={backupStatusFilter}
                  onChange={(event) =>
                    setBackupStatusFilter(event.target.value)
                  }
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All backup statuses</option>
                  {Object.keys(backupStatusStyles).map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter verification status"
                  value={verificationFilter}
                  onChange={(event) =>
                    setVerificationFilter(event.target.value)
                  }
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All verification statuses</option>
                  {Object.keys(verificationStyles).map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  Loading backup records...
                </div>
              ) : filteredBackups.length === 0 ? (
                <div className="p-12 text-center">
                  <Archive size={28} className="mx-auto text-stone-300" />
                  <p className="mt-3 text-sm font-medium">
                    No backup records found
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredBackups.map((backup) => (
                    <article
                      key={backup.id}
                      className="p-4 transition hover:bg-stone-50/70 sm:p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-stone-400">
                              {backup.id}
                            </span>
                            <Badge className={backupStatusStyles[backup.status]}>
                              {backup.status.replaceAll("_", " ")}
                            </Badge>
                            <Badge
                              className={verificationStyles[backup.verification]}
                            >
                              {backup.verification.replaceAll("_", " ")}
                            </Badge>
                          </div>

                          <h2 className="mt-2 text-sm font-semibold">
                            {backup.name}
                          </h2>

                          <div className="mt-3 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
                            <p>Type: {backup.backupType}</p>
                            <p>Size: {formatBytes(backup.sizeBytes)}</p>
                            <p>Created: {formatDate(backup.createdAt)}</p>
                            <p>Completed: {formatDate(backup.completedAt)}</p>
                            <p>
                              Retention until: {formatDate(backup.retentionUntil)}
                            </p>
                          </div>

                          {backup.coveredSystems.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {backup.coveredSystems.map((system) => (
                                <span
                                  key={system}
                                  className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[10px] text-stone-600"
                                >
                                  {system}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenBackup?.(backup)}
                          disabled={!onOpenBackup}
                          className="inline-flex items-center gap-2 self-start rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-100 disabled:opacity-50"
                        >
                          <Eye size={14} />
                          View record
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="border-b border-stone-100 bg-stone-50/60 p-4">
                <select
                  aria-label="Filter recovery request status"
                  value={recoveryFilter}
                  onChange={(event) => setRecoveryFilter(event.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All request statuses</option>
                  {Object.keys(recoveryStatusStyles).map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  Loading recovery requests...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <RotateCcw size={28} className="mx-auto text-stone-300" />
                  <p className="mt-3 text-sm font-medium">
                    No recovery requests found
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredRequests.map((request) => (
                    <article key={request.id} className="p-4 sm:p-5">
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-stone-400">
                              {request.id}
                            </span>
                            <Badge
                              className={recoveryStatusStyles[request.status]}
                            >
                              {request.status.replaceAll("_", " ")}
                            </Badge>
                          </div>

                          <h2 className="mt-2 text-sm font-semibold">
                            {request.targetDescription}
                          </h2>
                          <p className="mt-1 text-sm leading-6 text-stone-500">
                            {request.reason}
                          </p>

                          <div className="mt-3 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
                            <p>Backup reference: {request.backupId}</p>
                            <p>Requested by: {request.requestedBy}</p>
                            <p>Requested: {formatDate(request.requestedAt)}</p>
                            <p>Reviewed by: {request.reviewedBy || "Not recorded"}</p>
                            <p>Completed: {formatDate(request.completedAt)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {request.status === "PENDING_APPROVAL" &&
                            onReviewRecoveryRequest && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReviewRecoveryRequest(request, "REJECT")
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReviewRecoveryRequest(request, "APPROVE")
                                  }
                                  className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700"
                                >
                                  Approve
                                </button>
                              </>
                            )}

                          <button
                            type="button"
                            onClick={() => onOpenRecoveryRequest?.(request)}
                            disabled={!onOpenRecoveryRequest}
                            className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-100 disabled:opacity-50"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-amber-800"
            />
            <div>
              <h2 className="text-sm font-semibold">
                Recovery and evidence safeguards
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-600">
                A successful backup job does not prove that data can be
                restored. Verification should include documented restore
                testing. Recovery requires explicit authorization, target
                validation, preservation checks, and an auditable execution
                record. Never expose backup credentials or sensitive storage
                paths in this interface.
              </p>
            </div>
          </div>
        </section>

        <p className="flex items-center gap-2 text-xs text-stone-400">
          <Download size={13} />
          This component displays records only. It does not download backups
          or execute recovery operations.
        </p>
      </div>
    </main>
  );
}
