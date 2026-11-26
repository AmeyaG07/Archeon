"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ClientPortalLayout,
  type ClientPortalSection,
} from "@/components/portal/client/ClientPortalLayout";
import { useAuth } from "@/providers/AuthProvider";

const routes: Record<ClientPortalSection, string> = {
  dashboard: "/client",
  projects: "/client/projects",
  invoices: "/client/invoices?tab=invoices",
  support: "/client/support",
  settings: "/client/profile",
};

function getActiveSection(pathname: string): ClientPortalSection {
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/invoices")) return "invoices";
  if (pathname.includes("/support")) return "support";
  if (pathname.includes("/profile")) return "settings";
  return "dashboard";
}

export function ClientPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <ClientPortalLayout
      activeSection={getActiveSection(pathname)}
      clientName={user?.username || "Studio Client"}
      clientReference="CLIENT-PORTAL"
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
