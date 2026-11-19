"use client";

import { VendorProjectOverview } from "@/components/portal/vendor/VendorProjectOverview";

export default function VendorProjectsPage() {
  return (
    <VendorProjectOverview
      projects={[]}
      onOpenProject={() => {}}
      onOpenDocument={() => {}}
    />
  );
}
