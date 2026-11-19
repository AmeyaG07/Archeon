"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  AdminPortalLayout,
  type AdminPortalSection,
} from "@/components/portal/admin/AdminPortalLayout";

const routes: Record<AdminPortalSection, string> = {
  dashboard: "/admin",
  projects: "/admin/unavailable",
  leads: "/admin/unavailable",
  clients: "/admin/unavailable",
  vendors: "/admin/unavailable",
  invoices: "/admin/unavailable",
  approvals: "/admin/unavailable",
  "cash-settlements": "/admin/unavailable",
  "finance-reports": "/admin/unavailable",
  "audit-logs": "/admin/unavailable",
  settings: "/admin/unavailable",
};

function getActiveSection(pathname: string): AdminPortalSection {
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/leads")) return "leads";
  if (pathname.includes("/clients")) return "clients";
  if (pathname.includes("/vendors")) return "vendors";
  if (pathname.includes("/invoices")) return "invoices";
  if (pathname.includes("/approvals")) return "approvals";
  if (pathname.includes("/cash")) return "cash-settlements";
  if (pathname.includes("/finance")) return "finance-reports";
  if (pathname.includes("/audit")) return "audit-logs";
  if (pathname.includes("/settings")) return "settings";
  return "dashboard";
}

export function AdminPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AdminPortalLayout
      activeSection={getActiveSection(pathname)}
      adminName="Administration"
      adminRole="Restricted workspace"
      adminReference="Access-managed"
      onNavigate={(section) => router.push(routes[section])}
      onLogout={() => router.push("/")}
    >
      {children}
    </AdminPortalLayout>
  );
}
