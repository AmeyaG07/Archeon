
"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  Monitor,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

export type AdminAccessUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited" | "suspended" | "disabled";
  lastLoginAt?: string;
  mfaEnabled: boolean;
  createdAt: string;
};

export type AdminAccessSession = {
  id: string;
  userId: string;
  userName: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  ipAddress?: string;
  locationLabel?: string;
  startedAt: string;
  lastActivityAt: string;
  currentSession?: boolean;
};

export type AdminSecurityEvent = {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "information";
  occurredAt: string;
  actor?: string;
  resolved?: boolean;
};

export type AdminInvitation = {
  id: string;
  recipient: string;
  role: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  invitedAt: string;
  expiresAt?: string;
};

type Props = {
  users: AdminAccessUser[];
  sessions: AdminAccessSession[];
  events: AdminSecurityEvent[];
  invitations: AdminInvitation[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenUser?: (user: AdminAccessUser) => void;
  onSuspendUser?: (user: AdminAccessUser) => void;
  onOpenSession?: (session: AdminAccessSession) => void;
  onRevokeSession?: (session: AdminAccessSession) => void;
  onOpenSecurityEvent?: (event: AdminSecurityEvent) => void;
  onResolveSecurityEvent?: (event: AdminSecurityEvent) => void;
  onRevokeInvitation?: (invitation: AdminInvitation) => void;
  onCreateInvitation?: () => void;
};

const userStatusStyles: Record<AdminAccessUser["status"], string> = {
  active: "bg-emerald-50 text-emerald-800",
  invited: "bg-blue-50 text-blue-800",
  suspended: "bg-amber-50 text-amber-800",
  disabled: "bg-[#F2F0EB] text-[#77736D]",
};

const eventSeverityStyles: Record<
  AdminSecurityEvent["severity"],
  string
> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  information: "border-[#D8D6D0] bg-[#F2F0EB] text-[#55534F]",
};

