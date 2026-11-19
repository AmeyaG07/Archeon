"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  VendorInvoiceHistory,
  type VendorInvoiceRecord,
  type VendorInvoiceStatus,
} from "@/components/portal/vendor/VendorInvoiceHistory";
import {
  VendorInvoiceSubmissionForm,
  type VendorInvoiceSubmissionData,
} from "@/components/portal/vendor/VendorInvoiceSubmissionForm";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { Plus, ListFilter } from "lucide-react";

export default function VendorInvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [invoices, setInvoices] = useState<VendorInvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/approvals");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: VendorInvoiceRecord[] = list.map((a: any) => {
          const amt = Number(a.amount || 0);
          const isApproved = !!a.secondApprover || !!a.firstApprover;
          const isRejected = a.status === "REJECTED";

          const status: VendorInvoiceStatus = isRejected
            ? "Rejected"
            : isApproved
            ? "Approved"
            : "Submitted";

          return {
            id: a.billId || a.id || "",
            invoiceNumber: a.billId || "BILL",
            projectName: "Contract Package Execution",
            projectReference: a.projectId || "PROJ-SITE",
            invoiceDate: a.createdAt || new Date().toISOString(),
            submittedAt: a.createdAt || new Date().toISOString(),
            dueDate: a.dueDate || "Due upon approval",
            submittedAmount: amt,
            approvedAmount: isApproved ? amt : undefined,
            paidAmount: isApproved ? amt : 0,
            status,
            financeRemark: a.rejectionReason,
            lastUpdatedAt: a.updatedAt || new Date().toISOString(),
          };
        });
        setInvoices(records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
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

  const handleInvoiceSubmit = async (data: VendorInvoiceSubmissionData) => {
    setSubmitting(true);
    setError(null);
    try {
      // Calculate total from line items
      const total = data.lineItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        0
      );

      await apiFetch("/api/approvals/initiate", {
        method: "POST",
        body: {
          billId: data.invoiceNumber || `BILL-${Date.now().toString().slice(-6)}`,
          amount: total > 0 ? total : 50000.0,
          vendorId: user?.username || "vendor",
          clientId: "client-system",
          projectId: data.projectId || "PROJ-SITE",
        },
      });

      setShowForm(false);
      await loadInvoices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <h1 className="font-serif text-3xl text-[#111111]">
          {showForm ? "Submit New Trade Invoice" : "Contractor Billing & Invoices"}
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-[#25221D] text-white text-xs font-mono uppercase tracking-wider transition-all"
        >
          {showForm ? (
            <>
              <ListFilter className="w-3.5 h-3.5" /> View Invoices Queue
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Submit New Invoice
            </>
          )}
        </button>
      </div>

      {showForm ? (
        <div className="max-w-4xl mx-auto">
          <VendorInvoiceSubmissionForm
            projects={[
              { id: "PROJ-SITE-1", projectName: "Alibaug Luxury Villa - Civil", referenceCode: "PRJ-ALB-001" },
              { id: "PROJ-SITE-2", projectName: "Bandra Penthouse - Millwork", referenceCode: "PRJ-BND-002" },
            ]}
            submitting={submitting}
            error={error ?? undefined}
            onSubmit={handleInvoiceSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <VendorInvoiceHistory
          invoices={invoices}
          loading={loading}
          error={error ?? undefined}
          onRefresh={loadInvoices}
          onOpenInvoice={() => {}}
        />
      )}
    </div>
  );
}
