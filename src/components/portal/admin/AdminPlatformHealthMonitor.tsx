
"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  HardDrive,
  Layers3,
  RefreshCw,
  Server,
  ShieldAlert,
  Workflow,
  XCircle,
} from "lucide-react";

export type PlatformServiceStatus =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "unknown";

export type PlatformService = {
  id: string;
  name: string;
  description: string;
  category: "application" | "database" | "storage" | "integration" | "infrastructure";
  status: PlatformServiceStatus;
  checkedAt?: string;
  responseTimeMs?: number;
  detail?: string;
};

export type PlatformJob = {
  id: string;
  name: string;
  status: "running" | "queued" | "completed" | "failed" | "paused";
  startedAt?: string;
  completedAt?: string;
  lastRunAt?: string;
  detail?: string;
};

export type PlatformHealthCheck = {
  id: string;
  name: string;
  result: "passed" | "failed" | "warning" | "not_run";
  checkedAt?: string;
  detail?: string;
};

type Props = {
  services: PlatformService[];
  jobs: PlatformJob[];
  checks: PlatformHealthCheck[];
  environmentLabel?: string;
  lastUpdatedAt?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenService?: (service: PlatformService) => void;
  onOpenJob?: (job: PlatformJob) => void;
  onOpenHealthCheck?: (check: PlatformHealthCheck) => void;
};

const serviceStyles: Record<PlatformServiceStatus, string> = {
  healthy: "bg-emerald-50 text-emerald-800",
  degraded: "bg-amber-50 text-amber-800",
  unavailable: "bg-red-50 text-red-800",
  unknown: "bg-[#F2F0EB] text-[#77736D]",
};

const jobStyles: Record<PlatformJob["status"], string> = {
  running: "bg-blue-50 text-blue-800",
  queued: "bg-[#F2F0EB] text-[#55534F]",
  completed: "bg-emerald-50 text-emerald-800",
  failed: "bg-red-50 text-red-800",
  paused: "bg-amber-50 text-amber-800",
};

const checkStyles: Record<PlatformHealthCheck["result"], string> = {
  passed: "bg-emerald-50 text-emerald-800",
  failed: "bg-red-50 text-red-800",
  warning: "bg-amber-50 text-amber-800",
  not_run: "bg-[#F2F0EB] text-[#77736D]",
};

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-4">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9A7848]">
        {eyebrow}
      </p>
      <h2 className="text-lg font-medium tracking-tight text-[#171717]">
        {title}
      </h2>
    </div>
  );
}

function ServiceIcon({ category }: { category: PlatformService["category"] }) {
  switch (category) {
    case "database":
      return <Database size={18} />;
    case "storage":
      return <HardDrive size={18} />;
    case "integration":
      return <Layers3 size={18} />;
    case "infrastructure":
      return <Server size={18} />;
    default:
      return <Activity size={18} />;
  }
}

