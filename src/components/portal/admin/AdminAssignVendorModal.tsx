"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, UserPlus, Building2, Briefcase, IndianRupee, FileText, AlertCircle, CheckCircle2, MessageSquare, Image as ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface VendorOption {
  id: string;
  businessName: string;
  vendorReference?: string;
  category?: string;
  contactPerson?: string;
  phone?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vendorId, setVendorId] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [assignedVendorIds, setAssignedVendorIds] = useState<Set<string>>(new Set());
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setLoadingVendors(true);

      Promise.all([
        apiFetch("/api/vendors").then((res) => res.json()).catch(() => []),
        apiFetch(`/api/operational-projects/${projectId}/vendors`).then((res) => res.json()).catch(() => []),
      ])
        .then(([allVendors, currentAssignments]) => {
          const assignedIds = new Set<string>();
          if (Array.isArray(currentAssignments)) {
            currentAssignments.forEach((a: any) => {
              if (a.vendorId) assignedIds.add(a.vendorId);
            });
          }
          setAssignedVendorIds(assignedIds);

          if (Array.isArray(allVendors)) {
            setVendors(allVendors);
            // Default select first vendor that is NOT already assigned
            const firstUnassigned = allVendors.find((v: VendorOption) => !assignedIds.has(v.id));
            if (firstUnassigned) {
              setVendorId(firstUnassigned.id);
            } else if (allVendors.length > 0) {
              setVendorId(allVendors[0].id);
            }
          }
        })
        .catch(() => setError("Failed to load registered trade vendors"))
        .finally(() => setLoadingVendors(false));
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
      const selectedVendor = vendors.find((v) => v.id === vendorId);
      const enrichedNotes = photoFileName
        ? `${notes.trim() ? notes.trim() + "\n\n" : ""}[Attached Site Reference Photo: ${photoFileName}]`
        : notes.trim();

      const res = await apiFetch(`/api/operational-projects/${projectId}/vendors`, {
        method: "POST",
        body: {
          vendorId,
          scopeOfWork: scopeOfWork.trim(),
          contractAmount: contractAmount ? Number(contractAmount) : undefined,
          notes: enrichedNotes || undefined,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg =
          errData.error ||
          errData.message ||
          (typeof errData === "string" ? errData : null) ||
          `Failed to assign vendor (HTTP ${res.status})`;
        throw new Error(msg);
      }

      // If sendWhatsApp is enabled, dispatch WhatsApp update
      if (sendWhatsApp && selectedVendor) {
        const targetPhone = selectedVendor.phone ? selectedVendor.phone.replace(/[^0-9]/g, "") : "";
        const waMessage =
          `*ArcheOn Design Studio — Project Assignment Notice*\n\n` +
          `Hello ${selectedVendor.contactPerson || selectedVendor.businessName},\n` +
          `You have been assigned to project: *${projectName}*.\n\n` +
          `*Scope of Work:* ${scopeOfWork.trim()}\n` +
          (contractAmount ? `*Allocated Budget:* ₹${Number(contractAmount).toLocaleString("en-IN")}\n` : "") +
          (notes.trim() ? `*Instructions & Site Conditions:* ${notes.trim()}\n\n` : "\n") +
          (photoFileName ? `*Attachment:* ${photoFileName}\n\n` : "") +
          `Please access your ArcheOn Vendor Portal to view project files, progress logs, and submit invoices.`;

        const waUrl = targetPhone
          ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(waMessage)}`
          : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

        // Open WhatsApp web/app in a new window
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }

      setSuccess(true);
      setTimeout(() => {
        onVendorAssigned();
        onClose();
        setScopeOfWork("");
        setContractAmount("");
        setNotes("");
        setPhotoPreview(null);
        setPhotoFileName(null);
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
            ) : vendors.length > 0 && vendors.every((v) => assignedVendorIds.has(v.id)) ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs font-mono text-amber-800">
                All registered trade partners are currently assigned to this project. To assign a new partner, please register one under Trade Partners first.
              </div>
            ) : (
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              >
                {vendors.map((v) => {
                  const isAssigned = assignedVendorIds.has(v.id);
                  return (
                    <option key={v.id} value={v.id} disabled={isAssigned}>
                      {v.businessName} ({v.category || "General"} — {v.contactPerson || "Partner"})
                      {isAssigned ? " [Already Assigned]" : ""}
                    </option>
                  );
                })}
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

          {/* Specific Instructions or Site Conditions */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                <FileText size={12} /> Specific Instructions or Site Conditions
              </label>

              {/* Add Photo Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#A58A64] hover:text-[#171717] transition-colors cursor-pointer"
              >
                <ImageIcon size={12} />
                <span>{photoPreview ? "Change Photo" : "+ Add Photo"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Material staging permitted only on Ground Floor west terrace."
              className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />

            {/* Photo Preview Card */}
            {photoPreview && (
              <div className="mt-2.5 flex items-center justify-between rounded-sm border border-[#C6A779]/40 bg-[#FAF8F5] p-2.5">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xs border border-[#D8D6D0] bg-white">
                    <img
                      src={photoPreview}
                      alt="Site condition thumbnail"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-[#171717] truncate max-w-[240px]">
                      {photoFileName}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-[#A58A64]">
                      Attached to Vendor Instructions
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="rounded-xs p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Send Update to Vendor via WhatsApp */}
          <div className="rounded-sm border border-[#25D366]/30 bg-[#25D366]/5 p-3.5 transition-all">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="mt-0.5 rounded border-[#25D366] text-[#25D366] focus:ring-[#25D366]"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#25D366] text-white">
                    <MessageSquare size={10} />
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#171717]">
                    Send this update to the vendor (WhatsApp message)
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10.5px] text-[#55514A] leading-relaxed">
                  Automatically prepares and dispatches a verified WhatsApp notification to the trade partner with the project scope, budget, and site instructions.
                </p>
              </div>
            </label>
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
