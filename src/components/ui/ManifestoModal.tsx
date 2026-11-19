"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";

interface ManifestoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManifestoModal({ isOpen, onClose }: ManifestoModalProps) {
  const { playSfx } = useAudio();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playSfx("ui-short");
              onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container — Editorial Ivory Visual Foundation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-sm border border-[#D8D6D0] bg-[#F2F0EB] p-6 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.25)] text-[#111111]"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4 mb-8">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-[1px] bg-[#B68A4A]" aria-hidden="true" />
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#B68A4A] font-medium">
                  Studio Philosophy // Manifesto
                </span>
              </div>
              <button
                onClick={() => {
                  playSfx("ui-short");
                  onClose();
                }}
                className="p-1.5 rounded-sm hover:bg-black/5 text-[#777777] hover:text-[#111111] transition-colors focus-visible:outline-2 focus-visible:outline-[#B68A4A]"
                aria-label="Close manifesto modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Headline */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl md:text-3xl font-light tracking-[-0.01em] text-[#111111] leading-relaxed">
                &ldquo;{siteConfig.philosophy}&rdquo;
              </h2>
            </div>

            {/* Mission Statement */}
            <p className="font-sans text-sm md:text-base text-[#777777] font-light leading-relaxed mb-8">
              {siteConfig.missionStatement}
            </p>

            <div className="space-y-4 pt-6 border-t border-[#D8D6D0] text-sm text-[#111111] font-sans">
              <div className="font-mono text-xs uppercase tracking-wider text-[#777777] mb-3">
                {"/// Core Architectural Tenets"}
              </div>
              {siteConfig.about.approach.map((tenet: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-3.5">
                  <span className="font-mono text-xs text-[#B68A4A] mt-0.5 shrink-0">
                    0{idx + 1}
                  </span>
                  <p className="font-light leading-relaxed text-[#111111]">{tenet}</p>
                </div>
              ))}
            </div>

            {/* Footer Sign-off */}
            <div className="mt-10 pt-6 border-t border-[#D8D6D0] flex flex-wrap items-center justify-between text-xs font-mono text-[#777777] gap-2">
              <span>{siteConfig.copyright}</span>
              <span>{siteConfig.rights}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
