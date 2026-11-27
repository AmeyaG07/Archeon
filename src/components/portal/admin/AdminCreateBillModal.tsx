"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Receipt,
  UploadCloud,
  Building2,
  User,
  IndianRupee,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { OptionalField } from "@/components/ui/OptionalField";

export interface AdminCreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillCreated: () => void;
  defaultClientId?: string;
  defaultProjectId?: string;
}

export function AdminCreateBillModal({
  isOpen,
  onClose,
  onBillCreated,
  defaultClientId,
  defaultProjectId,
}: AdminCreateBillModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lists
  const [clients, setClients] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // Form fields
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientId || "");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || "");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [billPhotoUrl, setBillPhotoUrl] = useState<string>("");
  const [billFileName, setBillFileName] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load lookups when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (defaultClientId) setSelectedClientId(defaultClientId);
    if (defaultProjectId) setSelectedProjectId(defaultProjectId);

    const loadLookups = async () => {
      setLoadingLookups(true);
      try {
        const [cRes, vRes, pRes] = await Promise.all([
          apiFetch("/api/clients").catch(() => null),
          apiFetch("/api/vendors").catch(() => null),
          apiFetch("/api/operational-projects").catch(() => null),
        ]);

        if (cRes && cRes.ok) {
          const cData = await cRes.json();
          setClients(Array.isArray(cData) ? cData : []);
          if (!defaultClientId && Array.isArray(cData) && cData.length > 0) {
            setSelectedClientId(cData[0].id || "");
          }
        }

        if (vRes && vRes.ok) {
          const vData = await vRes.json();
          setVendors(Array.isArray(vData) ? vData : []);
          if (Array.isArray(vData) && vData.length > 0) {
            setSelectedVendorId(vData[0].id || vData[0].vendorReference || "");
          }
        }

        if (pRes && pRes.ok) {
          const pData = await pRes.json();
          setProjects(Array.isArray(pData) ? pData : []);
          if (!defaultProjectId && Array.isArray(pData) && pData.length > 0) {
            setSelectedProjectId(pData[0].id || "");
          }
        }
      } catch (err) {
        console.warn("Failed to load bill lookups:", err);
      } finally {
        setLoadingLookups(false);
      }
    };

    loadLookups();
  }, [isOpen, defaultClientId, defaultProjectId]);

  // Update filtered projects when client changes
  const filteredProjects = projects.filter((p) => {
    if (!selectedClientId) return true;
    return String(p.clientId) === String(selectedClientId);
  });

  useEffect(() => {
    if (filteredProjects.length > 0 && !filteredProjects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(filteredProjects[0].id);
    }
  }, [selectedClientId, filteredProjects, selectedProjectId]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBillFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setBillPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setBillPhotoUrl("");
    setBillFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid bill amount greater than ₹0.");
      return;
    }

    if (!selectedVendorId) {
      setError("Please select a Trade Partner / Vendor from the list.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedVendor = vendors.find(
        (v) => v.id === selectedVendorId || v.vendorReference === selectedVendorId
      );

      const generatedBillRef = invoiceNumber.trim() || `BILL-${Date.now().toString().slice(-6)}`;

      const payload = {
        clientId: selectedClientId || undefined,
        projectId: selectedProjectId || undefined,
        vendorId: selectedVendor?.vendorReference || selectedVendorId,
        amount: parsedAmount,
        tradeCategory: selectedVendor?.category || selectedVendor?.tradeDiscipline || "Civil Contractor",
        invoiceNumber: generatedBillRef,
        description: details.trim() || undefined,
        billPhotoUrl: billPhotoUrl || undefined,
      };

      const res = await apiFetch("/api/billing/bills", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to submit bill (HTTP ${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        onBillCreated();
        onClose();
        // Reset form
        setAmount("");
        setInvoiceNumber("");
        setDetails("");
        setBillPhotoUrl("");
        setBillFileName("");
        setSuccess(false);
      }, 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record bill.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-lenis-prevent="true"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] p-6 sm:p-8 shadow-2xl"
      >
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 p-1 text-[#77736C] hover:text-[#171717] transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#D8D6D0] pb-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            <Receipt size={14} /> Studio Financial Operations
          </div>
          <h2 className="mt-1 font-serif text-2xl text-[#171717]">
            Upload &amp; Add Trade Partner Bill
          </h2>
          <p className="mt-1 font-mono text-xs text-[#77736C]">
            Record a vendor bill against the client project. The bill and attached voucher will be immediately visible to both Client and Trade Partner.
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 p-3 font-mono text-xs text-red-800">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-emerald-300 bg-emerald-50 p-3 font-mono text-xs text-emerald-800">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            <span>Bill recorded successfully! Synced to Client and Vendor portals.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Client & Project Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Select Client *
              </label>
              <select
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={Boolean(defaultClientId)}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              >
                {clients.length === 0 ? (
                  <option value="">Loading clients...</option>
                ) : (
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName || c.name} ({c.clientReference || "CLI"})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Associated Project *
              </label>
              <select
                required
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              >
                {filteredProjects.length === 0 ? (
                  <option value="">No projects found for client</option>
                ) : (
                  filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.projectReference}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Vendor Name Drop List */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              Vendor Name Drop List *
            </label>
            <select
              required
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            >
              {vendors.length === 0 ? (
                <option value="">Loading trade partners...</option>
              ) : (
                vendors.map((v) => (
                  <option key={v.id || v.vendorReference} value={v.id || v.vendorReference}>
                    {v.businessName || v.name} — {v.category || v.tradeCategory || "Contractor"} ({v.vendorReference || "VEN"})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Bill Amount & Bill Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Bill Amount (₹ INR) *
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-xs text-[#A58A64]">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  placeholder="e.g. 150000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-sm border border-[#D8D6D0] bg-white pl-8 pr-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
            </div>

            <OptionalField label="Bill / Invoice No. (Optional)">
              <input
                type="text"
                placeholder="e.g. BILL-2026-042"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </OptionalField>
          </div>

          {/* Details (Optional) */}
          <OptionalField label="Details / Scope Description (Optional)">
            <textarea
              rows={2}
              placeholder="e.g. 1st Running Account bill for RCC foundation casting & structural columns..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />
          </OptionalField>

          {/* Attach Bill Image */}
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#A58A64]">
                <ImageIcon size={13} /> Bill Ka Image Attach
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-[#171717] hover:text-[#A58A64] transition-colors cursor-pointer"
              >
                <UploadCloud size={13} />
                <span>{billPhotoUrl ? "Change Photo" : "+ Attach Bill Photo"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {billPhotoUrl ? (
              <div className="mt-3 flex items-center justify-between rounded-sm border border-[#C6A779]/40 bg-[#FAF8F5] p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xs border border-[#D8D6D0] bg-white p-1">
                    <img
                      src={billPhotoUrl}
                      alt="Bill Voucher Preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#171717]">
                      <FileText size={13} className="text-[#A58A64]" />
                      <span>{billFileName || "Bill Voucher Attachment"}</span>
                    </div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-[#A58A64] mt-0.5">
                      Ready for Client &amp; Vendor Dual Inspection
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="rounded-xs p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove image"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <p className="mt-2 text-[11px] font-mono text-[#77736C]">
                Attach an on-site photo or scanned copy of the contractor&apos;s physical bill voucher.
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8D6D0]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xs border border-[#D8D6D0] px-4 py-2 font-mono text-xs text-[#77736C] hover:bg-[#F2F0EB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xs bg-[#171717] px-6 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] transition-colors disabled:opacity-50"
            >
              <UploadCloud size={14} />
              {submitting ? "Uploading..." : "Upload & Record Bill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
