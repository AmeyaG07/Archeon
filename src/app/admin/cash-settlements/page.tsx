"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminCashSettlementManagement,
  type AdminCashSettlementRecord,
  type CashSettlementSummary,
  type CashFinanceDecision,
} from "@/components/portal/admin/AdminCashSettlementManagement";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminCashSettlementsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [settlements, setSettlements] = useState<AdminCashSettlementRecord[]>([]);
  const [summary, setSummary] = useState<CashSettlementSummary | undefined>();
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const loadSettlements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/finance/cash/all");
      const list = await res.json();
      if (Array.isArray(list)) {
        let totalVal = 0;
        let awaitingVend = 0;
        let awaitingFin = 0;
        let verified = 0;
        let disputed = 0;

        const records: AdminCashSettlementRecord[] = list.map((s: any) => {
          const amt = Number(s.amount || 0);
          totalVal += amt;

          const isAwaitingVendor = s.counterpartyStatus === "PENDING";
          const isAcknowledged = s.counterpartyStatus === "ACKNOWLEDGED";
          const isDisputed = s.counterpartyStatus === "DISPUTED";
          const isVerified = s.financeApprovalStatus === "APPROVED";
          const isRejected = s.financeApprovalStatus === "REJECTED";

          if (isVerified) verified++;
          else if (isDisputed) disputed++;
          else if (isAwaitingVendor) awaitingVend++;
          else if (isAcknowledged) awaitingFin++;

          const overallStatus = isVerified
            ? "Verified"
            : isRejected
            ? "Rejected"
            : isDisputed
            ? "Disputed"
            : isAcknowledged
            ? "Awaiting Finance Verification"
            : "Awaiting Acknowledgement";

          const currentUsername = user?.username || "";
          const isInitiator = s.initiator === currentUsername;

          return {
            id: s.settlementRef || s.id || "",
            reference: s.settlementRef || "CSH",
            vendorId: s.counterpartyId || "",
            vendorName: `Trade Partner ${s.counterpartyId?.slice(0, 8) || ""}`,
            projectId: s.projectId,
            projectReference: s.projectId,
            projectName: "Site Operations",
            amount: amt,
            currency: "INR" as const,
            initiatedBy: s.initiator || "Site Supervisor",
            initiatedAt: s.createdAt || new Date().toISOString(),
            settlementDate: s.createdAt,
            settlementDescription: s.sitePurpose || "Emergency on-site material & labor cash settlement",
            vendorAcknowledgement: (isAcknowledged ? "Acknowledged" : isDisputed ? "Disputed" : "Pending") as any,
            vendorAcknowledgedAt: s.counterpartyRespondedAt,
            vendorResponse: s.counterpartyNotes,
            financeStatus: (isVerified ? "Verified" : isRejected ? "Rejected" : isDisputed ? "Disputed" : isAcknowledged ? "Pending Verification" : "Awaiting Vendor") as any,
            financeVerifiedBy: s.financeApprover,
            financeVerifiedAt: s.financeApprovedAt,
            overallStatus: overallStatus as any,
            evidenceCount: 1,
            hasRequiredEvidence: true,
            currentUserCanVerify: !isInitiator && isAcknowledged && !isVerified,
            currentUserInitiated: isInitiator,
            history: [
              {
                id: "h1",
                actorName: s.initiator || "Supervisor",
                actorRole: "Initiator",
                action: "Initiated Cash Settlement",
                remarks: s.sitePurpose,
                timestamp: s.createdAt || new Date().toISOString(),
              },
              ...(s.counterpartyRespondedAt
                ? [{
                    id: "h2",
                    actorName: "Vendor Counterparty",
                    actorRole: "Recipient",
                    action: isAcknowledged ? "Acknowledged Cash Receipt" : "Disputed Cash Amount",
                    remarks: s.counterpartyNotes,
                    timestamp: s.counterpartyRespondedAt,
                  }]
                : []),
              ...(s.financeApprovedAt
                ? [{
                    id: "h3",
                    actorName: s.financeApprover || "Finance",
                    actorRole: "Auditor",
                    action: "Finance Verified & Cleared",
                    timestamp: s.financeApprovedAt,
                  }]
                : []),
            ],
          };
        });

        setSettlements(records);
        setSummary({
          totalCount: records.length,
          totalValue: totalVal,
          awaitingVendor: awaitingVend,
          awaitingFinance: awaitingFin,
          verifiedCount: verified,
          disputedCount: disputed,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load cash settlements");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadSettlements();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadSettlements, router]);

  const handleSubmitFinanceDecision = async (
    settlementId: string,
    decision: CashFinanceDecision
  ) => {
    setProcessingId(settlementId);
    try {
      if (decision.decision === "Verify") {
        await apiFetch(`/api/finance/cash/${settlementId}/approve`, {
          method: "POST",
        });
      } else {
        await apiFetch(`/api/finance/cash/${settlementId}/respond`, {
          method: "POST",
          body: { acknowledge: false, notes: decision.remarks || "Rejected by finance" },
        });
      }
      await loadSettlements();
    } catch (err: unknown) {
      alert("Finance action failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setProcessingId(undefined);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <AdminCashSettlementManagement
        settlements={settlements}
        summary={summary}
        loading={loading}
        processingSettlementId={processingId}
        error={error ?? undefined}
        onRefresh={loadSettlements}
        onSubmitFinanceDecision={handleSubmitFinanceDecision}
      />
    </div>
  );
}
