"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClientProjectOverview,
  type ClientProject,
  type ClientProjectStatus,
} from "@/components/portal/client/ClientProjectOverview";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function ClientProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/operational-projects");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: ClientProject[] = list.map((p: any) => ({
          id: p.id || "",
          projectName: p.name || "Architecture Project",
          projectType: p.projectType || "Residential",
          location: p.siteAddress || "Maharashtra",
          status: (p.status === "COMPLETED"
            ? "Completed"
            : p.status === "IN_PROGRESS"
            ? "Under Execution"
            : p.status === "ON_HOLD"
            ? "On Hold"
            : "Under Design") as ClientProjectStatus,
          startDate: p.startDate,
          expectedCompletion: p.expectedCompletionDate,
          projectManager: p.projectManagerUsername || "Ar. Mandar Bhalekar",
          description: p.description,
        }));
        setProjects(records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
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
    <ClientProjectOverview
      projects={projects}
      loading={loading}
      error={error ?? undefined}
      onRetry={loadProjects}
      onOpenProject={(proj) => router.push(`/client/projects/${proj.id}`)}
    />
  );
}
