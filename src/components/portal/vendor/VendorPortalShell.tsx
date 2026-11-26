"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  VendorPortalLayout,
  type VendorPortalSection,
} from "@/components/portal/vendor/VendorPortalLayout";
import { useAuth } from "@/providers/AuthProvider";

const routes: Record<VendorPortalSection, string> = {
  dashboard: "/vendor",
  projects: "/vendor/projects",
  invoices: "/vendor/invoices?tab=invoices",
  "cash-settlements": "/vendor/cash-settlements",
  notifications: "/vendor/notifications",
  support: "/vendor/support",
  settings: "/vendor/profile",
};

function getActiveSection(pathname: string, tab?: string | null): VendorPortalSection {
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/cash-settlements")) return "cash-settlements";
  if (pathname.includes("/invoices")) {
    return "invoices";
  }
  if (pathname.includes("/notifications")) return "notifications";
  if (pathname.includes("/support")) return "support";
  if (pathname.includes("/profile")) return "settings";
  return "dashboard";
}

function VendorPortalShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const currentTab = searchParams?.get("tab");

  return (
    <VendorPortalLayout
      activeSection={getActiveSection(pathname, currentTab)}
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

export function VendorPortalShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <VendorPortalShellInner>{children}</VendorPortalShellInner>
    </Suspense>
  );
}
