"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ShieldCheck, Info } from "lucide-react";
import { useAudio } from "@/providers/AudioProvider";

interface VendorPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VendorPortalModal({ isOpen, onClose }: VendorPortalModalProps) {
  const { playSfx } = useAudio();
  const [requested, setRequested] = useState(false);
  const handleRequestAccess = () => { playSfx("enter-project"); setRequested(true); };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-8 pointer-events-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { playSfx("ui-short"); onClose(); }} className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 25 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border border-stone-800 bg-gradient-to-b from-[#181615]/98 to-[#0c0a09]/98 backdrop-blur-2xl p-4 sm:p-8 md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.95)] text-white font-mono">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs tracking-widest text-orange-400 font-bold uppercase">VENDOR PORTAL ACCESS</span>
              </div>
              <button onClick={() => { playSfx("ui-short"); onClose(); }} className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-950/20 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 leading-relaxed">
                  <strong className="text-orange-300">Invitation-only portal access.</strong> Vendor invoices, payment proofs, cash settlements, and dispute tracking are available only to invited vendors through an authorised studio session. No financial data is shown on this public page.
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-xs text-stone-400 uppercase mb-1">Request Portal Invitation</div>
              <p className="text-[11px] text-stone-500 mb-4">A studio representative will review your request and enable portal access through the verified account provisioning flow.</p>
              <button type="button" onClick={handleRequestAccess} disabled={requested} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-stone-950 text-xs font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">{requested ? (<><Mail className="w-4 h-4" /> Request Sent</>) : (<><Mail className="w-4 h-4" /> Request Invitation</>)}</button>
              {requested && (<div className="p-3 rounded-lg border border-orange-500/30 bg-orange-950/10"><div className="flex items-center gap-2 text-xs text-orange-300"><ShieldCheck className="w-3.5 h-3.5" /><span>Invitation request recorded. Awaiting studio approval.</span></div></div>)}
              <div className="pt-2 border-t border-stone-800">
                <a
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-stone-700 hover:border-orange-500 text-stone-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-400" /> Sign In to Vendor Workspace
                </a>
              </div>
              <p className="text-[10px] text-stone-600 mt-4">Already invited? Access your portal through your credentials or the link shared in your invitation email.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
