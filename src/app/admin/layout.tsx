import { AdminPortalShell } from "@/components/portal/admin/AdminPortalShell";

/**
 * Admin portal server layout.
 *
 * Protects the administration workspace. Only users with the
 * ADMIN role may access this area.
 */
export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminPortalShell>
      {children}
    </AdminPortalShell>
  );
}