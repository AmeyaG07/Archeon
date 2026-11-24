
"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Search,
  RefreshCw,
  Clock,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";

export type NotificationScheduleStatus =
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type NotificationRecurrence =
  | "ONCE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "CUSTOM";

export interface NotificationScheduleRecord {
  id: string;
  name: string;
  description: string;
  notificationPurpose: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "IN_APP";
  status: NotificationScheduleStatus;
  recurrence: NotificationRecurrence;
  timezone: string;
  nextRunAt?: string;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  templateId?: string;
  targetAudience: string;
  executionCount: number;
  failureCount: number;
}

interface AdminNotificationScheduleManagementCenterProps {
  schedules: NotificationScheduleRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onView?: (schedule: NotificationScheduleRecord) => void;
  onEdit?: (schedule: NotificationScheduleRecord) => void;
  onChangeStatus?: (
    schedule: NotificationScheduleRecord,
    nextStatus: NotificationScheduleStatus
  ) => void;
}

const statusStyles: Record<NotificationScheduleStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PAUSED: "bg-amber-50 text-amber-800",
  COMPLETED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-zinc-100 text-zinc-600",
  FAILED: "bg-red-50 text-red-700",
};

const recurrenceLabels: Record<NotificationRecurrence, string> = {
  ONCE: "One time",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  CUSTOM: "Custom recurrence",
};

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminNotificationScheduleManagementCenter({
  schedules,
  loading = false,
  error,
  onRefresh,
  onView,
  onEdit,
  onChangeStatus,
}: AdminNotificationScheduleManagementCenterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    NotificationScheduleStatus | "ALL"
  >("ALL");
  const [recurrenceFilter, setRecurrenceFilter] = useState<
    NotificationRecurrence | "ALL"
  >("ALL");

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schedules
      .filter((schedule) => {
        const searchable = [
          schedule.id,
          schedule.name,
          schedule.description,
          schedule.notificationPurpose,
          schedule.channel,
          schedule.createdBy,
          schedule.targetAudience,
          schedule.timezone,
          schedule.templateId ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!query || searchable.includes(query)) &&
          (statusFilter === "ALL" ||
            schedule.status === statusFilter) &&
          (recurrenceFilter === "ALL" ||
            schedule.recurrence === recurrenceFilter)
        );
      })
      .sort((a, b) => {
        const aTime = a.nextRunAt
          ? new Date(a.nextRunAt).getTime()
          : Number.MAX_SAFE_INTEGER;

        const bTime = b.nextRunAt
          ? new Date(b.nextRunAt).getTime()
          : Number.MAX_SAFE_INTEGER;

        return aTime - bTime;
      });
  }, [schedules, search, statusFilter, recurrenceFilter]);

  const counts = useMemo(
    () => ({
      scheduled: schedules.filter(
        (item) => item.status === "SCHEDULED"
      ).length,
      active: schedules.filter(
        (item) => item.status === "ACTIVE"
      ).length,
      paused: schedules.filter(
        (item) => item.status === "PAUSED"
      ).length,
      failed: schedules.filter(
        (item) => item.status === "FAILED"
      ).length,
    }),
    [schedules]
  );

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <CalendarClock size={15} />
            Communication operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Notification Schedule Management
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review scheduled communication jobs, recurring reminders,
            execution history, and scheduling ownership.
          </p>
        </div>

        </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Scheduled",
            value: counts.scheduled,
            color: "text-blue-700",
            icon: CalendarDays,
          },
          {
            label: "Active",
            value: counts.active,
            color: "text-emerald-700",
            icon: CheckCircle2,
          },
          {
            label: "Paused",
            value: counts.paused,
            color: "text-amber-700",
            icon: PauseCircle,
          },
          {
            label: "Failed",
            value: counts.failed,
            color: "text-red-700",
            icon: AlertTriangle,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl border border-[#e9e5dd] bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#77736c]">{item.label}</p>
                <Icon size={17} className={item.color} />
              </div>

              <p className={`mt-3 text-3xl font-semibold ${item.color}`}>
                {item.value.toLocaleString("en-IN")}
              </p>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div>
            <h2 className="font-semibold text-[#292821]">
              Scheduled jobs
            </h2>

            <p className="mt-1 text-xs text-[#918c83]">
              Times are displayed using the supplied timezone
              information from each schedule.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search schedules..."
                className="w-full rounded-lg border border-[#e5e0d7] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | NotificationScheduleStatus
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="FAILED">Failed</option>
            </select>

            <select
              value={recurrenceFilter}
              onChange={(event) =>
                setRecurrenceFilter(
                  event.target.value as
                    | NotificationRecurrence
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All recurrence types</option>
              <option value="ONCE">One time</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading notification schedules...
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarClock
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />

            <p className="mt-3 font-medium text-[#34322c]">
              No matching schedules
            </p>

            <p className="mt-1 text-sm text-[#918c83]">
              Adjust your filters or refresh the schedule list.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede7]">
            {filteredSchedules.map((schedule) => (
              <article
                key={schedule.id}
                className="space-y-4 p-5"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#34322c]">
                        {schedule.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[schedule.status]}`}
                      >
                        {schedule.status}
                      </span>

                      <span className="rounded-full bg-[#f3f1ec] px-2.5 py-1 text-xs text-[#666157]">
                        {recurrenceLabels[schedule.recurrence]}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#77736c]">
                      {schedule.description}
                    </p>

                    <p className="mt-2 text-xs text-[#918c83]">
                      Schedule ID: {schedule.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onView?.(schedule)}
                      disabled={!onView}
                      className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                    >
                      View details
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit?.(schedule)}
                      disabled={
                        !onEdit ||
                        schedule.status === "COMPLETED" ||
                        schedule.status === "CANCELLED"
                      }
                      className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                    >
                      Edit schedule
                    </button>

                    {schedule.status === "ACTIVE" ||
                    schedule.status === "SCHEDULED" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onChangeStatus?.(schedule, "PAUSED")
                        }
                        disabled={!onChangeStatus}
                        className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                      >
                        Pause
                      </button>
                    ) : schedule.status === "PAUSED" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onChangeStatus?.(schedule, "ACTIVE")
                        }
                        disabled={!onChangeStatus}
                        className="rounded-lg bg-[#292821] px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
                      >
                        Resume
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Next execution
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(schedule.nextRunAt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Last execution
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(schedule.lastRunAt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Execution count
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {schedule.executionCount.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Failure count
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {schedule.failureCount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#918c83]">
                      Channel
                    </p>
                    <p className="mt-1 text-sm text-[#555148]">
                      {schedule.channel}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#918c83]">
                      Target audience
                    </p>
                    <p className="mt-1 text-sm text-[#555148]">
                      {schedule.targetAudience}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#918c83]">
                      Timezone
                    </p>
                    <p className="mt-1 text-sm text-[#555148]">
                      {schedule.timezone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0ede7] pt-3 text-xs text-[#918c83]">
                  <span>
                    Created by {schedule.createdBy}
                  </span>

                  <span>
                    Updated {formatDate(schedule.updatedAt)}
                  </span>

                  {schedule.templateId && (
                    <span>
                      Template: {schedule.templateId}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="border-t border-[#eeeae3] bg-[#faf9f6] px-5 py-3 text-xs text-[#918c83]">
          Showing {filteredSchedules.length.toLocaleString("en-IN")} of{" "}
          {schedules.length.toLocaleString("en-IN")} supplied schedules.
        </footer>
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-700"
        />

        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Scheduling requires server-side safeguards
          </h3>

          <p className="mt-1 text-xs leading-5 text-amber-800">
            The backend must handle timezone-aware execution,
            duplicate prevention, schedule versioning, retry
            behavior, consent checks, and payment-state validation.
            A paused schedule must not leave already queued messages
            eligible for delivery without revalidation.
          </p>
        </div>
      </section>
    </main>
  );
}
