"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArchitectRevenueLedger,
  type LedgerEntryRecord,
  type StoredAuditReportRecord,
  type PartyOption,
} from "@/components/portal/admin/ArchitectRevenueLedger";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminArchitectRevenuePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [entries, setEntries] = useState<LedgerEntryRecord[]>([]);
  const [reports, setReports] = useState<StoredAuditReportRecord[]>([]);
  const [clients, setClients] = useState<PartyOption[]>([]);
  const [vendors, setVendors] = useState<PartyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eRes, rRes, cRes, vRes] = await Promise.all([
        apiFetch("/api/architect-ledger/entries"),
        apiFetch("/api/architect-ledger/reports"),
        apiFetch("/api/clients").catch(() => null),
        apiFetch("/api/vendors").catch(() => null),
      ]);

      if (!eRes.ok) {
        const body = await eRes.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load revenue ledger (HTTP ${eRes.status})`);
      }

      const [eData, rData] = await Promise.all([
        eRes.json(),
        rRes.ok ? rRes.json() : Promise.resolve([]),
      ]);

      setEntries(Array.isArray(eData) ? eData : []);
      setReports(Array.isArray(rData) ? rData : []);

      if (cRes && cRes.ok) {
        const cList = await cRes.json();
        if (Array.isArray(cList)) {
          setClients(
            cList.map((c: any) => ({
              id: String(c.id),
              name: c.fullName || c.name || "Client",
              reference: c.clientReference,
            }))
          );
        }
      }

      if (vRes && vRes.ok) {
        const vList = await vRes.json();
        if (Array.isArray(vList)) {
          setVendors(
            vList.map((v: any) => ({
              id: String(v.id),
              name: v.businessName || v.name || "Vendor",
              reference: v.vendorReference,
            }))
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load architect revenue ledger.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadAll();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadAll, router]);

  const handleAddEntry = async (payload: {
    entryType: "REVENUE" | "EXPENSE";
    sourceType: "CLIENT" | "VENDOR" | "DIRECT";
    sourceId?: string;
    sourceName?: string;
    amount: number;
    transactionDate: string;
    paymentMode: string;
    category: string;
    referenceNumber?: string;
    notes?: string;
  }) => {
    const res = await apiFetch("/api/architect-ledger/entries", {
      method: "POST",
      body: payload,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to save entry (HTTP ${res.status})`);
    }
    await loadAll();
  };

  const handleDeleteEntry = async (id: string) => {
    const res = await apiFetch(`/api/architect-ledger/entries/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Failed to remove entry.");
      return;
    }
    await loadAll();
  };

  const handleClearAllData = async () => {
    setError(null);
    const res = await apiFetch("/api/architect-ledger/clear", {
      method: "DELETE",
    });
    if (!res.ok) {
      setError(`Failed to empty Excel & ledger data (HTTP ${res.status})`);
      return;
    }
    await loadAll();
  };

  const handleGenerateReport = async (payload: {
    periodFilter: "MONTHLY" | "QUARTERLY" | "YEARLY" | "ALL";
    year: number;
    month?: number;
    quarter?: number;
  }): Promise<StoredAuditReportRecord | null> => {
    setError(null);
    const res = await apiFetch("/api/architect-ledger/reports", {
      method: "POST",
      body: payload,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || `Failed to generate CA report (HTTP ${res.status})`);
      return null;
    }
    const created = (await res.json()) as StoredAuditReportRecord;
    await loadAll();
    return created;
  };

  const handleDownloadReport = async (reportId: string, filename: string) => {
    const res = await apiFetch(`/api/architect-ledger/reports/${reportId}/download`);
    if (!res.ok) {
      setError("Failed to download stored CA audit workbook.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ArchitectRevenueLedger
      entries={entries}
      reports={reports}
      clients={clients}
      vendors={vendors}
      loading={loading}
      error={error}
      onAddEntry={handleAddEntry}
      onDeleteEntry={handleDeleteEntry}
      onClearAllData={handleClearAllData}
      onGenerateReport={handleGenerateReport}
      onDownloadReport={handleDownloadReport}
    />
  );
}
