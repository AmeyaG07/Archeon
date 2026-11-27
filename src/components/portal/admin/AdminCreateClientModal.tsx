"use client";

import { OptionalField } from "@/components/ui/OptionalField";

import React, { useState } from "react";
import { X, UserPlus, Mail, Phone, Building2, MapPin, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AdminCreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

export function AdminCreateClientModal({
  isOpen,
  onClose,
  onClientCreated,
}: AdminCreateClientModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [sendInvite, setSendInvite] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError("Full name, email address, and phone number are mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create client in registry
      const res = await apiFetch("/api/clients", {
        method: "POST",
        body: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          organization: organization.trim() || undefined,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Client creation failed (HTTP ${res.status})`);
      }

      const client = await res.json();

      // 2. Optionally trigger instant portal invitation
      if (sendInvite && client.id) {
        try {
          await apiFetch(`/api/clients/${client.id}/invite`, {
            method: "POST",
          });
        } catch {
          // Non-fatal if invitation delivery queues
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClientCreated();
        onClose();
        // Reset form
        setFullName("");
        setEmail("");
        setPhone("");
        setOrganization("");
        setLocation("");
        setNotes("");
        setSuccess(false);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register client");
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
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] p-6 sm:p-8 shadow-2xl"
      >
        {/* Close Button */}
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
            <UserPlus size={14} /> Studio Client Registration
          </div>
          <h2 className="mt-1 font-serif text-2xl text-[#171717]">
            Register New Client
          </h2>
          <p className="mt-1 font-mono text-xs text-[#77736C]">
            Add a new client entity to the studio directory and establish their dedicated client portal.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 p-3 font-mono text-xs text-red-800">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-emerald-300 bg-emerald-50 p-3 font-mono text-xs text-emerald-800">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            <span>Client registered successfully! {sendInvite && "Portal invitation dispatched."}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              Client Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ar. Vikramaditya Singhania"
              className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                <Mail size={12} /> Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                <Phone size={12} /> Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
          </div>

          {/* Organization & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <OptionalField
              label={
                <span className="inline-flex items-center gap-1">
                  <Building2 size={12} /> Organization / Company (Optional)
                </span>
              }
            >
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Singhania Estates / Private"
                className="w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </OptionalField>
            <OptionalField
              label={
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} /> Location / City (Optional)
                </span>
              }
            >
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Alibaug, Maharashtra"
                className="w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </OptionalField>
          </div>

          {/* Client Specifications */}
          <div>
            <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              <FileText size={12} /> Client Specifications
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Modern minimalist villa, bespoke stone finishes, prefers WhatsApp billing notifications."
              className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />
          </div>

          {/* Portal Invitation Checkbox */}
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="rounded border-[#D8D6D0] text-[#A58A64] focus:ring-[#A58A64]"
              />
              <span className="font-mono text-xs font-semibold text-[#171717]">
                Dispatch Secure Portal Invitation Immediately
              </span>
            </label>
            <p className="mt-1 ml-5 font-mono text-[11px] text-[#77736C]">
              Generates an onboarding activation link and dispatches dual Email/SMS invitation so the client can activate their account.
            </p>
          </div>

          {/* Form Actions */}
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
              <UserPlus size={14} />
              {submitting ? "Registering Client..." : "Register Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
