"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  VendorPortalLayout,
  type VendorPortalSection,
} from "@/components/portal/vendor/VendorPortalLayout";
import { useAuth } from "@/providers/AuthProvider";

const routes: Record<VendorPortalSection, string> = {
  dashboard: "/vendor",
  projects: "/vendor/projects",
  invoices: "/vendor/invoices",
  "cash-settlements": "/vendor/cash-settlements",
  payments: "/vendor/invoices",
  disputes: "/vendor/invoices",
  notifications: "/vendor/notifications",
  support: "/vendor/notifications",
  settings: "/vendor/profile",
};

function getActiveSection(pathname: string): VendorPortalSection {
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/invoices")) return "invoices";
  if (pathname.includes("/cash-settlements")) return "cash-settlements";
  if (pathname.includes("/notifications")) return "notifications";
  if (pathname.includes("/profile")) return "settings";
  return "dashboard";
}

export function VendorPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <VendorPortalLayout
      activeSection={getActiveSection(pathname)}
      vendorName={user?.username || "Trade Partner"}
      businessName="Trade & Subcontractor Portal"
      vendorReference="VENDOR-PORTAL"
      onNavigate={(section) => router.push(routes[section])}
      onLogout={async () => {
        await logout();
        router.push("/login");
      }}
    >
      {children}
    </VendorPortalLayout>
  );
}