const invitationStatusStyles: Record<AdminInvitation["status"], string> = {
  pending: "bg-blue-50 text-blue-800",
  accepted: "bg-emerald-50 text-emerald-800",
  expired: "bg-[#F2F0EB] text-[#77736D]",
  revoked: "bg-red-50 text-red-800",
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
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9A7848]">
          {eyebrow}
        </p>
        <h2 className="text-lg font-medium tracking-tight text-[#171717]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export default function AdminSecurityAccessCenter({
  users,
  sessions,
  events,
  invitations,
  loading = false,
  error = null,
  onRefresh,
  onOpenUser,
  onSuspendUser,
  onOpenSession,
  onRevokeSession,
  onOpenSecurityEvent,
  onResolveSecurityEvent,
  onRevokeInvitation,
  onCreateInvitation,
}: Props) {
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term);

      const matchesStatus =
        userStatusFilter === "all" || user.status === userStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, userSearch, userStatusFilter]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === "all") return events;
    return events.filter((event) => event.severity === eventFilter);
  }, [events, eventFilter]);

  const activeUsers = users.filter((user) => user.status === "active").length;
  const mfaEnabledUsers = users.filter(
    (user) => user.status === "active" && user.mfaEnabled
  ).length;
  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending"
  ).length;
  const unresolvedCriticalEvents = events.filter(
    (event) => event.severity === "critical" && !event.resolved
  ).length;

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#D8D6D0] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9A7848]">
              Studio administration / Security
            </p>

            <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">
              Security & access
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77736D]">
              Review account access, active sessions, invitations and
              security events across the studio platform.
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

            {onCreateInvitation && (
              <button
                type="button"
                onClick={onCreateInvitation}
                className="rounded-lg bg-[#171717] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#33312E]"
              >
                Create invitation
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
              <p className="font-medium">Unable to load security information</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-[#D8D6D0] bg-white px-4 py-3 text-xs text-[#77736D]"
          >
            Updating security information…
          </div>
        )}

        {/* Overview */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="01 / Overview"
            title="Access indicators"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <UserCheck size={18} className="text-[#9A7848]" />
              <p className="mt-4 text-xs text-[#77736D]">Active accounts</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {activeUsers}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <ShieldCheck size={18} className="text-emerald-700" />
              <p className="mt-4 text-xs text-[#77736D]">MFA-enabled active accounts</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {mfaEnabledUsers}
                <span className="ml-1 text-sm font-normal text-[#99958D]">
                  / {activeUsers}
                </span>
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <KeyRound size={18} className="text-[#9A7848]" />
              <p className="mt-4 text-xs text-[#77736D]">Pending invitations</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {pendingInvitations}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <ShieldAlert size={18} className="text-red-700" />
              <p className="mt-4 text-xs text-[#77736D]">
                Unresolved critical events
              </p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {unresolvedCriticalEvents}
              </p>
            </article>
          </div>
        </section>

        {/* User access */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="02 / Identity"
            title="User access management"
          />

          <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-[#E2E0DA] bg-white p-4 md:grid-cols-[minmax(220px,1fr)_200px]">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99958D]"
              />
              <input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search name, email or role"
                aria-label="Search user accounts"
                className="w-full rounded-lg border border-[#D8D6D0] bg-[#FAF9F6] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#B68A4A]"
              />
            </div>

            <select
              value={userStatusFilter}
              onChange={(event) => setUserStatusFilter(event.target.value)}
              aria-label="Filter user status"
              className="rounded-lg border border-[#D8D6D0] bg-[#FAF9F6] px-3 py-2.5 text-xs outline-none focus:border-[#B68A4A]"
            >
              <option value="all">All account statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="suspended">Suspended</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2E0DA] bg-white">
            {filteredUsers.length > 0 ? (
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-[#EEECE7] bg-[#FAF9F6]">
                  <tr className="text-[10px] uppercase tracking-wider text-[#77736D]">
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">MFA</th>
                    <th className="px-5 py-3 font-medium">Last login</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#EEECE7] last:border-0 hover:bg-[#FAF9F6]"
                    >
                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-[#252421]">
                          {user.name}
                        </p>
                        <p className="mt-1 text-[10px] text-[#99958D]">
                          {user.email}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-xs text-[#55534F]">
                        {user.role}
                      </td>

                      <td className="px-5 py-4">
                        <StatusPill className={userStatusStyles[user.status]}>
                          {user.status}
                        </StatusPill>
                      </td>

                      <td className="px-5 py-4">
                        {user.mfaEnabled ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-800">
                            <CheckCircle2 size={13} />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-800">
                            <AlertCircle size={13} />
                            Not enabled
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {formatDate(user.lastLoginAt)}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {onOpenUser && (
                            <button
                              type="button"
                              onClick={() => onOpenUser(user)}
                              className="text-xs font-medium text-[#9A7848] hover:underline"
                            >
                              Details
                            </button>
                          )}

                          {user.status === "active" && onSuspendUser && (
                            <button
                              type="button"
                              onClick={() => onSuspendUser(user)}
                              className="text-xs font-medium text-red-700 hover:underline"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-8 text-center text-xs text-[#77736D]">
                No matching user accounts.
              </p>
            )}
          </div>
        </section>

        {/* Sessions */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="03 / Sessions"
            title="Active sessions"
          />

          <div className="overflow-hidden rounded-xl border border-[#E2E0DA] bg-white">
            {sessions.length > 0 ? (
              sessions.map((session, index) => (
                <div
                  key={session.id}
                  className={`flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center ${
                    index !== sessions.length - 1
                      ? "border-b border-[#EEECE7]"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-lg bg-[#F2F0EB] p-2 text-[#77736D]">
                      {session.deviceType === "mobile" ? (
                        <Smartphone size={18} />
                      ) : (
                        <Monitor size={18} />
                      )}
                    </span>

                    <div>
                      <p className="text-sm font-medium text-[#252421]">
                        {session.userName}
                      </p>
                      <p className="mt-1 text-xs text-[#77736D]">
                        {session.device}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#99958D]">
                        {session.ipAddress && (
                          <span>IP: {session.ipAddress}</span>
                        )}
                        {session.locationLabel && (
                          <span>{session.locationLabel}</span>
                        )}
                        <span>
                          Last active: {formatDate(session.lastActivityAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {session.currentSession && (
                      <StatusPill className="bg-emerald-50 text-emerald-800">
                        Current session
                      </StatusPill>
                    )}

                    {onOpenSession && (
                      <button
                        type="button"
                        onClick={() => onOpenSession(session)}
                        className="text-xs font-medium text-[#9A7848] hover:underline"
                      >
                        Details
                      </button>
                    )}

                    {onRevokeSession && !session.currentSession && (
                      <button
                        type="button"
                        onClick={() => onRevokeSession(session)}
                        className="text-xs font-medium text-red-700 hover:underline"
                      >
                        Revoke session
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-xs text-[#77736D]">
                No active sessions were supplied.
              </p>
            )}
          </div>
        </section>

        {/* Security events */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="04 / Monitoring"
            title="Security events"
            action={
              <select
                value={eventFilter}
                onChange={(event) => setEventFilter(event.target.value)}
                aria-label="Filter security events"
                className="rounded-lg border border-[#D8D6D0] bg-white px-3 py-2 text-xs text-[#55534F] outline-none focus:border-[#B68A4A]"
              >
                <option value="all">All severity levels</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="information">Information</option>
              </select>
            }
          />

          {filteredEvents.length > 0 ? (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-xl border border-[#E2E0DA] bg-white p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 rounded-lg border p-2 ${eventSeverityStyles[event.severity]}`}
                      >
                        {event.severity === "critical" ? (
                          <ShieldAlert size={16} />
                        ) : event.severity === "warning" ? (
                          <AlertCircle size={16} />
                        ) : (
                          <Shield size={16} />
                        )}
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium text-[#252421]">
                            {event.title}
                          </h3>
                          <StatusPill
                            className={eventSeverityStyles[event.severity]}
                          >
                            {event.severity}
                          </StatusPill>
                          {event.resolved && (
                            <StatusPill className="bg-emerald-50 text-emerald-800">
                              Resolved
                            </StatusPill>
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-[#77736D]">
                          {event.description}
                        </p>

                        <p className="mt-2 text-[10px] text-[#99958D]">
                          {formatDate(event.occurredAt)}
                          {event.actor ? ` · ${event.actor}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {onOpenSecurityEvent && (
                        <button
                          type="button"
                          onClick={() => onOpenSecurityEvent(event)}
                          className="text-xs font-medium text-[#9A7848] hover:underline"
                        >
                          Details
                        </button>
                      )}

                      {!event.resolved && onResolveSecurityEvent && (
                        <button
                          type="button"
                          onClick={() => onResolveSecurityEvent(event)}
                          className="text-xs font-medium text-[#55534F] hover:underline"
                        >
                          Mark reviewed
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8D6D0] bg-white p-8 text-center">
              <ShieldCheck size={23} className="mx-auto mb-2 text-[#99958D]" />
              <p className="text-sm font-medium text-[#33312E]">
                No matching security events
              </p>
            </div>
          )}
        </section>

        {/* Invitations */}
        <section>
          <SectionHeading
            eyebrow="05 / Onboarding"
            title="Account invitations"
          />

          <div className="overflow-x-auto rounded-xl border border-[#E2E0DA] bg-white">
            {invitations.length > 0 ? (
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-[#EEECE7] bg-[#FAF9F6]">
                  <tr className="text-[10px] uppercase tracking-wider text-[#77736D]">
                    <th className="px-5 py-3 font-medium">Recipient</th>
                    <th className="px-5 py-3 font-medium">Assigned role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Invited</th>
                    <th className="px-5 py-3 font-medium">Expires</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {invitations.map((invitation) => (
                    <tr
                      key={invitation.id}
                      className="border-b border-[#EEECE7] last:border-0"
                    >
                      <td className="px-5 py-4 text-xs font-medium text-[#252421]">
                        {invitation.recipient}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {invitation.role}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill
                          className={invitationStatusStyles[invitation.status]}
                        >
                          {invitation.status}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {formatDate(invitation.invitedAt)}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {formatDate(invitation.expiresAt)}
                      </td>
                      <td className="px-5 py-4">
                        {invitation.status === "pending" &&
                          onRevokeInvitation && (
                            <button
                              type="button"
                              onClick={() => onRevokeInvitation(invitation)}
                              className="text-xs font-medium text-red-700 hover:underline"
                            >
                              Revoke
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-8 text-center text-xs text-[#77736D]">
                No invitation records are available.
              </p>
            )}
          </div>
        </section>

        <footer className="mt-9 border-t border-[#D8D6D0] pt-5">
          <div className="flex items-start gap-2">
            <LockKeyhole
              size={15}
              className="mt-0.5 shrink-0 text-[#9A7848]"
            />
            <p className="text-[11px] leading-5 text-[#8B877F]">
              The backend must enforce authentication, role-based
              authorisation, MFA policy, session expiry and revocation,
              invitation expiry, account suspension and immutable security
              audit records. This interface does not independently secure
              accounts or terminate sessions.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
