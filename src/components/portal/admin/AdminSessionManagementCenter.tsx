
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Clock3,
  Eye,
  Filter,
  Globe,
  Laptop,
  LogOut,
  Monitor,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Tablet,
} from "lucide-react";

export type SessionStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "REVOKED"
  | "SUSPICIOUS"
  | "REAUTHENTICATION_REQUIRED";

export type SessionDeviceType =
  | "DESKTOP"
  | "MOBILE"
  | "TABLET"
  | "UNKNOWN";

export interface AdminUserSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  deviceType: SessionDeviceType;
  deviceName: string;
  browserName?: string;
  operatingSystem?: string;
  locationLabel?: string;
  ipAddressLabel?: string;
  authenticationMethod: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt?: string;
  status: SessionStatus;
  isCurrentSession?: boolean;
}

interface AdminSessionManagementCenterProps {
  sessions: AdminUserSession[];
  currentUserId: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (session: AdminUserSession) => void;
  onRequestRevocation?: (sessionId: string) => void;
}

const statusConfig: Record<
  SessionStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700",
    icon: <ShieldCheck size={14} />,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-100 text-slate-600",
    icon: <Clock3 size={14} />,
  },
  REVOKED: {
    label: "Revoked",
    className: "bg-red-50 text-red-700",
    icon: <LogOut size={14} />,
  },
  SUSPICIOUS: {
    label: "Suspicious",
    className: "bg-orange-50 text-orange-700",
    icon: <AlertCircle size={14} />,
  },
  REAUTHENTICATION_REQUIRED: {
    label: "Reauthentication required",
    className: "bg-amber-50 text-amber-700",
    icon: <RefreshCw size={14} />,
  },
};

const filters = [
  "ALL",
  "ACTIVE",
  "SUSPICIOUS",
  "REAUTHENTICATION_REQUIRED",
  "EXPIRED",
  "REVOKED",
] as const;

type SessionFilter = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function DeviceIcon({ type }: { type: SessionDeviceType }) {
  switch (type) {
    case "DESKTOP":
      return <Monitor size={19} />;
    case "MOBILE":
      return <Smartphone size={19} />;
    case "TABLET":
      return <Tablet size={19} />;
    default:
      return <Laptop size={19} />;
  }
}

function MetricCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e9e5dd] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#77736c]">{label}</p>
        <span className="text-[#9b8358]">{icon}</span>
      </div>

      <p className="mt-3 text-3xl font-semibold text-[#292821]">
        {value.toLocaleString("en-IN")}
      </p>

      <p className="mt-1 text-xs text-[#918c83]">{description}</p>
    </div>
  );
}

export default function AdminSessionManagementCenter({
  sessions,
  currentUserId,
  loading = false,
  error,
  onRefresh,
  onViewDetails,
  onRequestRevocation,
}: AdminSessionManagementCenterProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<SessionFilter>("ALL");

  const metrics = useMemo(
    () => ({
      total: sessions.length,
      active: sessions.filter(
        (session) => session.status === "ACTIVE"
      ).length,
      suspicious: sessions.filter(
        (session) => session.status === "SUSPICIOUS"
      ).length,
      reauthentication: sessions.filter(
        (session) =>
          session.status === "REAUTHENTICATION_REQUIRED"
      ).length,
      revoked: sessions.filter(
        (session) => session.status === "REVOKED"
      ).length,
    }),
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesStatus =
        activeFilter === "ALL" ||
        session.status === activeFilter;

      const searchable = [
        session.id,
        session.userName,
        session.userEmail,
        session.deviceName,
        session.browserName ?? "",
        session.operatingSystem ?? "",
        session.locationLabel ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!query || searchable.includes(query))
      );
    });
  }, [sessions, search, activeFilter]);

  function canRequestRevocation(session: AdminUserSession) {
    return (
      session.status === "ACTIVE" &&
      !session.isCurrentSession &&
      session.userId !== currentUserId
    );
  }

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <ShieldCheck size={15} />
            Security operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Session Management Center
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Monitor authenticated sessions, review device activity, and
            request controlled session revocation.
          </p>
        </div>

        </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total sessions"
          value={metrics.total}
          description="Records in supplied dataset"
          icon={<Laptop size={19} />}
        />
        <MetricCard
          label="Active sessions"
          value={metrics.active}
          description="Currently marked active"
          icon={<ShieldCheck size={19} />}
        />
        <MetricCard
          label="Suspicious"
          value={metrics.suspicious}
          description="Flagged for investigation"
          icon={<AlertCircle size={19} />}
        />
        <MetricCard
          label="Reauthentication"
          value={metrics.reauthentication}
          description="Require renewed authentication"
          icon={<RefreshCw size={19} />}
        />
        <MetricCard
          label="Revoked"
          value={metrics.revoked}
          description="Marked as revoked"
          icon={<LogOut size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                User sessions
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredSessions.length} matching sessions
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search user, device, location..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={15} className="mr-1 text-[#918c83]" />

            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeFilter === filter
                    ? "bg-[#292821] text-white"
                    : "border border-[#e8e3da] text-[#77736c] hover:bg-[#f7f5f0]"
                }`}
              >
                {filter === "ALL"
                  ? "All sessions"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading user sessions...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <Monitor
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No sessions found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Device</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Last activity</th>
                  <th className="px-5 py-3 font-medium">Expires</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredSessions.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-[#fcfbf9]"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#34322c]">
                        {session.userName}
                      </p>
                      <p className="mt-1 text-xs text-[#918c83]">
                        {session.userEmail}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#aaa397]">
                        {session.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[#9b8359]">
                          <DeviceIcon type={session.deviceType} />
                        </span>
                        <div>
                          <p className="text-sm text-[#34322c]">
                            {session.deviceName}
                          </p>
                          <p className="mt-1 text-xs text-[#918c83]">
                            {[
                              session.browserName,
                              session.operatingSystem,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Device details unavailable"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-[#77736c]">
                        <Globe size={14} />
                        {session.locationLabel || "Not available"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {formatDate(session.lastActivityAt)}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {formatDate(session.expiresAt)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={session.status} />
                      {session.isCurrentSession && (
                        <p className="mt-1 text-xs text-[#9b8359]">
                          Current session
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails?.(session)}
                          disabled={!onViewDetails}
                          title="View session details"
                          className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onRequestRevocation?.(session.id)
                          }
                          disabled={
                            !canRequestRevocation(session) ||
                            !onRequestRevocation
                          }
                          title="Request session revocation"
                          className="rounded-lg border border-[#e8e3da] p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <LogOut size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#e9e5dd] bg-[#faf9f6] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Session security requirements
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Session revocation must invalidate the server-side session,
                not merely remove a browser-side record.
              </li>
              <li>
                • Use secure, HttpOnly, appropriately configured session
                cookies where applicable.
              </li>
              <li>
                • Apply idle and absolute session expiry policies on the
                server.
              </li>
              <li>
                • Record session creation, renewal, expiry, and revocation
                events in security logs.
              </li>
              <li>
                • Restrict access to device and location information because
                it can contain personal data.
              </li>
              <li>
                • Do not treat approximate geolocation as proof of a user&apos;s
                identity or physical location.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
