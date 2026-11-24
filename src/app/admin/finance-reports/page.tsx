"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminFinanceOverview,
  type AdminFinanceData,
} from "@/components/portal/admin/AdminFinanceOverview";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminFinanceReportsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<AdminFinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/dashboards/admin");
      const d = await res.json();

      const aging = d.aging || {};
      const current = Number(aging.current || 0);
      const d1To30 = Number(aging.days1To30 || 0);
      const d31To60 = Number(aging.days31To60 || 0);
      const dOver60 = Number(aging.daysOver60 || 0);

      const financeData: AdminFinanceData = {
        currency: "INR",
        reportingPeriod: "FY 2026-27",
        generatedAt: new Date().toISOString(),
        totalReceivables: Number(d.totalReceivables || 0),
        totalPayables: 0,
        overdueReceivables: Number(d.overdueReceivables || 0),
        overduePayables: 0,
        collectionsThisPeriod: 0,
        paymentsThisPeriod: 0,
        pendingClientPayments: Number(d.pendingApprovalsCount || 0),
        pendingVendorPayments: Number(d.pendingCashSettlementsCount || 0),
        verifiedCashSettlements: 0,
        disputedCashSettlements: 0,
        receivablesAgeing: [
          { label: "Current", amount: current, invoiceCount: 1 },
          { label: "1 - 30 Days", amount: d1To30, invoiceCount: 1 },
          { label: "31 - 60 Days", amount: d31To60, invoiceCount: 0 },
          { label: "Over 60 Days", amount: dOver60, invoiceCount: 0 },
        ],
        payablesAgeing: [
          { label: "Current", amount: 0, invoiceCount: 0 },
          { label: "1 - 30 Days", amount: 0, invoiceCount: 0 },
          { label: "31 - 60 Days", amount: 0, invoiceCount: 0 },
          { label: "Over 60 Days", amount: 0, invoiceCount: 0 },
        ],
        monthlyRecords: [],
        recentTransactions: [],
      };

      setData(financeData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load finance reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadFinanceData();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadFinanceData, router]);

  return (
    <div className="w-full">
      <AdminFinanceOverview
        data={data}
        loading={loading}
        error={error ?? undefined}
        onRefresh={loadFinanceData}
        onOpenInvoices={() => router.push("/admin/invoices")}
        onOpenCashSettlements={() => router.push("/admin/cash-settlements")}
      />
    </div>
  );
}
