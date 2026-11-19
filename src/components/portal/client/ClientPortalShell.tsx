"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  ClientPortalLayout,
  type ClientPortalSection,
} from "@/components/portal/client/ClientPortalLayout";

const routes: Record<ClientPortalSection, string> = {
  dashboard: "/client",
  projects: "/client/projects",
  drawings: "/client/documents",
  documents: "/client/documents",
  invoices: "/client/invoices",
  payments: "/client/unavailable",
  disputes: "/client/unavailable",
  notifications: "/client/notifications",
  support: "/client/unavailable",
  settings: "/client/profile",
};

function getActiveSection(pathname: string): ClientPortalSection {
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/documents")) return "documents";
  if (pathname.includes("/invoices")) return "invoices";
  if (pathname.includes("/notifications")) return "notifications";
  if (pathname.includes("/profile")) return "settings";
  return "dashboard";
}

/**
 * Presentational route shell only. Authentication and role enforcement require
 * a verified server-side session/cookie contract and are intentionally not
 * implemented here.
 */
export function ClientPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ClientPortalLayout
      activeSection={getActiveSection(pathname)}
      clientName="Client workspace"
      clientReference="Access-managed"
      pageTitle="Client Portal"
      pageDescription="Your ArcheOn Design Studio workspace"
      onNavigate={(section) => router.push(routes[section])}
      onLogout={() => router.push("/")}
    >
      {children}
    </ClientPortalLayout>
  );
}
