"use client";

import { OptionalField } from "@/components/ui/OptionalField";

import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Plus,
  MinusCircle,
  FileSpreadsheet,
  Download,
  Trash2,
  Building2,
  HardHat,
  UserRound,
  Wallet,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export interface LedgerEntryRecord {
  id: string;
  entryType: "REVENUE" | "EXPENSE";
  sourceType: "CLIENT" | "VENDOR" | "DIRECT";
  sourceId?: string | null;
  sourceName?: string | null;
  amount: number;
  transactionDate: string; // YYYY-MM-DD
  paymentMode?: string | null;
  category?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt?: string;
}

export interface StoredAuditReportRecord {
  id: string;
  reportCode: string;
  title: string;
  periodFilter: string;
  reportYear: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  entryCount: number;
  generatedBy?: string;
  generatedAt: string;
}

export interface PartyOption {
  id: string;
  name: string;
  reference?: string;
}

interface ArchitectRevenueLedgerProps {
  entries: LedgerEntryRecord[];
  reports: StoredAuditReportRecord[];
  clients: PartyOption[];
  vendors: PartyOption[];
  loading: boolean;
  error?: string | null;
  onAddEntry: (payload: {
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
  }) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onClearAllData?: () => Promise<void>;
  onGenerateReport: (payload: {
    periodFilter: "MONTHLY" | "QUARTERLY" | "YEARLY" | "ALL";
    year: number;
    month?: number;
    quarter?: number;
  }) => Promise<StoredAuditReportRecord | null>;
  onDownloadReport: (reportId: string, filename: string) => Promise<void>;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const REVENUE_CATEGORIES = [
  "Architectural Fee",
  "Interior Design Fee",
  "Turnkey Management",
  "Vendor Share / Commission",
  "Site Consultation",
  "Retainer / Milestone",
  "Other Income",
];

const EXPENSE_CATEGORIES = [
  "Site Visit & Travel",
  "Studio Rent & Utilities",
  "Consultant / Drafting Fee",
  "Software & Tools",
  "Material Samples & Prints",
  "Staff & Operations",
  "Miscellaneous Expense",
];

function formatInr(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val || 0);
}

