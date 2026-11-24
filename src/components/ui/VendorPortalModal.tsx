"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ShieldCheck, Lock, Truck, FileSpreadsheet, CheckCircle2, ArrowUpRight, Scale } from "lucide-react";
import { useAudio } from "@/providers/AudioProvider";
import { useAuth } from "@/providers/AuthProvider";

interface VendorPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VendorPortalModal({ isOpen, onClose }: VendorPortalModalProps) {
  const { playSfx } = useAudio();
  const { isAuthenticated, user } = useAuth();
  const [requested, setRequested] = useState(false);
  const handleRequestAccess = () => {
    playSfx("enter-project");
    setRequested(true);
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
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent="true"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-8 pointer-events-auto"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playSfx("ui-short");
              onClose();
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container with Custom Dark Minimal Scrollbar */}
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, scale: 0.95, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-[#C6A779]/30 bg-[#0C0B0A]/95 backdrop-blur-2xl p-5 sm:p-8 md:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.12)] text-[#F2F0EB] overscroll-contain [scrollbar-width:thin] [scrollbar-color:#2a2725_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-800 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C6A779]/15 border border-[#C6A779]/40 text-[#C6A779]">
                  <Lock size={12} />
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[#C6A779] font-medium">
                  ARCHEON ATELIER // FABRICATOR & VENDOR DESK
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSfx("ui-short");
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Description */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl sm:text-3xl text-white tracking-tight mb-2">
                Vendor & Contractor Portal
              </h2>
              <p className="font-['Outfit',sans-serif] text-[13.5px] text-[#C2BEB6] leading-relaxed font-light">
                Secure conduit for verified contractors, stone fabricators, MEP engineers, and material suppliers. Submit GST tax invoices, audit purchase orders, log site delivery receipts, and track milestone disbursements.
              </p>
            </div>

            {/* Vendor Capabilities Grid */}
            <div className="mb-6 space-y-2.5">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#C6A779] font-medium mb-2">
                PORTAL WORKFLOWS
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2.5">
                  <FileSpreadsheet size={14} className="text-[#C6A779] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-['Outfit',sans-serif] text-xs font-semibold text-white">Direct Tax Invoicing</h4>
                    <p className="font-['Outfit',sans-serif] text-[11px] text-stone-400 font-light mt-0.5">Instant GST invoice validation</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2.5">
                  <Truck size={14} className="text-[#C6A779] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-['Outfit',sans-serif] text-xs font-semibold text-white">Site Delivery Manifests</h4>
                    <p className="font-['Outfit',sans-serif] text-[11px] text-stone-400 font-light mt-0.5">Gate passes & delivery proofs</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2.5">
                  <Scale size={14} className="text-[#C6A779] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-['Outfit',sans-serif] text-xs font-semibold text-white">Cash Settlement Audit</h4>
                    <p className="font-['Outfit',sans-serif] text-[11px] text-stone-400 font-light mt-0.5">Milestone releases & escrow</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2.5">
                  <ShieldCheck size={14} className="text-[#C6A779] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-['Outfit',sans-serif] text-xs font-semibold text-white">Tenders & Specs</h4>
                    <p className="font-['Outfit',sans-serif] text-[11px] text-stone-400 font-light mt-0.5">Upcoming BOQ procurement</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleRequestAccess}
                disabled={requested}
                className="group relative w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#C6A779]/35 via-[#B68A4A]/30 to-[#C8621E]/20 hover:from-[#C6A779]/50 hover:via-[#B68A4A]/40 hover:to-[#C8621E]/30 backdrop-blur-2xl border border-[#C6A779]/60 hover:border-[#C6A779] text-[#F2EFE9] font-['Outfit',sans-serif] text-[13px] font-medium tracking-[0.1em] uppercase shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_rgba(182,138,74,0.35)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] cursor-pointer disabled:opacity-60 overflow-hidden"
              >
                {/* Shimmer light reflection effect */}
                <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

                <span className="relative z-10">
                  {requested ? "Vendor Registration Recorded" : "Request Vendor Onboarding"}
                </span>
                <span className="relative z-10 w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#E0D8C3]">
                  {requested ? <CheckCircle2 size={13} className="text-[#C6A779]" /> : <ArrowUpRight size={13} strokeWidth={2.2} />}
                </span>
              </button>

              {requested && (
                <div className="p-3 rounded-xl border border-[#C6A779]/30 bg-[#C6A779]/10 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-['Outfit',sans-serif] text-[#E0D8C3]">
                    <ShieldCheck size={14} className="text-[#C6A779]" />
                    <span>Vendor onboarding ticket created. The procurement desk will reach out for GSTIN and KYC verification.</span>
                  </div>
                </div>
              )}

              <a
                href={isAuthenticated && (user?.role === "ROLE_VENDOR" || user?.role === "VENDOR") ? "/vendor" : "/login"}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 text-stone-300 hover:text-white font-['Outfit',sans-serif] text-[12.5px] font-medium tracking-wide transition-all"
              >
                <ShieldCheck size={14} className="text-[#C6A779]" />
                <span>{isAuthenticated && (user?.role === "ROLE_VENDOR" || user?.role === "VENDOR") ? "Enter Vendor Workspace" : "Sign In to Vendor Workspace"}</span>
              </a>
            </div>

            {/* Security Guarantee Note */}
            <p className="mt-5 text-center font-['Outfit',sans-serif] text-[10.5px] text-stone-500 leading-snug">
              Verified vendor sessions enforce multi-tenant Row-Level Security. Financial invoices are encrypted in transit and at rest.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
