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

const DEFAULT_VENDOR_PROJECTS: VendorProjectRecord[] = [
  {
    id: "PRJ_ARCH_2026_01",
    projectName: "The Monolith Sanctuary",
    location: "Khandala, Maharashtra",
    assignment: "Basalt Stone Masonry & Cantilever Structure",
    scopeDescription: "Direct cliffside site execution, basalt stratum carving, post-tensioned cantilever slab shuttering and waterproofing as per detail AT-DET-08.",
    status: "In Progress",
    assignedAt: "10 Oct 2026",
    expectedCompletion: "15 Dec 2026",
    projectManager: "Ar. Mandar Bhalekar",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80",
    documents: [
      { id: "d-1", title: "General Arrangement Drawing (Revision 3)", category: "Drawing", version: "v3.2", uploadedAt: "12 Oct 2026" },
      { id: "d-2", title: "Cantilever Reinforcement & Basalt Specification", category: "Specification", version: "v1.0", uploadedAt: "14 Oct 2026" },
    ],
  },
  {
    id: "PRJ_INT_2025_04",
    projectName: "The Travertine Penthouse",
    location: "Worli, Mumbai",
    assignment: "Architectural Millwork & Glazing Systems",
    scopeDescription: "Fluted travertine cladding installation, Italian marble flooring dry lay, and floor-to-ceiling recessed curtain wall profiles.",
    status: "In Progress",
    assignedAt: "05 Nov 2026",
    expectedCompletion: "28 Jan 2027",
    projectManager: "Ar. Mandar Bhalekar",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&auto=format&fit=crop&q=80",
    documents: [
      { id: "d-3", title: "Travertine Cladding & Joint Detailing", category: "Drawing", version: "v2.0", uploadedAt: "06 Nov 2026" },
    ],
  },
  {
    id: "PRJ_RES_2026_09",
    projectName: "Bhalekar Residence Turnkey",
    location: "Civil Lines, Nagpur",
    assignment: "Turnkey MEP & Finishing Execution",
    scopeDescription: "Integrated mechanical, electrical, plumbing and climate automation systems along with architectural drywall and lighting niches.",
    status: "In Progress",
    assignedAt: "01 Nov 2026",
    expectedCompletion: "20 Feb 2027",
    projectManager: "Ar. Mandar Bhalekar",
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&auto=format&fit=crop&q=80",
    documents: [
      { id: "d-4", title: "MEP Rough-In Schematic & Single Line Diagram", category: "Specification", version: "v1.4", uploadedAt: "02 Nov 2026" },
    ],
  },
];

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
      if (Array.isArray(list) && list.length > 0) {
        const records: VendorProjectRecord[] = list.map((p: any) => ({
          id: p.id || "",
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
      } else {
        setProjects(DEFAULT_VENDOR_PROJECTS);
      }
    } catch {
      setProjects(DEFAULT_VENDOR_PROJECTS);
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
