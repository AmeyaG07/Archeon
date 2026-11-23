"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminInvoiceManagement,
  type AdminInvoiceRecord,
  type AdminInvoiceSummary,
  type AdminInvoiceStatus,
} from "@/components/portal/admin/AdminInvoiceManagement";
import { AdminCreateBillModal } from "@/components/portal/admin/AdminCreateBillModal";
import { AdminNotifyBillsWhatsAppModal } from "@/components/portal/admin/AdminNotifyBillsWhatsAppModal";
import { apiFetch, resolveApiBaseUrl, getAuthToken } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminInvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState<AdminInvoiceRecord[]>([]);
  const [clientsList, setClientsList] = useState<{ id: string; fullName: string; reference?: string }[]>([]);
  const [summary, setSummary] = useState<AdminInvoiceSummary | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isNotifyWhatsAppOpen, setIsNotifyWhatsAppOpen] = useState(false);
  const [defaultBillClientId, setDefaultBillClientId] = useState<string | undefined>();

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, billsRes, clientsRes, projectsRes, vendorsRes] = await Promise.all([
        apiFetch("/api/invoices?size=100").catch(() => null),
        apiFetch("/api/billing/bills").catch(() => null),
        apiFetch("/api/clients").catch(() => null),
        apiFetch("/api/operational-projects").catch(() => null),
        apiFetch("/api/vendors").catch(() => null),
      ]);

      const invPage = invRes && invRes.ok ? await invRes.json() : [];
      const invList = Array.isArray(invPage) ? invPage : invPage.content || [];

      const billsList = billsRes && billsRes.ok ? await billsRes.json() : [];
      const rawBills: any[] = Array.isArray(billsList) ? billsList : [];

      const rawClients: any[] = clientsRes && clientsRes.ok ? await clientsRes.json() : [];
      const rawProjects: any[] = projectsRes && projectsRes.ok ? await projectsRes.json() : [];
      const rawVendors: any[] = vendorsRes && vendorsRes.ok ? await vendorsRes.json() : [];

      // Mappings
      const clientMap = new Map<string, any>();
      const clientListFormatted: { id: string; fullName: string; reference?: string }[] = [];
      if (Array.isArray(rawClients)) {
        rawClients.forEach((c) => {
          if (c.id) clientMap.set(String(c.id), c);
          if (c.clientReference) clientMap.set(c.clientReference, c);
          clientListFormatted.push({
            id: c.id,
            fullName: c.fullName || c.name || "Studio Client",
            reference: c.clientReference,
          });
        });
      }
      setClientsList(clientListFormatted);

      const projectMap = new Map<string, any>();
      if (Array.isArray(rawProjects)) {
        rawProjects.forEach((p) => {
          if (p.id) projectMap.set(String(p.id), p);
          if (p.projectReference) projectMap.set(p.projectReference, p);
        });
      }

      const vendorMap = new Map<string, any>();
      if (Array.isArray(rawVendors)) {
        rawVendors.forEach((v) => {
          if (v.id) vendorMap.set(String(v.id), v);
          if (v.vendorReference) vendorMap.set(v.vendorReference, v);
        });
      }

      // Calculate Total Expenses for every project across all bills & invoices
      const projectExpenseMap = new Map<string, number>();

      invList.forEach((inv: any) => {
        const pId = inv.projectId ? String(inv.projectId) : "general";
        const amt = Number(inv.totalAmount || 0);
        projectExpenseMap.set(pId, (projectExpenseMap.get(pId) || 0) + amt);
      });

      rawBills.forEach((b: any) => {
        const pId = b.projectId ? String(b.projectId) : "general";
        const amt = Number(b.amount || 0);
        projectExpenseMap.set(pId, (projectExpenseMap.get(pId) || 0) + amt);
      });

      let totalSub = 0;
      let totalApp = 0;
      let totalPaid = 0;
      let totalOut = 0;
      let pendingReview = 0;

      // 1. Process Tax / GST Invoices
      const invoiceRecords: AdminInvoiceRecord[] = invList.map((inv: any) => {
        const sub = Number(inv.subtotal || 0);
        const tax = Number(inv.taxAmount || 0);
        const tot = Number(inv.totalAmount || 0);
        const paid = Number(inv.paidAmount || 0);
        const out = Number(inv.outstandingAmount || 0);

        totalSub += sub;
        totalApp += tot;
        totalPaid += paid;
        totalOut += out;
        if (inv.status === "DRAFT" || inv.status === "ISSUED") pendingReview++;

        const pId = inv.projectId ? String(inv.projectId) : "";
        const proj = projectMap.get(pId);
        const cl = clientMap.get(String(inv.clientId));

        return {
          id: inv.id || "",
          reference: inv.invoiceNumber || inv.id || "INV",
          partyType: "Client" as const,
          partyId: inv.clientId || "",
          partyName: cl?.fullName || inv.clientName || "Studio Client",
          projectId: inv.projectId,
          projectReference: proj?.projectReference || inv.projectId,
          projectName: proj?.name || inv.projectTitle || "Architecture Project",
          invoiceDate: inv.invoiceDate || new Date().toISOString(),
          dueDate: inv.dueDate,
          submittedAt: inv.createdAt || new Date().toISOString(),
          currency: "INR" as const,
          subtotal: sub,
          taxAmount: tax,
          totalAmount: tot,
          approvedAmount: tot,
          paidAmount: paid,
          outstandingAmount: out,
          status: (inv.status === "PAID"
            ? "Paid"
            : inv.status === "PARTIALLY_PAID"
            ? "Partially Paid"
            : inv.status === "CANCELLED"
            ? "Cancelled"
            : inv.status === "ISSUED"
            ? "Approved"
            : "Draft") as AdminInvoiceStatus,
          description: inv.notes || "Professional Architectural & Turnkey Execution Services",
          attachmentCount: 1,
          lastUpdated: inv.updatedAt || new Date().toISOString(),
          projectTotalExpenses: projectExpenseMap.get(pId) || tot,
          clientId: inv.clientId,
        };
      });

      // 2. Process Trade Partner / Contractor Bills
      const billRecords: AdminInvoiceRecord[] = rawBills.map((b: any) => {
        const amt = Number(b.amount || 0);
        const paid = Number(b.paidAmount || 0);
        const out = Math.max(0, amt - paid);
        const isSettled = b.status === "PAID_CASH" || b.status === "PAID_ONLINE";
        const isApproved = isSettled || b.status === "APPROVED";

        totalSub += amt;
        totalApp += isApproved ? amt : 0;
        totalPaid += paid;
        totalOut += out;
        if (!isSettled && !isApproved) pendingReview++;

        const pId = b.projectId ? String(b.projectId) : "";
        const proj = projectMap.get(pId);
        const vendor = vendorMap.get(b.vendorId);
        const cl = clientMap.get(String(b.clientId)) || (proj ? clientMap.get(String(proj.clientId)) : null);

        return {
          id: b.id ? String(b.id) : b.billId || "BILL",
          reference: b.invoiceNumber || b.billId || "BILL",
          partyType: "Vendor" as const,
          partyId: b.vendorId || "",
          partyName: vendor?.businessName || b.vendorId || "Trade Partner",
          projectId: b.projectId,
          projectReference: proj?.projectReference || b.projectId,
          projectName: proj?.name || "Architecture Project",
          invoiceDate: b.createdAt || new Date().toISOString(),
          dueDate: undefined,
          submittedAt: b.createdAt || new Date().toISOString(),
          currency: "INR" as const,
          subtotal: amt,
          taxAmount: 0,
          totalAmount: amt,
          approvedAmount: isApproved ? amt : 0,
          paidAmount: paid,
          outstandingAmount: out,
          status: (isSettled
            ? "Paid"
            : isApproved
            ? "Approved"
            : b.status === "CASH_REQUESTED"
            ? "Payment Processing"
            : "Submitted") as AdminInvoiceStatus,
          description: b.disputeReason || b.tradeCategory ? `${b.tradeCategory || "Contractor"} — ${b.disputeReason || "On-site trade bill"}` : "Contractor Trade Bill",
          attachmentCount: b.billPhotoUrl ? 1 : 0,
          lastUpdated: b.updatedAt || b.createdAt || new Date().toISOString(),
          projectTotalExpenses: projectExpenseMap.get(pId) || amt,
          billPhotoUrl: b.billPhotoUrl,
          clientId: b.clientId || (cl ? cl.id : undefined),
        };
      });

      const allRecords = [...invoiceRecords, ...billRecords].sort(
        (a, b) => new Date(b.submittedAt || b.invoiceDate).getTime() - new Date(a.submittedAt || a.invoiceDate).getTime()
      );

      setInvoices(allRecords);
      setSummary({
        totalInvoices: allRecords.length,
        submittedAmount: totalSub,
        approvedAmount: totalApp,
        paidAmount: totalPaid,
        outstandingAmount: totalOut,
        pendingReviewCount: pendingReview,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load invoices & bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadInvoices();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadInvoices, router]);

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const baseUrl = resolveApiBaseUrl();
      const token = getAuthToken();
      const res = await fetch(`${baseUrl}/api/invoices/${invoiceId}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoiceId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading invoice PDF: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <AdminInvoiceManagement
        invoices={invoices}
        clientsList={clientsList}
        summary={summary}
        loading={loading}
        error={error ?? undefined}
        onRefresh={loadInvoices}
        onAddBill={(clientId) => {
          setDefaultBillClientId(clientId);
          setIsAddBillOpen(true);
        }}
        onNotifyWhatsApp={() => setIsNotifyWhatsAppOpen(true)}
        onDownloadAttachment={handleDownloadPdf}
        onOpenInvoice={(id) => handleDownloadPdf(id)}
      />

      <AdminCreateBillModal
        isOpen={isAddBillOpen}
        onClose={() => {
          setIsAddBillOpen(false);
          setDefaultBillClientId(undefined);
        }}
        onBillCreated={loadInvoices}
        defaultClientId={defaultBillClientId}
      />

      <AdminNotifyBillsWhatsAppModal
        isOpen={isNotifyWhatsAppOpen}
        onClose={() => setIsNotifyWhatsAppOpen(false)}
        clientsList={clientsList}
        selectedClientId={defaultBillClientId}
      />
    </div>
  );
}
