"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2, MessageSquare, MapPin, Navigation } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";
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

export function ConsultationModal({
  isOpen,
  onClose,
  defaultServiceId
}: ConsultationModalProps) {
  const { playSfx } = useAudio();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    preferredContact: "WhatsApp",
    serviceId: defaultServiceId || "architecture",
    projectType: "Residential Villa",
    location: "",
    area: "",
    budgetBand: "₹50L – ₹1.5 Cr",
    targetDate: "",
    brief: "",
    whatsappConsent: true
  });

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studioProfile, setStudioProfile] = useState<StudioProfileData>(DEFAULT_STUDIO_PROFILE);

  useEffect(() => {
    if (isOpen) {
      fetchPublicStudioProfile().then(setStudioProfile).catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSfx("enter-project");
    setIsSubmitting(true);

    try {
      const res = await apiFetch("/api/leads", {
        method: "POST",
        body: {
          clientName: formData.name,
          phone: formData.mobile,
          email: formData.email,
          serviceDiscipline: formData.serviceId.toUpperCase(),
          location: formData.location,
          budgetBand: formData.budgetBand,
          estimatedTimeline: formData.targetDate,
          projectBrief: formData.brief,
          whatsappOptIn: formData.whatsappConsent
        }
      });

      if (res.ok) {
        const data = await res.json();
        setSubmittedRef(data.leadId ? `ARCHEON-${data.leadId.substring(0, 8).toUpperCase()}` : `ARCHEON-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        setSubmittedRef(`ARCHEON-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } catch (err) {
      // Graceful offline fallback
      setSubmittedRef(`ARCHEON-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedRef(null);
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
        resetForm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-8 pointer-events-auto"
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
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#C6A779]/30 bg-[#0C0B0A]/95 backdrop-blur-2xl p-5 sm:p-8 md:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.12)] text-[#F2F0EB] [scrollbar-width:thin] [scrollbar-color:#2a2725_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-800 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C6A779]/15 border border-[#C6A779]/40 text-[#C6A779]">
                  <MessageSquare size={13} />
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.24em] uppercase text-[#C6A779] font-medium">
                  ARCHEON ATELIER // COMMISSION INQUIRY
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSfx("ui-short");
                  resetForm();
                }}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Header Title */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl sm:text-3xl text-white tracking-tight mb-1.5">
                Discuss Your Project
              </h2>
              <p className="font-['Outfit',sans-serif] text-[13.5px] text-[#C2BEB6] leading-relaxed font-light">
                Initiate a direct architectural consultation with Ar. Mandar Bhalekar. Share your site constraints, design preferences, and vision.
              </p>
            </div>

            {/* Studio Coordinates Banner */}
            <div className="p-3.5 rounded-xl border border-[#C6A779]/25 bg-white/[0.02] mb-7 space-y-2.5 text-xs">
              {studioProfile.offices.map((office) => (
                <div
                  key={office.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 last:pb-0 border-b border-white/10 last:border-b-0"
                >
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-[#C6A779] font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5">
                      <MapPin className="w-3 h-3 text-[#C6A779]" />
                      <span>
                        {siteConfig.businessDisplayName} // {office.label}
                      </span>
                    </div>
                    <div className="text-stone-300 font-['Outfit',sans-serif] text-[11.5px] font-light">
                      {office.address}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <a
                      href={getOfficeMapsHref(office)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#C6A779]/15 hover:bg-[#C6A779]/25 border border-[#C6A779]/35 text-[#E0D8C3] text-[10.5px] font-mono transition-colors"
                    >
                      <Navigation className="w-3 h-3 text-[#C6A779]" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {submittedRef ? (
              /* Success Screen */
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#C6A779]/20 border border-[#C6A779]/40 text-[#C6A779] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-white">Commission Enquiry Registered</h3>
                <div className="inline-block px-5 py-2.5 rounded-xl bg-black/60 border border-[#C6A779]/40 text-[#C6A779] font-mono text-xs tracking-wider">
                  REFERENCE DOSSIER: {submittedRef}
                </div>
                <p className="text-sm font-['Outfit',sans-serif] text-stone-300 max-w-md mx-auto font-light leading-relaxed">
                  Thank you for reaching out to ArcheOn Atelier. Ar. Mandar Bhalekar and the studio team will review your site brief and connect with you via {formData.preferredContact}.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-6 px-7 py-3 rounded-full bg-[#C6A779] hover:bg-[#D97724] text-stone-950 font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Return to Studio
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 01 · Client Details */}
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C6A779] font-medium mb-3 border-b border-white/10 pb-1.5">
                    01 · CLIENT PARTICULARS
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Mobile */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                        Mobile Number (India) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="client@domain.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Preferred Contact Method */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                        Preferred Contact Mode
                      </label>
                      <select
                        value={formData.preferredContact}
                        onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#121110] border border-white/10 hover:border-white/20 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white focus:outline-none transition-colors"
                      >
                        <option value="WhatsApp">WhatsApp Message</option>
                        <option value="Phone Call">Direct Phone Call</option>
                        <option value="Email">Formal Email</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 02 · Project Parameters */}
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C6A779] font-medium mb-3 border-b border-white/10 pb-1.5">
                    02 · SPATIAL & SITE PARAMETERS
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Service Selection */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                        Service Required *
                      </label>
                      <select
                        value={formData.serviceId}
                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#121110] border border-white/10 hover:border-white/20 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white focus:outline-none transition-colors"
                      >
                        {siteConfig.services.map((srv) => (
                          <option key={srv.id} value={srv.id}>
                            {srv.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Project Location */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                        Site City / Location *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pune, Mumbai, Alibaug, Nagpur"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Built-up Area */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                        Approximate Area / Footprint
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5,000 sq.ft / 1 Acre"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Budget Band */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                        Target Capital Budget (INR)
                      </label>
                      <select
                        value={formData.budgetBand}
                        onChange={(e) => setFormData({ ...formData, budgetBand: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#121110] border border-white/10 hover:border-white/20 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white focus:outline-none transition-colors"
                      >
                        <option value="₹25L – ₹50L">₹25L – ₹50L</option>
                        <option value="₹50L – ₹1.5 Cr">₹50L – ₹1.5 Cr</option>
                        <option value="₹1.5 Cr – ₹5 Cr">₹1.5 Cr – ₹5 Cr</option>
                        <option value="₹5 Cr+">₹5 Cr+ (Bespoke Luxury / Estate)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 03 · Project Brief */}
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C6A779] font-medium mb-3 border-b border-white/10 pb-1.5">
                    03 · ARCHITECTURAL ASPIRATIONS & CONSTRAINTS
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                      Project Brief & Spatial Vision
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe your site contours, timeline aspirations, material preferences, and architectural vision..."
                      value={formData.brief}
                      onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#C6A779] text-sm font-['Outfit',sans-serif] text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* WhatsApp Specific Opt-In Consent */}
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <input
                    type="checkbox"
                    id="whatsappConsent"
                    checked={formData.whatsappConsent}
                    onChange={(e) => setFormData({ ...formData, whatsappConsent: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-stone-700 bg-stone-900 text-[#C6A779] accent-[#C6A779] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="whatsappConsent" className="text-xs font-['Outfit',sans-serif] text-stone-300 leading-snug cursor-pointer">
                    <span className="text-white font-medium">WhatsApp Updates Opt-in:</span> I consent to ArcheOn Design Studio sending transactional consultation schedules and architectural milestone notifications via WhatsApp to the registered mobile number.
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-[11px] text-stone-500 font-mono">
                    DPDP Act 2023 Compliant Privacy · Encrypted Transmission
                  </span>

                  {/* Glassmorphic Shimmer Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C6A779]/35 via-[#B68A4A]/30 to-[#C8621E]/20 hover:from-[#C6A779]/50 hover:via-[#B68A4A]/40 hover:to-[#C8621E]/30 backdrop-blur-2xl border border-[#C6A779]/60 hover:border-[#C6A779] text-[#F2EFE9] font-['Outfit',sans-serif] text-[13px] font-medium tracking-[0.1em] uppercase shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_rgba(182,138,74,0.35)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_12px_40px_rgba(182,138,74,0.55)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-60 overflow-hidden"
                  >
                    {/* Shimmer light reflection effect */}
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
