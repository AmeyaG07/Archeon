"use client";

import { VendorInvoiceHistory } from "@/components/portal/vendor/VendorInvoiceHistory";

export default function VendorInvoicesPage() {
  return (
    <VendorInvoiceHistory invoices={[]} onOpenInvoice={() => {}} />
  );
}
