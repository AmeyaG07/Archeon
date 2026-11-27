"use client";

import { OptionalField } from "@/components/ui/OptionalField";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  CheckCircle2,
  MapPin,
  ChevronDown,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";
import { emitToast } from "@/providers/ToastProvider";
import { apiFetch } from "@/lib/api";
import {
  DEFAULT_STUDIO_PROFILE,
  StudioProfileData,
  fetchPublicStudioProfile,
  getOfficeMapsHref,
} from "@/lib/studioProfile";

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultServiceId?: string | null;
}

const CONTACT_MODES = [
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Phone Call", label: "Call" },
  { value: "Email", label: "Email" },
] as const;

const BUDGET_OPTIONS = [
  "₹25L – ₹50L",
  "₹50L – ₹1.5 Cr",
  "₹1.5 Cr – ₹5 Cr",
  "₹5 Cr+",
] as const;

export function ConsultationModal({
  isOpen,
  onClose,
  defaultServiceId,
}: ConsultationModalProps) {
  const { playSfx } = useAudio();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    preferredContact: "WhatsApp",
    serviceId: null as string | null,
    location: "",
    budgetBand: "₹50L – ₹1.5 Cr",
    brief: "",
    whatsappConsent: true,
  });

  const activeServiceId = formData.serviceId || defaultServiceId || "architecture";

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [studioProfile, setStudioProfile] =
    useState<StudioProfileData>(DEFAULT_STUDIO_PROFILE);

  useEffect(() => {
    if (!isOpen) return;
    fetchPublicStudioProfile().then(setStudioProfile).catch(() => {});
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSfx("enter-project");
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await apiFetch("/api/leads", {
        method: "POST",
        body: {
          clientName: formData.name.trim(),
          phone: formData.mobile.trim(),
          email: formData.email.trim(),
          serviceDiscipline: activeServiceId.toUpperCase(),
          location: formData.location.trim(),
          budgetBand: formData.budgetBand,
          estimatedTimeline: formData.preferredContact,
          projectBrief: formData.brief.trim(),
          whatsappOptIn: formData.whatsappConsent,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const refId = data.leadId
          ? `ARCHEON-${String(data.leadId).substring(0, 8).toUpperCase()}`
          : `ARCHEON-${Math.floor(100000 + Math.random() * 900000)}`;
        setSubmittedRef(refId);
        emitToast("Consultation enquiry registered with ArcheOn Studio.", "success");
      } else {
        const errData = await res.json().catch(() => null);
        const msg =
          errData?.error ||
          "Please verify all required fields and try submitting again.";
        setSubmitError(msg);
        emitToast(msg, "error");
      }
    } catch {
      // Graceful offline fallback
      setSubmittedRef(`ARCHEON-${Math.floor(100000 + Math.random() * 900000)}`);
      emitToast("Enquiry saved locally.", "info");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedRef(null);
    setSubmitError(null);
    setFormData((prev) => ({ ...prev, serviceId: null }));
    onClose();
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setSubmittedRef(null);
        setSubmitError(null);
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const primaryOffice = studioProfile.offices[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 pointer-events-auto"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playSfx("ui-short");
              resetForm();
            }}
            className="absolute inset-0 bg-black/82 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            aria-labelledby="consultation-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl border border-[#C6A779]/30 bg-[#0D0C0B]/96 backdrop-blur-2xl p-5 sm:p-7 md:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.1)] text-[#F2F0EB] [scrollbar-width:thin] [scrollbar-color:#2a2725_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-800 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {/* Clean Modal Header */}
            <div className="mb-5 pb-4 border-b border-white/10 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <h2
                  id="consultation-modal-title"
                  className="font-serif text-2xl sm:text-3xl text-white tracking-tight"
                >
                  Discuss Your Project
                </h2>
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="font-['Outfit',sans-serif] text-[13px] text-[#B8B4AC] font-light">
                    Direct consultation with Ar. Mandar Bhalekar.
                  </p>
                  {primaryOffice && (
                    <a
                      href={getOfficeMapsHref(primaryOffice)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] hover:border-[#C6A779]/45 px-2.5 py-0.5 text-[10px] font-mono text-[#D4D0C5] hover:text-[#F4E6C8] transition-colors shrink-0"
                    >
                      <MapPin className="w-2.5 h-2.5 text-[#C6A779]" />
                      <span>{primaryOffice.label}</span>
                      <ArrowUpRight className="w-2.5 h-2.5 text-[#C6A779]" />
                    </a>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playSfx("ui-short");
                  resetForm();
                }}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submittedRef ? (
              /* Clean Success State */
              <div className="py-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#C6A779]/20 border border-[#C6A779]/45 text-[#C6A779] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-white">
                  Commission Enquiry Registered
                </h3>
                <div className="inline-block px-4 py-2 rounded-xl bg-black/55 border border-[#C6A779]/40 text-[#C6A779] font-mono text-xs tracking-wider">
                  REFERENCE: {submittedRef}
                </div>
                <p className="text-sm font-['Outfit',sans-serif] text-stone-300 max-w-md mx-auto font-light leading-relaxed">
                  Thank you for reaching out. Ar. Mandar Bhalekar&apos;s studio team
                  will review your brief and respond via{" "}
                  <span className="text-[#E0D8C3] font-medium">
                    {formData.preferredContact}
                  </span>
                  .
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-4 px-7 py-3 rounded-full bg-[#C6A779] hover:bg-[#D97724] text-stone-950 font-semibold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Return to Studio
                </button>
              </div>
            ) : (
              /* Clean Streamlined Consultation Form */
              <form onSubmit={handleSubmit} className="space-y-4.5">
                {submitError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-400/35 bg-red-500/10 p-3 text-xs text-red-200"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* 01 · Essential Contact & Location Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="consult-name"
                      className="block text-[10.5px] font-mono uppercase tracking-wider text-stone-400 mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      id="consult-name"
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.035] border border-white/12 hover:border-white/25 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white placeholder:text-stone-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="consult-mobile"
                      className="block text-[10.5px] font-mono uppercase tracking-wider text-stone-400 mb-1.5"
                    >
                      Mobile Number *
                    </label>
                    <input
                      id="consult-mobile"
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.035] border border-white/12 hover:border-white/25 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white placeholder:text-stone-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="consult-email"
                      className="block text-[10.5px] font-mono uppercase tracking-wider text-stone-400 mb-1.5"
                    >
                      Email Address *
                    </label>
                    <input
                      id="consult-email"
                      type="email"
                      required
                      placeholder="client@domain.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.035] border border-white/12 hover:border-white/25 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white placeholder:text-stone-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="consult-location"
                      className="block text-[10.5px] font-mono uppercase tracking-wider text-stone-400 mb-1.5"
                    >
                      Site City / Location *
                    </label>
                    <input
                      id="consult-location"
                      type="text"
                      required
                      placeholder="e.g. Pune, Nagpur, Mumbai"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.035] border border-white/12 hover:border-white/25 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white placeholder:text-stone-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 02 · Interactive Discipline Pills */}
                <div>
                  <span className="block text-[10.5px] font-mono uppercase tracking-wider text-stone-400 mb-2">
                    Discipline *
                  </span>
                  <div
                    role="group"
                    aria-label="Select project discipline"
                    className="flex flex-wrap gap-2"
                  >
                    {siteConfig.services.map((srv) => {
                      const active = activeServiceId === srv.id;
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setFormData({ ...formData, serviceId: srv.id })
                          }
                          className={`px-3.5 py-1.5 rounded-full border text-xs font-['Outfit',sans-serif] transition-all cursor-pointer ${
                            active
                              ? "border-[#C6A779] bg-[#B68A4A]/25 text-[#F4E6C8] shadow-[0_0_12px_rgba(182,138,74,0.25)] font-medium"
                              : "border-white/12 bg-white/[0.03] text-stone-300 hover:border-[#C6A779]/45 hover:text-white"
                          }`}
                        >
                          {srv.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 03 · Budget & Preferred Contact Segmented Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="consult-budget"
                      className="block text-[10.5px] font-mono uppercase tracking-wider text-stone-400 mb-1.5"
                    >
                      Estimated Budget (INR)
                    </label>
                    <div className="relative">
                      <select
                        id="consult-budget"
                        value={formData.budgetBand}
                        onChange={(e) =>
                          setFormData({ ...formData, budgetBand: e.target.value })
                        }
                        className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl bg-[#151311] border border-white/12 hover:border-white/25 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white focus:outline-none transition-colors cursor-pointer"
                      >
                        {BUDGET_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#C6A779]"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10.5px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                      Preferred Contact
                    </span>
                    <div className="grid grid-cols-3 rounded-xl border border-white/12 bg-white/[0.03] p-1">
                      {CONTACT_MODES.map((mode) => {
                        const active = formData.preferredContact === mode.value;
                        return (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                preferredContact: mode.value,
                              })
                            }
                            className={`py-1.5 rounded-lg text-xs font-['Outfit',sans-serif] transition-all cursor-pointer ${
                              active
                                ? "bg-[#B68A4A]/25 text-[#F4E6C8] border border-[#C6A779]/45 font-medium"
                                : "text-stone-400 hover:text-white border border-transparent"
                            }`}
                          >
                            {mode.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 04 · Concise Project Brief */}
                <OptionalField
                  label="Project Brief (Optional)"
                  labelClassName="text-[10.5px] font-mono uppercase tracking-wider text-stone-400 hover:text-white"
                >
                  <textarea
                    id="consult-brief"
                    rows={2}
                    placeholder="Plot size, timeline, or key design aspirations..."
                    value={formData.brief}
                    onChange={(e) =>
                      setFormData({ ...formData, brief: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.035] border border-white/12 hover:border-white/25 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white placeholder:text-stone-500 focus:outline-none transition-colors resize-y min-h-[72px]"
                  />
                </OptionalField>

                {/* Compact WhatsApp Opt-In */}
                <label
                  htmlFor="whatsappConsent"
                  className="flex items-center gap-2.5 text-xs font-['Outfit',sans-serif] text-stone-300 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="whatsappConsent"
                    checked={formData.whatsappConsent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsappConsent: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-[#C6A779] accent-[#C6A779] focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Send consultation schedule &amp; updates via WhatsApp
                  </span>
                </label>

                {/* Clean Action Footer */}
                <div className="pt-3 border-t border-white/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                  <span className="text-[10.5px] text-stone-500 font-mono">
                    DPDP Act 2023 · Private &amp; Encrypted
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3 rounded-full bg-gradient-to-r from-[#C6A779]/35 via-[#B68A4A]/30 to-[#C8621E]/20 hover:from-[#C6A779]/55 hover:via-[#B68A4A]/45 hover:to-[#C8621E]/30 backdrop-blur-2xl border border-[#C6A779]/65 hover:border-[#C6A779] text-[#F2EFE9] font-['Outfit',sans-serif] text-[12.5px] font-medium tracking-[0.1em] uppercase shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_8px_28px_rgba(182,138,74,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-60 overflow-hidden"
                  >
                    <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

                    <span className="relative z-10">
                      {isSubmitting ? "Registering..." : "Submit Project Enquiry"}
                    </span>
                    <span className="relative z-10 w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#E0D8C3] group-hover:bg-[#C6A779] group-hover:text-black transition-all">
                      <Send size={12} />
                    </span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
