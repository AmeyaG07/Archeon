"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ArrowUpRight, Clock, ShieldCheck, Compass, Sparkles, Layers } from "lucide-react";
import { ServiceItem } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";

interface ServiceModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onEnquire: (serviceId: string) => void;
}

export function ServiceModal({ service, onClose, onEnquire }: ServiceModalProps) {
  const { playSfx } = useAudio();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (service) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [service]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && service) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [service, onClose]);

  return (
    <AnimatePresence>
      {service && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-8 pointer-events-auto"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playSfx("leave-project");
              onClose();
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container with Custom Dark Minimal Scrollbar */}
          <motion.div
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-[#C6A779]/30 bg-[#0C0B0A]/95 backdrop-blur-2xl p-5 sm:p-8 md:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.12)] text-[#F2F0EB] [scrollbar-width:thin] [scrollbar-color:#2a2725_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-800 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {/* Clean Title Header & Close Button */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5 mb-6">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#F2F0EB] tracking-tight mb-2">
                  {service.title}
                </h2>
                <p className="font-['Outfit',sans-serif] text-[14.5px] leading-relaxed text-[#D6D3CD] font-light">
                  {service.tagline}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSfx("leave-project");
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metadata Info Pills */}
            {(service.timeline || service.leadArchitect) && (
              <div className="flex flex-wrap items-center gap-2.5 mb-7 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                {service.timeline && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-['Outfit',sans-serif] text-[#C6A779]">
                    <Clock size={13} className="text-[#C6A779]" />
                    <span>Timeline: <strong className="text-white font-medium">{service.timeline}</strong></span>
                  </div>
                )}
                {service.leadArchitect && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-['Outfit',sans-serif] text-stone-300">
                    <ShieldCheck size={13} className="text-[#C6A779]" />
                    <span>Principal: <strong className="text-white font-medium">{service.leadArchitect}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Atelier Philosophy Rationale */}
            {service.philosophy && (
              <div className="mb-7 p-4 rounded-xl bg-gradient-to-r from-[#C6A779]/10 via-[#B68A4A]/5 to-transparent border-l-2 border-[#C6A779]">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-1.5">
                  ATELIER DESIGN APPROACH
                </p>
                <p className="font-serif italic text-[14px] text-[#E0D8C3] leading-relaxed">
                  &ldquo;{service.philosophy}&rdquo;
                </p>
              </div>
            )}

            {/* Sequential Project Phases */}
            {service.phases && service.phases.length > 0 && (
              <div className="mb-7">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C6A779] font-medium">
                    01 · SEQUENTIAL EXECUTION PHASES
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">
                    3-STAGE MILESTONE FRAMEWORK
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {service.phases.map((ph) => (
                    <div
                      key={ph.step}
                      className="p-3.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/10 flex flex-col justify-between transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-[#C6A779]">
                            {ph.step}
                          </span>
                          <span className="font-mono text-[9px] tracking-wider uppercase text-stone-400 bg-white/5 px-2 py-0.5 rounded">
                            {ph.duration}
                          </span>
                        </div>
                        <h4 className="font-['Outfit',sans-serif] text-[13px] font-semibold text-white leading-tight mb-1.5">
                          {ph.title}
                        </h4>
                        <p className="font-['Outfit',sans-serif] text-[11.5px] leading-snug text-stone-400 font-light">
                          {ph.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scope of Professional Services */}
            <div className="mb-7">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-3 border-b border-white/10 pb-2">
                02 · SCOPE OF PROFESSIONAL SERVICES
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-['Outfit',sans-serif] text-[13px] text-stone-300">
                {service.scope.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C6A779] shrink-0 mt-0.5" />
                    <span className="leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Typical Outputs & Deliverables */}
            <div className="mb-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-3 border-b border-white/10 pb-2">
                03 · TYPICAL OUTPUTS & DELIVERABLES
              </div>
              <div className="flex flex-wrap gap-2">
                {service.deliverables.map((del, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-[#E0D8C3] tracking-wide transition-colors"
                  >
                    {del}
                  </span>
                ))}
              </div>
            </div>

            {/* Studio Standards Badges */}
            {service.standards && (
              <div className="mb-7 p-3 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-400 mr-2">
                  COMPLIANCE & QUALITY:
                </span>
                {service.standards.map((std, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C6A779]/10 border border-[#C6A779]/30 text-[10px] font-mono text-[#E0D8C3]"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#C6A779]" />
                    {std}
                  </span>
                ))}
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="font-serif text-xs text-[#E0D8C3]">ArcheOn Atelier Standards</p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500">
                  Direct Principal Architect Oversight
                </p>
              </div>

              {/* Glassmorphic Shimmer CTA Button */}
              <button
                type="button"
                onClick={() => {
                  playSfx("click-project");
                  onClose();
                  onEnquire(service.id);
                }}
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#C6A779]/35 via-[#B68A4A]/30 to-[#C8621E]/20 hover:from-[#C6A779]/50 hover:via-[#B68A4A]/40 hover:to-[#C8621E]/30 backdrop-blur-2xl border border-[#C6A779]/60 hover:border-[#C6A779] text-[#F2EFE9] font-['Outfit',sans-serif] text-[13px] font-medium tracking-[0.1em] uppercase shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_rgba(182,138,74,0.35)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_12px_40px_rgba(182,138,74,0.55)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden"
              >
                {/* Shimmer light reflection effect */}
                <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

                <span className="relative z-10">Enquire For {service.title}</span>
                <span className="relative z-10 w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#E0D8C3] group-hover:bg-[#C6A779] group-hover:text-black transition-all">
                  <ArrowUpRight size={13} strokeWidth={2.2} />
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
