"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminProjectManagement,
  type AdminProjectRecord,
  type AdminProjectStatus,
  type AdminProjectCategory,
} from "@/components/portal/admin/AdminProjectManagement";
import { AdminCreateProjectModal } from "@/components/portal/admin/AdminCreateProjectModal";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [projects, setProjects] = useState<AdminProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/operational-projects");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: AdminProjectRecord[] = list.map((p: any) => ({
          id: p.id || "",
          reference: p.projectReference || p.id || "PROJ",
          name: p.name || "Untitled Project",
          category: (p.projectType === "RESIDENTIAL" || p.projectType === "RESIDENTIAL_ARCHITECTURE"
            ? "Residential"
            : p.projectType === "COMMERCIAL" || p.projectType === "COMMERCIAL_INTERIOR"
            ? "Commercial"
            : p.projectType === "INTERIOR"
            ? "Interior"
            : p.projectType === "LANDSCAPE" || p.projectType === "LANDSCAPE_DESIGN"
            ? "Landscape"
            : p.projectType === "TURNKEY" || p.projectType === "TURNKEY_EXECUTION"
            ? "Turnkey"
            : "Other") as AdminProjectCategory,
          clientName: p.clientName || "Studio Client",
          location: p.siteAddress || "Maharashtra",
          projectManager: p.projectManagerUsername || "Ar. Mandar Bhalekar",
          status: (p.status === "COMPLETED"
            ? "Completed"
            : p.status === "IN_PROGRESS"
            ? "Under Execution"
            : p.status === "ON_HOLD"
            ? "On Hold"
            : p.status === "CANCELLED"
            ? "Cancelled"
            : "Planning") as AdminProjectStatus,
          startDate: p.startDate,
          expectedCompletion: p.expectedCompletionDate,
          lastVisitDate: p.lastVisitDate,
          lastUpdated: new Date().toISOString(),
          milestoneSummary: {
            completed: p.progressPercentage ? Math.round((p.progressPercentage / 100) * 5) : 1,
            total: 5,
          },
        }));
        setProjects(records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load operational projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadProjects();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadProjects, router]);

  return (
    <div className="p-4 sm:p-8">
      <AdminProjectManagement
        projects={projects}
        loading={loading}
        error={error ?? undefined}
        onRefresh={loadProjects}
        onCreateProject={() => setShowCreateModal(true)}
        onOpenProject={(projId) => router.push(`/admin/projects/${projId}`)}
      />

      <AdminCreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={loadProjects}
      />
    </div>
  );
}