function formatCompactInr(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${Math.round(val)}`;
}

export function ArchitectRevenueLedger({
  entries,
  reports,
  clients,
  vendors,
  loading,
  error,
  onAddEntry,
  onDeleteEntry,
  onClearAllData,
  onGenerateReport,
  onDownloadReport,
}: ArchitectRevenueLedgerProps) {
  const [clearingAll, setClearingAll] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [timeframeView, setTimeframeView] = useState<"MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");

  // Entry Form State
  const [entryType, setEntryType] = useState<"REVENUE" | "EXPENSE">("REVENUE");
  const [sourceType, setSourceType] = useState<"CLIENT" | "VENDOR" | "DIRECT">("CLIENT");
  const [sourceId, setSourceId] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [txDate, setTxDate] = useState<string>(now.toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<string>("BANK_TRANSFER");
  const [category, setCategory] = useState<string>("Architectural Fee");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formFeedback, setFormFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Ledger Filter State
  const [registerFilter, setRegisterFilter] = useState<"ALL" | "REVENUE" | "CLIENT" | "VENDOR" | "EXPENSE">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [hoveredLineIdx, setHoveredLineIdx] = useState<number | null>(null);

  // CA Report Generation State
  const [reportPeriod, setReportPeriod] = useState<"MONTHLY" | "QUARTERLY" | "YEARLY" | "ALL">("YEARLY");
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);

  const availableYears = useMemo(() => {
    const yrs = new Set<number>([now.getFullYear(), now.getFullYear() - 1, now.getFullYear() + 1]);
    entries.forEach((e) => {
      const y = Number(String(e.transactionDate || "").slice(0, 4));
      if (!isNaN(y) && y > 2000) yrs.add(y);
    });
    return Array.from(yrs).sort((a, b) => b - a);
  }, [entries, now]);

  const currentQuarter = Math.floor((selectedMonth - 1) / 3) + 1;

  // Aggregates for KPIs & Charts
  const analytics = useMemo(() => {
    const monthlyRev = Array(12).fill(0) as number[];
    const monthlyExp = Array(12).fill(0) as number[];

    let selectedMonthRev = 0;
    let selectedMonthExp = 0;
    let selectedQuarterRev = 0;
    let selectedQuarterExp = 0;
    let selectedYearRev = 0;
    let selectedYearExp = 0;
    let clientRev = 0;
    let vendorRev = 0;
    let directRev = 0;
    let allTimeRev = 0;
    let allTimeExp = 0;

    entries.forEach((e) => {
      const amt = Number(e.amount || 0);
      const parts = String(e.transactionDate || "").split("-");
      const y = Number(parts[0]);
      const m = Number(parts[1]);

      if (e.entryType === "EXPENSE") {
        allTimeExp += amt;
      } else {
        allTimeRev += amt;
        if (e.sourceType === "CLIENT") clientRev += amt;
        else if (e.sourceType === "VENDOR") vendorRev += amt;
        else directRev += amt;
      }

      if (y === selectedYear && m >= 1 && m <= 12) {
        if (e.entryType === "EXPENSE") {
          monthlyExp[m - 1] += amt;
          selectedYearExp += amt;
          if (m === selectedMonth) selectedMonthExp += amt;
          if (Math.floor((m - 1) / 3) + 1 === currentQuarter) selectedQuarterExp += amt;
        } else {
          monthlyRev[m - 1] += amt;
          selectedYearRev += amt;
          if (m === selectedMonth) selectedMonthRev += amt;
          if (Math.floor((m - 1) / 3) + 1 === currentQuarter) selectedQuarterRev += amt;
        }
      }
    });

    const cumulativeRev: number[] = [];
    const cumulativeNet: number[] = [];
    let runningRev = 0;
    let runningNet = 0;
    for (let i = 0; i < 12; i++) {
      runningRev += monthlyRev[i];
      runningNet += monthlyRev[i] - monthlyExp[i];
      cumulativeRev.push(runningRev);
      cumulativeNet.push(runningNet);
    }

    const quarters = [0, 1, 2, 3].map((qIdx) => {
      const mStart = qIdx * 3;
      const rev = monthlyRev[mStart] + monthlyRev[mStart + 1] + monthlyRev[mStart + 2];
      const exp = monthlyExp[mStart] + monthlyExp[mStart + 1] + monthlyExp[mStart + 2];
      return {
        label: `Q${qIdx + 1}`,
        monthsLabel: `${MONTH_LABELS[mStart]}–${MONTH_LABELS[mStart + 2]}`,
        rev,
        exp,
        net: rev - exp,
      };
    });

    return {
      monthlyRev,
      monthlyExp,
      cumulativeRev,
      cumulativeNet,
      quarters,
      selectedMonthRev,
      selectedMonthExp,
      selectedQuarterRev,
      selectedQuarterExp,
      selectedYearRev,
      selectedYearExp,
      clientRev,
      vendorRev,
      directRev,
      allTimeRev,
      allTimeExp,
      netBalance: selectedYearRev - selectedYearExp,
    };
  }, [entries, selectedYear, selectedMonth, currentQuarter]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((e) => {
      if (registerFilter === "REVENUE" && e.entryType !== "REVENUE") return false;
      if (registerFilter === "EXPENSE" && e.entryType !== "EXPENSE") return false;
      if (registerFilter === "CLIENT" && e.sourceType !== "CLIENT") return false;
      if (registerFilter === "VENDOR" && e.sourceType !== "VENDOR") return false;

      if (q) {
        const hay = `${e.sourceName || ""} ${e.category || ""} ${e.referenceNumber || ""} ${e.notes || ""} ${e.sourceType}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, registerFilter, searchQuery]);

  const handleSwitchEntryType = (nextType: "REVENUE" | "EXPENSE") => {
    setEntryType(nextType);
    setCategory(nextType === "REVENUE" ? REVENUE_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSwitchSourceType = (nextSource: "CLIENT" | "VENDOR" | "DIRECT") => {
    setSourceType(nextSource);
    setSourceId("");
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);
    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormFeedback({ type: "err", msg: "Please enter a valid amount greater than ₹0." });
      return;
    }

    let resolvedSourceName: string | undefined;
    if (sourceType === "CLIENT" && sourceId) {
      resolvedSourceName = clients.find((c) => c.id === sourceId)?.name;
    } else if (sourceType === "VENDOR" && sourceId) {
      resolvedSourceName = vendors.find((v) => v.id === sourceId)?.name;
    }

    setSubmitting(true);
    try {
      await onAddEntry({
        entryType,
        sourceType: sourceType !== "DIRECT" && !sourceId ? "DIRECT" : sourceType,
        sourceId: sourceType !== "DIRECT" && sourceId ? sourceId : undefined,
        sourceName: resolvedSourceName,
        amount: parsedAmount,
        transactionDate: txDate,
        paymentMode,
        category,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setAmountInput("");
      setReferenceNumber("");
      setNotes("");
      setFormFeedback({
        type: "ok",
        msg: `${entryType === "REVENUE" ? "Amount received" : "Expense"} (${formatInr(parsedAmount)}) recorded in Architect Ledger.`,
      });
      setTimeout(() => setFormFeedback(null), 4000);
    } catch (err) {
      setFormFeedback({
        type: "err",
        msg: err instanceof Error ? err.message : "Failed to save ledger entry.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAndDownloadCaReport = async () => {
    setGeneratingReport(true);
    try {
      const created = await onGenerateReport({
        periodFilter: reportPeriod,
        year: selectedYear,
        month: reportPeriod === "MONTHLY" ? selectedMonth : undefined,
        quarter: reportPeriod === "QUARTERLY" ? currentQuarter : undefined,
      });
      if (created?.id) {
        await onDownloadReport(created.id, `${created.reportCode}_CA_Audit.xls`);
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  // Line Chart geometry (SVG 600x210 viewBox)
  const lineMax = Math.max(1000, ...analytics.cumulativeRev);
  const linePoints = analytics.cumulativeRev.map((val, idx) => {
    const x = 48 + idx * 48;
    const y = 175 - (val / lineMax) * 145;
    return { x, y, val, month: MONTH_LABELS[idx] };
  });
  const linePathD = linePoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  const areaPathD = `${linePathD} L ${linePoints[linePoints.length - 1].x} 175 L ${linePoints[0].x} 175 Z`;

  // Bar Chart geometry (SVG 600x210 viewBox)
  const barMax = Math.max(1000, ...analytics.monthlyRev, ...analytics.monthlyExp);

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-4 py-7 sm:px-8 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6 pb-16">
        {/* TOP HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-[#D8D6D0] pb-6">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#9F7947] font-semibold flex items-center gap-1.5">
              <ShieldCheck size={12} /> Architect Exclusive · Confidential Revenue &amp; Audit Workspace
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-[#171717]">
              Architect Revenue &amp; Expense Ledger
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#77736C]">
              Track Monthly, Quarterly, and Yearly revenue from Clients, Vendors, or direct receipts, log expenses cleanly, and store Excel workbooks for Chartered Accountant (CA) audits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter Statement Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717]"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  FY / {y}
                </option>
              ))}
            </select>

            <select
              aria-label="Select Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717]"
            >
              {MONTH_LABELS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m} {selectedYear}
                </option>
              ))}
            </select>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-2.5 border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 rounded-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* KPI CARDS: MONTHLY / QUARTERLY / YEARLY / NET */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-5 space-y-1.5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
              Monthly Revenue ({MONTH_LABELS[selectedMonth - 1]} {selectedYear})
            </p>
            <p className="font-serif text-2xl sm:text-3xl text-[#171717]">
              {formatInr(analytics.selectedMonthRev)}
            </p>
            <p className="font-mono text-[10px] text-[#77736C]">
              Monthly Expenses: {formatInr(analytics.selectedMonthExp)}
            </p>
          </div>

          <div className="rounded-sm border border-[#D8D6D0] bg-white p-5 space-y-1.5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
              Quarterly Revenue (Q{currentQuarter} {selectedYear})
            </p>
            <p className="font-serif text-2xl sm:text-3xl text-[#9F7947]">
              {formatInr(analytics.selectedQuarterRev)}
            </p>
            <p className="font-mono text-[10px] text-[#77736C]">
              Q{currentQuarter} Net: {formatInr(analytics.selectedQuarterRev - analytics.selectedQuarterExp)}
            </p>
          </div>

          <div className="rounded-sm border border-[#D8D6D0] bg-white p-5 space-y-1.5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
              Yearly Revenue ({selectedYear})
            </p>
            <p className="font-serif text-2xl sm:text-3xl text-[#171717]">
              {formatInr(analytics.selectedYearRev)}
            </p>
            <p className="font-mono text-[10px] text-[#77736C]">
              Annual Expenses: {formatInr(analytics.selectedYearExp)}
            </p>
          </div>

          <div className="rounded-sm border border-[#D8D6D0] bg-white p-5 space-y-1.5">
            <p className="font-mono text-xs uppercase tracking-widest text-[#7D5E32]">
              Net Balance ({selectedYear})
            </p>
            <p className="font-serif text-2xl sm:text-3xl text-[#171717]">
              {formatInr(analytics.netBalance)}
            </p>
            <p className="font-mono text-xs text-[#4F4B45]">
              Client: {formatCompactInr(analytics.clientRev)} · Vendor: {formatCompactInr(analytics.vendorRev)}
            </p>
          </div>
        </section>

        {/* LINE GRAPH (REVENUE GROWTH) + BAR GRAPH (MONTHLY REVENUE) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Line Graph: Cumulative Revenue Growth */}
          <div className="lg:col-span-6 rounded-sm border border-[#D8D6D0] bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFECE6] pb-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#9F7947] font-semibold flex items-center gap-1.5">
                  <TrendingUp size={12} /> Revenue Growth Trajectory
                </p>
                <h2 className="font-serif text-xl text-[#171717]">
                  Cumulative Revenue Growth ({selectedYear})
                </h2>
              </div>
              {hoveredLineIdx !== null && (
                <div className="rounded-xs border border-[#A58A64]/40 bg-[#FAF8F5] px-2.5 py-1 font-mono text-[10px] text-[#171717]">
                  {MONTH_LABELS[hoveredLineIdx]}: <strong>{formatInr(analytics.cumulativeRev[hoveredLineIdx])}</strong>
                </div>
              )}
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 620 215" className="w-full min-w-[300px] h-52">
                <defs>
                  <linearGradient id="revAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A58A64" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#A58A64" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                  const y = 175 - frac * 145;
                  return (
                    <g key={frac}>
                      <line x1="42" y1={y} x2="600" y2={y} stroke="#EFECE6" strokeWidth="1" />
                      <text x="2" y={y + 3} fontSize="9" fill="#77736C" fontFamily="monospace">
                        {formatCompactInr(lineMax * frac)}
                      </text>
                    </g>
                  );
                })}

                <path d={areaPathD} fill="url(#revAreaGrad)" />
                <path d={linePathD} fill="none" stroke="#9F7947" strokeWidth="2.5" strokeLinejoin="round" />

                {linePoints.map((pt, idx) => (
                  <g
                    key={pt.month}
                    onMouseEnter={() => setHoveredLineIdx(idx)}
                    onMouseLeave={() => setHoveredLineIdx(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredLineIdx === idx ? 5.5 : 3.5}
                      fill={hoveredLineIdx === idx ? "#171717" : "#9F7947"}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <text
                      x={pt.x}
                      y="198"
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="#55514A"
                      fontFamily="monospace"
                    >
                      {pt.month}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Bar Graph: Monthly Revenue vs Expenses */}
          <div className="lg:col-span-6 rounded-sm border border-[#D8D6D0] bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFECE6] pb-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#9F7947] font-semibold flex items-center gap-1.5">
                  <BarChart3 size={12} /> Monthly Performance Breakdown
                </p>
                <h2 className="font-serif text-xl text-[#171717]">
                  Monthly Revenue vs Expenses ({selectedYear})
                </h2>
              </div>
              <div className="flex items-center gap-3 font-mono text-[9px] uppercase text-[#55514A]">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 bg-[#A58A64] inline-block" /> Revenue
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 bg-[#171717] inline-block" /> Expense
                </span>
              </div>
            </div>

            {hoveredMonthIdx !== null && (
              <div className="rounded-xs border border-[#E4E1DA] bg-[#FAF8F5] px-3 py-1.5 font-mono text-[10px] text-[#171717] flex flex-wrap gap-4">
                <strong>{MONTH_LABELS[hoveredMonthIdx]} {selectedYear}:</strong>
                <span className="text-emerald-800">Revenue: {formatInr(analytics.monthlyRev[hoveredMonthIdx])}</span>
                <span className="text-red-700">Expense: {formatInr(analytics.monthlyExp[hoveredMonthIdx])}</span>
              </div>
            )}

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 620 215" className="w-full min-w-[300px] h-52">
                {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                  const y = 175 - frac * 145;
                  return (
                    <g key={frac}>
                      <line x1="42" y1={y} x2="600" y2={y} stroke="#EFECE6" strokeWidth="1" />
                      <text x="2" y={y + 3} fontSize="9" fill="#77736C" fontFamily="monospace">
                        {formatCompactInr(barMax * frac)}
                      </text>
                    </g>
                  );
                })}

                {MONTH_LABELS.map((month, idx) => {
                  const groupX = 48 + idx * 46;
                  const revH = (analytics.monthlyRev[idx] / barMax) * 145;
                  const expH = (analytics.monthlyExp[idx] / barMax) * 145;
                  return (
                    <g
                      key={month}
                      onMouseEnter={() => setHoveredMonthIdx(idx)}
                      onMouseLeave={() => setHoveredMonthIdx(null)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={groupX}
                        y={175 - revH}
                        width="14"
                        height={Math.max(2, revH)}
                        rx="1.5"
                        fill="#A58A64"
                      />
                      <rect
                        x={groupX + 16}
                        y={175 - expH}
                        width="14"
                        height={Math.max(2, expH)}
                        rx="1.5"
                        fill="#171717"
                      />
                      <text
                        x={groupX + 15}
                        y="198"
                        textAnchor="middle"
                        fontSize="9.5"
                        fill={idx + 1 === selectedMonth ? "#9F7947" : "#55514A"}
                        fontWeight={idx + 1 === selectedMonth ? "bold" : "normal"}
                        fontFamily="monospace"
                      >
                        {month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </section>

        {/* QUARTERLY BREAKDOWN STRIP */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {analytics.quarters.map((q) => (
            <div
              key={q.label}
              className="rounded-sm border border-[#D8D6D0] bg-white px-4 py-3 flex items-center justify-between gap-2"
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#9F7947]">
                  {q.label} · {q.monthsLabel}
                </p>
                <p className="font-serif text-lg text-[#171717] mt-0.5">
                  {formatInr(q.rev)}
                </p>
              </div>
              <div className="text-right font-mono text-[9px] text-[#77736C]">
                <div>Exp: {formatCompactInr(q.exp)}</div>
                <div className="text-[#171717] font-semibold">Net: {formatCompactInr(q.net)}</div>
              </div>
            </div>
          ))}
        </section>

        {/* EASY LOG ENTRY CARD (FULL WIDTH) + CA AUDIT EXCEL REPORT PANEL (MOVED BELOW) */}
        <section className="space-y-6">
          {/* Quick Add Revenue Received / Expense Form */}
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-5 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFECE6] pb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#9F7947] font-semibold">
                  Quick Entry · Instant Ledger Logging
                </p>
                <h2 className="font-serif text-2xl text-[#171717] mt-0.5">
                  {entryType === "REVENUE" ? "Add Amount Received by Architect" : "Log Architect / Studio Expense"}
                </h2>
              </div>

              {/* Type Toggle Pills */}
              <div className="inline-flex rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] p-0.5">
                <button
                  type="button"
                  onClick={() => handleSwitchEntryType("REVENUE")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                    entryType === "REVENUE"
                      ? "bg-[#171717] text-white font-semibold"
                      : "text-[#77736C] hover:text-[#171717]"
                  }`}
                >
                  <Plus size={12} /> Amount Received
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchEntryType("EXPENSE")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                    entryType === "EXPENSE"
                      ? "bg-[#9A5147] text-white font-semibold"
                      : "text-[#77736C] hover:text-[#171717]"
                  }`}
                >
                  <MinusCircle size={12} /> Log Expense
                </button>
              </div>
            </div>

            {formFeedback && (
              <div
                className={`flex items-center gap-2 rounded-sm border p-3 font-mono text-xs ${
                  formFeedback.type === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {formFeedback.type === "ok" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{formFeedback.msg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="space-y-4">
              {/* Source Selector: Client / Vendor / Leave Empty */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1.5">
                  Payment Source / Party (Optional — select Client, Vendor, or leave empty)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchSourceType("CLIENT")}
                    className={`inline-flex items-center gap-1.5 rounded-sm border px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                      sourceType === "CLIENT"
                        ? "border-[#171717] bg-[#171717] text-white"
                        : "border-[#D8D6D0] bg-[#FAF9F6] text-[#55514A]"
                    }`}
                  >
                    <UserRound size={12} /> Client
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchSourceType("VENDOR")}
                    className={`inline-flex items-center gap-1.5 rounded-sm border px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                      sourceType === "VENDOR"
                        ? "border-[#171717] bg-[#171717] text-white"
                        : "border-[#D8D6D0] bg-[#FAF9F6] text-[#55514A]"
                    }`}
                  >
                    <HardHat size={12} /> Vendor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchSourceType("DIRECT")}
                    className={`inline-flex items-center gap-1.5 rounded-sm border px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                      sourceType === "DIRECT"
                        ? "border-[#A58A64] bg-[#A58A64] text-white"
                        : "border-[#D8D6D0] bg-[#FAF9F6] text-[#55514A]"
                    }`}
                  >
                    Leave Source Empty
                  </button>
                </div>

                {sourceType === "CLIENT" && (
                  <select
                    aria-label="Select Client Source"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="mt-2.5 w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] px-3.5 py-2.5 font-mono text-xs text-[#171717]"
                  >
                    <option value="">— Leave Client Unspecified / Select Client —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.reference ? `(${c.reference})` : ""}
                      </option>
                    ))}
                  </select>
                )}

                {sourceType === "VENDOR" && (
                  <select
                    aria-label="Select Vendor Source"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="mt-2.5 w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] px-3.5 py-2.5 font-mono text-xs text-[#171717]"
                  >
                    <option value="">— Leave Vendor Unspecified / Select Vendor —</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.reference ? `(${v.reference})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount, Date, Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="e.g. 75000"
                    className="mt-1.5 w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] px-3.5 py-2.5 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="mt-1.5 w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] px-3.5 py-2.5 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="mt-1.5 w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] px-3.5 py-2.5 font-mono text-xs text-[#171717]"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Category, Reference, Notes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] px-3.5 py-2.5 font-mono text-xs text-[#171717]"
                  >
                    {(entryType === "REVENUE" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <OptionalField label="Reference / UTR / Bill No. (Optional)">
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. UTR-994120 / VOUCHER-12"
                    className="w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] px-3.5 py-2.5 font-mono text-xs text-[#171717]"
                  />
                </OptionalField>

                <OptionalField label="Audit Notes / Remarks (Optional)">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional remark for Chartered Accountant audit..."
                    className="w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] px-3.5 py-2.5 text-xs text-[#171717]"
                  />
                </OptionalField>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Wallet size={14} />
                  {submitting
                    ? "Saving Entry..."
                    : entryType === "REVENUE"
                    ? "Add Amount Received"
                    : "Save Expense Entry"}
                </button>
              </div>
            </form>
          </div>

          {/* CA AUDIT EXCEL REPORT GENERATOR & VAULT (Moved Below & Formatted Readably) */}
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-5 sm:p-7 space-y-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EFECE6] pb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#1b5e20] font-semibold flex items-center gap-1.5">
                  <FileSpreadsheet size={12} /> Chartered Accountant (CA) Audit Export
                </p>
                <h2 className="font-serif text-2xl text-[#171717] mt-0.5">
                  Generate &amp; Store Excel Report
                </h2>
                <p className="text-xs text-[#77736C] mt-1 max-w-2xl leading-relaxed">
                  Exports a structured multi-sheet Excel workbook (.xls) with CA Summary, Revenue/Expense Breakdown, and Full Transaction Ledger for tax filing and audit, while archiving a permanent copy below.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 shrink-0">
                <div className="sm:w-72">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Report Scope for CA Audit
                  </label>
                  <select
                    aria-label="CA Report Period Scope"
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value as any)}
                    className="mt-1.5 w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] px-3.5 py-2.5 font-mono text-xs text-[#171717]"
                  >
                    <option value="YEARLY">Annual Statement ({selectedYear})</option>
                    <option value="QUARTERLY">Quarterly Statement (Q{currentQuarter} {selectedYear})</option>
                    <option value="MONTHLY">Monthly Statement ({MONTH_LABELS[selectedMonth - 1]} {selectedYear})</option>
                    <option value="ALL">Complete Lifetime Ledger</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {onClearAllData && (
                    confirmClearAll ? (
                      <div className="inline-flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 px-3 py-1.5">
                        <span className="font-mono text-xs text-red-800">
                          Empty all ledger &amp; Excel data?
                        </span>
                        <button
                          type="button"
                          disabled={clearingAll}
                          onClick={async () => {
                            setClearingAll(true);
                            try {
                              await onClearAllData();
                              setConfirmClearAll(false);
                              setFormFeedback({
                                type: "ok",
                                msg: "All Excel reports and ledger data have been emptied.",
                              });
                              setTimeout(() => setFormFeedback(null), 4000);
                            } finally {
                              setClearingAll(false);
                            }
                          }}
                          className="rounded-sm bg-red-600 px-3 py-1 font-mono text-xs uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                        >
                          {clearingAll ? "Emptying..." : "Confirm"}
                        </button>
                        <button
                          type="button"
                          disabled={clearingAll}
                          onClick={() => setConfirmClearAll(false)}
                          className="rounded-sm border border-[#D8D6D0] bg-white px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-[#4F4B45] hover:border-[#171717] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={clearingAll || generatingReport || (entries.length === 0 && reports.length === 0)}
                        onClick={() => setConfirmClearAll(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-sm border border-red-200 bg-red-50/70 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-red-700 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors font-semibold cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                        Empty Excel Data
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={generatingReport}
                    onClick={handleCreateAndDownloadCaReport}
                    className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#2e7d32] bg-[#f1f8e9] px-5 py-2.5 font-mono text-[11px] uppercase tracking-wider text-[#1b5e20] hover:bg-[#2e7d32] hover:text-white transition-colors font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet size={15} />
                    {generatingReport ? "Generating & Storing..." : "Generate & Store CA Excel (.xls)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Stored Reports Table / Cards in Readable Format */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#77736C] font-semibold">
                  Stored CA Audit Reports ({reports.length})
                </p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#99958D]">
                  Archived in Database · Instant Download
                </p>
              </div>

              {reports.length === 0 ? (
                <p className="text-xs text-[#77736C] bg-[#FAF8F5] border border-[#EFECE6] p-4 rounded-xs">
                  No stored CA audit reports yet. Select a scope above and click &ldquo;Generate &amp; Store CA Excel (.xls)&rdquo; to create and archive your first statement.
                </p>
              ) : (
                <div className="overflow-x-auto border border-[#E4E1DA] rounded-xs">
                  <table className="w-full text-left font-mono text-xs min-w-[640px]">
                    <thead className="bg-[#FAF8F5] border-b border-[#E4E1DA] text-[9px] uppercase tracking-wider text-[#77736C]">
                      <tr>
                        <th className="py-3 px-4">Report Reference</th>
                        <th className="py-3 px-4">Statement Title &amp; Scope</th>
                        <th className="py-3 px-4 text-right">Entries</th>
                        <th className="py-3 px-4 text-right">Total Revenue</th>
                        <th className="py-3 px-4 text-right">Expenses</th>
                        <th className="py-3 px-4 text-right">Net Surplus</th>
                        <th className="py-3 px-4 text-right">Excel Export</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFECE6] bg-white">
                      {reports.map((rep) => (
                        <tr key={rep.id} className="hover:bg-[#FAF9F5] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#9F7947] whitespace-nowrap">
                            {rep.reportCode}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-serif text-sm font-semibold text-[#171717]">
                              {rep.title}
                            </p>
                            <p className="text-[10px] text-[#77736C] mt-0.5">
                              Scope: {rep.periodFilter} ({rep.reportYear}) · Generated{" "}
                              {rep.generatedAt ? new Date(rep.generatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Today"}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums text-[#55514A]">
                            {rep.entryCount}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-emerald-800">
                            {formatInr(Number(rep.totalRevenue || 0))}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums text-red-700">
                            {formatInr(Number(rep.totalExpenses || 0))}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums font-bold text-[#171717]">
                            {formatInr(Number(rep.netIncome || 0))}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onDownloadReport(rep.id, `${rep.reportCode}_CA_Audit.xls`)}
                              className="inline-flex items-center gap-1.5 rounded-xs border border-[#2e7d32] bg-[#f1f8e9] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider font-semibold text-[#1b5e20] hover:bg-[#2e7d32] hover:text-white transition-colors cursor-pointer"
                            >
                              <Download size={12} /> Download .XLS
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FULL SEARCHABLE & FILTERABLE REVENUE & EXPENSE REGISTER */}
        <section className="rounded-sm border border-[#D8D6D0] bg-white p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFECE6] pb-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#9F7947] font-semibold">
                Client, Vendor &amp; Direct Receipts
              </p>
              <h2 className="font-serif text-2xl text-[#171717]">
                Revenue &amp; Expense Register ({filteredEntries.length})
              </h2>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-2.5 text-[#77736C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search party, category, UTR..."
                className="w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] pl-8 pr-3 py-1.5 font-mono text-xs text-[#171717]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "ALL", label: "All Entries" },
                { id: "REVENUE", label: "Revenue Received" },
                { id: "CLIENT", label: "From Clients" },
                { id: "VENDOR", label: "From Vendors" },
                { id: "EXPENSE", label: "Expenses" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRegisterFilter(tab.id)}
                className={`rounded-sm border px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-wider transition-colors cursor-pointer ${
                  registerFilter === tab.id
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#D8D6D0] bg-[#FAF9F6] text-[#55514A] hover:border-[#171717]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-12 text-center font-mono text-xs text-[#77736C]">
              Loading architect revenue ledger...
            </p>
          ) : filteredEntries.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-[#D8D6D0] rounded-sm bg-[#FAF8F5]">
              <p className="font-serif text-lg text-[#171717]">No entries logged yet</p>
              <p className="text-xs text-[#77736C] mt-1">
                Use the Quick Entry form above to record amounts received from Clients, Vendors, or direct sources, as well as expenses.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EFECE6]">
              {filteredEntries.map((entry) => {
                const isExp = entry.entryType === "EXPENSE";
                return (
                  <div
                    key={entry.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-xs px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                            isExp
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isExp ? "Expense" : "Received"}
                        </span>

                        <span className="rounded-xs bg-[#FAF8F5] border border-[#D8D6D0] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#55514A]">
                          {entry.sourceType}
                        </span>

                        <span className="font-medium text-sm text-[#171717]">
                          {entry.sourceName || "Direct / Unspecified"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-[#77736C]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} /> {entry.transactionDate}
                        </span>
                        {entry.category && <span>· {entry.category}</span>}
                        {entry.paymentMode && <span>· {entry.paymentMode.replace("_", " ")}</span>}
                        {entry.referenceNumber && <span>· Ref: {entry.referenceNumber}</span>}
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-[#55514A]">{entry.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <span
                        className={`font-serif text-xl font-medium ${
                          isExp ? "text-red-700" : "text-emerald-800"
                        }`}
                      >
                        {isExp ? "-" : "+"}{formatInr(Number(entry.amount || 0))}
                      </span>

                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        title="Delete ledger entry"
                        aria-label={`Delete entry ${entry.id}`}
                        className="p-1.5 text-[#77736C] hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
