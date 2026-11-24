
"use client";

import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock3,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";

export type NotificationChannel = "whatsapp" | "email" | "in_app";

export type NotificationIntegration = {
  channel: NotificationChannel;
  configured: boolean;
  enabled: boolean;
  statusLabel: string;
  lastCheckedAt?: string;
  detail?: string;
};

export type NotificationTemplate = {
  id: string;
  name: string;
  channel: NotificationChannel;
  purpose: string;
  approvalStatus: "approved" | "pending" | "rejected" | "not_required";
  enabled: boolean;
  updatedAt?: string;
};

export type NotificationDelivery = {
  id: string;
  recipientLabel: string;
  recipientType: "client" | "vendor";
  channel: NotificationChannel;
  purpose: string;
  status:
    | "queued"
    | "sent"
    | "delivered"
    | "failed"
    | "suppressed";
  occurredAt: string;
  reason?: string;
};

export type NotificationConsentSummary = {
  optedIn: number;
  optedOut: number;
  notRecorded: number;
};

export type NotificationPolicy = {
  quietHoursStart: string;
  quietHoursEnd: string;
  reminderIntervalDays: number;
  suppressWhenPaid: boolean;
  suppressWhenDisputed: boolean;
  suppressWhenOptedOut: boolean;
  requiresOptIn: boolean;
};

type Props = {
  integrations: NotificationIntegration[];
  templates: NotificationTemplate[];
  deliveries: NotificationDelivery[];
  consent: NotificationConsentSummary;
  policy: NotificationPolicy;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenTemplate?: (template: NotificationTemplate) => void;
  onOpenDelivery?: (delivery: NotificationDelivery) => void;
  onOpenIntegrationSettings?: (channel: NotificationChannel) => void;
};

const channelLabels: Record<NotificationChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  in_app: "In-app",
};

const deliveryStyles: Record<
  NotificationDelivery["status"],
  string
> = {
  queued: "bg-blue-50 text-blue-800",
  sent: "bg-[#F2F0EB] text-[#55534F]",
  delivered: "bg-emerald-50 text-emerald-800",
  failed: "bg-red-50 text-red-800",
  suppressed: "bg-amber-50 text-amber-800",
};

const approvalStyles: Record<
  NotificationTemplate["approvalStatus"],
  string