export default function AdminPlatformHealthMonitor({
  services,
  jobs,
  checks,
  environmentLabel,
  lastUpdatedAt,
  loading = false,
  error = null,
  onRefresh,
  onOpenService,
  onOpenJob,
  onOpenHealthCheck,
}: Props) {
  const healthyServices = services.filter(
    (service) => service.status === "healthy"
  ).length;

  const degradedServices = services.filter(
    (service) => service.status === "degraded"
  ).length;

  const unavailableServices = services.filter(
    (service) => service.status === "unavailable"
  ).length;

  const failedJobs = jobs.filter(
    (job) => job.status === "failed"
  ).length;

  const failedChecks = checks.filter(
    (check) => check.result === "failed"
  ).length;

  const warningChecks = checks.filter(
    (check) => check.result === "warning"
  ).length;

  const hasIssues =
    degradedServices > 0 ||
    unavailableServices > 0 ||
    failedJobs > 0 ||
    failedChecks > 0;

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#D8D6D0] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9A7848]">
              Studio administration / Infrastructure
            </p>

            <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">
              Platform health
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77736D]">
              Monitor service availability, background processing and
              infrastructure health checks.
            </p>

            {environmentLabel && (
              <p className="mt-3 inline-flex rounded-md bg-[#EAE8E2] px-2.5 py-1 font-mono text-[10px] text-[#55534F]">
                Environment: {environmentLabel}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lastUpdatedAt && (
              <span className="text-xs text-[#77736D]">
                Updated {formatDate(lastUpdatedAt)}
              </span>
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
              <p className="font-medium">Unable to retrieve platform health</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div role="status" className="mb-6 rounded-lg border border-[#D8D6D0] bg-white px-4 py-3 text-xs text-[#77736D]">
            Refreshing platform health information…
          </div>
        )}

        {/* Overall status */}
        <section className="mb-9">
          <div className={`flex items-start gap-3 rounded-xl border p-5 ${
            hasIssues
              ? "border-amber-200 bg-amber-50"
              : "border-[#E2E0DA] bg-white"
          }`}>
            {hasIssues ? (
              <ShieldAlert size={21} className="mt-0.5 shrink-0 text-amber-800" />
            ) : (
              <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-emerald-700" />
            )}

            <div>
              <h2 className="text-sm font-medium text-[#252421]">
                {hasIssues
                  ? "Attention required"
                  : "No reported service issues"}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#77736D]">
                {hasIssues
                  ? "One or more supplied service, job or health-check records indicate an issue."
                  : "The supplied monitoring records contain no degraded services, unavailable services or failed checks."}
              </p>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="mb-9">
          <SectionHeading eyebrow="01 / Services" title="Service indicators" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <Server size={18} className="text-[#9A7848]" />
              <p className="mt-4 text-xs text-[#77736D]">Total services</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {services.length}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <CheckCircle2 size={18} className="text-emerald-700" />
              <p className="mt-4 text-xs text-[#77736D]">Healthy</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {healthyServices}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <AlertCircle size={18} className="text-amber-700" />
              <p className="mt-4 text-xs text-[#77736D]">Degraded</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {degradedServices}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <XCircle size={18} className="text-red-700" />
              <p className="mt-4 text-xs text-[#77736D]">Unavailable</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {unavailableServices}
              </p>
            </article>
          </div>
        </section>

        {/* Service inventory */}
        <section className="mb-9">
          <SectionHeading eyebrow="02 / Inventory" title="Service status" />

          {services.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-[#E2E0DA] bg-white">
              {services.map((service, index) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onOpenService?.(service)}
                  disabled={!onOpenService}
                  className={`flex w-full flex-col justify-between gap-4 p-5 text-left transition hover:bg-[#FAF9F6] sm:flex-row sm:items-center ${
                    index !== services.length - 1
                      ? "border-b border-[#EEECE7]"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-lg bg-[#F2F0EB] p-2 text-[#77736D]">
                      <ServiceIcon category={service.category} />
                    </span>

                    <div>
                      <h3 className="text-sm font-medium text-[#252421]">
                        {service.name}
                      </h3>
                      <p className="mt-1 text-xs text-[#77736D]">
                        {service.description}
                      </p>
                      {service.detail && (
                        <p className="mt-2 text-[10px] text-[#99958D]">
                          {service.detail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    {service.responseTimeMs !== undefined && (
                      <span className="text-xs text-[#77736D]">
                        {service.responseTimeMs} ms
                      </span>
                    )}

                    <StatusPill className={serviceStyles[service.status]}>
                      {service.status}
                    </StatusPill>

                    <span className="text-[10px] text-[#99958D]">
                      {formatDate(service.checkedAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8D6D0] bg-white p-8 text-center">
              <Server size={23} className="mx-auto mb-2 text-[#99958D]" />
              <p className="text-sm font-medium text-[#33312E]">No service records</p>
              <p className="mt-1 text-xs text-[#77736D]">
                Service status will appear when monitoring data is connected.
              </p>
            </div>
          )}
        </section>

        {/* Background jobs */}
        <section className="mb-9">
          <SectionHeading eyebrow="03 / Processing" title="Background jobs" />

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#E2E0DA] bg-white p-4">
              <p className="text-xs text-[#77736D]">Running</p>
              <p className="mt-1 text-xl font-medium text-[#171717]">
                {jobs.filter((job) => job.status === "running").length}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E0DA] bg-white p-4">
              <p className="text-xs text-[#77736D]">Queued</p>
              <p className="mt-1 text-xl font-medium text-[#171717]">
                {jobs.filter((job) => job.status === "queued").length}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E0DA] bg-white p-4">
              <p className="text-xs text-[#77736D]">Failed</p>
              <p className="mt-1 text-xl font-medium text-[#171717]">
                {failedJobs}
              </p>
            </div>
          </div>

          {jobs.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[#E2E0DA] bg-white">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-[#EEECE7] bg-[#FAF9F6]">
                  <tr className="text-[10px] uppercase tracking-wider text-[#77736D]">
                    <th className="px-5 py-3 font-medium">Job</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Started</th>
                    <th className="px-5 py-3 font-medium">Last run</th>
                    <th className="px-5 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-[#EEECE7] last:border-0">
                      <td className="px-5 py-4 text-xs font-medium text-[#252421]">
                        {job.name}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill className={jobStyles[job.status]}>
                          {job.status}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {formatDate(job.startedAt)}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {formatDate(job.lastRunAt)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          disabled={!onOpenJob}
                          onClick={() => onOpenJob?.(job)}
                          className="text-xs font-medium text-[#9A7848] hover:underline disabled:cursor-default"
                        >
                          {job.detail || onOpenJob ? "View details" : "—"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8D6D0] bg-white p-8 text-center">
              <Workflow size={23} className="mx-auto mb-2 text-[#99958D]" />
              <p className="text-sm font-medium text-[#33312E]">No job records</p>
              <p className="mt-1 text-xs text-[#77736D]">
                Background job information has not been supplied.
              </p>
            </div>
          )}
        </section>

        {/* Health checks */}
        <section>
          <SectionHeading eyebrow="04 / Diagnostics" title="Health checks" />

          <div className="mb-4 flex flex-wrap gap-3">
            <StatusPill className="bg-red-50 text-red-800">
              Failed: {failedChecks}
            </StatusPill>
            <StatusPill className="bg-amber-50 text-amber-800">
              Warnings: {warningChecks}
            </StatusPill>
            <StatusPill className="bg-[#F2F0EB] text-[#55534F]">
              Total: {checks.length}
            </StatusPill>
          </div>

          {checks.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-[#E2E0DA] bg-white">
              {checks.map((check, index) => (
                <button
                  key={check.id}
                  type="button"
                  onClick={() => onOpenHealthCheck?.(check)}
                  disabled={!onOpenHealthCheck}
                  className={`flex w-full flex-col justify-between gap-3 p-5 text-left transition hover:bg-[#FAF9F6] sm:flex-row sm:items-center ${
                    index !== checks.length - 1
                      ? "border-b border-[#EEECE7]"
                      : ""
                  }`}
                >
                  <div>
                    <h3 className="text-sm font-medium text-[#252421]">
                      {check.name}
                    </h3>
                    {check.detail && (
                      <p className="mt-1 text-xs text-[#77736D]">
                        {check.detail}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] text-[#99958D]">
                      Checked: {formatDate(check.checkedAt)}
                    </p>
                  </div>

                  <StatusPill className={checkStyles[check.result]}>
                    {check.result.replace("_", " ")}
                  </StatusPill>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8D6D0] bg-white p-8 text-center">
              <Activity size={23} className="mx-auto mb-2 text-[#99958D]" />
              <p className="text-sm font-medium text-[#33312E]">No health checks available</p>
              <p className="mt-1 text-xs text-[#77736D]">
                Diagnostic results will appear when the monitoring service provides them.
              </p>
            </div>
          )}
        </section>

        <footer className="mt-9 border-t border-[#D8D6D0] pt-5">
          <div className="flex items-start gap-2">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-[#9A7848]" />
            <p className="text-[11px] leading-5 text-[#8B877F]">
              This interface displays monitoring data supplied by the
              backend. It does not perform infrastructure diagnostics,
              restart services, modify databases or execute background
              jobs. Do not expose internal hostnames, credentials,
              connection strings, stack traces or sensitive infrastructure
              metadata to unauthorised users.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
