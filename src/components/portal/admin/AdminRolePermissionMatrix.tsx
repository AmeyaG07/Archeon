
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  LockKeyhole,
  Search,
  RefreshCw,
  Save,
  X,
  Info,
  Check,
  Minus,
  Users,
  ChevronRight,
  AlertCircle,
  History,
} from "lucide-react";

export interface AdminPermission {
  key: string;
  label: string;
  description: string;
  category: string;
  protected?: boolean;
}

export interface AdminRoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
  assignedUserCount: number;
  permissions: string[];
  updatedAt: string;
  updatedBy: string;
}

export interface AdminRolePermissionMatrixProps {
  roles: AdminRoleDefinition[];
  permissions: AdminPermission[];

  loading?: boolean;
  saving?: boolean;
  error?: string;

  canManageRoles?: boolean;

  onRefresh?: () => void;

  onSavePermissions: (
    roleId: string,
    permissionKeys: string[],
    reason: string,
    expectedUpdatedAt: string
  ) => Promise<void>;

  onOpenRoleUsers?: (roleId: string) => void;
  onOpenRoleHistory?: (roleId: string) => void;
}

interface PermissionDraft {
  roleId: string;
  permissionKeys: Set<string>;
  reason: string;
}

function categoryPermissions(
  permissions: AdminPermission[]
) {
  const groups = new Map<string, AdminPermission[]>();

  permissions.forEach((permission) => {
    const existing = groups.get(permission.category) ?? [];
    existing.push(permission);
    groups.set(permission.category, existing);
  });

  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

export function AdminRolePermissionMatrix({
  roles,
  permissions,
  loading = false,
  saving = false,
  error,
  canManageRoles = false,
  onRefresh,
  onSavePermissions,
  onOpenRoleUsers,
  onOpenRoleHistory,
}: AdminRolePermissionMatrixProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(
    roles[0]?.id ?? ""
  );

  const [draft, setDraft] = useState<PermissionDraft | null>(null);
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] =
    useState<Set<string>>(new Set());

  const [validationError, setValidationError] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const selectedRole = roles.find(
    (role) => role.id === selectedRoleId
  );

  const activePermissionKeys =
    draft?.roleId === selectedRoleId
      ? draft.permissionKeys
      : new Set(selectedRole?.permissions ?? []);

  const groupedPermissions = useMemo(
    () => categoryPermissions(permissions),
    [permissions]
  );

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return groupedPermissions;

    return groupedPermissions
      .map((group) => ({
        ...group,
        items: group.items.filter((permission) =>
          [
            permission.key,
            permission.label,
            permission.description,
            permission.category,
          ].some((value) =>
            value.toLowerCase().includes(query)
          )
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groupedPermissions, search]);

  const hasChanges =
    Boolean(draft) &&
    draft?.roleId === selectedRoleId &&
    selectedRole !== undefined &&
    (
      draft.permissionKeys.size !== selectedRole.permissions.length ||
      selectedRole.permissions.some(
        (key) => !draft.permissionKeys.has(key)
      )
    );

  const editable =
    canManageRoles &&
    Boolean(selectedRole) &&
    Boolean(selectedRole?.isActive);

  function startEditing() {
    if (!selectedRole || !editable) return;

    setDraft({
      roleId: selectedRole.id,
      permissionKeys: new Set(selectedRole.permissions),
      reason: "",
    });

    setValidationError("");
    setActionError("");
  }

  function cancelEditing() {
    setDraft(null);
    setValidationError("");
    setActionError("");
    setConfirmationOpen(false);
  }

  function togglePermission(permission: AdminPermission) {
    if (!editable || !draft || draft.roleId !== selectedRoleId) {
      return;
    }

    if (permission.protected) return;

    setDraft((current) => {
      if (!current) return current;

      const next = new Set(current.permissionKeys);

      if (next.has(permission.key)) {
        next.delete(permission.key);
      } else {
        next.add(permission.key);
      }

      return {
        ...current,
        permissionKeys: next,
      };
    });

    setValidationError("");
  }

  function toggleCategory(category: string) {
    setExpandedCategories((current) => {
      const next = new Set(current);

      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }

      return next;
    });
  }

  function validateChanges() {
    if (!selectedRole || !draft) {
      return "No role changes are available.";
    }

    if (!canManageRoles) {
      return "You do not have permission to manage roles.";
    }

    if (!selectedRole.isActive) {
      return "Inactive roles cannot be modified.";
    }

    if (draft.roleId !== selectedRole.id) {
      return "The selected role changed. Refresh and try again.";
    }

    if (draft.reason.trim().length < 10) {
      return "Provide a reason with at least 10 characters.";
    }

    const protectedPermissions = permissions.filter(
      (permission) => permission.protected
    );

    for (const permission of protectedPermissions) {
      if (
        selectedRole.permissions.includes(permission.key) &&
        !draft.permissionKeys.has(permission.key)
      ) {
        return `The protected permission "${permission.label}" cannot be removed here.`;
      }
    }

    const knownKeys = new Set(
      permissions.map((permission) => permission.key)
    );

    for (const key of draft.permissionKeys) {
      if (!knownKeys.has(key)) {
        return `Unknown permission detected: ${key}`;
      }
    }

    return "";
  }

  function requestSave() {
    const validation = validateChanges();

    if (validation) {
      setValidationError(validation);
      return;
    }

    if (!hasChanges) {
      setValidationError("No permission changes have been made.");
      return;
    }

    setConfirmationOpen(true);
  }

  async function confirmSave() {
    if (!selectedRole || !draft) return;

    const validation = validateChanges();

    if (validation) {
      setValidationError(validation);
      setConfirmationOpen(false);
      return;
    }

    setActionError("");
    setValidationError("");

    try {
      await onSavePermissions(
        selectedRole.id,
        Array.from(draft.permissionKeys).sort(),
        draft.reason.trim(),
        selectedRole.updatedAt
      );

      setDraft(null);
      setConfirmationOpen(false);
    } catch {
      setActionError(
        "Permission changes were not confirmed. Refresh the role before trying again."
      );
    }
  }

  if (loading && roles.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center bg-[#F2F0EB]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
          Loading role definitions...
        </p>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F0EB] p-6">
        <div className="max-w-lg border border-[#D8D6D0] bg-white p-10 text-center">
          <ShieldAlert
            size={30}
            className="mx-auto text-[#A58A64]"
          />
          <h1 className="mt-5 font-serif text-3xl text-[#171717]">
            No role definitions
          </h1>
          <p className="mt-3 text-xs leading-6 text-[#77736C]">
            Role definitions could not be loaded from the system.
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-6 bg-[#171717] px-5 py-3 text-[9px] uppercase tracking-widest text-white"
            >
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
            Administration / Access Governance
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Roles & Permissions
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Review role definitions and control which operations
            each role is authorised to perform.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#55514A] disabled:opacity-40"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        )}
      </header>

      {error && <Feedback type="error">{error}</Feedback>}
      {actionError && <Feedback type="error">{actionError}</Feedback>}
      {validationError && (
        <Feedback type="error">{validationError}</Feedback>
      )}

      {/* Security Notice */}
      <div className="mt-7 flex items-start gap-3 border border-[#D8D6D0] bg-white p-5">
        <LockKeyhole
          size={19}
          className="mt-0.5 shrink-0 text-[#A58A64]"
        />

        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            Permission Enforcement
          </p>

          <p className="mt-2 text-xs leading-6 text-[#77736C]">
            This matrix is an administrative interface only.
            Backend APIs must enforce role permissions on every
            protected request. Hiding a button or disabling a
            checkbox does not provide security.
          </p>
        </div>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-7 xl:grid-cols-[300px_minmax(0,1fr)]">

        {/* Role List */}
        <aside>
          <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                Role Directory
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[#171717]">
                Roles
              </h2>
            </div>

            <span className="font-mono text-[9px] text-[#99958D]">
              {roles.length}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {roles.map((role) => {
              const selected = role.id === selectedRoleId;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    if (draft && hasChanges) {
                      const confirmed = window.confirm(
                        "Discard unsaved permission changes?"
                      );
                      if (!confirmed) return;
                    }

                    setSelectedRoleId(role.id);
                    setDraft(null);
                    setValidationError("");
                    setActionError("");
                    setConfirmationOpen(false);
                  }}
                  className={`w-full border p-4 text-left transition-colors ${
                    selected
                      ? "border-[#A58A64] bg-white"
                      : "border-[#D8D6D0] bg-transparent hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-1 text-[#A58A64]">
                        <ShieldCheck size={17} />
                      </span>

                      <div className="min-w-0">
                        <p className="text-xs text-[#171717]">
                          {role.name}
                        </p>

                        <p className="mt-1 text-[9px] leading-5 text-[#99958D]">
                          {role.description}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      size={15}
                      className="shrink-0 text-[#A58A64]"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {role.isSystemRole && (
                      <span className="bg-[#F4EFE2] px-2 py-1 text-[8px] uppercase tracking-widest text-[#94743F]">
                        System Role
                      </span>
                    )}

                    <span
                      className={`px-2 py-1 text-[8px] uppercase tracking-widest ${
                        role.isActive
                          ? "bg-[#EAF1E8] text-[#547A51]"
                          : "bg-[#ECEAE5] text-[#77736C]"
                      }`}
                    >
                      {role.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#EAE7E0] pt-3">
                    <span className="text-[9px] text-[#99958D]">
                      {role.assignedUserCount} assigned users
                    </span>

                    <span className="text-[9px] text-[#77736C]">
                      {role.permissions.length} permissions
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Permission Matrix */}
        <section className="min-w-0 border border-[#D8D6D0] bg-white">
          {selectedRole && (
            <>
              <header className="flex flex-col justify-between gap-4 border-b border-[#E5E2DC] p-6 md:flex-row md:items-start">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                    Selected Role
                  </p>

                  <h2 className="mt-2 font-serif text-2xl text-[#171717]">
                    {selectedRole.name}
                  </h2>

                  <p className="mt-2 max-w-xl text-xs leading-6 text-[#77736C]">
                    {selectedRole.description}
                  </p>

                  <p className="mt-3 font-mono text-[8px] text-[#99958D]">
                    Updated {selectedRole.updatedAt}
                    {" · "}
                    By {selectedRole.updatedBy}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {onOpenRoleUsers && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenRoleUsers(selectedRole.id)
                      }
                      className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-4 py-3 text-[9px] uppercase tracking-widest text-[#55514A]"
                    >
                      <Users size={13} />
                      Assigned Users
                    </button>
                  )}

                  {onOpenRoleHistory && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenRoleHistory(selectedRole.id)
                      }
                      className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-4 py-3 text-[9px] uppercase tracking-widest text-[#55514A]"
                    >
                      <History size={13} />
                      History
                    </button>
                  )}
                </div>
              </header>

              {/* Role Summary */}
              <div className="grid grid-cols-2 gap-px border-b border-[#E5E2DC] bg-[#E5E2DC] md:grid-cols-3">
                <SummaryItem
                  label="Assigned Users"
                  value={selectedRole.assignedUserCount.toLocaleString("en-IN")}
                />
                <SummaryItem
                  label="Assigned Permissions"
                  value={activePermissionKeys.size.toLocaleString("en-IN")}
                />
                <SummaryItem
                  label="Role Type"
                  value={selectedRole.isSystemRole ? "System" : "Custom"}
                />
              </div>

              {/* Permission Controls */}
              <div className="p-5 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-serif text-xl text-[#171717]">
                      Permission Catalogue
                    </p>

                    <p className="mt-1 text-[10px] text-[#99958D]">
                      {activePermissionKeys.size} permissions assigned
                    </p>
                  </div>

                  {editable && !draft && (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="bg-[#171717] px-5 py-3 text-[9px] uppercase tracking-widest text-white"
                    >
                      Edit Permissions
                    </button>
                  )}
                </div>

                <div className="relative mt-5">
                  <Search
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search permissions..."
                    className="h-11 w-full border border-[#D8D6D0] bg-[#FAF9F6] pl-10 pr-4 text-xs outline-none focus:border-[#A58A64]"
                  />
                </div>

                <div className="mt-5 space-y-3">
                  {visibleGroups.map((group) => {
                    const expanded =
                      expandedCategories.has(group.category) ||
                      Boolean(search.trim());

                    const assignedCount = group.items.filter(
                      (permission) =>
                        activePermissionKeys.has(permission.key)
                    ).length;

                    return (
                      <div
                        key={group.category}
                        className="border border-[#D8D6D0]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleCategory(group.category)
                          }
                          aria-expanded={expanded}
                          className="flex w-full items-center justify-between gap-4 bg-[#FAF9F6] px-4 py-4 text-left"
                        >
                          <div>
                            <p className="text-xs text-[#33312D]">
                              {group.category}
                            </p>

                            <p className="mt-1 text-[9px] text-[#99958D]">
                              {assignedCount} of {group.items.length} assigned
                            </p>
                          </div>

                          <ChevronRight
                            size={15}
                            className={`text-[#A58A64] transition-transform ${
                              expanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        {expanded && (
                          <div className="divide-y divide-[#EAE7E0] px-4">
                            {group.items.map((permission) => {
                              const checked =
                                activePermissionKeys.has(permission.key);

                              return (
                                <div
                                  key={permission.key}
                                  className="flex items-start justify-between gap-4 py-4"
                                >
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-xs text-[#33312D]">
                                        {permission.label}
                                      </p>

                                      {permission.protected && (
                                        <span className="inline-flex items-center gap-1 bg-[#F4EFE2] px-2 py-1 text-[8px] uppercase tracking-widest text-[#94743F]">
                                          <LockKeyhole size={10} />
                                          Protected
                                        </span>
                                      )}
                                    </div>

                                    <p className="mt-1 text-[10px] leading-5 text-[#99958D]">
                                      {permission.description}
                                    </p>

                                    <p className="mt-2 font-mono text-[8px] text-[#AAA69E]">
                                      {permission.key}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={checked}
                                    aria-label={`${checked ? "Remove" : "Assign"} ${permission.label}`}
                                    disabled={
                                      !draft ||
                                      !editable ||
                                      Boolean(permission.protected)
                                    }
                                    onClick={() =>
                                      togglePermission(permission)
                                    }
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center border ${
                                      checked
                                        ? "border-[#A58A64] bg-[#A58A64] text-white"
                                        : "border-[#D8D6D0] bg-white text-[#77736C]"
                                    } disabled:cursor-not-allowed disabled:opacity-70`}
                                  >
                                    {checked ? (
                                      <Check size={14} />
                                    ) : (
                                      <Minus size={14} />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {visibleGroups.length === 0 && (
                    <p className="border border-[#D8D6D0] p-8 text-center text-xs text-[#77736C]">
                      No permissions match this search.
                    </p>
                  )}
                </div>

                {draft && (
                  <div className="mt-7 border-t border-[#E5E2DC] pt-6">
                    <label className="block">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                        Reason for Permission Changes
                      </span>

                      <textarea
                        value={draft.reason}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  reason: event.target.value,
                                }
                              : current
                          )
                        }
                        rows={3}
                        maxLength={1000}
                        placeholder="Explain why this role requires these permission changes..."
                        className="mt-3 w-full border border-[#D8D6D0] bg-white p-4 text-xs leading-6 text-[#33312D] outline-none focus:border-[#A58A64]"
                      />
                    </label>

                    <div className="mt-5 flex flex-wrap justify-between gap-3">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                        className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[9px] uppercase tracking-widest text-[#55514A]"
                      >
                        <X size={13} />
                        Discard
                      </button>

                      <button
                        type="button"
                        onClick={requestSave}
                        disabled={saving || !hasChanges}
                        className="inline-flex items-center gap-2 bg-[#171717] px-5 py-3 text-[9px] uppercase tracking-widest text-white disabled:opacity-40"
                      >
                        <Save size={13} />
                        Review Changes
                      </button>
                    </div>
                  </div>
                )}

                {!canManageRoles && (
                  <div className="mt-6 flex items-start gap-3 border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                    <LockKeyhole
                      size={16}
                      className="mt-0.5 shrink-0 text-[#A58A64]"
                    />

                    <p className="text-[10px] leading-6 text-[#77736C]">
                      You have read-only access to role definitions.
                      Contact an authorised administrator for permission changes.
                    </p>
                  </div>
                )}

                {selectedRole && !selectedRole.isActive && (
                  <div className="mt-6 flex items-start gap-3 border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0 text-[#A58A64]"
                    />

                    <p className="text-[10px] leading-6 text-[#77736C]">
                      This role is inactive. Permission editing is disabled.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Confirmation */}
      {confirmationOpen && selectedRole && draft && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="permission-confirm-title"
            className="w-full max-w-lg border border-[#D8D6D0] bg-[#F7F5F0] p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert
                size={21}
                className="text-[#A58A64]"
              />

              <h2
                id="permission-confirm-title"
                className="font-serif text-2xl text-[#171717]"
              >
                Confirm Permission Changes
              </h2>
            </div>

            <p className="mt-4 text-xs leading-7 text-[#77736C]">
              You are changing permissions for the role{" "}
              <strong>{selectedRole.name}</strong>.
              These changes may affect every user assigned to this role.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="border border-[#D8D6D0] bg-white p-4">
                <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                  Current
                </p>

                <p className="mt-2 font-serif text-2xl text-[#171717]">
                  {selectedRole.permissions.length}
                </p>
              </div>

              <div className="border border-[#D8D6D0] bg-white p-4">
                <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                  Proposed
                </p>

                <p className="mt-2 font-serif text-2xl text-[#171717]">
                  {draft.permissionKeys.size}
                </p>
              </div>
            </div>

            <div className="mt-5 border border-[#D8D6D0] bg-white p-4">
              <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                Reason
              </p>

              <p className="mt-2 text-xs leading-6 text-[#33312D]">
                {draft.reason}
              </p>
            </div>

            <p className="mt-4 text-[10px] leading-6 text-[#77736C]">
              The server must recheck your authority, validate the
              role version and record this change in the audit log.
            </p>

            {validationError && (
              <p className="mt-3 text-xs text-[#9A5147]">
                {validationError}
              </p>
            )}

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
                onClick={confirmSave}
                disabled={saving}
                className="bg-[#171717] px-5 py-3 text-[9px] uppercase tracking-widest text-white disabled:opacity-40"
              >
                {saving ? "Saving..." : "Confirm Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#FAF9F6] p-4">
      <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-2 font-serif text-xl text-[#171717]">
        {value}
      </p>
    </div>
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
        <Check size={17} />
      )}

      <p className="text-xs leading-6">{children}</p>
    </div>
  );
}
