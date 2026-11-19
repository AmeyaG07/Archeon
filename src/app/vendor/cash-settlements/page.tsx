"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  VendorCashSettlement,
  type VendorCashSettlementRecord,
  type VendorSettlementAcknowledgement,
  type VendorSettlementStatus,
} from "@/components/portal/vendor/VendorCashSettlement";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function VendorCashSettlementsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [settlements, setSettlements] = useState<VendorCashSettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const loadSettlements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/finance/cash/my-settlements");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: VendorCashSettlementRecord[] = list.map((s: any) => {
          const isAck = s.counterpartyStatus === "ACKNOWLEDGED";
          const isDisp = s.counterpartyStatus === "DISPUTED";
          const isVer = s.financeApprovalStatus === "APPROVED";
          const isRej = s.financeApprovalStatus === "REJECTED";

          const status: VendorSettlementStatus = isVer
            ? "Finance Verified"
            : isRej
            ? "Rejected"
            : isDisp
            ? "Disputed"
            : isAck
            ? "Finance Verification Pending"
            : "Pending Acknowledgement";

          return {
            id: s.settlementRef || s.id || "",
            referenceCode: s.settlementRef || "CSH",
            projectName: s.projectId || "Site Operations",
            settlementAmount: Number(s.amount || 0),
            settlementDate: s.createdAt || new Date().toISOString(),
            recordedBy: s.initiator || "Site Supervisor",
            description: s.sitePurpose,
            status,
            vendorAcknowledgedAt: s.counterpartyRespondedAt,
            financeVerifiedAt: s.financeApprovedAt,
            financeRemark: s.counterpartyNotes,
            disputeReason: s.counterpartyNotes,
          };
        });
        setSettlements(records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load cash vouchers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadSettlements();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadSettlements, router]);

  const handleSubmitDecision = async (decision: VendorSettlementAcknowledgement) => {
    setSubmittingId(decision.settlementId);
    try {
      await apiFetch(`/api/finance/cash/${decision.settlementId}/respond`, {
        method: "POST",
        body: {
          acknowledge: decision.decision === "ACKNOWLEDGE",
          notes: decision.disputeReason || (decision.decision === "ACKNOWLEDGE" ? "Cash received on site" : "Disputed amount"),
        },
      });
      await loadSettlements();
    } catch (err: unknown) {
      alert("Error submitting cash acknowledgement: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmittingId(undefined);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <VendorCashSettlement
        settlements={settlements}
        loading={loading}
        submittingId={submittingId}
        error={error ?? undefined}
        onRefresh={loadSettlements}
        onSubmitDecision={handleSubmitDecision}
      />
    </div>
  );
}
