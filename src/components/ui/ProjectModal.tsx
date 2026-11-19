"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Ruler, Tag } from "lucide-react";
import { PortfolioProject } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";

interface ProjectModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
  onEnquire?: () => void;
}

export function ProjectModal({ project, onClose, onEnquire }: ProjectModalProps) {
  const { playSfx } = useAudio();

  return (
    <AnimatePresence>
      {project && (
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
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card — Editorial Ivory Visual Foundation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-sm border border-[#D8D6D0] bg-[#F2F0EB] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.25)] text-[#111111]"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4 mb-6">
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="tracking-[0.16em] text-[#B68A4A] font-semibold">
                  {project.code}
                </span>
                <span className="text-[#D8D6D0]">•</span>
                <span className="px-2 py-0.5 rounded-sm bg-[#FFFFFF] border border-[#D8D6D0] text-[#777777] uppercase text-[10px]">
                  {project.category}
                </span>
                <span className="text-[#D8D6D0]">•</span>
                <span className="text-[#777777] text-[10px]">
                  {project.status}
                </span>
              </div>
              <button
                onClick={() => {
                  playSfx("leave-project");
                  onClose();
                }}
                className="p-1.5 rounded-sm hover:bg-black/5 text-[#777777] hover:text-[#111111] transition-colors focus-visible:outline-2 focus-visible:outline-[#B68A4A]"
                aria-label="Close project modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Metadata */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl md:text-3xl font-light tracking-[-0.01em] text-[#111111] mb-2 leading-tight">
                {project.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#777777] pt-1">
                <span className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B68A4A]" />
                  <span>{project.location}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#B68A4A]" />
                  <span>{project.year}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#B68A4A]" />
                  <span>{project.area}</span>
                </span>
              </div>
            </div>

            <p className="font-sans text-sm md:text-base text-[#111111] font-light leading-relaxed mb-6">
              {project.heroSummary}
            </p>

            <div className="space-y-4 mb-6 pt-4 border-t border-[#D8D6D0] text-sm font-sans leading-relaxed">
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-[#777777] mb-1">
                  {"/// Site Brief"}
                </div>
                <p className="font-light text-[#111111]">{project.brief}</p>
              </div>

              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-[#777777] mb-1">
                  {"/// Architectural Response"}
                </div>
                <p className="font-light text-[#111111]">{project.designResponse}</p>
              </div>
            </div>

            <div className="mb-6 pt-4 border-t border-[#D8D6D0]">
              <div className="font-mono text-xs uppercase tracking-wider text-[#777777] mb-2.5">
                {"/// Scope Delivered"}
              </div>
              <div className="flex flex-wrap gap-2">
                {project.deliverables.map((item: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-sm bg-[#FFFFFF] border border-[#D8D6D0] text-xs font-sans text-[#111111]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[#D8D6D0]">
              {project.tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#B68A4A]/10 text-[#B68A4A] border border-[#B68A4A]/20"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-[#D8D6D0] flex items-center justify-between">
              <span className="font-mono text-xs text-[#777777]">
                ArcheOn Portfolio
              </span>
              <button
                type="button"
                onClick={() => {
                  playSfx("leave-project");
                  onClose();
                  if (onEnquire) onEnquire();
                }}
                className="px-4 py-2 rounded-sm bg-[#111111] hover:bg-[#1C1C1C] text-[#F2F0EB] font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-[#B68A4A]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