> = {
  approved: "bg-emerald-50 text-emerald-800",
  pending: "bg-amber-50 text-amber-800",
  rejected: "bg-red-50 text-red-800",
  not_required: "bg-[#F2F0EB] text-[#55534F]",
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
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${className}`}
    >
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

export default function AdminNotificationOperations({
  integrations,
  templates,
  deliveries,
  consent,
  policy,
  loading = false,
  error = null,
  onRefresh,
  onOpenTemplate,
  onOpenDelivery,
  onOpenIntegrationSettings,
}: Props) {
  const totalConsent =
    consent.optedIn + consent.optedOut + consent.notRecorded;

  const activeIntegrations = integrations.filter(
    (item) => item.configured && item.enabled
  ).length;

  const failedDeliveries = deliveries.filter(
    (item) => item.status === "failed"
  ).length;

  const suppressedDeliveries = deliveries.filter(
    (item) => item.status === "suppressed"
  ).length;

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#D8D6D0] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9A7848]">
              Studio administration / Communications
            </p>
            <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">
              Notification operations
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77736D]">
              Review communication integrations, message templates,
              consent records and notification delivery activity.
            </p>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-[#D8D6D0] bg-white px-4 py-2.5 text-xs font-medium text-[#33312E] hover:border-[#B68A4A] disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
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
              <p className="font-medium">Notification data unavailable</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-[#D8D6D0] bg-white px-4 py-3 text-xs text-[#77736D]"
          >
            Refreshing notification information…
          </div>
        )}

        {/* Summary */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="01 / Summary"
            title="Communication overview"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <MessageCircle size={18} className="text-[#9A7848]" />
              <p className="mt-4 text-xs text-[#77736D]">
                Active integrations
              </p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {activeIntegrations}
                <span className="ml-1 text-sm font-normal text-[#99958D]">
                  / {integrations.length}
                </span>
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <ShieldCheck size={18} className="text-[#9A7848]" />
              <p className="mt-4 text-xs text-[#77736D]">
                Recorded opt-ins
              </p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {consent.optedIn}
              </p>
              <p className="mt-1 text-[11px] text-[#99958D]">
                {totalConsent > 0
                  ? `${((consent.optedIn / totalConsent) * 100).toFixed(1)}% of recorded consent states`
                  : "No consent records supplied"}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <XCircle size={18} className="text-red-700" />
              <p className="mt-4 text-xs text-[#77736D]">
                Failed deliveries
              </p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {failedDeliveries}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <Bell size={18} className="text-[#9A7848]" />
              <p className="mt-4 text-xs text-[#77736D]">
                Suppressed deliveries
              </p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {suppressedDeliveries}
              </p>
            </article>
          </div>
        </section>

        {/* Integration status */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="02 / Connectivity"
            title="Channel integrations"
          />

          <div className="overflow-hidden rounded-xl border border-[#E2E0DA] bg-white">
            {integrations.length > 0 ? (
              integrations.map((integration, index) => {
                const operational =
                  integration.configured && integration.enabled;

                return (
                  <div
                    key={integration.channel}
                    className={`flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center ${
                      index !== integrations.length - 1
                        ? "border-b border-[#EEECE7]"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="rounded-lg bg-[#F2F0EB] p-2 text-[#77736D]">
                        <MessageCircle size={18} />
                      </span>

                      <div>
                        <h3 className="text-sm font-medium text-[#252421]">
                          {channelLabels[integration.channel]}
                        </h3>
                        <p className="mt-1 text-xs text-[#77736D]">
                          {integration.detail ??
                            "No integration details supplied."}
                        </p>
                        <p className="mt-2 text-[10px] text-[#99958D]">
                          Last checked: {formatDate(integration.lastCheckedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill
                        className={
                          operational
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-50 text-amber-800"
                        }
                      >
                        {integration.statusLabel}
                      </StatusPill>

                      {onOpenIntegrationSettings && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenIntegrationSettings(integration.channel)
                          }
                          className="text-xs font-medium text-[#9A7848] hover:underline"
                        >
                          Settings
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="p-6 text-sm text-[#77736D]">
                No integration records are available.
              </p>
            )}
          </div>
        </section>

        {/* Consent and policy */}
        <section className="mb-9 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="03 / Privacy"
              title="Communication consent"
            />

            <div className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-[#77736D]">Opted in</p>
                  <p className="mt-1 text-2xl font-medium tabular-nums text-emerald-800">
                    {consent.optedIn}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#77736D]">Opted out</p>
                  <p className="mt-1 text-2xl font-medium tabular-nums text-red-800">
                    {consent.optedOut}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#77736D]">Not recorded</p>
                  <p className="mt-1 text-2xl font-medium tabular-nums text-[#55534F]">
                    {consent.notRecorded}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-[#EEECE7] pt-4">
                <div className="flex items-center gap-2 text-sm font-medium text-[#252421]">
                  <ShieldCheck size={16} className="text-[#9A7848]" />
                  Consent enforcement
                </div>
                <p className="mt-2 text-xs leading-5 text-[#77736D]">
                  {policy.requiresOptIn
                    ? "Affirmative opt-in is required before sending consent-dependent communications."
                    : "The supplied policy does not require opt-in. Verify the applicable legal and channel requirements before enabling delivery."}
                </p>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="04 / Rules"
              title="Reminder policy"
            />

            <div className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <div className="flex items-center justify-between border-b border-[#EEECE7] pb-3">
                <span className="text-xs text-[#77736D]">Quiet hours</span>
                <strong className="text-sm text-[#252421]">
                  {policy.quietHoursStart} – {policy.quietHoursEnd}
                </strong>
              </div>

              <div className="flex items-center justify-between border-b border-[#EEECE7] py-3">
                <span className="text-xs text-[#77736D]">
                  Reminder interval
                </span>
                <strong className="text-sm text-[#252421]">
                  Every {policy.reminderIntervalDays} calendar days
                </strong>
              </div>

              <div className="pt-4">
                <p className="mb-3 text-xs font-medium text-[#252421]">
                  Automatic suppression conditions
                </p>

                <div className="space-y-3">
                  {[
                    {
                      label: "Bill marked paid",
                      enabled: policy.suppressWhenPaid,
                    },
                    {
                      label: "Bill under dispute",
                      enabled: policy.suppressWhenDisputed,
                    },
                    {
                      label: "Recipient opted out",
                      enabled: policy.suppressWhenOptedOut,
                    },
                  ].map((rule) => (
                    <div
                      key={rule.label}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-xs text-[#77736D]">
                        {rule.label}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs">
                        {rule.enabled ? (
                          <>
                            <CheckCircle2
                              size={14}
                              className="text-emerald-700"
                            />
                            <span className="text-emerald-800">Enabled</span>
                          </>
                        ) : (
                          <>
                            <ShieldX
                              size={14}
                              className="text-red-700"
                            />
                            <span className="text-red-800">Disabled</span>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Templates */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="05 / Content"
            title="Message templates"
          />

          <div className="overflow-x-auto rounded-xl border border-[#E2E0DA] bg-white">
            {templates.length > 0 ? (
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-[#EEECE7] bg-[#FAF9F6]">
                  <tr className="text-[10px] uppercase tracking-wider text-[#77736D]">
                    <th className="px-5 py-3 font-medium">Template</th>
                    <th className="px-5 py-3 font-medium">Channel</th>
                    <th className="px-5 py-3 font-medium">Purpose</th>
                    <th className="px-5 py-3 font-medium">Approval</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Updated</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>

                <tbody>
                  {templates.map((template) => (
                    <tr
                      key={template.id}
                      className="border-b border-[#EEECE7] last:border-0"
                    >
                      <td className="px-5 py-4 text-xs font-medium text-[#252421]">
                        {template.name}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {channelLabels[template.channel]}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {template.purpose}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill
                          className={approvalStyles[template.approvalStatus]}
                        >
                          {template.approvalStatus.replace("_", " ")}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill
                          className={
                            template.enabled
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-[#F2F0EB] text-[#55534F]"
                          }
                        >
                          {template.enabled ? "Enabled" : "Disabled"}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {formatDate(template.updatedAt)}
                      </td>
                      <td className="px-5 py-4">
                        {onOpenTemplate && (
                          <button
                            type="button"
                            onClick={() => onOpenTemplate(template)}
                            className="text-xs font-medium text-[#9A7848] hover:underline"
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-6 text-sm text-[#77736D]">
                No message templates are available.
              </p>
            )}
          </div>
        </section>

        {/* Delivery history */}
        <section>
          <SectionHeading
            eyebrow="06 / Delivery"
            title="Recent notification activity"
          />

          <div className="overflow-x-auto rounded-xl border border-[#E2E0DA] bg-white">
            {deliveries.length > 0 ? (
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-[#EEECE7] bg-[#FAF9F6]">
                  <tr className="text-[10px] uppercase tracking-wider text-[#77736D]">
                    <th className="px-5 py-3 font-medium">Recipient</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Channel</th>
                    <th className="px-5 py-3 font-medium">Purpose</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>

                <tbody>
                  {deliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="border-b border-[#EEECE7] last:border-0"
                    >
                      <td className="px-5 py-4 text-xs font-medium text-[#252421]">
                        {delivery.recipientLabel}
                      </td>
                      <td className="px-5 py-4 text-xs capitalize text-[#77736D]">
                        {delivery.recipientType}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {channelLabels[delivery.channel]}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {delivery.purpose}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill
                          className={deliveryStyles[delivery.status]}
                        >
                          {delivery.status}
                        </StatusPill>
                        {delivery.reason && (
                          <p className="mt-1 max-w-[180px] text-[10px] text-[#99958D]">
                            {delivery.reason}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {formatDate(delivery.occurredAt)}
                      </td>
                      <td className="px-5 py-4">
                        {onOpenDelivery && (
                          <button
                            type="button"
                            onClick={() => onOpenDelivery(delivery)}
                            className="text-xs font-medium text-[#9A7848] hover:underline"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center">
                <Clock3
                  size={22}
                  className="mx-auto mb-2 text-[#99958D]"
                />
                <p className="text-sm font-medium text-[#33312E]">
                  No delivery history
                </p>
                <p className="mt-1 text-xs text-[#77736D]">
                  Delivery records will appear when supplied by the backend.
                </p>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-9 border-t border-[#D8D6D0] pt-5">
          <p className="text-[11px] leading-5 text-[#8B877F]">
            This interface does not send messages or change consent.
            Delivery must be enforced by the backend using verified
            recipient consent, approved templates, quiet hours and
            suppression rules. A displayed delivery record is not proof
            that a recipient read or acted on a message.
          </p>
        </footer>
      </div>
    </main>
  );
}
