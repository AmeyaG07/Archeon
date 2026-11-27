"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  VendorProjectOverview,
  type VendorProjectRecord,
  type VendorProjectStatus,
} from "@/components/portal/vendor/VendorProjectOverview";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function VendorProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [projects, setProjects] = useState<VendorProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/operational-projects");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: VendorProjectRecord[] = list.map((p: any) => ({
          id: p.id || "",
          clientId: p.clientId || undefined,
          projectName: p.name || "Site Package Execution",
          location: p.siteAddress || "Maharashtra",
          assignment: p.projectType || "Trade Contractor",
          scopeDescription: p.description || "Supply, fabrication, and on-site architectural execution as per studio drawings",
          status: (p.status === "COMPLETED"
            ? "Completed"
            : p.status === "ON_HOLD"
            ? "On Hold"
            : "In Progress") as VendorProjectStatus,
          assignedAt: p.startDate || new Date().toISOString(),
          expectedCompletion: p.expectedCompletionDate,
          projectManager: p.projectManagerUsername || "Ar. Mandar Bhalekar",
          documents: [],
        }));
        setProjects(records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load assigned projects");
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
    <VendorProjectOverview
      projects={projects}
      loading={loading}
      error={error ?? undefined}
      onRetry={loadProjects}
      onOpenProject={(proj) => router.push(`/vendor/projects/${proj.id}`)}
      onOpenDocument={() => {}}
      onBack={() => router.push("/vendor")}
    />
  );
}
