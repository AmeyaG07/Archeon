"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  VendorPortalLayout,
  type VendorPortalSection,
} from "@/components/portal/vendor/VendorPortalLayout";

const routes: Record<VendorPortalSection, string> = {
  dashboard: "/vendor",
  projects: "/vendor/projects",
  invoices: "/vendor/invoices",
  "cash-settlements": "/vendor/cash-settlements",
  payments: "/vendor/unavailable",
  disputes: "/vendor/unavailable",
  notifications: "/vendor/notifications",
  support: "/vendor/unavailable",
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

/** Presentational vendor shell; backend session enforcement is pending. */
export function VendorPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <VendorPortalLayout
      activeSection={getActiveSection(pathname)}
      vendorName="Vendor workspace"
      businessName="Access-managed"
      vendorReference="Access-managed"
      onNavigate={(section) => router.push(routes[section])}
      onLogout={() => router.push("/")}
    >
      {children}
    </VendorPortalLayout>
  );
}