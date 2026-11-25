"use client";

import React, { useMemo, useState } from "react";
import {
  UserPlus,
  Pencil,
  Search,
  ShieldCheck,
  Users,
  UserCheck,
  KeyRound,
  Mail,
  Phone,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Ban,
} from "lucide-react";

export interface TeamMemberRecord {
  id: number;
  username: string;
  role: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  enabled: boolean;
  lastLoginAt?: string | null;
}

export interface CreateTeamProfilePayload {
  username: string;
  password: string;
  role: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: "ACTIVE" | "SUSPENDED";
}

export interface UpdateTeamProfilePayload {
  fullName: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: "ACTIVE" | "SUSPENDED";
  enabled?: boolean;
  newPassword?: string;
}

export interface UpdateSelfProfilePayload {
  fullName: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

interface AdminTeamManagementProps {
  myProfile: TeamMemberRecord | null;
  teamMembers: TeamMemberRecord[];
  loading?: boolean;
  error?: string | null;
  onCreateMember: (payload: CreateTeamProfilePayload) => Promise<void>;
  onUpdateMember: (id: number, payload: UpdateTeamProfilePayload) => Promise<void>;
  onToggleStatus: (member: TeamMemberRecord) => Promise<void>;
  onUpdateMyProfile: (payload: UpdateSelfProfilePayload) => Promise<void>;
  onChangeMyPassword: (payload: ChangePasswordPayload) => Promise<void>;
}

export const TEAM_ROLE_OPTIONS: { value: string; label: string; group: string }[] = [
  { value: "ROLE_ADMIN", label: "Studio Administrator", group: "Administration" },
  { value: "ROLE_PRINCIPAL_ARCHITECT", label: "Principal Architect", group: "Studio & Design" },
  { value: "ROLE_PROJECT_MANAGER", label: "Project Manager", group: "Studio & Design" },
  { value: "ROLE_STAFF", label: "Studio Staff", group: "Studio & Design" },
  { value: "ROLE_SITE_SUPERVISOR", label: "Site Supervisor", group: "Studio & Design" },
  { value: "ROLE_FINANCE_MANAGER", label: "Finance Manager", group: "Finance & Audit" },
  { value: "ROLE_FINANCE_LEAD", label: "Finance Lead", group: "Finance & Audit" },
  { value: "ROLE_FINANCE_MAKER", label: "Finance Maker", group: "Finance & Audit" },
  { value: "ROLE_FINANCE_CHECKER", label: "Finance Checker", group: "Finance & Audit" },
  { value: "ROLE_FINANCE_CHECKER_1", label: "Finance Checker (Level 1)", group: "Finance & Audit" },
  { value: "ROLE_FINANCE_CHECKER_2", label: "Finance Checker (Level 2)", group: "Finance & Audit" },
  { value: "ROLE_FINANCE_AUDIT", label: "Finance Auditor", group: "Finance & Audit" },
];

function getRoleLabel(role?: string): string {
  if (!role) return "Team Member";
  const match = TEAM_ROLE_OPTIONS.find((opt) => opt.value === role);
  if (match) return match.label;
  return role.replace("ROLE_", "").replace(/_/g, " ");
}

function getRoleBadgeStyle(role?: string): string {
  if (role === "ROLE_ADMIN") return "border-[#C5A36D] bg-[#FAF6EC] text-[#7D5E29]";
  if (role?.startsWith("ROLE_FINANCE")) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  return "border-[#D8D6D0] bg-[#FAF9F5] text-[#55534F]";
}

export function AdminTeamManagement({
  myProfile,
  teamMembers,
  loading = false,
  error = null,
  onCreateMember,
  onUpdateMember,
  onToggleStatus,
  onUpdateMyProfile,
  onChangeMyPassword,
}: AdminTeamManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busyStatusId, setBusyStatusId] = useState<number | null>(null);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createShowPassword, setCreateShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTeamProfilePayload>({
    username: "",
    password: "",
    role: "ROLE_STAFF",
    fullName: "",
    email: "",
    phone: "",
    status: "ACTIVE",
  });

