"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ClientPortalLayout,
  type ClientPortalSection,
} from "@/components/portal/client/ClientPortalLayout";
import { useAuth } from "@/providers/AuthProvider";

const routes: Record<ClientPortalSection, string> = {
  dashboard: "/client",
  projects: "/client/projects",
  drawings: "/client/documents",
  documents: "/client/documents",
  invoices: "/client/invoices?tab=invoices",
  payments: "/client/invoices?tab=payments",
  notifications: "/client/notifications",
  support: "/client/support",
  settings: "/client/profile",
};

function getActiveSection(pathname: string, tab?: string | null): ClientPortalSection {
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/documents")) return "documents";
  if (pathname.includes("/invoices")) {
    if (tab === "payments") return "payments";
    return "invoices";
  }
  if (pathname.includes("/notifications")) return "notifications";
  if (pathname.includes("/support")) return "support";
  if (pathname.includes("/profile")) return "settings";
  return "dashboard";
}

function ClientPortalShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const currentTab = searchParams?.get("tab");

  return (
    <ClientPortalLayout
      activeSection={getActiveSection(pathname, currentTab)}
      clientName={user?.username || "Studio Client"}
      clientReference="CLIENT-PORTAL"
      pageTitle="Client Portal"
      pageDescription="Your ArcheOn Design Studio workspace"
      onNavigate={(section) => router.push(routes[section])}
      onLogout={async () => {
        await logout();
        router.push("/login");
      }}
    >
      {children}
    </ClientPortalLayout>
  );
}

export function ClientPortalShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ClientPortalShellInner>{children}</ClientPortalShellInner>
    </Suspense>
  );
}
