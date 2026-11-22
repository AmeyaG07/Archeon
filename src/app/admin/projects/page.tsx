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
import { AdminWebsiteProjectList } from "@/components/portal/admin/AdminWebsiteProjectList";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { Building2, Globe } from "lucide-react";

export default function AdminProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"operational" | "showcase">("operational");
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
    <div className="p-4 sm:p-8 space-y-6">
      {/* Top Section Segmented Tab Switcher */}
      <div className="flex border-b border-[#D8D6D0] gap-2 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("operational")}
          className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "operational"
              ? "border-[#111111] text-[#111111] font-semibold"
              : "border-transparent text-[#77736C] hover:text-[#111111]"
          }`}
        >
          <Building2 size={15} />
          Operational Site Projects
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("showcase")}
          className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "showcase"
              ? "border-[#A58A64] text-[#A58A64] font-semibold bg-[#FAF8F5]/60"
              : "border-transparent text-[#77736C] hover:text-[#111111]"
          }`}
        >
          <Globe size={15} />
          Website Portfolio Showcase (Photos & Descriptions)
        </button>
      </div>

      {activeTab === "operational" ? (
        <>
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
        </>
      ) : (
        <AdminWebsiteProjectList />
      )}
    </div>
  );
}