  // Edit member modal state
  const [editingMember, setEditingMember] = useState<TeamMemberRecord | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editForm, setEditForm] = useState<UpdateTeamProfilePayload>({
    fullName: "",
    email: "",
    phone: "",
    role: "ROLE_STAFF",
    status: "ACTIVE",
    enabled: true,
    newPassword: "",
  });

  // Self profile & password modal state
  const [editSelfOpen, setEditSelfOpen] = useState(false);
  const [selfSaving, setSelfSaving] = useState(false);
  const [selfForm, setSelfForm] = useState<UpdateSelfProfilePayload>({
    fullName: "",
    email: "",
    phone: "",
  });

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const stats = useMemo(() => {
    const total = teamMembers.length;
    const active = teamMembers.filter((m) => m.enabled && m.status !== "SUSPENDED").length;
    const finance = teamMembers.filter((m) => m.role.startsWith("ROLE_FINANCE")).length;
    const admins = teamMembers.filter((m) => m.role === "ROLE_ADMIN").length;
    return { total, active, finance, admins };
  }, [teamMembers]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teamMembers.filter((member) => {
      const matchesSearch =
        !q ||
        (member.fullName || "").toLowerCase().includes(q) ||
        member.username.toLowerCase().includes(q) ||
        (member.email || "").toLowerCase().includes(q) ||
        (member.phone || "").toLowerCase().includes(q) ||
        getRoleLabel(member.role).toLowerCase().includes(q);

      const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
      const normalizedStatus = member.enabled && member.status !== "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
      const matchesStatus = statusFilter === "ALL" || normalizedStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [teamMembers, searchQuery, roleFilter, statusFilter]);

  function openCreateModal() {
    setFeedback(null);
    setCreateForm({
      username: "",
      password: "",
      role: "ROLE_STAFF",
      fullName: "",
      email: "",
      phone: "",
      status: "ACTIVE",
    });
    setCreateShowPassword(false);
    setCreateOpen(true);
  }

  function openEditMemberModal(member: TeamMemberRecord) {
    setFeedback(null);
    const active = member.enabled && member.status !== "SUSPENDED";
    setEditingMember(member);
    setEditForm({
      fullName: member.fullName || member.username,
      email: member.email || "",
      phone: member.phone || "",
      role: member.role,
      status: active ? "ACTIVE" : "SUSPENDED",
      enabled: active,
      newPassword: "",
    });
    setEditShowPassword(false);
  }

  function openSelfProfileModal() {
    if (!myProfile) return;
    setFeedback(null);
    setSelfForm({
      fullName: myProfile.fullName || myProfile.username,
      email: myProfile.email || "",
      phone: myProfile.phone || "",
    });
    setEditSelfOpen(true);
  }

  function openPasswordModal() {
    setFeedback(null);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordOpen(true);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setCreateSaving(true);
    try {
      await onCreateMember(createForm);
      setCreateOpen(false);
      setFeedback({
        type: "ok",
        text: `Team profile "${createForm.fullName || createForm.username}" created successfully.`,
      });
    } catch (err) {
      setFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to create team profile.",
      });
    } finally {
      setCreateSaving(false);
    }
  }

  async function submitEditMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;
    setFeedback(null);
    setEditSaving(true);
    try {
      const isSelf = myProfile?.username === editingMember.username;
      const payload: UpdateTeamProfilePayload = {
        fullName: editForm.fullName,
        email: editForm.email,
        phone: editForm.phone,
        ...(isSelf
          ? {}
          : {
              role: editForm.role,
              status: editForm.status,
              enabled: editForm.status === "ACTIVE",
            }),
        ...(editForm.newPassword?.trim() ? { newPassword: editForm.newPassword.trim() } : {}),
      };
      await onUpdateMember(editingMember.id, payload);
      setEditingMember(null);
      setFeedback({
        type: "ok",
        text: `Profile updated for ${editForm.fullName || editingMember.username}.`,
      });
    } catch (err) {
      setFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to update team profile.",
      });
    } finally {
      setEditSaving(false);
    }
  }

  async function submitSelfProfile(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSelfSaving(true);
    try {
      await onUpdateMyProfile(selfForm);
      setEditSelfOpen(false);
      setFeedback({ type: "ok", text: "Your profile details were updated." });
    } catch (err) {
      setFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to update your profile.",
      });
    } finally {
      setSelfSaving(false);
    }
  }

  async function submitChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: "err", text: "New password and confirmation do not match." });
      return;
    }
    setFeedback(null);
    setPasswordSaving(true);
    try {
      await onChangeMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordOpen(false);
      setFeedback({ type: "ok", text: "Password updated cleanly." });
    } catch (err) {
      setFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to change password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleQuickStatusToggle(member: TeamMemberRecord) {
    setFeedback(null);
    setBusyStatusId(member.id);
    try {
      await onToggleStatus(member);
      const nextActive = !(member.enabled && member.status !== "SUSPENDED");
      setFeedback({
        type: "ok",
        text: `${member.fullName || member.username} is now ${nextActive ? "ACTIVE" : "SUSPENDED"}.`,
      });
    } catch (err) {
      setFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Unable to update account status.",
      });
    } finally {
      setBusyStatusId(null);
    }
  }

  return (
    <div className="space-y-8 bg-[#F2F0EB] p-5 sm:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#D8D6D0] pb-6 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Team &amp; Access
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#171717] md:text-4xl">
            Studio Team &amp; Profiles
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#77736C]">
            Create profiles for your architecture, site supervision, and finance team,
            edit existing team member details, or update your own administrator profile.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex shrink-0 items-center gap-2 border border-[#171717] bg-[#171717] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[#33312D]"
        >
          <UserPlus size={14} />
          Create Team Profile
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role={feedback.type === "err" ? "alert" : "status"}
          className={`flex items-center justify-between gap-4 border px-5 py-3.5 text-xs ${
            feedback.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-[#E3C9C5] bg-[#FAF3F1] text-[#773B34]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "ok" ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-mono text-[10px] uppercase tracking-wider underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="border border-[#E3C9C5] bg-[#FAF3F1] p-4 text-xs text-[#773B34]">
          {error}
        </div>
      )}

      {/* My Profile Card */}
      {myProfile && (
        <section className="border border-[#D8D6D0] bg-white p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
                  Signed-In Profile
                </span>
                <span
                  className={`border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${getRoleBadgeStyle(
                    myProfile.role
                  )}`}
                >
                  {getRoleLabel(myProfile.role)}
                </span>
              </div>

              <h2 className="font-serif text-2xl text-[#171717]">
                {myProfile.fullName || myProfile.username}
              </h2>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#66635D]">
                <span className="font-mono text-[11px] text-[#33312D]">@{myProfile.username}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={13} className="text-[#A58A64]" />
                  {myProfile.email || "No email set"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={13} className="text-[#A58A64]" />
                  {myProfile.phone || "No phone set"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openSelfProfileModal}
                className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-[#FAF9F5] px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#171717] transition-colors hover:border-[#A58A64]"
              >
                <Pencil size={13} />
                Edit My Profile
              </button>

              <button
                type="button"
                onClick={openPasswordModal}
                className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#55534F] transition-colors hover:border-[#171717] hover:text-[#171717]"
              >
                <KeyRound size={13} />
                Change Password
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Summary KPI Strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="border border-[#D8D6D0] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
            Team Profiles
          </p>
          <p className="mt-2 font-serif text-3xl text-[#171717]">{stats.total}</p>
        </div>
        <div className="border border-[#D8D6D0] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
            Active Accounts
          </p>
          <p className="mt-2 font-serif text-3xl text-emerald-700">{stats.active}</p>
        </div>
        <div className="border border-[#D8D6D0] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
            Finance &amp; Audit
          </p>
          <p className="mt-2 font-serif text-3xl text-[#171717]">{stats.finance}</p>
        </div>
        <div className="border border-[#D8D6D0] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
            Administrators
          </p>
          <p className="mt-2 font-serif text-3xl text-[#A58A64]">{stats.admins}</p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="grid grid-cols-1 gap-4 border border-[#D8D6D0] bg-white p-5 md:grid-cols-12">
        <div className="md:col-span-6">
          <label
            htmlFor="team-search"
            className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#99958D]"
          >
            Search Team Roster
          </label>
          <div className="flex items-center gap-2.5 border border-[#D8D6D0] bg-[#FAF9F5] px-3.5">
            <Search size={15} className="shrink-0 text-[#A58A64]" />
            <input
              id="team-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, username, email, phone, or role..."
              className="w-full bg-transparent py-2.5 text-sm text-[#171717] outline-none placeholder:text-[#AAA69E]"
            />
          </div>
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="team-role-filter"
            className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#99958D]"
          >
            Role
          </label>
          <select
            id="team-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full border border-[#D8D6D0] bg-[#FAF9F5] px-3.5 py-2.5 text-sm text-[#171717] outline-none focus:border-[#A58A64]"
          >
            <option value="ALL">All Team Roles</option>
            {TEAM_ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="team-status-filter"
            className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#99958D]"
          >
            Status
          </label>
          <select
            id="team-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-[#D8D6D0] bg-[#FAF9F5] px-3.5 py-2.5 text-sm text-[#171717] outline-none focus:border-[#A58A64]"
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </section>

      {/* Roster */}
      <section className="border border-[#D8D6D0] bg-white">
        <div className="flex items-center justify-between border-b border-[#EAE8E2] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Users size={16} className="text-[#A58A64]" />
            <h2 className="font-serif text-xl text-[#171717]">
              Internal Team Directory ({filteredMembers.length})
            </h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-[#99958D] sm:inline">
            Clients &amp; Vendors managed in their respective directories
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-6 py-12 text-sm text-[#77736C]">
            <Loader2 size={16} className="animate-spin" />
            Loading studio team roster...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#77736C]">
            No team profiles match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-[#EAE8E2] bg-[#FAF9F5] font-mono text-[10px] uppercase tracking-widest text-[#8E8A83]">
                <tr>
                  <th className="px-6 py-3.5">Member</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE8E2]">
                {filteredMembers.map((member) => {
                  const isSelf = myProfile?.username === member.username;
                  const isActive = member.enabled && member.status !== "SUSPENDED";
                  const isBusy = busyStatusId === member.id;

                  return (
                    <tr key={member.id} className="hover:bg-[#FAF9F5]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#171717]">
                            {member.fullName || member.username}
                          </span>
                          {isSelf && (
                            <span className="border border-[#C5A36D] bg-[#FAF6EC] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#7D5E29]">
                              You
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 font-mono text-[11px] text-[#77736C]">
                          @{member.username}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${getRoleBadgeStyle(
                            member.role
                          )}`}
                        >
                          {getRoleLabel(member.role)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-xs text-[#55534F]">
                        <p>{member.email || "—"}</p>
                        <p className="mt-0.5 text-[#8E8A83]">{member.phone || "—"}</p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                            isActive
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-red-50 text-red-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-emerald-600" : "bg-red-600"
                            }`}
                          />
                          {isActive ? "Active" : "Suspended"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditMemberModal(member)}
                            className="inline-flex whitespace-nowrap items-center gap-1.5 border border-[#D8D6D0] bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#171717] transition-colors hover:border-[#A58A64]"
                          >
                            <Pencil size={12} />
                            Edit Profile
                          </button>

                          {!isSelf && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleQuickStatusToggle(member)}
                              className={`inline-flex whitespace-nowrap items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors disabled:opacity-60 ${
                                isActive
                                  ? "border-[#E3C9C5] bg-white text-[#8C3B31] hover:bg-[#FAF3F1]"
                                  : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                              }`}
                            >
                              {isActive ? <Ban size={12} /> : <UserCheck size={12} />}
                              {isActive ? "Suspend" : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Team Profile Modal */}
      {createOpen && (
        <ModalFrame
          title="Create Team Profile"
          subtitle="Provision a new studio administrator, architect, supervisor, or finance profile."
          onClose={() => setCreateOpen(false)}
        >
          <form onSubmit={submitCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                  Full Name *
                </label>
                <input
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="e.g., Ar. Riya Deshmukh"
                  className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                  Username *
                </label>
                <input
                  required
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="e.g., riya_architect"
                  className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                  Role *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
                >
                  {TEAM_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                  Account Status
                </label>
                <select
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      status: e.target.value as "ACTIVE" | "SUSPENDED",
                    })
                  }
                  className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
                >
                  <option value="ACTIVE">Active (Can Sign In Immediately)</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={createForm.email || ""}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="name@studioarcheon.com"
                  className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                  Phone Number
                </label>
                <input
                  value={createForm.phone || ""}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                Initial Password * (Minimum 8 characters)
              </label>
              <div className="flex border border-[#D8D6D0] bg-white">
                <input
                  required
                  minLength={8}
                  type={createShowPassword ? "text" : "password"}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Set initial sign-in password"
                  className="w-full bg-transparent px-3.5 py-2.5 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCreateShowPassword((v) => !v)}
                  className="px-3 text-[#77736C] hover:text-[#171717]"
                  aria-label="Toggle password visibility"
                >
                  {createShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#EAE8E2] pt-4">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="border border-[#D8D6D0] bg-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#55534F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSaving}
                className="inline-flex items-center gap-2 bg-[#171717] px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white disabled:opacity-60"
              >
                {createSaving && <Loader2 size={13} className="animate-spin" />}
                Create Profile
              </button>
            </div>
          </form>
        </ModalFrame>
      )}

      {/* Edit Team Profile Modal */}
      {editingMember && (
        <ModalFrame
          title={`Edit Profile — @${editingMember.username}`}
          subtitle="Update team member identity details, assigned role, account status, or reset password."
          onClose={() => setEditingMember(null)}
        >
          <form onSubmit={submitEditMember} className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                Full Name *
              </label>
              <input
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                  Phone Number
                </label>
                <input
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
                />
              </div>
            </div>

            {myProfile?.username === editingMember.username ? (
              <div className="flex items-start gap-2.5 border border-[#E5DEC9] bg-[#FAF7EE] p-3 text-xs text-[#6D552B]">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                <span>
                  Role and status changes are locked on your own signed-in administrator
                  account to prevent accidental self-lockout.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                    Assigned Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
                  >
                    {TEAM_ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                    Account Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as "ACTIVE" | "SUSPENDED",
                      })
                    }
                    className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                Reset Password (Optional — leave blank to keep current)
              </label>
              <div className="flex border border-[#D8D6D0] bg-white">
                <input
                  minLength={editForm.newPassword ? 8 : undefined}
                  type={editShowPassword ? "text" : "password"}
                  value={editForm.newPassword || ""}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  placeholder="Enter new password (min 8 chars)"
                  className="w-full bg-transparent px-3.5 py-2.5 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setEditShowPassword((v) => !v)}
                  className="px-3 text-[#77736C] hover:text-[#171717]"
                  aria-label="Toggle reset password visibility"
                >
                  {editShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#EAE8E2] pt-4">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="border border-[#D8D6D0] bg-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#55534F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="inline-flex items-center gap-2 bg-[#171717] px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white disabled:opacity-60"
              >
                {editSaving && <Loader2 size={13} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </ModalFrame>
      )}

      {/* Edit Self Profile Modal */}
      {editSelfOpen && (
        <ModalFrame
          title="Edit My Profile"
          subtitle="Update your administrator display name, email, and contact phone."
          onClose={() => setEditSelfOpen(false)}
        >
          <form onSubmit={submitSelfProfile} className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                Full Name *
              </label>
              <input
                required
                value={selfForm.fullName}
                onChange={(e) => setSelfForm({ ...selfForm, fullName: e.target.value })}
                className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                Email Address
              </label>
              <input
                type="email"
                value={selfForm.email || ""}
                onChange={(e) => setSelfForm({ ...selfForm, email: e.target.value })}
                className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                Phone Number
              </label>
              <input
                value={selfForm.phone || ""}
                onChange={(e) => setSelfForm({ ...selfForm, phone: e.target.value })}
                className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-[#EAE8E2] pt-4">
              <button
                type="button"
                onClick={() => setEditSelfOpen(false)}
                className="border border-[#D8D6D0] bg-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#55534F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selfSaving}
                className="inline-flex items-center gap-2 bg-[#171717] px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white disabled:opacity-60"
              >
                {selfSaving && <Loader2 size={13} className="animate-spin" />}
                Save My Profile
              </button>
            </div>
          </form>
        </ModalFrame>
      )}

      {/* Change Password Modal */}
      {passwordOpen && (
        <ModalFrame
          title="Change My Password"
          subtitle="Changing your password revokes other active sessions automatically."
          onClose={() => setPasswordOpen(false)}
        >
          <form onSubmit={submitChangePassword} className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                Current Password *
              </label>
              <input
                required
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                New Password * (Minimum 8 characters)
              </label>
              <input
                required
                minLength={8}
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#66635D]">
                Confirm New Password *
              </label>
              <input
                required
                minLength={8}
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#A58A64]"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-[#EAE8E2] pt-4">
              <button
                type="button"
                onClick={() => setPasswordOpen(false)}
                className="border border-[#D8D6D0] bg-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#55534F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center gap-2 bg-[#171717] px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white disabled:opacity-60"
              >
                {passwordSaving && <Loader2 size={13} className="animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        </ModalFrame>
      )}
    </div>
  );
}

function ModalFrame({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl border border-[#D8D6D0] bg-[#FAF9F5] p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#EAE8E2] pb-4">
          <div>
            <h3 className="font-serif text-2xl text-[#171717]">{title}</h3>
            <p className="mt-1 text-xs text-[#77736C]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center border border-[#D8D6D0] bg-white text-[#55534F] hover:border-[#171717]"
          >
            <X size={15} />
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}
