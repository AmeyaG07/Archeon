"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ArrowRight } from "lucide-react";
import { ServiceItem } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";

interface ServiceModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onEnquire: (serviceId: string) => void;
}

export function ServiceModal({ service, onClose, onEnquire }: ServiceModalProps) {
  const { playSfx } = useAudio();

  return (
    <AnimatePresence>
      {service && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playSfx("leave-project");
              onClose();
            }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-stone-800 bg-gradient-to-b from-[#1c1917]/95 to-[#0c0a09]/95 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.9)] text-white font-mono"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
              <span className="text-xs tracking-widest text-amber-500 font-bold">
                {service.code}
              </span>
              <button
                onClick={() => {
                  playSfx("leave-project");
                  onClose();
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Tagline */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                {service.title}
              </h2>
              <p className="text-sm font-sans text-stone-300 font-light leading-relaxed">
                {service.tagline}
              </p>
            </div>

            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-stone-400 mb-3 border-b border-stone-800/80 pb-1">
                /// Scope of Professional Services
              </div>
              <div className="space-y-2.5 font-sans text-sm text-stone-300">
                {service.scope.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-stone-400 mb-3 border-b border-stone-800/80 pb-1">
                /// Typical Outputs & Deliverables
              </div>
              <div className="flex flex-wrap gap-2">
                {service.deliverables.map((del, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-md bg-stone-800/70 border border-stone-700/60 text-xs font-mono text-stone-200"
                  >
                    {del}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-stone-800 flex items-center justify-between">
              <span className="text-xs text-stone-500 font-mono">
                ArcheOn Design Studio Standards
              </span>
              <button
                onClick={() => {
                  playSfx("click-project");
                  onClose();
                  onEnquire(service.id);
                }}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-mono font-bold tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              >
                <span>Enquire For {service.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
