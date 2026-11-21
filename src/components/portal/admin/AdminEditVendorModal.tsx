"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, Mail, Phone, Building2, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { AdminVendorRecord } from "@/components/portal/admin/AdminVendorManagement";

const TRADE_CATEGORIES = [
  { value: "CIVIL_WORK", label: "Civil & Structural" },
  { value: "CARPENTRY", label: "Carpentry & Architectural Millwork" },
  { value: "ELECTRICAL", label: "Electrical Systems & Automation" },
  { value: "PLUMBING", label: "Plumbing & Sanitary" },
  { value: "HVAC", label: "HVAC & Climate Systems" },
  { value: "MASONRY", label: "Stone, Marble & Masonry" },
  { value: "FABRICATION", label: "Structural Glass & Metal Fabrication" },
  { value: "OTHER", label: "Others (Custom Trade)" },
];

interface AdminEditVendorModalProps {
  vendor: AdminVendorRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onVendorUpdated: () => void;
}

export function AdminEditVendorModal({
  vendor,
  isOpen,
  onClose,
  onVendorUpdated,
}: AdminEditVendorModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("CIVIL_WORK");
  const [customCategory, setCustomCategory] = useState("");
  const [location, setLocation] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (vendor) {
      setBusinessName(vendor.businessName || "");
      setContactPerson(vendor.contactPerson || "");
      setPhone(vendor.phone || "");
      const matchedCat = TRADE_CATEGORIES.some((c) => c.value === vendor.category);
      if (matchedCat) {
        setCategory(vendor.category || "CIVIL_WORK");
        setCustomCategory("");
      } else {
        setCategory("OTHER");
        setCustomCategory(vendor.category || "");
      }
      setLocation(vendor.location || "");
      setError(null);
      setSuccess(false);
    }
  }, [vendor]);

  if (!isOpen || !vendor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessName.trim() || !contactPerson.trim() || !phone.trim()) {
      setError("Business name, contact person, and phone number are mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      const resolvedCategory =
        category === "OTHER"
          ? (customCategory.trim() || "OTHER")
          : category;

      const res = await apiFetch(`/api/vendors/${vendor.id}`, {
        method: "PUT",
        body: {
          businessName: businessName.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          category: resolvedCategory,
          location: location.trim() || undefined,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to update vendor (HTTP ${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        onVendorUpdated();
        onClose();
        setSuccess(false);
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update vendor details");
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
            <Edit3 size={14} /> Update Trade Partner Record
          </div>
          <h2 className="mt-1 font-serif text-2xl text-[#171717]">
            {vendor.businessName}
          </h2>
          <p className="mt-1 font-mono text-xs text-[#77736C]">
            Reference: <span className="text-[#171717] font-semibold">{vendor.reference}</span> • Email: {vendor.email}
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
            <span>Vendor details updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Trade Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              >
                {TRADE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {category === "OTHER" && (
                <input
                  type="text"
                  required
                  placeholder="Specify custom trade discipline..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full rounded-sm border border-[#A58A64] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:ring-1 focus:ring-[#A58A64] focus:outline-none"
                />
              )}
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Contact Person *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
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
                <MapPin size={12} /> Workshop / City
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
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
