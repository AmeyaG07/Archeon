"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Receipt,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { AdminNotifyBillsWhatsAppModal } from "@/components/portal/admin/AdminNotifyBillsWhatsAppModal";

interface RawBill {
  id: string | number;
  billId?: string;
  invoiceNumber?: string;
  amount: number;
  paidAmount?: number;
  status: string;
  clientId?: string;
  vendorId?: string;
  projectId?: string;
  tradeCategory?: string;
  billPhotoUrl?: string;
  paymentProofUrl?: string;
  createdAt?: string;
}

interface ClientRecord {
  id: string;
  fullName: string;
  clientReference?: string;
  phone?: string;
}

interface VendorRecord {
  id: string;
  businessName: string;
  vendorReference?: string;
}

interface ProjectRecord {
  id: string;
  name: string;
  projectReference?: string;
}

type NormalizedBillStatus = "Paid" | "Pending" | "Partially Settled";

interface PopupState {
  bill: RawBill;
  kind: "billPhoto" | "paymentScreenshot";
  projectName: string;
  clientName: string;
  vendorName: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function normalizeStatus(bill: RawBill): NormalizedBillStatus {
  const st = (bill.status || "").toUpperCase();
  const amount = Number(bill.amount || 0);
  const paid = Number(bill.paidAmount || 0);

  if (st === "PAID" || st === "PAID_CASH" || st === "PAID_ONLINE" || (amount > 0 && paid >= amount)) {
    return "Paid";
  }
  if (st === "PARTIALLY_PAID" || (paid > 0 && paid < amount)) {
    return "Partially Settled";
  }
  return "Pending";
}

function getStatusBadgeClass(status: NormalizedBillStatus) {
  switch (status) {
    case "Paid":
      return "bg-[#EAF1E8] text-[#2D6A4F] border-[#CFE3C9]";
    case "Partially Settled":
      return "bg-[#EAF0F5] text-[#3E5E7A] border-[#CEDCE8]";
    default:
      return "bg-[#F4EFE2] text-[#8D6E3D] border-[#E4D8BC]";
  }
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [bills, setBills] = useState<RawBill[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);

  const [selectedClientId, setSelectedClientId] = useState<string>("ALL");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billsRes, clientsRes, vendorsRes, projectsRes] = await Promise.all([
        apiFetch("/api/billing/bills"),
        apiFetch("/api/clients"),
        apiFetch("/api/vendors"),
        apiFetch("/api/operational-projects"),
      ]);

      const [bData, cData, vData, pData] = await Promise.all([
        billsRes.json().catch(() => []),
        clientsRes.json().catch(() => []),
        vendorsRes.json().catch(() => []),
        projectsRes.json().catch(() => []),
      ]);

