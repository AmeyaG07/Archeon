"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  AdminPortalLayout,
  type AdminPortalSection,
} from "@/components/portal/admin/AdminPortalLayout";
import { useAuth } from "@/providers/AuthProvider";

const routes: Record<AdminPortalSection, string> = {
  dashboard: "/admin",
  projects: "/admin/projects",
  "website-projects": "/admin/website-projects",
  leads: "/admin/leads",
  clients: "/admin/clients",
  vendors: "/admin/vendors",
  invoices: "/admin/invoices",
  approvals: "/admin/approvals",
  "cash-settlements": "/admin/cash-settlements",
  "finance-reports": "/admin/finance-reports",
  "audit-logs": "/admin/audit-logs",
  settings: "/admin/settings",
};

function getActiveSection(pathname: string): AdminPortalSection {
  if (pathname.includes("/website-projects")) return "website-projects";
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
  const { user, logout } = useAuth();

  return (
    <AdminPortalLayout
      activeSection={getActiveSection(pathname)}
      adminName={user?.username || "Studio Principal"}
      adminRole={user?.role ? user.role.replace("ROLE_", "") : "Administration"}
      adminReference="ARCHEON-STUDIO"
      onNavigate={(section) => router.push(routes[section])}
      onLogout={async () => {
        await logout();
        router.push("/login");
      }}
    >
      {children}
    </AdminPortalLayout>
  );
}
