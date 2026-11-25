"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminFinanceOverview,
  type AdminFinanceData,
  type FinanceAgeingBucket,
  type FinanceMonthlyRecord,
  type FinanceRecentTransaction,
} from "@/components/portal/admin/AdminFinanceOverview";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

const SETTLED_BILL_STATUSES = new Set([
  "PAID",
  "PAID_CASH",
  "PAID_ONLINE",
  "APPROVED",
  "SETTLED",
]);

function mapBillStatus(status?: string, disputed?: boolean): FinanceRecentTransaction["status"] {
  if (disputed || status === "DISPUTED") return "Disputed";
  const st = (status || "").toUpperCase();
  if (SETTLED_BILL_STATUSES.has(st)) return "Recorded";
  if (st.includes("REJECT")) return "Rejected";
  if (st.includes("PENDING") || st.includes("CASH_REQUESTED")) return "Pending Verification";
  return "Under Review";
}

function daysBetween(isoDate?: string): number {
  if (!isoDate) return 0;
  const parsed = new Date(isoDate).getTime();
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.floor((Date.now() - parsed) / (1000 * 60 * 60 * 24)));
}

function buildAgeingBuckets(items: Array<{ amount: number; createdAt?: string }>): FinanceAgeingBucket[] {
  const buckets = [
    { label: "Current (0 - 7 Days)", amount: 0, invoiceCount: 0 },
    { label: "8 - 30 Days", amount: 0, invoiceCount: 0 },
    { label: "31 - 60 Days", amount: 0, invoiceCount: 0 },
    { label: "Over 60 Days", amount: 0, invoiceCount: 0 },
  ];
  for (const item of items) {
    const age = daysBetween(item.createdAt);
    const idx = age <= 7 ? 0 : age <= 30 ? 1 : age <= 60 ? 2 : 3;
    buckets[idx].amount += item.amount;
    buckets[idx].invoiceCount += 1;
  }
  return buckets;
}

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
      const [dashRes, billsRes, cashRes, clientsRes, vendorsRes] = await Promise.all([
        apiFetch("/api/dashboards/admin").catch(() => null),
        apiFetch("/api/billing/bills").catch(() => null),
        apiFetch("/api/finance/cash/all").catch(() => null),
        apiFetch("/api/clients").catch(() => null),
        apiFetch("/api/vendors").catch(() => null),
      ]);

      const d = dashRes && dashRes.ok ? await dashRes.json().catch(() => ({})) : {};
      const bills: any[] = billsRes && billsRes.ok ? await billsRes.json().catch(() => []) : [];
      const settlements: any[] = cashRes && cashRes.ok ? await cashRes.json().catch(() => []) : [];
      const clients: any[] = clientsRes && clientsRes.ok ? await clientsRes.json().catch(() => []) : [];
      const vendors: any[] = vendorsRes && vendorsRes.ok ? await vendorsRes.json().catch(() => []) : [];

      const clientNameMap = new Map<string, string>();
      for (const c of Array.isArray(clients) ? clients : []) {
        if (c.id) clientNameMap.set(String(c.id).toLowerCase(), c.fullName || c.clientReference);
        if (c.clientReference) clientNameMap.set(String(c.clientReference).toLowerCase(), c.fullName);
      }

      const vendorNameMap = new Map<string, string>();
      for (const v of Array.isArray(vendors) ? vendors : []) {
        if (v.id) vendorNameMap.set(String(v.id).toLowerCase(), v.businessName || v.vendorReference);
        if (v.vendorReference) vendorNameMap.set(String(v.vendorReference).toLowerCase(), v.businessName);
      }

      let settledTotal = 0;
      let pendingVendorTotal = 0;
      let pendingClientFundingTotal = 0;
      let overdueVendorTotal = 0;

      const unsettledBillsForAgeing: Array<{ amount: number; createdAt?: string }> = [];
      const clientPendingForAgeing: Array<{ amount: number; createdAt?: string }> = [];
      const monthMap = new Map<string, FinanceMonthlyRecord>();
      const transactions: FinanceRecentTransaction[] = [];

      const ensureMonth = (iso?: string) => {
        const dt = iso ? new Date(iso) : new Date();
        const safeDate = Number.isNaN(dt.getTime()) ? new Date() : dt;
        const key = `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap.has(key)) {
          const label = safeDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
          monthMap.set(key, {
            period: label,
            receivables: 0,
            payables: 0,
            collections: 0,
            payments: 0,
          });
        }
        return monthMap.get(key)!;
      };

      for (const bill of Array.isArray(bills) ? bills : []) {
        const amt = Number(bill.amount || 0);
        const st = String(bill.status || "").toUpperCase();
        const isSettled = SETTLED_BILL_STATUSES.has(st);
        const monthBucket = ensureMonth(bill.createdAt);

        if (isSettled) {
          const paidAmt = Number(bill.paidAmount || 0) > 0 ? Number(bill.paidAmount) : amt;
          settledTotal += paidAmt;
          monthBucket.collections += paidAmt;
          monthBucket.payments += paidAmt;
        } else {
          pendingVendorTotal += amt;
          monthBucket.payables += amt;
          unsettledBillsForAgeing.push({ amount: amt, createdAt: bill.createdAt });
          if (daysBetween(bill.createdAt) > 30) {
            overdueVendorTotal += amt;
          }
          if (bill.clientId) {
            pendingClientFundingTotal += amt;
            monthBucket.receivables += amt;
            clientPendingForAgeing.push({ amount: amt, createdAt: bill.createdAt });
          }
        }

        const vKey = String(bill.vendorId || "").toLowerCase();
        const resolvedParty =
          vendorNameMap.get(vKey) ||
          bill.vendorId ||
          "Registered Trade Partner";

        transactions.push({
          id: String(bill.billId || bill.id),
          reference: bill.invoiceNumber || bill.billId || "BILL",
          partyName: resolvedParty,
          partyType: "Vendor",
          description: bill.disputeReason || bill.tradeCategory || "Project contractor bill",
          amount: amt,
          date: bill.createdAt || new Date().toISOString(),
          status: mapBillStatus(bill.status, bill.disputed),
          direction: "Payable",
        });
      }

      let verifiedCashCount = 0;
      let disputedCashCount = 0;
      let cashCollections = 0;

      for (const csh of Array.isArray(settlements) ? settlements : []) {
        const st = String(csh.financeApprovalStatus || csh.status || "").toUpperCase();
        const cpSt = String(csh.counterpartyStatus || "").toUpperCase();
        const amt = Number(csh.amount || 0);
        const monthBucket = ensureMonth(csh.createdAt);

        if (st.includes("VERIFIED") || st.includes("SETTLED") || st === "APPROVED") {
          verifiedCashCount += 1;
          cashCollections += amt;
          monthBucket.payments += amt;
        } else if (st.includes("DISPUT") || st.includes("REJECT") || cpSt.includes("DISPUT") || cpSt.includes("REJECT")) {
          disputedCashCount += 1;
        } else {
          monthBucket.payables += amt;
        }

        const cpKey = String(csh.counterpartyId || "").toLowerCase();
        transactions.push({
          id: String(csh.settlementRef || csh.id),
          reference: csh.settlementRef || "CASH",
          partyName: vendorNameMap.get(cpKey) || clientNameMap.get(cpKey) || csh.counterpartyId || "Counterparty",
          partyType: "Vendor",
          description: csh.sitePurpose || "Two-party site cash settlement",
          amount: amt,
          date: csh.createdAt || new Date().toISOString(),
          status:
            st.includes("VERIFIED") || st.includes("SETTLED")
              ? "Recorded"
              : st.includes("DISPUT") || cpSt.includes("DISPUT")
              ? "Disputed"
              : st.includes("REJECT") || cpSt.includes("REJECT")
              ? "Rejected"
              : "Pending Verification",
          direction: "Payable",
        });
      }

      const apiReceivables = Number(d.totalReceivables || 0);
      const totalReceivables = apiReceivables > 0 ? apiReceivables : pendingClientFundingTotal;
      const overdueReceivables = Number(d.overdueReceivables || 0);

      const aging = d.aging || {};
      const hasApiAging =
        Number(aging.current || 0) +
          Number(aging.days1To30 || 0) +
          Number(aging.days31To60 || 0) +
          Number(aging.daysOver60 || 0) >
        0;

      const receivablesAgeing = hasApiAging
        ? [
            { label: "Current (0 - 7 Days)", amount: Number(aging.current || 0), invoiceCount: 1 },
            { label: "8 - 30 Days", amount: Number(aging.days1To30 || 0), invoiceCount: 1 },
            { label: "31 - 60 Days", amount: Number(aging.days31To60 || 0), invoiceCount: 0 },
            { label: "Over 60 Days", amount: Number(aging.daysOver60 || 0), invoiceCount: 0 },
          ]
        : buildAgeingBuckets(clientPendingForAgeing);

      const payablesAgeing = buildAgeingBuckets(unsettledBillsForAgeing);

      transactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const monthlyRecords = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v);

      const financeData: AdminFinanceData = {
        currency: "INR",
        reportingPeriod: `FY ${new Date().getFullYear()}-${String((new Date().getFullYear() + 1) % 100).padStart(2, "0")}`,
        generatedAt: new Date().toISOString(),
        totalReceivables,
        totalPayables: pendingVendorTotal,
        overdueReceivables,
        overduePayables: overdueVendorTotal,
        collectionsThisPeriod: settledTotal,
        paymentsThisPeriod: settledTotal + cashCollections,
        pendingClientPayments: pendingClientFundingTotal,
        pendingVendorPayments: pendingVendorTotal,
        verifiedCashSettlements: verifiedCashCount,
        disputedCashSettlements: disputedCashCount,
        receivablesAgeing,
        payablesAgeing,
        monthlyRecords,
        recentTransactions: transactions.slice(0, 20),
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

  const handleExportCsvReport = () => {
    if (!data) return;
    const rows = [
      ["ArcheOn Design Studio — Finance Overview Statement", data.reportingPeriod],
      ["Generated At", new Date(data.generatedAt).toLocaleString("en-IN")],
      [],
      ["Metric", "Value (INR / Count)"],
      ["Total Client Receivables", String(data.totalReceivables)],
      ["Total Vendor Payables (Pending Bills)", String(data.totalPayables)],
      ["Settled Collections & Verified Bills", String(data.collectionsThisPeriod)],
      ["Total Disbursed Payments (Online + Cash)", String(data.paymentsThisPeriod)],
      ["Pending Client-Funded Bills", String(data.pendingClientPayments)],
      ["Pending Vendor Payouts", String(data.pendingVendorPayments)],
      ["Verified Cash Settlements (Count)", String(data.verifiedCashSettlements)],
      ["Disputed Cash Settlements (Count)", String(data.disputedCashSettlements)],
      [],
      ["Reference", "Party", "Type", "Direction", "Amount (INR)", "Status", "Date", "Description"],
      ...data.recentTransactions.map((t) => [
        t.reference,
        t.partyName,
        t.partyType,
        t.direction,
        String(t.amount),
        t.status,
        t.date,
        t.description.replace(/"/g, "'"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ArcheOn_Studio_Finance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      <AdminFinanceOverview
        data={data}
        loading={loading}
        error={error ?? undefined}
        onOpenReceivables={() => router.push("/admin/invoices")}
        onOpenPayables={() => router.push("/admin/invoices")}
        onOpenInvoices={() => router.push("/admin/invoices")}
        onOpenCashSettlements={() => router.push("/admin/cash-settlements")}
        onOpenTransaction={() => router.push("/admin/invoices")}
        onExportReport={handleExportCsvReport}
      />
    </div>
  );
}