      setBills(Array.isArray(bData) ? bData : []);
      setClients(Array.isArray(cData) ? cData : []);
      setVendors(Array.isArray(vData) ? vData : []);
      setProjects(Array.isArray(pData) ? pData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications and bills.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadData();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadData, router]);

  const clientLookup = useMemo(() => {
    const map = new Map<string, ClientRecord>();
    for (const c of clients) {
      if (c.id) map.set(c.id.toLowerCase(), c);
      if (c.clientReference) map.set(c.clientReference.toLowerCase(), c);
    }
    return map;
  }, [clients]);

  const vendorLookup = useMemo(() => {
    const map = new Map<string, VendorRecord>();
    for (const v of vendors) {
      if (v.id) map.set(v.id.toLowerCase(), v);
      if (v.vendorReference) map.set(v.vendorReference.toLowerCase(), v);
    }
    return map;
  }, [vendors]);

  const projectLookup = useMemo(() => {
    const map = new Map<string, ProjectRecord>();
    for (const p of projects) {
      if (p.id) map.set(p.id.toLowerCase(), p);
      if (p.projectReference) map.set(p.projectReference.toLowerCase(), p);
    }
    return map;
  }, [projects]);

  const resolveClientName = (clientId?: string) => {
    if (!clientId) return "Unassigned Client";
    const found = clientLookup.get(clientId.toLowerCase());
    return found?.fullName || clientId;
  };

  const resolveVendorName = (vendorId?: string) => {
    if (!vendorId) return "Studio Vendor";
    const found = vendorLookup.get(vendorId.toLowerCase());
    return found?.businessName || vendorId;
  };

  const resolveProjectName = (projectId?: string) => {
    if (!projectId) return "Studio Project";
    const found = projectLookup.get(projectId.toLowerCase());
    return found?.name || projectId;
  };

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (selectedClientId !== "ALL") {
        const selectedClient = clients.find((c) => c.id === selectedClientId);
        const billCid = (bill.clientId || "").toLowerCase();
        const matchesId = billCid === selectedClientId.toLowerCase();
        const matchesRef =
          selectedClient?.clientReference &&
          billCid === selectedClient.clientReference.toLowerCase();
        if (!matchesId && !matchesRef) return false;
      }

      if (selectedVendorId !== "ALL") {
        const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
        const billVid = (bill.vendorId || "").toLowerCase();
        const matchesId = billVid === selectedVendorId.toLowerCase();
        const matchesRef =
          selectedVendor?.vendorReference &&
          billVid === selectedVendor.vendorReference.toLowerCase();
        if (!matchesId && !matchesRef) return false;
      }

      return true;
    });
  }, [bills, clients, vendors, selectedClientId, selectedVendorId]);

  const summary = useMemo(() => {
    let settledCount = 0;
    let pendingCount = 0;
    for (const b of filteredBills) {
      const st = normalizeStatus(b);
      if (st === "Paid") settledCount++;
      else pendingCount++;
    }
    return {
      invoicesGenerated: filteredBills.length,
      settled: settledCount,
      pending: pendingCount,
    };
  }, [filteredBills]);

  const handlePopupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !popup) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5 MB.");
      return;
    }

    setUploadError(null);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const targetId = popup.bill.billId || String(popup.bill.id);
        const isBillPhoto = popup.kind === "billPhoto";
        const endpoint = isBillPhoto
          ? `/api/billing/bills/${encodeURIComponent(targetId)}/photo`
          : `/api/billing/bills/${encodeURIComponent(targetId)}/payment-proof`;
        const payload = isBillPhoto
          ? { billPhotoUrl: dataUrl }
          : { paymentProofUrl: dataUrl };

        const res = await apiFetch(endpoint, {
          method: "POST",
          body: payload,
        });
        const updatedBill: RawBill = await res.json();

        setBills((prev) =>
          prev.map((b) =>
            String(b.id) === String(popup.bill.id) || (b.billId && b.billId === popup.bill.billId)
              ? {
                  ...b,
                  ...(isBillPhoto
                    ? { billPhotoUrl: updatedBill.billPhotoUrl || dataUrl }
                    : {
                        paymentProofUrl: updatedBill.paymentProofUrl || dataUrl,
                        status: updatedBill.status || b.status,
                        paidAmount: updatedBill.paidAmount ?? b.paidAmount,
                      }),
                }
              : b
          )
        );
        setPopup((prev) =>
          prev
            ? {
                ...prev,
                bill: {
                  ...prev.bill,
                  ...(isBillPhoto
                    ? { billPhotoUrl: updatedBill.billPhotoUrl || dataUrl }
                    : {
                        paymentProofUrl: updatedBill.paymentProofUrl || dataUrl,
                        status: updatedBill.status || prev.bill.status,
                        paidAmount: updatedBill.paidAmount ?? prev.bill.paidAmount,
                      }),
                },
              }
            : null
        );
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Failed to upload file.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setUploadError("Could not read selected file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const activePopupImageUrl =
    popup?.kind === "billPhoto" ? popup.bill.billPhotoUrl : popup?.bill.paymentProofUrl;
  const activePopupIsPdf =
    activePopupImageUrl?.startsWith("data:application/pdf") ||
    activePopupImageUrl?.toLowerCase().endsWith(".pdf");

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-4 py-8 sm:px-6 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-5 border-b border-[#D8D6D0] pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
              Administration / Billing Notifications
            </p>
            <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-[#171717]">
              Notifications
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#66635D]">
              Track generated vendor bills, filter by client or vendor, and view or upload bill photos and payment screenshots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setNotifyModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#128C7E] px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-[#0E7367] transition-colors shadow-xs cursor-pointer"
            >
              <MessageSquare size={14} />
              WhatsApp Alerts &amp; 3-Day Reminders
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#171717] hover:border-[#A58A64] transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </header>

        {/* Three Top Summary Tiles */}
        <section aria-label="Notification Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border border-[#D8D6D0] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
                Invoices Generated
              </p>
              <Receipt size={16} className="text-[#A58A64]" />
            </div>
            <p className="mt-4 font-serif text-3xl text-[#171717]">
              {summary.invoicesGenerated}
            </p>
          </div>

          <div className="border border-[#D8D6D0] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
                Settled
              </p>
              <CheckCircle2 size={16} className="text-[#2D6A4F]" />
            </div>
            <p className="mt-4 font-serif text-3xl text-[#2D6A4F]">
              {summary.settled}
            </p>
          </div>

          <div className="border border-[#D8D6D0] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
                Pending
              </p>
              <Clock3 size={16} className="text-[#8D6E3D]" />
            </div>
            <p className="mt-4 font-serif text-3xl text-[#8D6E3D]">
              {summary.pending}
            </p>
          </div>
        </section>

        {/* Client & Vendor Dropdown Filters */}
        <section className="grid grid-cols-1 gap-4 border border-[#D8D6D0] bg-white p-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
              Client
            </span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs text-[#171717] outline-none focus:border-[#A58A64]"
            >
              <option value="ALL">All Clients (Show all bills)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.clientReference ? `(${c.clientReference})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
              Vendor
            </span>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs text-[#171717] outline-none focus:border-[#A58A64]"
            >
              <option value="ALL">All Vendors (Show all bills)</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.businessName} {v.vendorReference ? `(${v.vendorReference})` : ""}
                </option>
              ))}
            </select>
          </label>
        </section>

        {error && (
          <div className="border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Bill Tiles List (No Redirect on Click) */}
        <section className="space-y-4">
          {loading ? (
            <div className="border border-[#D8D6D0] bg-white p-10 text-center font-mono text-xs text-[#77736C]">
              Loading bills and notifications...
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="border border-[#D8D6D0] bg-white p-10 text-center">
              <Bell size={22} className="mx-auto text-[#A58A64]" />
              <p className="mt-3 font-serif text-lg text-[#171717]">No bills found</p>
              <p className="mt-1 text-xs text-[#77736C]">
                No bills match the selected Client and Vendor filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredBills.map((bill) => {
                const projectName = resolveProjectName(bill.projectId);
                const clientName = resolveClientName(bill.clientId);
                const vendorName = resolveVendorName(bill.vendorId);
                const displayStatus = normalizeStatus(bill);

                return (
                  <article
                    key={String(bill.id)}
                    className="border border-[#D8D6D0] bg-white p-5 transition-colors hover:border-[#A58A64]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Core Bill Details */}
                      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                            Project Name
                          </p>
                          <p className="mt-1 font-serif text-base text-[#171717]">
                            {projectName}
                          </p>
                        </div>

                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                            Client Name
                          </p>
                          <p className="mt-1 text-xs font-medium text-[#171717]">
                            {clientName}
                          </p>
                        </div>

                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                            Vendor Name
                          </p>
                          <p className="mt-1 text-xs font-medium text-[#171717]">
                            {vendorName}
                          </p>
                        </div>

                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                            Bill Amount
                          </p>
                          <p className="mt-1 font-mono text-sm font-semibold text-[#171717]">
                            {formatCurrency(bill.amount)}
                          </p>
                        </div>

                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                            Status
                          </p>
                          <span
                            className={`mt-1 inline-block border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${getStatusBadgeClass(displayStatus)}`}
                          >
                            {displayStatus}
                          </span>
                        </div>
                      </div>

                      {/* Additional Small Tiles: Bill Photo & Payment Screenshot */}
                      <div className="grid grid-cols-2 gap-3 shrink-0 lg:w-80">
                        <button
                          type="button"
                          onClick={() => {
                            setUploadError(null);
                            setPopup({
                              bill,
                              kind: "billPhoto",
                              projectName,
                              clientName,
                              vendorName,
                            });
                          }}
                          className="flex flex-col items-start justify-between border border-[#D8D6D0] bg-[#FAF9F6] p-3 text-left hover:border-[#A58A64] transition-colors cursor-pointer"
                        >
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                            Bill Photo
                          </span>
                          <span className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[10px] font-medium text-[#171717]">
                            {bill.billPhotoUrl ? (
                              <>
                                <ImageIcon size={13} className="text-[#2D6A4F]" />
                                View Photo
                              </>
                            ) : (
                              <>
                                <Upload size={13} className="text-[#A58A64]" />
                                Upload Photo
                              </>
                            )}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUploadError(null);
                            setPopup({
                              bill,
                              kind: "paymentScreenshot",
                              projectName,
                              clientName,
                              vendorName,
                            });
                          }}
                          className="flex flex-col items-start justify-between border border-[#D8D6D0] bg-[#FAF9F6] p-3 text-left hover:border-[#A58A64] transition-colors cursor-pointer"
                        >
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                            Payment Screenshot
                          </span>
                          <span className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[10px] font-medium text-[#171717]">
                            {bill.paymentProofUrl ? (
                              <>
                                <Camera size={13} className="text-[#2D6A4F]" />
                                View Screenshot
                              </>
                            ) : (
                              <>
                                <Upload size={13} className="text-[#A58A64]" />
                                Upload Screenshot
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Pop-up Tile for Viewing / Uploading Bill Photo or Payment Screenshot */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !uploading) {
              setPopup(null);
            }
          }}
        >
          <div className="w-full max-w-lg border border-[#D8D6D0] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] bg-[#FAF9F6] px-5 py-3.5">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#A58A64]">
                  {popup.kind === "billPhoto" ? "Bill Photo" : "Payment Screenshot"}
                </p>
                <h3 className="font-serif text-lg text-[#171717] truncate">
                  {popup.projectName} · {formatCurrency(popup.bill.amount)}
                </h3>
                <p className="text-[11px] text-[#77736C] truncate">
                  {popup.clientName} · {popup.vendorName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPopup(null)}
                disabled={uploading}
                className="p-1.5 text-[#77736C] hover:text-[#171717] cursor-pointer"
                aria-label="Close popup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {activePopupImageUrl ? (
                <div className="flex max-h-[55vh] items-center justify-center overflow-auto border border-[#E5E2DC] bg-[#FAF9F6] p-3">
                  {activePopupIsPdf ? (
                    <div className="py-8 text-center space-y-2">
                      <FileText size={32} className="mx-auto text-[#A58A64]" />
                      <p className="text-xs text-[#4F4B45]">PDF Document Attached</p>
                      <a
                        href={activePopupImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block font-mono text-xs text-[#A58A64] underline"
                      >
                        Open Document
                      </a>
                    </div>
                  ) : (
                    <img
                      src={activePopupImageUrl}
                      alt={popup.kind === "billPhoto" ? "Bill Photo" : "Payment Screenshot"}
                      className="max-h-[50vh] w-auto object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-[#D8D6D0] bg-[#FAF9F6] py-10 text-center">
                  <Upload size={26} className="mx-auto text-[#A58A64]" />
                  <p className="mt-2.5 text-sm font-medium text-[#171717]">
                    No {popup.kind === "billPhoto" ? "bill photo" : "payment screenshot"} uploaded yet
                  </p>
                  <p className="mt-1 text-xs text-[#77736C]">
                    Upload an image or PDF receipt (max 5 MB).
                  </p>
                </div>
              )}

              {uploadError && (
                <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {uploadError}
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.pdf"
                className="hidden"
                onChange={handlePopupFileUpload}
              />

              <div className="mt-4 flex items-center justify-between border-t border-[#E5E2DC] pt-4">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-[#171717] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50 cursor-pointer"
                >
                  <Upload size={13} />
                  {uploading
                    ? "Uploading..."
                    : activePopupImageUrl
                      ? "Replace File"
                      : popup.kind === "billPhoto"
                        ? "Upload Bill Photo"
                        : "Upload Payment Screenshot"}
                </button>

                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  disabled={uploading}
                  className="border border-[#D8D6D0] bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#55514A] hover:border-[#171717] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Notifications & 3-Day Auto Reminder Modal */}
      <AdminNotifyBillsWhatsAppModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        clientsList={clients.map((c) => ({
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          reference: c.clientReference,
        }))}
        selectedClientId={selectedClientId === "ALL" ? undefined : selectedClientId}
      />
    </main>
  );
}
