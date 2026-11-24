"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, QrCode, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Building2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DualImageUpload } from "@/components/ui/DualImageUpload";
import type { AdminVendorRecord } from "@/components/portal/admin/AdminVendorManagement";

interface AdminVendorPaymentSettingsModalProps {
  vendor: AdminVendorRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export function AdminVendorPaymentSettingsModal({
  vendor,
  isOpen,
  onClose,
  onSettingsSaved,
}: AdminVendorPaymentSettingsModalProps) {
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (vendor && isOpen) {
      setError(null);
      setSuccess(false);
      setLoading(true);

      apiFetch(`/api/vendor-payment-methods/vendor/${vendor.id}`)
        .then((res) => {
          if (res.status === 204) return null;
          return res.json();
        })
        .then((data) => {
          if (data) {
            setAccountHolderName(data.accountHolderName || vendor.businessName || "");
            setBankName(data.bankName || "");
            setAccountNumber(data.accountNumber || "");
            setIfscCode(data.ifscCode || "");
            setUpiId(data.upiId || "");
            setQrCodeUrl(data.qrCodeUrl || "");
          } else {
            setAccountHolderName(vendor.businessName || "");
            setBankName("");
            setAccountNumber("");
            setIfscCode("");
            setUpiId("");
            setQrCodeUrl("");
          }
        })
        .catch(() => {
          setError("Failed to load vendor payment configuration");
        })
        .finally(() => setLoading(false));
    }
  }, [vendor, isOpen]);

  if (!isOpen || !vendor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/vendor-payment-methods/vendor/${vendor.id}`, {
        method: "PUT",
        body: {
          accountHolderName: accountHolderName.trim() || vendor.businessName,
          bankName: bankName.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          ifscCode: ifscCode.trim() || undefined,
          upiId: upiId.trim() || undefined,
          qrCodeUrl: qrCodeUrl.trim() || undefined,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to save payment settings (HTTP ${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        onSettingsSaved();
        onClose();
        setSuccess(false);
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update vendor payment settings");
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
            <CreditCard size={14} /> Settlement & Banking Configuration
          </div>
          <h2 className="mt-1 font-serif text-2xl text-[#171717]">
            {vendor.businessName}
          </h2>
          <p className="mt-1 font-mono text-xs text-[#77736C]">
            Configure direct NEFT/RTGS bank credentials and instant UPI settlement coordinates.
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
            <span>Payment settings updated successfully!</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-[#A58A64]">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading Payment Configuration...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Beneficiary / Account Holder Name
              </label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="e.g. Paramount Millwork LLP"
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="50200012345678"
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="HDFC0000123"
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="vendor@okhdfcbank"
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
            </div>

            <DualImageUpload
              label="UPI QR Code (Upload from Device or Paste Link)"
              value={qrCodeUrl}
              onChange={setQrCodeUrl}
              placeholder="Paste Google Drive share link, Dropbox or cloud photo URL..."
            />

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
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-6 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50 transition-colors shadow-xs"
              >
                <CreditCard size={14} />
                {submitting ? "Saving Settings..." : "Save Payment Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
