"use client";

import React, { useRef, useState } from "react";
import { X, Upload, ImageOff, Receipt } from "lucide-react";
import { apiFetch } from "@/lib/api";

export interface BillPhotoTarget {
  id: string;
  billId?: string;
  invoiceNumber?: string;
  projectName?: string;
  amount: number;
  status: string;
  createdAt: string;
  billPhotoUrl?: string;
}

interface BillPhotoModalProps {
  bill: BillPhotoTarget | null;
  onClose: () => void;
  onPhotoUploaded?: (bill: BillPhotoTarget, newPhotoUrl: string) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function BillPhotoModal({
  bill,
  onClose,
  onPhotoUploaded,
}: BillPhotoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!bill) return null;

  const billRef = bill.invoiceNumber || bill.billId || "BILL";
  const isPdf =
    bill.billPhotoUrl?.startsWith("data:application/pdf") ||
    bill.billPhotoUrl?.toLowerCase().endsWith(".pdf");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5 MB.");
      return;
    }

    setError(null);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const targetId = bill.billId || bill.id;
        const res = await apiFetch(`/api/billing/bills/${encodeURIComponent(targetId)}/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ billPhotoUrl: dataUrl }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed (HTTP ${res.status})`);
        }
        onPhotoUploaded?.(bill, dataUrl);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to upload bill photo.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
      setError("Could not read selected file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-photo-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !uploading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg border border-[#D8D6D0] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E2DC] bg-[#FAF9F6] px-5 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Receipt size={13} className="text-[#A58A64] shrink-0" />
              <h3
                id="bill-photo-modal-title"
                className="font-mono text-xs font-bold text-[#171717] truncate"
              >
                {billRef}
              </h3>
              <span className="bg-[#F4EFE2] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#94743F]">
                {bill.status}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#77736C] truncate">
              {bill.projectName || "Studio Project"} · {formatCurrency(bill.amount)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            aria-label="Close bill preview"
            className="text-[#77736C] hover:text-[#171717] disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {bill.billPhotoUrl ? (
            <div className="space-y-3">
              <div className="overflow-hidden border border-[#D8D6D0] bg-[#FAF9F6]">
                {isPdf ? (
                  <iframe
                    src={bill.billPhotoUrl}
                    title={`Bill ${billRef}`}
                    className="h-80 w-full"
                  />
                ) : (
                  <img
                    src={bill.billPhotoUrl}
                    alt={`Bill ${billRef}`}
                    className="max-h-[60vh] w-full object-contain"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-w-[88px] items-center justify-center gap-1 border border-[#D8D6D0] bg-[#FAF9F6] px-3 py-1.5 font-mono text-[8px] uppercase tracking-widest text-[#55514A] hover:border-[#171717] disabled:opacity-40 transition-colors"
                >
                  <Upload size={9} />
                  {uploading ? "Uploading..." : "Replace"}
                </button>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={onClose}
                  className="inline-flex min-w-[88px] items-center justify-center border border-[#171717] bg-[#171717] px-3 py-1.5 font-mono text-[8px] uppercase tracking-widest text-white hover:border-[#A58A64] hover:bg-[#A58A64] disabled:opacity-40 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-[#D8D6D0] bg-[#FAF9F6] px-5 py-8 text-center">
              <ImageOff size={24} className="mx-auto text-[#A58A64]" />
              <p className="mt-3 font-serif text-lg text-[#171717]">
                No Bill Photo Uploaded
              </p>
              <p className="mt-1 text-xs text-[#77736C]">
                No bill image or document is attached to {billRef} yet.
              </p>

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-1.5 bg-[#171717] px-3.5 py-2 font-mono text-[8px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-40 transition-colors"
              >
                <Upload size={11} />
                {uploading ? "Uploading..." : "Upload Bill Photo"}
              </button>
            </div>
          )}

          {error && (
            <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
