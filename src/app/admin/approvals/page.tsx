"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminInvoiceApprovalWorkspace,
  type ApprovalInvoice,
  type ApprovalInvoiceStatus,
  type ApprovalWorkspaceSummary,
  type ApprovalSubmission,
} from "@/components/portal/admin/AdminInvoiceApprovalWorkspace";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminApprovalsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [invoices, setInvoices] = useState<ApprovalInvoice[]>([]);
  const [summary, setSummary] = useState<ApprovalWorkspaceSummary | undefined>();
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/approvals");
      const list = await res.json();
      if (Array.isArray(list)) {
        let pending = 0;
        let underReview = 0;
        let awaitingSecond = 0;
        let approvedToday = 0;
        let rejected = 0;

        const records: ApprovalInvoice[] = list.map((b: any) => {
          const amt = Number(b.amount || 0);
          const isHighValue = amt >= 100000;
          const isFirstApproved = !!b.firstApprover;
          const isSecondApproved = !!b.secondApprover;
          const isRejected = b.status === "REJECTED";

          if (isRejected) rejected++;
          else if (isSecondApproved || (isFirstApproved && !isHighValue)) approvedToday++;
          else if (isFirstApproved && isHighValue) { awaitingSecond++; underReview++; }
          else { pending++; }

          const status: ApprovalInvoiceStatus = isRejected
            ? "Rejected"
            : (isSecondApproved || (isFirstApproved && !isHighValue))
            ? "Approved"
            : isFirstApproved
            ? "Under Review"
            : "Submitted";

          const currentUsername = user?.username || "";
          const isInitiator = b.initiator === currentUsername;
          const alreadyApproved = b.firstApprover === currentUsername || b.secondApprover === currentUsername;
          const canApprove = !isInitiator && !alreadyApproved && !isRejected && status !== "Approved";

          return {
            id: b.billId || b.id || "",
            reference: b.billId || "BILL",
            partyType: "Vendor" as const,
            partyName: b.vendorId ? `Vendor ${b.vendorId.slice(0, 8)}` : "Trade Contractor",
            projectReference: b.projectId,
            projectName: "Contract Execution",
            invoiceDate: b.createdAt || new Date().toISOString(),
            submittedAt: b.createdAt || new Date().toISOString(),
            currency: "INR" as const,
            invoiceAmount: amt,
            previouslyApprovedAmount: 0,
            proposedApprovalAmount: amt,
            status: status as any,
            description: `Contractor billing - ${isHighValue ? "Dual Maker-Checker Required (>= ₹1L)" : "Single Approval (< ₹1L)"}`,
            invoiceDocumentCount: 1,
            hasRequiredDocuments: true,
            submittedBy: b.initiator || "Vendor",
            requiresSecondApproval: isHighValue,
            approvalCount: isSecondApproved ? 2 : isFirstApproved ? 1 : 0,
            requiredApprovalCount: isHighValue ? 2 : 1,
            currentUserCanApprove: canApprove,
            currentUserAlreadyApproved: alreadyApproved,
            history: [
              ...(b.initiator
                ? [{
                    id: "h1",
                    actorName: b.initiator,
                    actorRole: "Initiator",
                    action: "Initiated Bill Approval",
                    timestamp: b.createdAt || new Date().toISOString(),
                  }]
                : []),
              ...(b.firstApprover
                ? [{
                    id: "h2",
                    actorName: b.firstApprover,
                    actorRole: "Primary Reviewer",
                    action: "Primary Approval Granted",
                    timestamp: b.firstApprovalAt || new Date().toISOString(),
                  }]
                : []),
              ...(b.secondApprover
                ? [{
                    id: "h3",
                    actorName: b.secondApprover,
                    actorRole: "Finance Principal",
                    action: "Secondary Approval Granted",
                    timestamp: b.secondApprovalAt || new Date().toISOString(),
                  }]
                : []),
              ...(b.rejectionReason
                ? [{
                    id: "h4",
                    actorName: "Finance Auditor",
                    actorRole: "Auditor",
                    action: "Rejected",
                    remarks: b.rejectionReason,
                    timestamp: b.updatedAt || new Date().toISOString(),
                  }]
                : []),
            ],
          };
        });

        setInvoices(records);
        setSummary({
          pendingCount: pending,
          underReviewCount: underReview,
          awaitingSecondApprovalCount: awaitingSecond,
          approvedTodayCount: approvedToday,
          rejectedCount: rejected,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load approval queue");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadApprovals();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadApprovals, router]);

  const handleSubmitDecision = async (
    invoiceId: string,
    submission: ApprovalSubmission
  ) => {
    setSubmittingId(invoiceId);
    try {
      const inv = invoices.find((i) => i.id === invoiceId);
      if (submission.decision === "Reject") {
        await apiFetch(`/api/approvals/${invoiceId}/reject`, {
          method: "POST",
          body: { reason: submission.remarks || "Administrative rejection" },
        });
      } else {
        // Approve: if awaiting second approval, call approve-secondary, otherwise approve-primary
        const endpoint =
          inv?.requiresSecondApproval && inv?.approvalCount === 1
            ? `/api/approvals/${invoiceId}/approve-secondary`
            : `/api/approvals/${invoiceId}/approve-primary`;
        await apiFetch(endpoint, {
          method: "POST",
        });
      }
      await loadApprovals();
    } catch (err: unknown) {
      alert("Approval action failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmittingId(undefined);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <AdminInvoiceApprovalWorkspace
        invoices={invoices}
        summary={summary}
        loading={loading}
        submittingInvoiceId={submittingId}
        error={error ?? undefined}
        onRefresh={loadApprovals}
        onSubmitDecision={handleSubmitDecision}
      />
    </div>
  );
}
