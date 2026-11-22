"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, Mail, Phone, Building2, MapPin, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { AdminClientRecord } from "@/components/portal/admin/AdminClientManagement";

interface AdminEditClientModalProps {
  client: AdminClientRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated: () => void;
}

export function AdminEditClientModal({
  client,
  isOpen,
  onClose,
  onClientUpdated,
}: AdminEditClientModalProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (client) {
      setFullName(client.fullName || "");
      setPhone(client.phone || "");
      setOrganization(client.organisation || "");
      setLocation(client.location || "");
      setNotes("");
      setError(null);
      setSuccess(false);
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !phone.trim()) {
      setError("Full name and phone number are mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/clients/${client.id}`, {
        method: "PUT",
        body: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          organization: organization.trim() || undefined,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to update client (HTTP ${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        onClientUpdated();
        onClose();
        setSuccess(false);
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update client details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-lenis-prevent="true"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] p-6 sm:p-8 shadow-2xl"
      >
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 p-1 text-[#77736C] hover:text-[#171717] transition-colors"
        >
          <X size={20} />
        </button>

        <div className="border-b border-[#D8D6D0] pb-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            <Edit3 size={14} /> Update Client Record
          </div>
          <h2 className="mt-1 font-serif text-2xl text-[#171717]">
            {client.fullName}
          </h2>
          <p className="mt-1 font-mono text-xs text-[#77736C]">
            Reference: <span className="text-[#171717] font-semibold">{client.reference}</span> • Email: {client.email}
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
            <span>Client details updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              Client Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                <Phone size={12} /> Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                <Building2 size={12} /> Organization
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              <MapPin size={12} /> Location / Address
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              <FileText size={12} /> Client Specifications
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Modern minimalist villa, bespoke stone finishes..."
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
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-6 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50 transition-colors shadow-xs"
            >
              <Edit3 size={14} />
              {submitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
