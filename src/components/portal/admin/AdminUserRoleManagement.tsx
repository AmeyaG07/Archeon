
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Search,
  RefreshCw,
  UserPlus,
  Users,
  ShieldCheck,
  ShieldAlert,
  UserRound,
  LockKeyhole,
  MoreHorizontal,
  X,
  CheckCircle2,
  AlertCircle,
  Clock3,
  History,
  ChevronDown,
} from "lucide-react";

export type AdminUserRole =
  | "Studio Admin"
  | "Project Manager"
  | "Accounts / Finance"
  | "Architect"
  | "Designer"
  | "Operations";

export type AdminUserStatus =
  | "Active"
  | "Invited"
  | "Suspended"
  | "Deactivated";

export interface AdminManagedUser {
  id: string;
  userReference: string;
  fullName: string;
  email: string;
  phone?: string;

  role: AdminUserRole;
  status: AdminUserStatus;

  department?: string;
  assignedProjectsCount: number;

  invitedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;

  mfaEnabled: boolean;
  permissions: string[];
}

export interface AdminUserRoleManagementProps {
  users: AdminManagedUser[];

  loading?: boolean;
  error?: string;

  totalRecords: number;
  currentPage: number;
  totalPages: number;

  canCreateUsers?: boolean;
  canChangeRoles?: boolean;
  canManageAccounts?: boolean;

  onRefresh?: () => void;
  onPageChange: (page: number) => void;

  onCreateUser?: () => void;

  onUpdateRole?: (
    userId: string,
    role: AdminUserRole,
    reason: string
  ) => Promise<void>;

  onUpdateStatus?: (
    userId: string,
    status: AdminUserStatus,
    reason: string
  ) => Promise<void>;

  onResendInvitation?: (userId: string) => Promise<void>;

  onOpenUser?: (userId: string) => void;
  onOpenAccessHistory?: (userId: string) => void;
}

const ROLES: AdminUserRole[] = [
  "Studio Admin",
  "Project Manager",
  "Accounts / Finance",
  "Architect",
  "Designer",
  "Operations",
];

const STATUSES: AdminUserStatus[] = [
  "Active",
  "Invited",
  "Suspended",
  "Deactivated",
];

type UserFilters = {
  search: string;
  role: string;
  status: string;
  department: string;
};

const INITIAL_FILTERS: UserFilters = {
  search: "",
  role: "All",
  status: "All",
  department: "All",
};

