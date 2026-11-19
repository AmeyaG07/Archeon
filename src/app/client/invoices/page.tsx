"use client";

import { ClientInvoiceOverview } from "@/components/portal/client/ClientInvoiceOverview";

export default function ClientInvoicesPage() {
  return (
    <ClientInvoiceOverview
      invoices={[]}
      onViewInvoice={() => {}}
      onSubmitPaymentProof={() => {}}
      onRaiseDispute={() => {}}
    />
  );
}
