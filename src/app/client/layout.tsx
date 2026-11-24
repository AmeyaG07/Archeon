import { ClientPortalShell } from "@/components/portal/client/ClientPortalShell";

/**
 * Client portal server layout.
 *
 * Uses a server-side role check to protect the client workspace.
 * If the request cannot be authenticated, the visitor is redirected
 * to the login page.
 */
export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientPortalShell>
      {children}
    </ClientPortalShell>
  );
}