function statusStyle(status: AdminUserStatus) {
  switch (status) {
    case "Active":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "Invited":
      return "bg-[#F4EFE2] text-[#94743F]";
    case "Suspended":
      return "bg-[#F8EAE7] text-[#9A5147]";
    case "Deactivated":
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AdminUserRoleManagement({
  users,
  loading = false,
  error,
  totalRecords,
  currentPage,
  totalPages,
  canCreateUsers = false,
  canChangeRoles = false,
  canManageAccounts = false,
  onRefresh,
  onPageChange,
  onCreateUser,
  onUpdateRole,
  onUpdateStatus,
  onResendInvitation,
  onOpenUser,
  onOpenAccessHistory,
}: AdminUserRoleManagementProps) {
  const [filters, setFilters] =
    useState<UserFilters>(INITIAL_FILTERS);

  const [selectedUser, setSelectedUser] =
    useState<AdminManagedUser | null>(null);

  const [actionMenuUserId, setActionMenuUserId] =
    useState<string | null>(null);

  const [roleDraft, setRoleDraft] =
    useState<AdminUserRole | "">("");

  const [actionReason, setActionReason] = useState("");
  const [pendingAction, setPendingAction] = useState<
    | { type: "role"; userId: string; role: AdminUserRole }
    | { type: "status"; userId: string; status: AdminUserStatus }
    | { type: "resend"; userId: string }
    | null
  >(null);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        users
          .map((user) => user.department)
          .filter((department): department is string =>
            Boolean(department)
          )
      )
    ).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [
          user.fullName,
          user.email,
          user.userReference,
          user.role,
          user.department ?? "",
        ].some((value) =>
          value.toLowerCase().includes(query)
        );

      const matchesRole =
        filters.role === "All" || user.role === filters.role;

      const matchesStatus =
        filters.status === "All" ||
        user.status === filters.status;

      const matchesDepartment =
        filters.department === "All" ||
        user.department === filters.department;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesDepartment
      );
    });
  }, [users, filters]);

  const activeCount = users.filter(
    (user) => user.status === "Active"
  ).length;

  const invitedCount = users.filter(
    (user) => user.status === "Invited"
  ).length;

  const suspendedCount = users.filter(
    (user) => user.status === "Suspended"
  ).length;

  function clearFilters() {
    setFilters(INITIAL_FILTERS);
  }

  function openUser(user: AdminManagedUser) {
    setSelectedUser(user);
    setRoleDraft(user.role);
    setActionReason("");
    setActionError("");
    setActionMenuUserId(null);
  }

  async function executeAction() {
    if (!pendingAction) return;

    if (
      pendingAction.type !== "resend" &&
      actionReason.trim().length < 10
    ) {
      setActionError(
        "Provide a reason with at least 10 characters."
      );
      return;
    }

    setBusy(true);
    setActionError("");

    try {
      if (pendingAction.type === "role") {
        if (!onUpdateRole) return;

        await onUpdateRole(
          pendingAction.userId,
          pendingAction.role,
          actionReason.trim()
        );
      }

      if (pendingAction.type === "status") {
        if (!onUpdateStatus) return;

        await onUpdateStatus(
          pendingAction.userId,
          pendingAction.status,
          actionReason.trim()
        );
      }

      if (pendingAction.type === "resend") {
        if (!onResendInvitation) return;

        await onResendInvitation(pendingAction.userId);
      }

      setPendingAction(null);
      setActionReason("");
      setSelectedUser(null);
    } catch {
      setActionError(
        "The action could not be completed. Refresh the user record and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  function requestStatusChange(
    user: AdminManagedUser,
    status: AdminUserStatus
  ) {
    setPendingAction({
      type: "status",
      userId: user.id,
      status,
    });

    setActionReason("");
    setActionError("");
    setActionMenuUserId(null);
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

      {/* Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Access Control
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            User & Role Management
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Manage internal accounts, assigned roles, account
            status and administrative access.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#55514A] disabled:opacity-40"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          )}

          {canCreateUsers && onCreateUser && (
            <button
              type="button"
              onClick={onCreateUser}
              className="inline-flex items-center gap-2 bg-[#171717] px-5 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64]"
            >
              <UserPlus size={14} />
              Create User
            </button>
          )}
        </div>
      </header>

      {error && (
        <Feedback type="error">{error}</Feedback>
      )}

      {actionError && !pendingAction && (
        <Feedback type="error">{actionError}</Feedback>
      )}

      {/* Summary */}
      <section className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Users"
          value={totalRecords}
          icon={<Users size={18} />}
        />

        <SummaryCard
          label="Active Accounts"
          value={activeCount}
          icon={<CheckCircle2 size={18} />}
        />

        <SummaryCard
          label="Invitations Pending"
          value={invitedCount}
          icon={<Clock3 size={18} />}
        />

        <SummaryCard
          label="Suspended Accounts"
          value={suspendedCount}
          icon={<ShieldAlert size={18} />}
        />
      </section>

      {/* Access Notice */}
      <div className="mt-7 flex items-start gap-3 border border-[#D8D6D0] bg-white p-5">
        <ShieldCheck
          size={18}
          className="mt-0.5 shrink-0 text-[#A58A64]"
        />

        <p className="text-xs leading-6 text-[#77736C]">
          Role assignment is not a substitute for permission
          enforcement. Every protected backend operation must
          verify the authenticated user&apos;s permissions independently.
        </p>
      </div>

      {/* Search and Filters */}
      <section className="mt-9">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_190px_190px]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
            />

            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search name, email or user reference..."
              aria-label="Search users"
              className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-xs outline-none focus:border-[#A58A64]"
            />
          </div>

          <FilterSelect
            label="Role"
            value={filters.role}
            options={["All", ...ROLES]}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                role: value,
              }))
            }
          />

          <FilterSelect
            label="Status"
            value={filters.status}
            options={["All", ...STATUSES]}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                status: value,
              }))
            }
          />

          <FilterSelect
            label="Department"
            value={filters.department}
            options={["All", ...departments]}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                department: value,
              }))
            }
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[10px] text-[#77736C]">
            {filteredUsers.length.toLocaleString("en-IN")} users shown
            {" · "}
            {totalRecords.toLocaleString("en-IN")} total records
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="text-[9px] uppercase tracking-widest text-[#987543]"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* User Directory */}
      <section className="mt-7">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center border border-[#D8D6D0] bg-white">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              Loading user directory...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="border border-[#D8D6D0] bg-white p-12 text-center">
            <Users
              size={28}
              className="mx-auto text-[#A58A64]"
            />

            <h2 className="mt-4 font-serif text-xl text-[#171717]">
              No users found
            </h2>

            <p className="mt-2 text-xs text-[#77736C]">
              Try changing the search terms or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#D8D6D0] bg-white">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr className="border-b border-[#E5E2DC] bg-[#FAF9F6]">
                  {[
                    "User",
                    "Role",
                    "Department",
                    "Projects",
                    "MFA",
                    "Last Login",
                    "Status",
                    "",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 font-mono text-[8px] uppercase tracking-widest text-[#99958D]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#EAE7E0] last:border-0 hover:bg-[#FAF9F6]"
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openUser(user)}
                        className="text-left"
                      >
                        <p className="text-xs text-[#171717]">
                          {user.fullName}
                        </p>

                        <p className="mt-1 text-[9px] text-[#99958D]">
                          {user.email}
                        </p>

                        <p className="mt-1 font-mono text-[8px] text-[#A58A64]">
                          {user.userReference}
                        </p>
                      </button>
                    </td>

                    <td className="px-5 py-4 text-xs text-[#55514A]">
                      {user.role}
                    </td>

                    <td className="px-5 py-4 text-xs text-[#77736C]">
                      {user.department ?? "—"}
                    </td>

                    <td className="px-5 py-4 text-xs tabular-nums text-[#55514A]">
                      {user.assignedProjectsCount}
                    </td>

                    <td className="px-5 py-4">
                      {user.mfaEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[9px] text-[#547A51]">
                          <ShieldCheck size={13} />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] text-[#9A5147]">
                          <ShieldAlert size={13} />
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-[10px] text-[#77736C]">
                      {formatDate(user.lastLoginAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-3 py-2 text-[8px] uppercase tracking-widest ${statusStyle(user.status)}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="relative px-5 py-4">
                      <button
                        type="button"
                        aria-label={`Actions for ${user.fullName}`}
                        aria-expanded={actionMenuUserId === user.id}
                        onClick={() =>
                          setActionMenuUserId((current) =>
                            current === user.id ? null : user.id
                          )
                        }
                        className="border border-[#E5E2DC] p-2 text-[#77736C]"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {actionMenuUserId === user.id && (
                        <div className="absolute right-5 top-14 z-20 w-48 border border-[#D8D6D0] bg-white p-2 shadow-xl">
                          <MenuAction
                            label="View User"
                            onClick={() => openUser(user)}
                          />

                          {onOpenAccessHistory && (
                            <MenuAction
                              label="Access History"
                              onClick={() => {
                                onOpenAccessHistory(user.id);
                                setActionMenuUserId(null);
                              }}
                            />
                          )}

                          {user.status === "Invited" &&
                            onResendInvitation && (
                              <MenuAction
                                label="Resend Invitation"
                                onClick={() => {
                                  setPendingAction({
                                    type: "resend",
                                    userId: user.id,
                                  });
                                  setActionMenuUserId(null);
                                }}
                              />
                            )}

                          {canManageAccounts &&
                            user.status === "Active" && (
                              <MenuAction
                                label="Suspend Account"
                                danger
                                onClick={() =>
                                  requestStatusChange(
                                    user,
                                    "Suspended"
                                  )
                                }
                              />
                            )}

                          {canManageAccounts &&
                            user.status === "Suspended" && (
                              <MenuAction
                                label="Reactivate Account"
                                onClick={() =>
                                  requestStatusChange(
                                    user,
                                    "Active"
                                  )
                                }
                              />
                            )}

                          {canManageAccounts &&
                            user.status !== "Deactivated" && (
                              <MenuAction
                                label="Deactivate Account"
                                danger
                                onClick={() =>
                                  requestStatusChange(
                                    user,
                                    "Deactivated"
                                  )
                                }
                              />
                            )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[10px] text-[#77736C]">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="border border-[#D8D6D0] bg-white px-4 py-2 text-[9px] uppercase tracking-widest disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="border border-[#171717] bg-[#171717] px-4 py-2 text-[9px] uppercase tracking-widest text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Detail Drawer */}
      {selectedUser && (
        <UserDetailDrawer
          user={selectedUser}
          editableRole={canChangeRoles}
          editableStatus={canManageAccounts}
          roleDraft={roleDraft}
          setRoleDraft={setRoleDraft}
          actionReason={actionReason}
          setActionReason={setActionReason}
          onClose={() => setSelectedUser(null)}
          onSaveRole={() => {
            if (!roleDraft || roleDraft === selectedUser.role) return;

            setPendingAction({
              type: "role",
              userId: selectedUser.id,
              role: roleDraft,
            });
            setActionError("");
          }}
          onStatusChange={(status) =>
            requestStatusChange(selectedUser, status)
          }
          onOpenHistory={() =>
            onOpenAccessHistory?.(selectedUser.id)
          }
          onOpenUser={() => onOpenUser?.(selectedUser.id)}
        />
      )}

      {/* Action Confirmation */}
      {pendingAction && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-action-title"
            className="w-full max-w-lg border border-[#D8D6D0] bg-[#F7F5F0] p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert
                size={20}
                className="text-[#A58A64]"
              />

              <h2
                id="user-action-title"
                className="font-serif text-2xl text-[#171717]"
              >
                Confirm User Action
              </h2>
            </div>

            <p className="mt-4 text-xs leading-7 text-[#77736C]">
              {pendingAction.type === "role" &&
                `Change this user's role to ${pendingAction.role}?`}

              {pendingAction.type === "status" &&
                `Change this account status to ${pendingAction.status}?`}

              {pendingAction.type === "resend" &&
                "Request a new invitation message for this user?"}
            </p>

            {pendingAction.type !== "resend" && (
              <label className="mt-5 block">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                  Reason for action
                </span>

                <textarea
                  value={actionReason}
                  onChange={(event) =>
                    setActionReason(event.target.value)
                  }
                  rows={3}
                  maxLength={1000}
                  className="mt-3 w-full border border-[#D8D6D0] bg-white p-4 text-xs outline-none focus:border-[#A58A64]"
                  placeholder="Explain why this change is required..."
                />
              </label>
            )}

            {actionError && (
              <p className="mt-4 text-xs text-[#9A5147]">
                {actionError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setPendingAction(null);
                  setActionError("");
                }}
                className="border border-[#D8D6D0] bg-white px-5 py-3 text-[9px] uppercase tracking-widest text-[#55514A]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={executeAction}
                className="bg-[#171717] px-5 py-3 text-[9px] uppercase tracking-widest text-white disabled:opacity-40"
              >
                {busy ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="border border-[#D8D6D0] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-5 font-serif text-3xl text-[#171717]">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <span className="mb-2 block font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none border border-[#D8D6D0] bg-white px-4 pr-9 text-xs text-[#55514A] outline-none focus:border-[#A58A64]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <ChevronDown
        size={13}
        className="pointer-events-none absolute bottom-4 right-3 text-[#99958D]"
      />
    </label>
  );
}

function MenuAction({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2.5 text-left text-[10px] hover:bg-[#F7F5F0] ${
        danger ? "text-[#9A5147]" : "text-[#55514A]"
      }`}
    >
      {label}
    </button>
  );
}

function UserDetailDrawer({
  user,
  editableRole,
  editableStatus,
  roleDraft,
  setRoleDraft,
  actionReason,
  setActionReason,
  onClose,
  onSaveRole,
  onStatusChange,
  onOpenHistory,
  onOpenUser,
}: {
  user: AdminManagedUser;
  editableRole: boolean;
  editableStatus: boolean;
  roleDraft: AdminUserRole | "";
  setRoleDraft: (role: AdminUserRole) => void;
  actionReason: string;
  setActionReason: (reason: string) => void;
  onClose: () => void;
  onSaveRole: () => void;
  onStatusChange: (status: AdminUserStatus) => void;
  onOpenHistory: () => void;
  onOpenUser: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40">
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        className="h-full w-full max-w-xl overflow-y-auto bg-[#F7F5F0] shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D8D6D0] bg-[#F7F5F0] px-6 py-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              User Account
            </p>

            <h2
              id="user-detail-title"
              className="mt-2 font-serif text-2xl text-[#171717]"
            >
              User Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close user details"
            className="border border-[#D8D6D0] bg-white p-2"
          >
            <X size={17} />
          </button>
        </header>

        <div className="space-y-7 p-6">
          <section className="border border-[#D8D6D0] bg-white p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center bg-[#EAE7E0] text-[#A58A64]">
                <UserRound size={21} />
              </div>

              <div className="min-w-0">
                <h3 className="break-words font-serif text-xl text-[#171717]">
                  {user.fullName}
                </h3>

                <p className="mt-1 break-all text-[10px] text-[#77736C]">
                  {user.email}
                </p>

                <p className="mt-2 font-mono text-[8px] uppercase tracking-widest text-[#A58A64]">
                  {user.userReference}
                </p>
              </div>
            </div>

            <span
              className={`mt-5 inline-block px-3 py-2 text-[8px] uppercase tracking-widest ${statusStyle(user.status)}`}
            >
              {user.status}
            </span>
          </section>

          <DetailGroup title="Account Information">
            <DetailRow label="User ID" value={user.id} />
            <DetailRow label="Role" value={user.role} />
            <DetailRow
              label="Department"
              value={user.department ?? "Not assigned"}
            />
            <DetailRow
              label="Phone"
              value={user.phone ?? "Not provided"}
            />
            <DetailRow
              label="Assigned Projects"
              value={String(user.assignedProjectsCount)}
            />
            <DetailRow
              label="Created"
              value={formatDate(user.createdAt)}
            />
            <DetailRow
              label="Last Updated"
              value={formatDate(user.updatedAt)}
            />
            <DetailRow
              label="Last Login"
              value={formatDate(user.lastLoginAt)}
            />
            <DetailRow
              label="Invitation Sent"
              value={formatDate(user.invitedAt)}
            />
            <DetailRow
              label="Multi-factor Authentication"
              value={user.mfaEnabled ? "Enabled" : "Not enabled"}
            />
          </DetailGroup>

          <DetailGroup title="Assigned Permissions">
            {user.permissions.length === 0 ? (
              <p className="text-xs text-[#77736C]">
                No permission details supplied.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="border border-[#D8D6D0] bg-[#FAF9F6] px-3 py-2 text-[9px] text-[#55514A]"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            )}
          </DetailGroup>

          {editableRole && (
            <DetailGroup title="Role Assignment">
              <label className="block">
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                  New Role
                </span>

                <select
                  value={roleDraft}
                  onChange={(event) =>
                    setRoleDraft(event.target.value as AdminUserRole)
                  }
                  className="mt-2 h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs text-[#33312D] outline-none focus:border-[#A58A64]"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block">
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                  Reason
                </span>

                <textarea
                  value={actionReason}
                  onChange={(event) =>
                    setActionReason(event.target.value)
                  }
                  rows={2}
                  maxLength={1000}
                  className="mt-2 w-full border border-[#D8D6D0] bg-white p-3 text-xs outline-none focus:border-[#A58A64]"
                  placeholder="Reason for role change..."
                />
              </label>

              <button
                type="button"
                onClick={onSaveRole}
                disabled={
                  !roleDraft ||
                  roleDraft === user.role ||
                  actionReason.trim().length < 10
                }
                className="mt-4 bg-[#171717] px-5 py-3 text-[9px] uppercase tracking-widest text-white disabled:opacity-40"
              >
                Request Role Change
              </button>
            </DetailGroup>
          )}

          {editableStatus && (
            <DetailGroup title="Account Status">
              <div className="flex flex-wrap gap-2">
                {user.status === "Active" && (
                  <ActionButton
                    danger
                    onClick={() => onStatusChange("Suspended")}
                  >
                    Suspend Account
                  </ActionButton>
                )}

                {user.status === "Suspended" && (
                  <ActionButton
                    onClick={() => onStatusChange("Active")}
                  >
                    Reactivate Account
                  </ActionButton>
                )}

                {user.status !== "Deactivated" && (
                  <ActionButton
                    danger
                    onClick={() => onStatusChange("Deactivated")}
                  >
                    Deactivate Account
                  </ActionButton>
                )}
              </div>
            </DetailGroup>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-4 py-3 text-[9px] uppercase tracking-widest text-[#55514A]"
            >
              <History size={13} />
              Access History
            </button>

            <button
              type="button"
              onClick={onOpenUser}
              className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-4 py-3 text-[9px] uppercase tracking-widest text-[#55514A]"
            >
              Open Full Record
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DetailGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
        {title}
      </h3>

      <div className="border border-[#D8D6D0] bg-white p-5">
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-2 border-b border-[#EAE7E0] py-3 last:border-0 sm:flex-row">
      <span className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
        {label}
      </span>

      <span className="break-all text-xs text-[#33312D] sm:max-w-[65%] sm:text-right">
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-3 text-[9px] uppercase tracking-widest ${
        danger
          ? "border-[#E3C9C5] bg-[#FAF3F1] text-[#9A5147]"
          : "border-[#D8D6D0] bg-white text-[#55514A]"
      }`}
    >
      {children}
    </button>
  );
}

function Feedback({
  children,
  type,
}: {
  children: ReactNode;
  type: "error" | "success";
}) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`mt-6 flex items-start gap-3 border p-4 ${
        type === "error"
          ? "border-[#E3C9C5] bg-[#FAF3F1] text-[#9A5147]"
          : "border-[#D2DFCE] bg-[#F0F5EE] text-[#547A51]"
      }`}
    >
      {type === "error" ? (
        <AlertCircle size={17} />
      ) : (
        <CheckCircle2 size={17} />
      )}

      <p className="text-xs leading-6">{children}</p>
    </div>
  );
}
