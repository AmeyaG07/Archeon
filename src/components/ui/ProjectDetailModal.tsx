"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  MapPin,
  Calendar,
  Ruler,
  Sliders,
  Layers,
  Eye,
  Compass,
} from "lucide-react";
import { PortfolioProject } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";

interface ProjectDetailModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
  onEnquire: (serviceId?: string) => void;
}

function mapCategoryToServiceId(category?: string): string {
  switch ((category || "").toLowerCase()) {
    case "interior":
      return "interior-design";
    case "landscape":
      return "landscape-architecture";
    case "turnkey":
      return "turnkey-execution";
    default:
      return "architecture";
  }
}

export function ProjectDetailModal({
  project,
  onClose,
  onEnquire,
}: ProjectDetailModalProps) {
  const { playSfx } = useAudio();
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleMove(e.clientX);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic events
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore synthetic events
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (project) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [project]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && project) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, onClose]);

  const showDesignResponse =
    Boolean(project?.designResponse?.trim()) &&
    project?.designResponse?.trim() !== project?.brief?.trim();

  const metrics =
    project?.metrics && project.metrics.length > 0
      ? project.metrics
      : project
      ? [
          { label: "Built-Up Area", value: project.area || "On Request" },
          { label: "Delivery Stage", value: project.status || "Completed" },
          { label: "Completion Year", value: project.year || "2026" },
        ]
      : [];

  return (
    <AnimatePresence>
      {project && (
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
              playSfx("leave-project");
              onClose();
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-detail-title"
            initial={{ opacity: 0, scale: 0.95, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-4xl max-h-[92dvh] overflow-y-auto rounded-3xl border border-[#C6A779]/25 bg-gradient-to-b from-[#171513]/98 to-[#0B0A09]/98 backdrop-blur-2xl p-5 sm:p-8 md:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-white [scrollbar-width:thin] [scrollbar-color:#2a2725_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-800 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-stone-200 text-[11px]">
                  {project.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#B68A4A]/15 border border-[#B68A4A]/35 text-[#E5D3B3] text-[10.5px] uppercase tracking-wider">
                  {project.status}
                </span>
              </div>

              <button
                type="button"
                aria-label="Close modal"
                onClick={() => {
                  playSfx("leave-project");
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Dynamic Metadata */}
            <div className="mb-6">
              <h2
                id="project-detail-title"
                className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-white mb-2.5"
              >
                {project.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-300 font-['Outfit',sans-serif]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C6A779]" />
                  <span>{project.location}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C6A779]" />
                  <span>{project.year}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#C6A779]" />
                  <span>{project.area}</span>
                </span>
              </div>
            </div>

            {/* INTERACTIVE DYNAMIC BLUEPRINT-TO-REALITY COMPARISON */}
            <div className="mb-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5 text-xs">
                <span className="text-stone-300 font-mono uppercase tracking-[0.16em] flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                  <Sliders className="w-3.5 h-3.5 text-[#C6A779] shrink-0" />
                  <span>Blueprint vs Built Reality</span>
                </span>

                {/* Interactive Quick-Snap Presets */}
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  {[
                    { label: "Blueprint", val: 100, icon: Compass },
                    { label: "Split 50%", val: 50, icon: Layers },
                    { label: "Built View", val: 0, icon: Eye },
                  ].map((preset) => {
                    const active = Math.abs(sliderPosition - preset.val) < 6;
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSliderPosition(preset.val)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          active
                            ? "border-[#C6A779] bg-[#B68A4A]/25 text-[#F4E6C8]"
                            : "border-white/10 bg-white/[0.03] text-stone-400 hover:border-white/25 hover:text-white"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative h-64 sm:h-80 w-full overflow-hidden rounded-2xl border border-white/15 select-none cursor-ew-resize bg-[#0E0D0C] touch-none"
              >
                {/* Layer 1 (Underneath): Built Spatial Execution Photo */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-tr from-stone-900 via-amber-950/35 to-stone-900">
                  {project.image ? (
                    <>
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        unoptimized={
                          project.image.startsWith("http") ||
                          project.image.startsWith("data:")
                        }
                        className="object-cover object-center pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />
                    </>
                  ) : (
                    <div className="space-y-2.5 max-w-md px-6 text-center pointer-events-none">
                      <div className="inline-block px-3 py-1 rounded-full bg-[#B68A4A]/20 border border-[#C6A779]/40 text-[#E5D3B3] text-[11px] font-mono">
                        ✦ {project.title.toUpperCase()}
                      </div>
                      <p className="text-stone-300 font-['Outfit',sans-serif] text-xs leading-relaxed">
                        {project.heroSummary}
                      </p>
                    </div>
                  )}
                </div>

                {/* Layer 2 (Top Clipped 1:1 — Never Squashes Content on Drag): Dynamic CAD Blueprint Overlay */}
                <div
                  className="absolute inset-0 bg-[#081523] pointer-events-none overflow-hidden"
                  style={{
                    clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                  }}
                >
                  {/* Edge-filtered underlying photo silhouette so CAD aligns 1:1 with built space */}
                  {project.image && (
                    <Image
                      src={project.image}
                      alt=""
                      fill
                      unoptimized={
                        project.image.startsWith("http") ||
                        project.image.startsWith("data:")
                      }
                      className="object-cover object-center opacity-25 grayscale contrast-150 brightness-75 mix-blend-luminosity"
                    />
                  )}

                  {/* Precision CAD Technical Grid + Blueprint Scrim */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.14) 0%, rgba(8, 21, 35, 0.88) 78%),
                        linear-gradient(to right, rgba(56, 189, 248, 0.12) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(56, 189, 248, 0.12) 1px, transparent 1px)
                      `,
                      backgroundSize: "100% 100%, 32px 32px, 32px 32px",
                    }}
                  />

                  {/* Dynamic Per-Project Architectural Datum Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="space-y-2.5 max-w-md rounded-2xl border border-cyan-400/30 bg-[#07131F]/80 px-5 py-4 backdrop-blur-md">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10.5px] font-mono tracking-wider uppercase">
                        <Compass className="w-3 h-3" />
                        <span>Architectural Blueprint</span>
                      </div>
                      <p className="text-stone-200 font-['Outfit',sans-serif] text-xs leading-relaxed line-clamp-2">
                        {project.heroSummary || project.brief}
                      </p>
                      <div className="text-[10px] text-cyan-300/85 font-mono uppercase tracking-widest">
                        {project.category} · {project.area} · {project.year}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Split Divider & Thumb */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.85)] z-20 flex items-center justify-center pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white text-stone-950 flex items-center justify-center shadow-xl border border-stone-300">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Non-overlapping Corner Labels (Each fades cleanly when collapsed) */}
                {sliderPosition > 14 && (
                  <div className="absolute bottom-3 left-3 z-30 px-2.5 py-1 rounded-md bg-black/70 border border-cyan-400/30 backdrop-blur-md text-[10px] text-cyan-300 font-mono pointer-events-none">
                    CAD BLUEPRINT · {Math.round(sliderPosition)}%
                  </div>
                )}
                {sliderPosition < 86 && (
                  <div className="absolute bottom-3 right-3 z-30 px-2.5 py-1 rounded-md bg-black/70 border border-[#C6A779]/35 backdrop-blur-md text-[10px] text-[#E5D3B3] font-mono pointer-events-none">
                    BUILT REALITY · {Math.round(100 - sliderPosition)}%
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Project Metrics Strip */}
            {metrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl border border-white/10 bg-white/[0.03] mb-6">
                {metrics.map((m, i) => (
                  <div key={i} className="sm:border-r sm:last:border-r-0 border-white/10 sm:pr-3">
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-stone-400 mb-1">
                      {m.label}
                    </div>
                    <div className="font-['Outfit',sans-serif] text-sm font-semibold text-[#E5C17B]">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic Case Study Narrative */}
            <div className="space-y-4 mb-6 font-['Outfit',sans-serif] text-sm text-stone-300 leading-relaxed font-light">
              <div>
                <div className="text-[10.5px] uppercase font-mono text-[#C6A779] mb-1.5 font-semibold tracking-[0.18em]">
                  Architectural Brief &amp; Context
                </div>
                <p>{project.brief || project.heroSummary}</p>
              </div>

              {showDesignResponse && (
                <div>
                  <div className="text-[10.5px] uppercase font-mono text-[#C6A779] mb-1.5 font-semibold tracking-[0.18em]">
                    Materiality &amp; Spatial Response
                  </div>
                  <p>{project.designResponse}</p>
                </div>
              )}
            </div>

            {/* Scope & Tags */}
            {(project.deliverables?.length > 0 || project.tags?.length > 0) && (
              <div className="mb-6 pt-4 border-t border-white/10">
                {project.deliverables?.length > 0 && (
                  <>
                    <div className="text-[10px] font-mono uppercase text-stone-400 mb-2.5 font-semibold tracking-[0.18em]">
                      Scope Delivered
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3.5">
                      {project.deliverables.map((d, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-['Outfit',sans-serif] text-stone-200"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {project.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#B68A4A]/12 border border-[#C6A779]/25 text-[#E5D3B3] font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer Action */}
            <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-stone-400 font-mono">
                {project.location} · {project.year}
              </span>
              <button
                type="button"
                onClick={() => {
                  playSfx("click-project");
                  onClose();
                  onEnquire(mapCategoryToServiceId(project.category));
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-full bg-[#C6A779] hover:bg-[#D97724] text-stone-950 text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-[0_6px_24px_rgba(198,167,121,0.35)] cursor-pointer"
              >
                <span>Discuss Similar Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
