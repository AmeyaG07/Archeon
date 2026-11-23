
"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Building2,
  FileText,
  IndianRupee,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Wallet,
  Bell,
  FolderOpen,
  Users,
  Upload,
  X,
  Eye,
  Plus,
} from "lucide-react";

export type VendorInvoiceStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Partially Paid"
  | "Paid"
  | "Rejected";

export interface VendorDashboardProject {
  id: string;
  name: string;
  location: string;
  assignment: string;
  status: string;
  updatedAt: string;
  imageUrl?: string;
}

export interface VendorDashboardInvoice {
  id: string;
  invoiceNumber: string;
  projectName: string;
  submittedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  status: VendorInvoiceStatus;
  submittedAt: string;
}

export interface VendorClientBill {
  id: string;
  billNumber: string;
  amount: number;
  tradeCategory?: string;
  status: "Paid" | "Pending";
  billPhotoUrl?: string;
  paymentProofUrl?: string;
  createdAt: string;
}

export interface VendorClientSummary {
  clientId: string;
  clientName: string;
  projectName: string;
  projectId?: string;
  bills: VendorClientBill[];
}

export interface VendorDashboardActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  category: "Project" | "Invoice" | "Payment" | "Announcement";
}

export interface VendorDashboardData {
  vendorName: string;
  organisationName?: string;
  projects: VendorDashboardProject[];
  invoices: VendorDashboardInvoice[];
  clients?: VendorClientSummary[];
  activities: VendorDashboardActivity[];
  unreadNotifications: number;
}

interface VendorPortalDashboardProps {
  data: VendorDashboardData;
  loading?: boolean;
  error?: string;

  onOpenProjects: () => void;
  onOpenProject: (project: VendorDashboardProject) => void;

  onOpenInvoices: () => void;
  onOpenInvoice: (invoice: VendorDashboardInvoice) => void;

  onCreateInvoice: () => void;
  onOpenDocuments: () => void;
  onOpenNotifications: () => void;
  onUploadBillToClient?: (clientId: string, projectId: string, amount: number, tradeCategory: string, photoUrl: string) => Promise<void>;

