import { VendorPortalShell } from "@/components/portal/vendor/VendorPortalShell";

/**
 * Vendor portal server layout.
 */
export default function VendorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VendorPortalShell>
      {children}
    </VendorPortalShell>
  );
}
