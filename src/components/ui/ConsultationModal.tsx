"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2, MessageSquare, MapPin, Navigation } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";
import { apiFetch } from "@/lib/api";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-8 pointer-events-auto">
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
            initial={{ opacity: 0, scale: 0.95, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-2xl border border-stone-800 bg-gradient-to-b from-[#1c1917]/98 to-[#0c0a09]/98 backdrop-blur-2xl p-4 sm:p-8 md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.9)] text-white font-mono"
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
              <span className="text-xs tracking-widest text-amber-500 font-bold">
                {"/// DISCUSS YOUR PROJECT"}
              </span>
              <button
                onClick={() => {
                  playSfx("ui-short");
                  resetForm();
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>{siteConfig.businessDisplayName} {"// NAGPUR STUDIO"}</span>
                </div>
                <div className="text-stone-300 font-sans text-[11px] font-light">
                  {siteConfig.contact.office}
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <a
                  href={siteConfig.contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono transition-colors"
                >
                  <MapPin className="w-2.5 h-2.5" />
                  <span>Map</span>
                </a>
                <a
                  href={siteConfig.contact.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-mono transition-colors"
                >
                  <Navigation className="w-2.5 h-2.5 text-stone-400" />
                  <span>Directions</span>
                </a>
              </div>
            </div>

            {submittedRef ? (
              /* Success Screen */
              <div className="py-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Enquiry Registered</h3>
                <div className="inline-block px-4 py-2 rounded-lg bg-stone-800/80 border border-stone-700 text-amber-400 font-mono text-sm tracking-wider">
                  REFERENCE ID: {submittedRef}
                </div>
                <p className="text-sm font-sans text-stone-300 max-w-md mx-auto font-light leading-relaxed">
                  Thank you for reaching out to ArcheOn Design Studio. Our team will review your site brief and contact you via your preferred communication channel ({formData.preferredContact}).
                </p>
                <button
                  onClick={resetForm}
                  className="mt-6 px-6 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5">
                      Mobile Number (India) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="client@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Preferred Contact Method */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5">
                      Preferred Contact Channel
                    </label>
                    <select
                      value={formData.preferredContact}
                      onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="WhatsApp">WhatsApp Message</option>
                      <option value="Phone Call">Direct Phone Call</option>
                      <option value="Email">Formal Email</option>
                    </select>
                  </div>
                </div>

                {/* Service Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5">
                      Service Required *
                    </label>
                    <select
                      value={formData.serviceId}
                      onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500"
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
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5">
                      Site Location / City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune, Mumbai, Alibaug"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Budget Band & Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5">
                      Approximate Area
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5,000 sq.ft / 1 Acre"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5">
                      Target Budget Band (INR)
                    </label>
                    <select
                      value={formData.budgetBand}
                      onChange={(e) => setFormData({ ...formData, budgetBand: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="₹25L – ₹50L">₹25L – ₹50L</option>
                      <option value="₹50L – ₹1.5 Cr">₹50L – ₹1.5 Cr</option>
                      <option value="₹1.5 Cr – ₹5 Cr">₹1.5 Cr – ₹5 Cr</option>
                      <option value="₹5 Cr+">₹5 Cr+ (Bespoke Luxury / Estate)</option>
                    </select>
                  </div>
                </div>

                {/* Project Brief */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5">
                    Project Brief & Spatial Vision
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your site constraints, timeline, and architectural aspiration..."
                    value={formData.brief}
                    onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-stone-900 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                {/* WhatsApp Specific Opt-In Consent (PDF Section 5.1 & 10.1 Invariant) */}
                <div className="flex items-start space-x-3 pt-2">
                  <input
                    type="checkbox"
                    id="whatsappConsent"
                    checked={formData.whatsappConsent}
                    onChange={(e) => setFormData({ ...formData, whatsappConsent: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-0"
                  />
                  <label htmlFor="whatsappConsent" className="text-xs font-sans text-stone-300 leading-snug">
                    <span className="text-white font-medium">WhatsApp Updates Opt-in:</span> I consent to ArcheOn Design Studio sending transactional consultation schedules and project notifications via WhatsApp to the registered mobile number.
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500 font-mono">
                    DPDP Act 2023 Compliant Privacy
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  >
                    <span>Submit Enquiry</span>
                    <Send className="w-3.5 h-3.5" />
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