  onRetry?: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getInvoiceStatusStyle(status: VendorInvoiceStatus) {
  switch (status) {
    case "Paid":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Approved":
      return "bg-[#EAF0F5] text-[#58738C]";

    case "Rejected":
      return "bg-[#F8EAE7] text-[#9A5147]";

    case "Under Review":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Partially Paid":
      return "bg-[#EAF0F5] text-[#58738C]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function getActivityIcon(
  category: VendorDashboardActivity["category"]
) {
  switch (category) {
    case "Project":
      return <Building2 size={17} />;

    case "Invoice":
      return <FileText size={17} />;

    case "Payment":
      return <IndianRupee size={17} />;

    case "Announcement":
      return <Bell size={17} />;
  }
}

export function VendorPortalDashboard({
  data,
  loading = false,
  error,
  onOpenProjects,
  onOpenProject,
  onOpenInvoices,
  onOpenInvoice,
  onCreateInvoice,
  onOpenDocuments,
  onOpenNotifications,
  onUploadBillToClient,
  onRetry,
}: VendorPortalDashboardProps) {
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [uploadModalClient, setUploadModalClient] = useState<VendorClientSummary | null>(null);
  const [billAmount, setBillAmount] = useState("");
  const [tradeCategory, setTradeCategory] = useState("Civil & MEP Contractor");
  const [billPhotoUrl, setBillPhotoUrl] = useState("");
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);

  const initialClients: VendorClientSummary[] =
    data.clients && data.clients.length > 0
      ? data.clients
      : [
          {
            clientId: "CLI-ANANYA",
            clientName: "Dr. Ananya Deshmukh",
            projectName: "The Monolith Sanctuary (Khandala)",
            projectId: "PRJ_ARCH_2026_01",
            bills: [
              {
                id: "b-1",
                billNumber: "STEL-2026-B901",
                amount: 185000,
                tradeCategory: "Carpentry & Joinery",
                status: "Paid",
                paymentProofUrl:
                  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
                createdAt: "18 Nov 2026",
              },
              {
                id: "b-2",
                billNumber: "STEL-2026-B905",
                amount: 240000,
                tradeCategory: "Natural Stone Cladding",
                status: "Pending",
                billPhotoUrl:
                  "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80",
                createdAt: "21 Nov 2026",
              },
            ],
          },
          {
            clientId: "CLI-KAPOOR",
            clientName: "Priya & Siddharth Kapoor",
            projectName: "The Travertine Penthouse",
            projectId: "PRJ_INT_2025_04",
            bills: [
              {
                id: "b-3",
                billNumber: "VERO-2026-B401",
                amount: 320000,
                tradeCategory: "Glazing & Aluminum Framing",
                status: "Paid",
                paymentProofUrl:
                  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
                createdAt: "15 Nov 2026",
              },
              {
                id: "b-4",
                billNumber: "VERO-2026-B404",
                amount: 115000,
                tradeCategory: "False Ceiling & Drywall",
                status: "Pending",
                createdAt: "22 Nov 2026",
              },
            ],
          },
          {
            clientId: "CLI-MEHTA",
            clientName: "Aakash Mehta",
            projectName: "Bhalekar Residence Turnkey",
            projectId: "PRJ_RES_2026_09",
            bills: [
              {
                id: "b-5",
                billNumber: "HYD-2026-B102",
                amount: 195000,
                tradeCategory: "HVAC Rough-In & Ducting",
                status: "Pending",
                createdAt: "20 Nov 2026",
              },
            ],
          },
        ];

  const [clients, setClients] = useState<VendorClientSummary[]>(initialClients);

  const handleUploadBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalClient || !billAmount) return;
    setIsSubmittingBill(true);
    try {
      const amt = parseFloat(billAmount);
      if (onUploadBillToClient) {
        await onUploadBillToClient(
          uploadModalClient.clientId,
          uploadModalClient.projectId || "PRJ_GEN",
          amt,
          tradeCategory,
          billPhotoUrl || ""
        );
      }
      const newBill: VendorClientBill = {
        id: `bill-${Date.now()}`,
        billNumber: `BILL-${Date.now().toString().slice(-4)}`,
        amount: amt,
        tradeCategory,
        status: "Pending",
        billPhotoUrl: billPhotoUrl || undefined,
        createdAt: new Date().toLocaleDateString("en-IN"),
      };
      setClients((prev) =>
        prev.map((c) =>
          c.clientId === uploadModalClient.clientId
            ? { ...c, bills: [newBill, ...c.bills] }
            : c
        )
      );
      setUploadModalClient(null);
      setBillAmount("");
      setBillPhotoUrl("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit bill. Please try again.");
    } finally {
      setIsSubmittingBill(false);
    }
  };
  const submittedTotal = data.invoices.reduce(
    (total, invoice) => total + Math.max(0, invoice.submittedAmount),
    0
  );

  const paidTotal = data.invoices.reduce(
    (total, invoice) => total + Math.max(0, invoice.paidAmount),
    0
  );

  const pendingInvoices = data.invoices.filter(
    (invoice) =>
      invoice.status === "Submitted" ||
      invoice.status === "Under Review"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading your vendor dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="border border-[#E3C9C5] bg-[#FAF3F1] p-7"
      >
        <AlertCircle size={22} className="text-[#9A5147]" />

        <h2 className="mt-4 font-serif text-2xl text-[#773B34]">
          Vendor dashboard unavailable
        </h2>

        <p className="mt-3 text-sm leading-7 text-[#805B55]">
          {error}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 text-xs uppercase tracking-widest text-[#773B34] underline"
          >
            Try Again
          </button>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-9 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
              ARCHEON DESIGN STUDIO / VENDOR PORTAL
            </p>

            <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
              Welcome, {data.vendorName}
            </h1>

            {data.organisationName && (
              <p className="mt-2 text-sm text-[#77736C]">
                {data.organisationName}
              </p>
            )}

            <p className="mt-4 text-sm leading-7 text-[#77736C]">
              Manage your project assignments, invoices and
              payment records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative flex items-center gap-3 border border-[#D8D6D0] bg-white px-5 py-3 text-xs text-[#33312D] hover:border-[#A58A64]"
            >
              <Bell size={17} className="text-[#A58A64]" />
              Notifications

              {data.unreadNotifications > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#A58A64] px-1 text-[9px] text-white">
                  {data.unreadNotifications > 99
                    ? "99+"
                    : data.unreadNotifications}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onCreateInvoice}
              className="bg-[#171717] px-5 py-3 text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#A58A64]"
            >
              Submit Invoice
            </button>
          </div>
        </header>

        {/* Overview */}
        <section
          aria-label="Vendor account overview"
          className="mt-8 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-2 lg:grid-cols-4"
        >
          <OverviewCard
            label="Assigned Projects"
            value={String(data.projects.length)}
            icon={<Building2 size={19} />}
          />

          <OverviewCard
            label="Submitted Invoice Value"
            value={formatCurrency(submittedTotal)}
            icon={<Receipt size={19} />}
          />

          <OverviewCard
            label="Payments Recorded"
            value={formatCurrency(paidTotal)}
            icon={<Wallet size={19} />}
          />

          <OverviewCard
            label="Pending Invoices"
            value={String(pendingInvoices)}
            icon={<Clock3 size={19} />}
          />
        </section>

        {/* Project Assignments */}
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 border-b border-[#D8D6D0] pb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Work Assignments
              </p>

              <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                My Projects
              </h2>
            </div>

            <button
              type="button"
              onClick={onOpenProjects}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
            >
              All Projects
              <ArrowUpRight size={15} />
            </button>
          </div>

          {data.projects.length === 0 ? (
            <EmptyState message="Project assignments will appear here when the studio assigns work to your account." />
          ) : (
            <div className="grid grid-cols-1 gap-6 py-7 md:grid-cols-2">
              {data.projects.slice(0, 4).map((project) => {
                const getCover = (title: string, url?: string) => {
                  if (url) return url;
                  const t = title.toLowerCase();
                  if (t.includes("monolith") || t.includes("sanctuary")) {
                    return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80";
                  }
                  if (t.includes("travertine") || t.includes("penthouse")) {
                    return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&auto=format&fit=crop&q=80";
                  }
                  if (t.includes("bhalekar") || t.includes("residence")) {
                    return "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&auto=format&fit=crop&q=80";
                  }
                  return "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=900&auto=format&fit=crop&q=80";
                };

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onOpenProject(project)}
                    className="group overflow-hidden border border-[#D8D6D0] bg-white text-left transition-all hover:border-[#A58A64] hover:shadow-md"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-black/5">
                      <img
                        src={getCover(project.name, project.imageUrl)}
                        alt={project.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80";
                        }}
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/75 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#C5A36D] backdrop-blur-sm">
                        {project.status}
                      </div>
                    </div>

                    <div className="p-6 md:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                          Work Assignment
                        </span>

                        <ArrowUpRight
                          size={17}
                          className="text-[#99958D] group-hover:text-[#A58A64] transition-colors"
                        />
                      </div>

                      <h3 className="mt-3 font-serif text-2xl text-[#171717]">
                        {project.name}
                      </h3>

                      <p className="mt-1 text-xs text-[#77736C]">
                        {project.location}
                      </p>

                      <div className="mt-4 border-t border-[#E5E2DC] pt-4">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                          Assigned Scope
                        </p>

                        <p className="mt-1 text-sm text-[#33312D]">
                          {project.assignment}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[9px] text-[#99958D]">
                        <span>ArcheOn Design Studio</span>
                        <span>Updated {project.updatedAt}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* List of Clients & Bills to Those Clients */}
        <section className="mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[#D8D6D0] pb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Contractor Direct Billing
              </p>
              <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                List of Clients &amp; Associated Bills
              </h2>
              <p className="mt-2 text-xs text-[#77736C]">
                Review bills issued to assigned clients. View client payment screenshots when paid, or upload a new contractor bill.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setUploadModalClient(clients[0] || null);
                setBillAmount("");
                setBillPhotoUrl("");
              }}
              className="inline-flex items-center gap-2 bg-[#171717] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] transition-colors"
            >
              <Plus size={14} /> Upload Bill to Client
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {clients.map((client) => {
              const pendingCount = client.bills.filter((b) => b.status === "Pending").length;
              const paidCount = client.bills.filter((b) => b.status === "Paid").length;
              const totalAmount = client.bills.reduce((sum, b) => sum + b.amount, 0);

              return (
                <div
                  key={client.clientId}
                  className="border border-[#D8D6D0] bg-white p-6 transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E2DC] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-[#A58A64]" />
                        <h3 className="font-serif text-xl text-[#171717]">{client.clientName}</h3>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-[#77736C]">
                        Project: <span className="text-[#333] font-semibold">{client.projectName}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[9px] uppercase px-2 py-1 bg-[#FAF9F5] border border-[#E5E2DC] text-[#555]">
                        {paidCount} Paid · {pendingCount} Pending · Total: {formatCurrency(totalAmount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadModalClient(client);
                          setBillAmount("");
                          setBillPhotoUrl("");
                        }}
                        className="inline-flex items-center gap-1.5 border border-[#D8D6D0] bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#171717] hover:border-[#A58A64] hover:bg-[#FAF9F5]"
                      >
                        <Plus size={12} /> Upload Bill
                      </button>
                    </div>
                  </div>

                  {/* Bills Table for this client */}
                  {client.bills.length === 0 ? (
                    <div className="py-6 text-center font-mono text-xs text-[#888]">
                      No bills submitted to this client yet.
                    </div>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-[#E5E2DC] text-[9px] uppercase tracking-wider text-[#888] bg-[#FAF9F5]">
                            <th className="py-2.5 px-3">Bill Ref</th>
                            <th className="py-2.5 px-3">Trade Scope</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-center">Proof of Payment</th>
                            <th className="py-2.5 px-3 text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAE8E3]">
                          {client.bills.map((bill) => {
                            const isPaid = bill.status === "Paid";
                            return (
                              <tr key={bill.id} className="hover:bg-[#FAF9F5]">
                                <td className="py-3 px-3 font-semibold text-[#111]">
                                  {bill.billNumber}
                                </td>
                                <td className="py-3 px-3 text-[#555]">
                                  {bill.tradeCategory || "Contractor Bill"}
                                </td>
                                <td className="py-3 px-3 text-right font-serif font-bold text-sm text-[#111]">
                                  {formatCurrency(bill.amount)}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {isPaid ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-[#EAF1E8] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#2D6A4F] border border-emerald-200">
                                      <CheckCircle2 size={11} /> Paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded bg-[#FBF0EA] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#B34033] border border-red-200">
                                      <Clock3 size={11} /> Pending
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {isPaid && bill.paymentProofUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewScreenshotUrl(bill.paymentProofUrl || null)}
                                      className="inline-flex items-center gap-1 rounded border border-[#A58A64]/40 bg-[#FAF9F5] px-2.5 py-1 text-[9px] uppercase font-mono tracking-wider text-[#8A6D3B] hover:bg-[#A58A64] hover:text-white transition-colors"
                                    >
                                      <Eye size={12} /> View Payment Screenshot
                                    </button>
                                  ) : isPaid ? (
                                    <span className="font-mono text-[9px] text-[#2D6A4F]">
                                      Verified Cash/Bank Transfer
                                    </span>
                                  ) : (
                                    <span className="font-mono text-[9px] text-[#999]">
                                      Awaiting Settlement
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right text-[10px] text-[#777]">
                                  {bill.createdAt}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Invoices */}
        <section className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="flex items-end justify-between gap-4 border-b border-[#D8D6D0] pb-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  Financial Records
                </p>

                <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                  Recent Invoices
                </h2>
              </div>

              <button
                type="button"
                onClick={onOpenInvoices}
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
              >
                View All
                <ArrowUpRight size={15} />
              </button>
            </div>

            {data.invoices.length === 0 ? (
              <EmptyState message="Invoices submitted by your account will appear here." />
            ) : (
              <div className="mt-2">
                {data.invoices.slice(0, 5).map((invoice) => (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => onOpenInvoice(invoice)}
                    className="flex w-full flex-col justify-between gap-4 border-b border-[#D8D6D0] py-6 text-left transition-colors hover:bg-white/60 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                        {invoice.invoiceNumber}
                      </p>

                      <h3 className="mt-2 text-sm text-[#171717]">
                        {invoice.projectName}
                      </h3>

                      <p className="mt-2 text-[10px] text-[#99958D]">
                        Submitted: {invoice.submittedAt}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="font-serif text-xl text-[#171717]">
                        {formatCurrency(invoice.submittedAmount)}
                      </p>

                      <span
                        className={`mt-2 inline-block px-3 py-1 text-[9px] uppercase tracking-widest ${getInvoiceStatusStyle(invoice.status)}`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Access */}
          <aside className="lg:col-span-3 lg:col-start-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
              Vendor Workspace
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#171717]">
              Quick Access
            </h2>

            <div className="mt-7 space-y-3">
              <QuickAccessItem
                icon={<Building2 size={19} />}
                title="My Projects"
                description="View assigned work"
                onClick={onOpenProjects}
              />

              <QuickAccessItem
                icon={<Receipt size={19} />}
                title="My Invoices"
                description="Review submitted invoices"
                onClick={onOpenInvoices}
              />

              <QuickAccessItem
                icon={<FolderOpen size={19} />}
                title="Project Documents"
                description="Access authorised files"
                onClick={onOpenDocuments}
              />
            </div>

            <div className="mt-7 border border-[#D8D6D0] bg-white p-6">
              <ShieldNotice />
            </div>
          </aside>
        </section>

        {/* Recent Activity */}
        <section className="mt-16">
          <div className="border-b border-[#D8D6D0] pb-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
              Latest Activity
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#171717]">
              Recent Updates
            </h2>
          </div>

          {data.activities.length === 0 ? (
            <EmptyState message="New project and account activity will appear here." />
          ) : (
            <div className="mt-3">
              {data.activities.slice(0, 6).map((activity) => (
                <article
                  key={activity.id}
                  className="flex items-start gap-4 border-b border-[#D8D6D0] py-6"
                >
                  <span className="mt-1 shrink-0 text-[#A58A64]">
                    {getActivityIcon(activity.category)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-sm text-[#171717]">
                        {activity.title}
                      </h3>

                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                        {activity.category}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-6 text-[#77736C]">
                      {activity.description}
                    </p>
                  </div>

                  <span className="shrink-0 font-mono text-[9px] text-[#99958D]">
                    {activity.date}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / PRIVATE VENDOR WORKSPACE
          </p>
        </footer>
      </div>

      {/* Payment Screenshot Lightbox Modal */}
      {previewScreenshotUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewScreenshotUrl(null)}
          data-lenis-prevent
        >
          <div
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto border border-[#D8D6D0] bg-[#F2F0EB] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  Settlement Verification
                </p>
                <h3 className="font-serif text-xl text-[#171717]">
                  Client Payment Screenshot &amp; Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className="flex h-8 w-8 items-center justify-center border border-[#D8D6D0] bg-white text-[#777] hover:text-[#111]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 border border-[#D8D6D0] bg-black/5 p-4 text-center">
              <img
                src={previewScreenshotUrl}
                alt="Payment Screenshot"
                className="max-h-[60vh] mx-auto object-contain rounded border border-[#ddd] shadow"
              />
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className="bg-[#171717] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-[#A58A64]"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Bill to Client Modal */}
      {uploadModalClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setUploadModalClient(null)}
          data-lenis-prevent
        >
          <div
            className="relative w-full max-w-lg border border-[#D8D6D0] bg-[#F2F0EB] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  New Trade Bill
                </p>
                <h3 className="font-serif text-xl text-[#171717]">
                  Bill to {uploadModalClient.clientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalClient(null)}
                className="flex h-8 w-8 items-center justify-center border border-[#D8D6D0] bg-white text-[#777] hover:text-[#111]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadBillSubmit} className="mt-4 space-y-4 font-mono text-xs">
              <div className="border border-[#D8D6D0] bg-white p-3 space-y-1">
                <span className="text-[10px] uppercase text-[#888] block">Project Assigned</span>
                <span className="font-semibold text-[#111]">{uploadModalClient.projectName}</span>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">
                  Bill Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 150000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full border border-[#D8D6D0] bg-white p-2.5 text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">
                  Trade Category / Scope Specifics *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Carpentry, MEP, Masonry, Glass & Glazing"
                  value={tradeCategory}
                  onChange={(e) => setTradeCategory(e.target.value)}
                  className="w-full border border-[#D8D6D0] bg-white p-2.5 text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">
                  Upload Bill Photograph / Scanned Document
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setBillPhotoUrl(ev.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full border border-[#D8D6D0] bg-white p-2 text-[#333] file:mr-3 file:border-0 file:bg-[#171717] file:px-3 file:py-1 file:font-mono file:text-[10px] file:uppercase file:text-white hover:file:bg-[#A58A64]"
                />
              </div>

              {billPhotoUrl && (
                <div className="border border-[#D8D6D0] bg-white p-2 text-center">
                  <img src={billPhotoUrl} alt="Bill Preview" className="max-h-32 mx-auto object-contain" />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-[#D8D6D0]">
                <button
                  type="button"
                  onClick={() => setUploadModalClient(null)}
                  className="border border-[#D8D6D0] bg-white px-4 py-2 uppercase tracking-wider text-[#555] hover:bg-[#e8e6e1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBill}
                  className="bg-[#171717] px-5 py-2 uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50"
                >
                  {isSubmittingBill ? "Submitting..." : "Submit Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function OverviewCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-7 break-words font-serif text-2xl text-[#171717] md:text-3xl">
        {value}
      </p>
    </div>
  );
}

function QuickAccessItem({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border border-[#D8D6D0] bg-white p-5 text-left transition-colors hover:border-[#A58A64]"
    >
      <span className="shrink-0 text-[#A58A64]">{icon}</span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm text-[#171717]">
          {title}
        </span>

        <span className="mt-1 block text-[10px] leading-5 text-[#99958D]">
          {description}
        </span>
      </span>

      <ArrowUpRight
        size={16}
        className="shrink-0 text-[#99958D]"
      />
    </button>
  );
}

function ShieldNotice() {
  return (
    <>
      <CheckCircle2 size={21} className="text-[#A58A64]" />

      <h3 className="mt-4 font-serif text-xl text-[#171717]">
        Secure Vendor Access
      </h3>

      <p className="mt-3 text-xs leading-6 text-[#77736C]">
        Your account provides access only to projects, documents
        and financial records authorised for your organisation.
      </p>
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-b border-[#D8D6D0] px-5 py-12 text-center">
      <FolderOpen
        size={25}
        strokeWidth={1.3}
        className="mx-auto text-[#A58A64]"
      />

      <p className="mt-4 text-sm leading-7 text-[#77736C]">
        {message}
      </p>
    </div>
  );
}
