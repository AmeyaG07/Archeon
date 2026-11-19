"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  MapPin,
  Calendar,
  Ruler,
  Layers,
  Sliders,
  Sparkles,
  Maximize2
} from "lucide-react";
import { PortfolioProject } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";

interface ProjectDetailModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
  onEnquire: () => void;
}

export function ProjectDetailModal({ project, onClose, onEnquire }: ProjectDetailModalProps) {
  const { playSfx } = useAudio();
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

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
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-2xl border border-stone-800 bg-gradient-to-b from-[#1c1917]/98 to-[#0c0a09]/98 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.95)] text-white font-mono"
            onMouseUp={() => setIsDragging(false)}
            onTouchEnd={() => setIsDragging(false)}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
              <div className="flex items-center space-x-3 text-xs">
                <span className="tracking-widest text-amber-500 font-bold">
                  {project.code}
                </span>
                <span className="text-stone-600">•</span>
                <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                  {project.category}
                </span>
              </div>
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

            {/* Title & Location Metadata */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                {project.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 pt-1 font-sans">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{project.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>{project.year}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Ruler className="w-3.5 h-3.5 text-amber-500" />
                  <span>{project.area}</span>
                </span>
              </div>
            </div>

            {/* INTERACTIVE PLAN-TO-RENDER COMPARISON SLIDER (PDF Section 4.2) */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-stone-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  <span>Interactive Visual Comparison // CAD vs Built Spatial Reality</span>
                </span>
                <span className="text-stone-500 text-[10px] hidden sm:inline">
                  Drag slider horizontally to compare
                </span>
              </div>

              <div
                ref={containerRef}
                onMouseDown={() => setIsDragging(true)}
                onMouseMove={handleMouseMove}
                onTouchStart={() => setIsDragging(true)}
                onTouchMove={handleTouchMove}
                className="relative h-64 sm:h-80 w-full overflow-hidden rounded-xl border border-stone-800 select-none cursor-ew-resize bg-stone-950"
              >
                {/* Layer 1 (Underneath): Rendered Spatial Execution */}
                <div className="absolute inset-0 bg-gradient-to-tr from-stone-900 via-amber-950/40 to-stone-900 flex items-center justify-center p-6 text-center">
                  <div className="space-y-3 max-w-md">
                    <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono">
                      ✦ PHOTOREALISTIC SPATIAL EXECUTION
                    </div>
                    <div className="text-stone-300 font-sans text-xs leading-relaxed">
                      Brutalist cast basalt walls, travertine stone floor plates, and warm circadian recessed illumination.
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      SURFACE: HONED NATURAL STONE & RECESSED COVE LIGHTING
                    </div>
                  </div>
                </div>

                {/* Layer 2 (Clipped Top): Architectural CAD Blueprint */}
                <div
                  className="absolute inset-0 overflow-hidden bg-gradient-to-tr from-blue-950 via-slate-900 to-cyan-950"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center p-6 text-center"
                    style={{ width: "100%" }}
                  >
                    <div className="space-y-3 max-w-md">
                      <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
                        📐 ARCHITECTURAL CAD / GFC BLUEPRINT
                      </div>
                      <div className="text-stone-300 font-sans text-xs leading-relaxed">
                        Dimensioned axial structural grid, load-bearing column placements, and MEP conduits overlay.
                      </div>
                      <div className="text-[10px] text-cyan-400/80 font-mono">
                        SECTION A-A • SCALE 1:50 • TOLERANCE ±2MM
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider Line & Draggable Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10 flex items-center justify-center pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white text-stone-950 flex items-center justify-center shadow-xl border border-stone-300">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Corner Labels */}
                <div className="absolute bottom-3 left-3 z-20 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] text-cyan-300 font-mono">
                  CAD BLUEPRINT
                </div>
                <div className="absolute bottom-3 right-3 z-20 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] text-amber-300 font-mono">
                  BUILT REALITY
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            {project.metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-stone-800 bg-stone-900/50 mb-6">
                {project.metrics.map((m, i) => (
                  <div key={i}>
                    <div className="text-[10px] uppercase text-stone-400 mb-0.5">
                      {m.label}
                    </div>
                    <div className="text-sm font-bold text-amber-400">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-5 mb-8 font-sans text-sm text-stone-300 leading-relaxed font-light">
              <div>
                <div className="text-xs uppercase font-mono text-stone-400 mb-1.5 font-bold tracking-wider">
                  /// Client Need & Site Brief
                </div>
                <p>{project.brief}</p>
              </div>

              <div>
                <div className="text-xs uppercase font-mono text-stone-400 mb-1.5 font-bold tracking-wider">
                  /// Architectural Response & Materiality
                </div>
                <p>{project.designResponse}</p>
              </div>
            </div>

            <div className="mb-8 pt-4 border-t border-stone-800">
              <div className="text-xs uppercase text-stone-400 mb-2.5 font-bold tracking-wider">
                /// Scope Delivered
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.deliverables.map((d, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-xs text-stone-300"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-6 border-t border-stone-800 flex items-center justify-between">
              <span className="text-xs text-stone-500 font-mono">
                Verified ArcheOn Case Study
              </span>
              <button
                onClick={() => {
                  playSfx("click-project");
                  onClose();
                  onEnquire();
                }}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold font-mono tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)]"
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
