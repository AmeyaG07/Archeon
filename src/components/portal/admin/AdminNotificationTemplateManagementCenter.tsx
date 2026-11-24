
"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Search,
  Plus,
  RefreshCw,
  FileText,
  MessageSquare,
  Mail,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export type NotificationTemplateChannel =
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "IN_APP";

export type NotificationTemplateStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export interface NotificationTemplateRecord {
  id: string;
  name: string;
  description: string;
  channel: NotificationTemplateChannel;
  purpose: string;
  language: string;
  version: number;
  status: NotificationTemplateStatus;
  providerTemplateId?: string;
  approvalReference?: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

interface AdminNotificationTemplateManagementCenterProps {
  templates: NotificationTemplateRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onCreate?: () => void;
  onView?: (template: NotificationTemplateRecord) => void;
  onEdit?: (template: NotificationTemplateRecord) => void;
  onSubmitForApproval?: (template: NotificationTemplateRecord) => void;
  onArchive?: (template: NotificationTemplateRecord) => void;
}

const statusStyles: Record<
  NotificationTemplateStatus,
  string
> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_APPROVAL: "bg-amber-50 text-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  ARCHIVED: "bg-zinc-100 text-zinc-600",
};

const channelStyles: Record<
  NotificationTemplateChannel,
  string
> = {
  EMAIL: "bg-blue-50 text-blue-700",
  SMS: "bg-violet-50 text-violet-700",
  WHATSAPP: "bg-emerald-50 text-emerald-700",
  IN_APP: "bg-slate-100 text-slate-700",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

export default function AdminNotificationTemplateManagementCenter({
  templates,
  loading = false,
  error,
  onRefresh,
  onCreate,
  onView,
  onEdit,
  onSubmitForApproval,
  onArchive,
}: AdminNotificationTemplateManagementCenterProps) {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<
    NotificationTemplateChannel | "ALL"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    NotificationTemplateStatus | "ALL"
  >("ALL");

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates
      .filter((template) => {
        const searchable = [
          template.id,
          template.name,
          template.description,
          template.purpose,
          template.language,
          template.providerTemplateId ?? "",
          template.updatedBy,
          ...template.variables,
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!query || searchable.includes(query)) &&
          (channelFilter === "ALL" ||
            template.channel === channelFilter) &&
          (statusFilter === "ALL" ||
            template.status === statusFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
      );
  }, [templates, search, channelFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      total: templates.length,
      approved: templates.filter(
        (item) => item.status === "APPROVED"
      ).length,
      pending: templates.filter(
        (item) => item.status === "PENDING_APPROVAL"
      ).length,
      drafts: templates.filter(
        (item) => item.status === "DRAFT"
      ).length,
      rejected: templates.filter(
        (item) => item.status === "REJECTED"
      ).length,
    }),
    [templates]
  );

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Bell size={15} />
            Communication governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Notification Template Management
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Maintain approved communication templates and track
            their channel, purpose, language, and version status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCreate}
            disabled={!onCreate}
            className="flex items-center gap-2 rounded-lg bg-[#292821] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            <Plus size={16} />
            New template
          </button>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total templates",
            value: counts.total,
            color: "text-[#292821]",
          },
          {
            label: "Approved",
            value: counts.approved,
            color: "text-emerald-700",
          },
          {
            label: "Pending approval",
            value: counts.pending,
            color: "text-amber-700",
          },
          {
            label: "Drafts",
            value: counts.drafts,
            color: "text-slate-700",
          },
          {
            label: "Rejected",
            value: counts.rejected,
            color: "text-red-700",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#e9e5dd] bg-white p-5"
          >
            <p className="text-sm text-[#77736c]">{item.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${item.color}`}>
              {item.value.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div>
            <h2 className="font-semibold text-[#292821]">
              Template registry
            </h2>
            <p className="mt-1 text-xs text-[#918c83]">
              Review template metadata and approval lifecycle.
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
                placeholder="Search templates..."
                className="w-full rounded-lg border border-[#e5e0d7] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(
                  event.target.value as
                    | NotificationTemplateChannel
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All channels</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="IN_APP">In-app</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | NotificationTemplateStatus
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">
                Pending approval
              </option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading notification templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No matching templates
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Adjust your filters or create a template.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede7]">
            {filteredTemplates.map((template) => (
              <article key={template.id} className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#34322c]">
                        {template.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${channelStyles[template.channel]}`}
                      >
                        {template.channel}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[template.status]}`}
                      >
                        {template.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#77736c]">
                      {template.description}
                    </p>

                    <p className="mt-2 text-xs text-[#918c83]">
                      ID: {template.id} · Version {template.version}
                      {" · "}
                      Language: {template.language}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onView?.(template)}
                      disabled={!onView}
                      className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit?.(template)}
                      disabled={
                        !onEdit ||
                        template.status === "ARCHIVED" ||
                        template.status === "PENDING_APPROVAL"
                      }
                      className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                    >
                      Edit
                    </button>

                    {template.status === "DRAFT" && (
                      <button
                        type="button"
                        onClick={() =>
                          onSubmitForApproval?.(template)
                        }
                        disabled={!onSubmitForApproval}
                        className="rounded-lg bg-[#292821] px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
                      >
                        Submit for approval
                      </button>
                    )}

                    {template.status !== "ARCHIVED" && (
                      <button
                        type="button"
                        onClick={() => onArchive?.(template)}
                        disabled={!onArchive}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">Purpose</p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {template.purpose}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Provider template ID
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-[#34322c]">
                      {template.providerTemplateId || "Not configured"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Approval reference
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-[#34322c]">
                      {template.approvalReference || "Not available"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Last updated
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(template.updatedAt)}
                    </p>
                    <p className="mt-1 text-xs text-[#918c83]">
                      By {template.updatedBy}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#918c83]">
                    Template variables
                  </p>

                  {template.variables.length === 0 ? (
                    <p className="text-xs text-[#918c83]">
                      No variables supplied.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable) => (
                        <span
                          key={variable}
                          className="rounded-md border border-[#eeeae3] bg-white px-2.5 py-1.5 font-mono text-xs text-[#666157]"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="border-t border-[#eeeae3] bg-[#faf9f6] px-5 py-3 text-xs text-[#918c83]">
          Showing {filteredTemplates.length.toLocaleString("en-IN")} of{" "}
          {templates.length.toLocaleString("en-IN")} supplied templates.
        </footer>
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-700"
        />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Approval is not provider activation
          </h3>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            An internally approved template may still require
            provider-side approval or configuration. The backend
            must validate template versions, allowed variables,
            channel restrictions, and provider status before use.
          </p>
        </div>
      </section>
    </main>
  );
}
