
"use client";

import { useState, type ReactNode } from "react";
import {
  Settings2,
  ShieldCheck,
  Bell,
  Wallet,
  Users,
  Clock3,
  LockKeyhole,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle2,
  History,
  Info,
  MessageSquare,
} from "lucide-react";
import { AdminAutomationSettingsTab } from "./AdminAutomationSettingsTab";

export interface AdminSystemSettingsData {
  version: string;
  updatedAt: string;
  updatedBy: string;

  financial: {
    highValueThreshold: number;
    currency: "INR";
    makerCheckerEnabled: boolean;
    requireSeparateApprovers: boolean;
    preventPaymentSplitting: boolean;
  };

  notifications: {
    whatsappEnabled: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    reminderIntervalCalendarDays: number;
    requireWhatsAppOptIn: boolean;
    suppressPaidInvoices: boolean;
    suppressDisputedInvoices: boolean;
    suppressOptOutContacts: boolean;
  };

  portalAccess: {
    clientSelfRegistration: boolean;
    vendorSelfRegistration: boolean;
    invitationOnlyAccess: boolean;
    invitationExpiryHours: number;
    requireEmailVerification: boolean;
  };

  security: {
    sessionTimeoutMinutes: number;
    maxFailedLoginAttempts: number;
    accountLockoutMinutes: number;
    requireStrongPasswords: boolean;
    auditLoggingEnabled: boolean;
  };
}

export type SystemSettingsSection =
  | "financial"
  | "notifications"
  | "portal"
  | "security"
  | "automation";

export interface SystemSettingsChangeRequest {
  section: SystemSettingsSection;
  reason: string;
  proposedValues: Record<string, string | number | boolean>;
  expectedVersion: string;
}

export interface SystemSettingsHistoryEntry {
  id: string;
  section: SystemSettingsSection;
  description: string;
  changedBy: string;
  changedAt: string;
  status: "Applied" | "Pending Approval" | "Rejected";
  reason?: string;
}

interface AdminSystemSettingsProps {
  settings: AdminSystemSettingsData | null;
  history: SystemSettingsHistoryEntry[];

  loading?: boolean;
  saving?: boolean;
  error?: string;
  successMessage?: string;

  canManageFinancialSettings?: boolean;
  canManageNotificationSettings?: boolean;
  canManagePortalSettings?: boolean;
  canManageSecuritySettings?: boolean;

  onRefresh?: () => void;
  onSubmitChange: (
    request: SystemSettingsChangeRequest
  ) => Promise<void>;
  onOpenHistory?: () => void;
}

type SettingsDraft = {
  financial: AdminSystemSettingsData["financial"];
  notifications: AdminSystemSettingsData["notifications"];
  portalAccess: AdminSystemSettingsData["portalAccess"];
  security: AdminSystemSettingsData["security"];
};

const SECTIONS: {
  id: SystemSettingsSection;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    id: "financial",
    label: "Financial Policies",
    description: "Approval thresholds and payment controls",
    icon: <Wallet size={17} />,
  },
  {
    id: "notifications",
    label: "Notification Policies",
    description: "WhatsApp reminders and communication rules",
    icon: <Bell size={17} />,
  },
  {
    id: "portal",
    label: "Portal Access",
    description: "Client and vendor account access",
    icon: <Users size={17} />,
  },
  {
    id: "security",
    label: "Security Policies",
    description: "Session, login and audit controls",
    icon: <LockKeyhole size={17} />,
  },
  {
    id: "automation",
    label: "WhatsApp & Email Automation",
    description: "Sender numbers, Meta Cloud API, templates and dispatches",
    icon: <MessageSquare size={17} />,
  },
];

function canManageSection(
  section: SystemSettingsSection,
  permissions: {
    financial: boolean;
    notifications: boolean;
    portal: boolean;
    security: boolean;
  }
) {
  switch (section) {
    case "financial":
      return permissions.financial;
    case "notifications":
      return permissions.notifications;
    case "portal":
      return permissions.portal;
    case "security":
      return permissions.security;
  }
}

