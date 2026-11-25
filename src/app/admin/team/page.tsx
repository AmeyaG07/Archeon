"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminTeamManagement,
  type TeamMemberRecord,
  type CreateTeamProfilePayload,
  type UpdateTeamProfilePayload,
  type UpdateSelfProfilePayload,
  type ChangePasswordPayload,
} from "@/components/portal/admin/AdminTeamManagement";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.error || body?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function AdminTeamPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, hasRole } = useAuth();

  const [myProfile, setMyProfile] = useState<TeamMemberRecord | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, usersRes] = await Promise.all([
        apiFetch("/api/users/me"),
        apiFetch("/api/users"),
      ]);

      if (!meRes.ok) {
        throw new Error(await parseError(meRes, "Failed to load your profile"));
      }
      const meJson: TeamMemberRecord = await meRes.json();
      setMyProfile(meJson);

      if (!usersRes.ok) {
        throw new Error(await parseError(usersRes, "Failed to load team roster"));
      }
      const usersJson = await usersRes.json();
      if (Array.isArray(usersJson)) {
        // Internal team accounts only; Clients and Vendors belong in their own directories.
        const internalOnly = usersJson.filter(
          (u: TeamMemberRecord) =>
            u.role !== "ROLE_CLIENT" && u.role !== "ROLE_VENDOR"
        );
        setTeamMembers(internalOnly);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load studio team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        loadData();
      }
    }
  }, [authLoading, isAuthenticated, loadData, router]);

  if (authLoading || !isAuthenticated) return null;

  if (!hasRole("ADMIN")) {
    return (
      <div className="p-8">
        <div className="border border-[#E3C9C5] bg-[#FAF3F1] p-6 text-sm text-[#773B34]">
          Administrator privileges are required to view and manage team profiles.
        </div>
      </div>
    );
  }

  const handleCreateMember = async (payload: CreateTeamProfilePayload) => {
    const res = await apiFetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await parseError(res, "Failed to create team profile"));
    }
    await loadData();
  };

  const handleUpdateMember = async (id: number, payload: UpdateTeamProfilePayload) => {
    const res = await apiFetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await parseError(res, "Failed to update team profile"));
    }
    await loadData();
  };

  const handleToggleStatus = async (member: TeamMemberRecord) => {
    const isCurrentlyActive = member.enabled && member.status !== "SUSPENDED";
    const res = await apiFetch(`/api/users/${member.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: isCurrentlyActive ? "SUSPENDED" : "ACTIVE",
        enabled: !isCurrentlyActive,
      }),
    });
    if (!res.ok) {
      throw new Error(await parseError(res, "Failed to update account status"));
    }
    await loadData();
  };

  const handleUpdateMyProfile = async (payload: UpdateSelfProfilePayload) => {
    const res = await apiFetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await parseError(res, "Failed to update your profile"));
    }
    await loadData();
  };

  const handleChangeMyPassword = async (payload: ChangePasswordPayload) => {
    const res = await apiFetch("/api/users/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await parseError(res, "Failed to change password"));
    }
  };

  return (
    <AdminTeamManagement
      myProfile={myProfile}
      teamMembers={teamMembers}
      loading={loading}
      error={error}
      onCreateMember={handleCreateMember}
      onUpdateMember={handleUpdateMember}
      onToggleStatus={handleToggleStatus}
      onUpdateMyProfile={handleUpdateMyProfile}
      onChangeMyPassword={handleChangeMyPassword}
    />
  );
}
