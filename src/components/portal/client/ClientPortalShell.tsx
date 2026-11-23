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
  invoices: "/client/invoices",
  projects: "/client/projects",
  documents: "/client/documents",
  notifications: "/client/notifications",
  support: "/client/support",
  settings: "/client/profile",
};

function getActiveSection(pathname: string): ClientPortalSection {
  if (pathname.includes("/invoices")) return "invoices";
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/documents")) return "documents";
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
  return (
    <ClientPortalLayout
      activeSection={getActiveSection(pathname)}
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