export function AdminSystemSettings({
  settings,
  history,
  loading = false,
  saving = false,
  error,
  successMessage,
  canManageFinancialSettings = false,
  canManageNotificationSettings = false,
  canManagePortalSettings = false,
  canManageSecuritySettings = false,
  onRefresh,
  onSubmitChange,
  onOpenHistory,
}: AdminSystemSettingsProps) {
  const [activeSection, setActiveSection] =
    useState<SystemSettingsSection>("financial");

  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const permissions = {
    financial: canManageFinancialSettings,
    notifications: canManageNotificationSettings,
    portal: canManagePortalSettings,
    security: canManageSecuritySettings,
  };

  const activeDraft = draft ??
    (settings
      ? {
          financial: { ...settings.financial },
          notifications: { ...settings.notifications },
          portalAccess: { ...settings.portalAccess },
          security: { ...settings.security },
        }
      : null);

  const hasDraft = Boolean(draft);

  function updateSection<K extends keyof SettingsDraft>(
    section: K,
    field: keyof SettingsDraft[K],
    value: SettingsDraft[K][keyof SettingsDraft[K]]
  ) {
    if (!settings || !canManageSection(
      activeSection,
      permissions
    )) {
      return;
    }

    setDraft((current) => {
      const base = current ?? {
        financial: { ...settings.financial },
        notifications: { ...settings.notifications },
        portalAccess: { ...settings.portalAccess },
        security: { ...settings.security },
      };

      return {
        ...base,
        [section]: {
          ...base[section],
          [field]: value,
        },
      } as SettingsDraft;
    });

    setValidationError("");
  }

  function resetDraft() {
    setDraft(null);
    setReason("");
    setValidationError("");
    setConfirmationOpen(false);
  }

  function getProposedValues(): Record<
    string,
    string | number | boolean
  > {
    if (!activeDraft) return {};

    switch (activeSection) {
      case "financial":
        return { ...activeDraft.financial };

      case "notifications":
        return { ...activeDraft.notifications };

      case "portal":
        return { ...activeDraft.portalAccess };

      case "security":
        return { ...activeDraft.security };

      case "automation":
      default:
        return {};
    }
  }

  function validateDraft() {
    if (!activeDraft || !settings) {
      return "Settings are not available.";
    }

    if (!canManageSection(activeSection, permissions)) {
      return "You do not have permission to change this section.";
    }

    if (reason.trim().length < 10) {
      return "Please provide a reason with at least 10 characters.";
    }

    const financial = activeDraft.financial;
    const notifications = activeDraft.notifications;
    const portal = activeDraft.portalAccess;
    const security = activeDraft.security;

    if (
      !Number.isFinite(financial.highValueThreshold) ||
      financial.highValueThreshold <= 0
    ) {
      return "The financial approval threshold must be greater than zero.";
    }

    if (
      !Number.isInteger(notifications.reminderIntervalCalendarDays) ||
      notifications.reminderIntervalCalendarDays < 1
    ) {
      return "Reminder interval must be at least one calendar day.";
    }

    if (
      !Number.isInteger(portal.invitationExpiryHours) ||
      portal.invitationExpiryHours < 1
    ) {
      return "Invitation expiry must be at least one hour.";
    }

    if (
      !Number.isInteger(security.sessionTimeoutMinutes) ||
      security.sessionTimeoutMinutes < 5
    ) {
      return "Session timeout must be at least five minutes.";
    }

    if (
      !Number.isInteger(security.maxFailedLoginAttempts) ||
      security.maxFailedLoginAttempts < 1
    ) {
      return "Failed login attempts must be at least one.";
    }

    if (
      !Number.isInteger(security.accountLockoutMinutes) ||
      security.accountLockoutMinutes < 1
    ) {
      return "Account lockout duration must be at least one minute.";
    }

    if (
      notifications.quietHoursEnabled &&
      notifications.quietHoursStart ===
        notifications.quietHoursEnd
    ) {
      return "Quiet hours start and end cannot be identical.";
    }

    if (
      portal.clientSelfRegistration ||
      portal.vendorSelfRegistration
    ) {
      return "Public self-registration is not permitted by the current access policy.";
    }

    if (!portal.invitationOnlyAccess) {
      return "Invitation-only portal access must remain enabled.";
    }

    if (!financial.makerCheckerEnabled) {
      return "Maker-checker approval controls must remain enabled.";
    }

    if (!financial.requireSeparateApprovers) {
      return "Separate approver controls must remain enabled.";
    }

    if (!financial.preventPaymentSplitting) {
      return "Payment-splitting prevention must remain enabled.";
    }

    if (!notifications.requireWhatsAppOptIn) {
      return "WhatsApp consent must remain mandatory.";
    }

    if (
      !notifications.suppressPaidInvoices ||
      !notifications.suppressDisputedInvoices ||
      !notifications.suppressOptOutContacts
    ) {
      return "Paid, disputed and opted-out contacts must remain excluded from reminders.";
    }

    if (!security.auditLoggingEnabled) {
      return "Audit logging cannot be disabled through this interface.";
    }

    return "";
  }

  function requestConfirmation() {
    const validation = validateDraft();

    if (validation) {
      setValidationError(validation);
      return;
    }

    setConfirmationOpen(true);
  }

  async function submitChange() {
    if (!settings) return;

    const validation = validateDraft();

    if (validation) {
      setValidationError(validation);
      setConfirmationOpen(false);
      return;
    }

    setValidationError("");

    await onSubmitChange({
      section: activeSection,
      reason: reason.trim(),
      proposedValues: getProposedValues(),
      expectedVersion: settings.version,
    });

    setConfirmationOpen(false);
    setDraft(null);
    setReason("");
  }

  if (loading && !settings) {
    return (
      <div className="flex min-h-80 items-center justify-center bg-[#F2F0EB]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
          Loading system configuration...
        </p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] p-8">
        <div className="mx-auto max-w-3xl border border-[#D8D6D0] bg-white p-10 text-center">
          <Settings2
            size={30}
            className="mx-auto text-[#A58A64]"
          />

          <h1 className="mt-5 font-serif text-3xl text-[#171717]">
            Settings unavailable
          </h1>

          <p className="mt-3 text-xs text-[#77736C]">
            The system configuration could not be loaded.
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-6 inline-flex items-center gap-2 bg-[#171717] px-5 py-3 text-[10px] uppercase tracking-widest text-white"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

      {/* Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Configuration
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            System Settings
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Review operational policies and submit controlled
            configuration changes.
          </p>

          <p className="mt-4 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            Version {settings.version}
            {" · "}
            Last updated {settings.updatedAt}
            {" · "}
            By {settings.updatedBy}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#55514A]"
            >
              <History size={14} />
              Change History
            </button>
          )}
        </div>
      </header>

      {error && <FeedbackMessage type="error">{error}</FeedbackMessage>}

      {successMessage && (
        <FeedbackMessage type="success">
          {successMessage}
        </FeedbackMessage>
      )}

      {validationError && (
        <FeedbackMessage type="error">
          {validationError}
        </FeedbackMessage>
      )}

      {/* Governance Notice */}
      <div className="mt-7 flex items-start gap-3 border border-[#D8D6D0] bg-white p-5">
        <ShieldCheck
          size={19}
          className="mt-0.5 shrink-0 text-[#A58A64]"
        />

        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            Controlled Configuration
          </p>

          <p className="mt-2 text-xs leading-6 text-[#77736C]">
            Changes submitted here are requests, not immediate policy
            changes. The server must verify permissions, validate
            the current configuration version and apply any required
            approval workflow.
          </p>
        </div>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-7 xl:grid-cols-[280px_minmax(0,1fr)]">

        {/* Navigation */}
        <aside className="space-y-2">
          {SECTIONS.map((section) => {
            const permitted = canManageSection(
              section.id,
              permissions
            );

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveSection(section.id);
                  setConfirmationOpen(false);
                  setValidationError("");
                }}
                className={`flex w-full items-start gap-4 border p-4 text-left transition-colors ${
                  activeSection === section.id
                    ? "border-[#A58A64] bg-white"
                    : "border-[#D8D6D0] bg-transparent hover:bg-white"
                }`}
              >
                <span className="mt-1 text-[#A58A64]">
                  {section.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-[#171717]">
                    {section.label}
                  </span>

                  <span className="mt-1 block text-[9px] leading-5 text-[#99958D]">
                    {section.description}
                  </span>

                  <span className={`mt-2 inline-block text-[8px] uppercase tracking-widest ${
                    permitted ? "text-[#547A51]" : "text-[#99958D]"
                  }`}>
                    {permitted ? "Can manage" : "View only"}
                  </span>
                </span>
              </button>
            );
          })}

          <div className="border border-[#D8D6D0] bg-white p-4">
            <div className="flex items-center gap-2 text-[#A58A64]">
              <Info size={15} />
              <p className="font-mono text-[8px] uppercase tracking-widest">
                Permission Notice
              </p>
            </div>

            <p className="mt-3 text-[10px] leading-6 text-[#77736C]">
              Access shown here is supplied by the application.
              Backend authorization must independently verify
              every submitted change.
            </p>
          </div>
        </aside>

        {/* Settings Panel */}
        <section className="min-w-0 border border-[#D8D6D0] bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-[#E5E2DC] p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                Configuration Area
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#171717]">
                {SECTIONS.find(
                  (section) => section.id === activeSection
                )?.label}
              </h2>
            </div>

            <span className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
              {canManageSection(activeSection, permissions)
                ? "Editing permitted"
                : "Read-only access"}
            </span>
          </div>

          <div className="space-y-8 p-6">
            {activeSection === "financial" && activeDraft && (
              <FinancialSettings
                value={activeDraft.financial}
                editable={canManageFinancialSettings}
                onChange={(field, value) =>
                  updateSection("financial", field, value)
                }
              />
            )}

            {activeSection === "notifications" && activeDraft && (
              <NotificationSettings
                value={activeDraft.notifications}
                editable={canManageNotificationSettings}
                onChange={(field, value) =>
                  updateSection("notifications", field, value)
                }
              />
            )}

            {activeSection === "portal" && activeDraft && (
              <PortalSettings
                value={activeDraft.portalAccess}
                editable={canManagePortalSettings}
                onChange={(field, value) =>
                  updateSection("portalAccess", field, value)
                }
              />
            )}

            {activeSection === "security" && activeDraft && (
              <SecuritySettings
                value={activeDraft.security}
                editable={canManageSecuritySettings}
                onChange={(field, value) =>
                  updateSection("security", field, value)
                }
              />
            )}

            {activeSection === "automation" && (
              <AdminAutomationSettingsTab />
            )}
          </div>

          {/* Change Request */}
          {canManageSection(activeSection, permissions) && (
            <div className="border-t border-[#E5E2DC] bg-[#FAF9F6] p-6">
              <label className="block">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                  Reason for Configuration Change
                </span>

                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Explain why this configuration change is required..."
                  className="mt-3 w-full resize-y border border-[#D8D6D0] bg-white p-4 text-xs leading-6 text-[#33312D] outline-none focus:border-[#A58A64]"
                />
              </label>

              <div className="mt-4 flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  onClick={resetDraft}
                  disabled={!hasDraft || saving}
                  className="border border-[#D8D6D0] bg-white px-5 py-3 text-[9px] uppercase tracking-widest text-[#55514A] disabled:opacity-40"
                >
                  Reset Changes
                </button>

                <button
                  type="button"
                  onClick={requestConfirmation}
                  disabled={!hasDraft || saving}
                  className="inline-flex items-center gap-2 bg-[#171717] px-5 py-3 text-[9px] uppercase tracking-widest text-white disabled:opacity-40"
                >
                  <Save size={14} />
                  Review Change Request
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Recent History */}
      <section className="mt-10">
        <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              Governance Records
            </p>

            <h2 className="mt-2 font-serif text-2xl text-[#171717]">
              Recent Configuration Changes
            </h2>
          </div>

          <History size={19} className="text-[#A58A64]" />
        </div>

        {history.length === 0 ? (
          <div className="mt-5 border border-[#D8D6D0] bg-white p-8 text-center text-xs text-[#77736C]">
            No configuration history is available.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col justify-between gap-3 border border-[#D8D6D0] bg-white p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-xs text-[#171717]">
                    {entry.description}
                  </p>

                  <p className="mt-2 text-[9px] text-[#99958D]">
                    {entry.section}
                    {" · "}
                    {entry.changedBy}
                    {" · "}
                    {entry.changedAt}
                  </p>

                  {entry.reason && (
                    <p className="mt-2 text-[10px] leading-5 text-[#77736C]">
                      Reason: {entry.reason}
                    </p>
                  )}
                </div>

                <HistoryStatus status={entry.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Dialog */}
      {confirmationOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-confirm-title"
            className="w-full max-w-lg border border-[#D8D6D0] bg-[#F7F5F0] p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <AlertCircle
                size={21}
                className="text-[#A58A64]"
              />

              <h2
                id="settings-confirm-title"
                className="font-serif text-2xl text-[#171717]"
              >
                Submit Configuration Request?
              </h2>
            </div>

            <p className="mt-4 text-xs leading-7 text-[#77736C]">
              You are submitting a proposed change to{" "}
              <strong>
                {SECTIONS.find(
                  (section) => section.id === activeSection
                )?.label}
              </strong>
              . The current settings will not be changed by this
              submission alone.
            </p>

            <div className="mt-5 border border-[#D8D6D0] bg-white p-4">
              <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                Change Reason
              </p>

              <p className="mt-2 text-xs leading-6 text-[#33312D]">
                {reason}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmationOpen(false)}
                disabled={saving}
                className="border border-[#D8D6D0] bg-white px-5 py-3 text-[9px] uppercase tracking-widest text-[#55514A]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitChange}
                disabled={saving}
                className="bg-[#171717] px-5 py-3 text-[9px] uppercase tracking-widest text-white disabled:opacity-40"
              >
                {saving ? "Submitting..." : "Confirm Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SettingGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="font-serif text-xl text-[#171717]">
        {title}
      </h3>

      {description && (
        <p className="mt-2 text-[10px] leading-6 text-[#77736C]">
          {description}
        </p>
      )}

      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#EAE7E0] pb-4 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-[#33312D]">{title}</p>

        <p className="mt-1 max-w-xl text-[10px] leading-5 text-[#99958D]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-5 w-10 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[#A58A64]" : "bg-[#C9C5BC]"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SettingNumber({
  label,
  value,
  suffix,
  editable,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  editable: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col justify-between gap-3 border-b border-[#EAE7E0] pb-4 sm:flex-row sm:items-center">
      <span className="text-xs text-[#33312D]">{label}</span>

      <span className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={value}
          disabled={!editable}
          onChange={(event) =>
            onChange(Number(event.target.value))
          }
          className="h-10 w-36 border border-[#D8D6D0] bg-white px-3 text-right text-xs text-[#33312D] outline-none focus:border-[#A58A64] disabled:bg-[#F2F0EB]"
        />

        {suffix && (
          <span className="text-[9px] text-[#99958D]">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

function SettingTime({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 border-b border-[#EAE7E0] pb-4">
      <span className="text-xs text-[#33312D]">{label}</span>

      <input
        type="time"
        value={value}
        disabled={!editable}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 border border-[#D8D6D0] bg-white px-3 text-xs text-[#33312D] outline-none focus:border-[#A58A64] disabled:bg-[#F2F0EB]"
      />
    </label>
  );
}

function FinancialSettings({
  value,
  editable,
  onChange,
}: {
  value: AdminSystemSettingsData["financial"];
  editable: boolean;
  onChange: (
    field: keyof AdminSystemSettingsData["financial"],
    value: number | boolean
  ) => void;
}) {
  return (
    <>
      <SettingGroup
        title="Approval Threshold"
        description="Controls when additional financial approval is required."
      >
        <SettingNumber
          label="High-value approval threshold"
          value={value.highValueThreshold}
          suffix="INR"
          editable={editable}
          onChange={(next) =>
            onChange("highValueThreshold", next)
          }
        />

        <SettingToggle
          title="Maker-checker approval"
          description="Require a separate authorised person to review financial actions."
          checked={value.makerCheckerEnabled}
          disabled={!editable}
          onChange={(next) =>
            onChange("makerCheckerEnabled", next)
          }
        />

        <SettingToggle
          title="Separate approvers"
          description="Prevent the transaction initiator from approving their own transaction."
          checked={value.requireSeparateApprovers}
          disabled={!editable}
          onChange={(next) =>
            onChange("requireSeparateApprovers", next)
          }
        />

        <SettingToggle
          title="Prevent payment splitting"
          description="Apply threshold checks to related transactions to prevent deliberate splitting."
          checked={value.preventPaymentSplitting}
          disabled={!editable}
          onChange={(next) =>
            onChange("preventPaymentSplitting", next)
          }
        />
      </SettingGroup>

      <PolicyNotice>
        The ₹1,00,000 threshold discussed for this platform is
        provisional pending business approval. The component does
        not assume or set that value. Load the currently authorised
        threshold from the backend.
      </PolicyNotice>
    </>
  );
}

function NotificationSettings({
  value,
  editable,
  onChange,
}: {
  value: AdminSystemSettingsData["notifications"];
  editable: boolean;
  onChange: (
    field: keyof AdminSystemSettingsData["notifications"],
    value: string | number | boolean
  ) => void;
}) {
  return (
    <>
      <SettingGroup
        title="WhatsApp Communication"
        description="Control the availability and consent requirements of official WhatsApp notifications."
      >
        <SettingToggle
          title="WhatsApp integration enabled"
          description="Allow the configured official WhatsApp Business integration to send approved messages."
          checked={value.whatsappEnabled}
          disabled={!editable}
          onChange={(next) =>
            onChange("whatsappEnabled", next)
          }
        />

        <SettingToggle
          title="Require affirmative opt-in"
          description="Messages must only be sent to contacts with recorded WhatsApp consent."
          checked={value.requireWhatsAppOptIn}
          disabled
          onChange={(next) =>
            onChange("requireWhatsAppOptIn", next)
          }
        />
      </SettingGroup>

      <SettingGroup
        title="Quiet Hours"
        description="Prevent routine reminders from being sent during restricted hours."
      >
        <SettingToggle
          title="Enable quiet hours"
          description="Apply the configured quiet-hour window to routine notifications."
          checked={value.quietHoursEnabled}
          disabled={!editable}
          onChange={(next) =>
            onChange("quietHoursEnabled", next)
          }
        />

        <SettingTime
          label="Quiet hours start"
          value={value.quietHoursStart}
          editable={editable && value.quietHoursEnabled}
          onChange={(next) =>
            onChange("quietHoursStart", next)
          }
        />

        <SettingTime
          label="Quiet hours end"
          value={value.quietHoursEnd}
          editable={editable && value.quietHoursEnabled}
          onChange={(next) =>
            onChange("quietHoursEnd", next)
          }
        />
      </SettingGroup>

      <SettingGroup
        title="Reminder Frequency"
        description="Reminder interval is measured in calendar days."
      >
        <SettingNumber
          label="Reminder interval"
          value={value.reminderIntervalCalendarDays}
          suffix="days"
          editable={editable}
          onChange={(next) =>
            onChange("reminderIntervalCalendarDays", next)
          }
        />
      </SettingGroup>

      <SettingGroup
        title="Reminder Suppression"
        description="These safeguards must remain enabled."
      >
        <SettingToggle
          title="Suppress paid invoices"
          description="Do not send payment reminders for invoices marked paid."
          checked={value.suppressPaidInvoices}
          disabled
          onChange={(next) =>
            onChange("suppressPaidInvoices", next)
          }
        />

        <SettingToggle
          title="Suppress disputed invoices"
          description="Pause routine reminders for invoices under an active dispute."
          checked={value.suppressDisputedInvoices}
          disabled
          onChange={(next) =>
            onChange("suppressDisputedInvoices", next)
          }
        />

        <SettingToggle
          title="Suppress opted-out contacts"
          description="Never send WhatsApp reminders to contacts who withdrew consent."
          checked={value.suppressOptOutContacts}
          disabled
          onChange={(next) =>
            onChange("suppressOptOutContacts", next)
          }
        />
      </SettingGroup>

      <PolicyNotice>
        Reminder scheduling, consent records, approved templates,
        quiet hours and opt-out enforcement must be implemented
        by the notification service. Changing this screen alone
        cannot activate WhatsApp messaging.
      </PolicyNotice>
    </>
  );
}

function PortalSettings({
  value,
  editable,
  onChange,
}: {
  value: AdminSystemSettingsData["portalAccess"];
  editable: boolean;
  onChange: (
    field: keyof AdminSystemSettingsData["portalAccess"],
    value: number | boolean
  ) => void;
}) {
  return (
    <>
      <SettingGroup
        title="Account Registration"
        description="Client and vendor access is controlled through invitations."
      >
        <SettingToggle
          title="Client self-registration"
          description="Public visitors must not create client accounts independently."
          checked={value.clientSelfRegistration}
          disabled
          onChange={(next) =>
            onChange("clientSelfRegistration", next)
          }
        />

        <SettingToggle
          title="Vendor self-registration"
          description="Vendor accounts must be provisioned through authorised studio workflows."
          checked={value.vendorSelfRegistration}
          disabled
          onChange={(next) =>
            onChange("vendorSelfRegistration", next)
          }
        />

        <SettingToggle
          title="Invitation-only access"
          description="Only authorised invitations may activate client and vendor portal accounts."
          checked={value.invitationOnlyAccess}
          disabled
          onChange={(next) =>
            onChange("invitationOnlyAccess", next)
          }
        />
      </SettingGroup>

      <SettingGroup
        title="Invitation Verification"
        description="Configure invitation lifetime and identity verification."
      >
        <SettingNumber
          label="Invitation expiry"
          value={value.invitationExpiryHours}
          suffix="hours"
          editable={editable}
          onChange={(next) =>
            onChange("invitationExpiryHours", next)
          }
        />

        <SettingToggle
          title="Require email verification"
          description="Require ownership verification of the invited email address."
          checked={value.requireEmailVerification}
          disabled={!editable}
          onChange={(next) =>
            onChange("requireEmailVerification", next)
          }
        />
      </SettingGroup>

      <PolicyNotice>
        Invitation tokens must be single-use, time-limited and
        securely validated by the backend. Portal access must
        always be checked against the authenticated user&apos;s
        assigned records.
      </PolicyNotice>
    </>
  );
}

function SecuritySettings({
  value,
  editable,
  onChange,
}: {
  value: AdminSystemSettingsData["security"];
  editable: boolean;
  onChange: (
    field: keyof AdminSystemSettingsData["security"],
    value: number | boolean
  ) => void;
}) {
  return (
    <>
      <SettingGroup
        title="Session Management"
        description="Control session duration for authenticated users."
      >
        <SettingNumber
          label="Session timeout"
          value={value.sessionTimeoutMinutes}
          suffix="minutes"
          editable={editable}
          onChange={(next) =>
            onChange("sessionTimeoutMinutes", next)
          }
        />
      </SettingGroup>

      <SettingGroup
        title="Login Protection"
        description="Controls for repeated unsuccessful authentication attempts."
      >
        <SettingNumber
          label="Maximum failed login attempts"
          value={value.maxFailedLoginAttempts}
          editable={editable}
          onChange={(next) =>
            onChange("maxFailedLoginAttempts", next)
          }
        />

        <SettingNumber
          label="Account lockout duration"
          value={value.accountLockoutMinutes}
          suffix="minutes"
          editable={editable}
          onChange={(next) =>
            onChange("accountLockoutMinutes", next)
          }
        />

        <SettingToggle
          title="Strong password policy"
          description="Require the backend password policy during account creation and password changes."
          checked={value.requireStrongPasswords}
          disabled={editable ? false : true}
          onChange={(next) =>
            onChange("requireStrongPasswords", next)
          }
        />
      </SettingGroup>

      <SettingGroup
        title="Audit Protection"
        description="Security and financial actions require traceable event records."
      >
        <SettingToggle
          title="Audit logging"
          description="Record relevant authentication, access, financial and configuration events."
          checked={value.auditLoggingEnabled}
          disabled
          onChange={(next) =>
            onChange("auditLoggingEnabled", next)
          }
        />
      </SettingGroup>

      <PolicyNotice>
        Authentication, session expiry, account lockout and
        password enforcement must be implemented server-side.
        The browser cannot be trusted to enforce these controls.
      </PolicyNotice>
    </>
  );
}

function PolicyNotice({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border border-[#D8D6D0] bg-[#FAF9F6] p-4">
      <Info
        size={16}
        className="mt-0.5 shrink-0 text-[#A58A64]"
      />

      <p className="text-[10px] leading-6 text-[#77736C]">
        {children}
      </p>
    </div>
  );
}

function FeedbackMessage({
  type,
  children,
}: {
  type: "error" | "success";
  children: ReactNode;
}) {
  const success = type === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      className={`mt-6 flex items-start gap-3 border p-4 ${
        success
          ? "border-[#D2DFCE] bg-[#F0F5EE] text-[#547A51]"
          : "border-[#E3C9C5] bg-[#FAF3F1] text-[#9A5147]"
      }`}
    >
      {success ? (
        <CheckCircle2 size={17} />
      ) : (
        <AlertCircle size={17} />
      )}

      <p className="text-xs leading-6">{children}</p>
    </div>
  );
}

function HistoryStatus({
  status,
}: {
  status: SystemSettingsHistoryEntry["status"];
}) {
  const styles = {
    Applied: "bg-[#EAF1E8] text-[#547A51]",
    "Pending Approval": "bg-[#F4EFE2] text-[#94743F]",
    Rejected: "bg-[#F8EAE7] text-[#9A5147]",
  };

  return (
    <span
      className={`shrink-0 px-3 py-2 text-[8px] uppercase tracking-widest ${styles[status]}`}
    >
      {status}
    </span>
  );
}
