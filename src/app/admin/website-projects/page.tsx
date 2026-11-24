"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminPortalShell } from "@/components/portal/admin/AdminPortalShell";
import { AdminWebsiteProjectList } from "@/components/portal/admin/AdminWebsiteProjectList";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminWebsiteProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  return (
    <AdminPortalShell>
      <AdminWebsiteProjectList />
    </AdminPortalShell>
  );
}
