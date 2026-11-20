"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Building2, Briefcase, IndianRupee, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface VendorOption {
  id: string;
  businessName: string;
  vendorReference?: string;
  category?: string;
  contactPerson?: string;
}

interface AdminAssignVendorModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onVendorAssigned: () => void;
}

export function AdminAssignVendorModal({
  projectId,
  projectName,
  isOpen,
  onClose,
  onVendorAssigned,
}: AdminAssignVendorModalProps) {
  const [vendorId, setVendorId] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setLoadingVendors(true);

      apiFetch("/api/vendors")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setVendors(data);
            if (data.length > 0 && !vendorId) {
              setVendorId(data[0].id);
            }
          }
        })
        .catch(() => setError("Failed to load registered trade vendors"))
        .finally(() => setLoadingVendors(false));
    }
  }, [isOpen, vendorId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vendorId) {
      setError("Please select a vendor to assign.");
      return;
    }
    if (!scopeOfWork.trim()) {
      setError("Scope of work description is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/operational-projects/${projectId}/vendors`, {
        method: "POST",
        body: {
          vendorId,
          scopeOfWork: scopeOfWork.trim(),
          contractAmount: contractAmount ? Number(contractAmount) : undefined,
          notes: notes.trim() || undefined,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to assign vendor (HTTP ${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        onVendorAssigned();
        onClose();
        setScopeOfWork("");
        setContractAmount("");
        setNotes("");
        setSuccess(false);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to assign vendor to project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 p-1 text-[#77736C] hover:text-[#171717] transition-colors"
        >
          <X size={20} />
        </button>

        <div className="border-b border-[#D8D6D0] pb-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            <UserPlus size={14} /> Project Vendor Onboarding
          </div>
          <h2 className="mt-1 font-serif text-2xl text-[#171717]">
            Assign Trade Partner
          </h2>
          <p className="mt-1 font-mono text-xs text-[#77736C]">
            Project: <span className="font-semibold text-[#171717]">{projectName}</span>
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
            <span>Vendor successfully assigned to project!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Vendor Selector */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              Select Registered Trade Partner *
            </label>
            {loadingVendors ? (
              <div className="py-2 text-xs font-mono text-[#A58A64]">Loading vendor directory...</div>
            ) : vendors.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs font-mono text-amber-800">
                No registered vendors found. Please register a vendor first in the Vendor Management directory.
              </div>
            ) : (
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.businessName} ({v.category || "General"} — {v.contactPerson || "Partner"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Scope of Work */}
          <div>
            <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              <Briefcase size={12} /> Scope of Work / Trade Deliverables *
            </label>
            <textarea
              required
              rows={3}
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              placeholder="e.g. Bespoke teakwood wardrobes, master suite wall panelling, and solid oak vanity fabrication."
              className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />
          </div>

          {/* Allocated Contract Value */}
          <div>
            <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              <IndianRupee size={12} /> Allocated Contract Value (₹ INR)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={contractAmount}
              onChange={(e) => setContractAmount(e.target.value)}
              placeholder="e.g. 500000"
              className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />
            <p className="mt-1 font-mono text-[10px] text-[#77736C]">
              Estimated trade budget used to track settled vs pending milestone spending.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              <FileText size={12} /> Specific Instructions or Site Conditions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Material staging permitted only on Ground Floor west terrace."
              className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#D8D6D0] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-sm border border-[#D8D6D0] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#77736C] hover:bg-[#FAF9F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || vendors.length === 0}
              className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-6 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50 transition-colors shadow-xs"
            >
              <UserPlus size={14} />
              {submitting ? "Assigning Vendor..." : "Confirm Vendor Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
