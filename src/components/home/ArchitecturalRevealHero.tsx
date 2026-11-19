"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Compass, Layers, Maximize2 } from "lucide-react";

interface ArchitecturalRevealHeroProps {
  onOpenConsultation?: () => void;
}

export function ArchitecturalRevealHero({
  onOpenConsultation,
}: ArchitecturalRevealHeroProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: x * 18, y: y * 18 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  const scrollToProjects = useCallback(() => {
    const el = document.getElementById("projects");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={shouldReduceMotion ? undefined : handleMouseMove}
      onMouseLeave={shouldReduceMotion ? undefined : handleMouseLeave}
      className="relative w-full h-screen min-h-[720px] overflow-hidden bg-[#111111] text-[#F2F0EB] flex flex-col justify-between"
    >
      {/* =================================================================== */}
      {/* MEDIA LAYER: VIDEO (IF PRESENT) OR LUXURY ARCHITECTURAL BACKDROP     */}
      {/* =================================================================== */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Layer 1: Radial Obsidian Studio Vignette */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(circle at 50% 48%, rgba(217, 119, 36, 0.08) 0%, rgba(20, 19, 18, 0.75) 55%, #111111 94%)",
          }}
        />

        {/* Layer 2: Asset-Ready HTML5 Video */}
        {!videoFailed && (
          <video
            src="/videos/archeon-reveal.mp4"
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoFailed(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              videoLoaded ? "opacity-60" : "opacity-0"
            }`}
          />
        )}

        {/* Layer 3: Luxury Architectural Blueprint & Elevation Matrix (Always Rendered / Fallback Base) */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  x: mouseOffset.x,
                  y: mouseOffset.y,
                }
          }
          transition={{ type: "spring", stiffness: 45, damping: 20 }}
          className="absolute inset-0 flex items-center justify-center will-change-transform"
        >
          <svg
            viewBox="0 0 1440 900"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-cover opacity-55"
          >
            <defs>
              <pattern
                id="hero-blueprint-grid"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke="#D8D6D0"
                  strokeWidth="0.5"
                  strokeOpacity="0.09"
                />
                <circle cx="80" cy="80" r="1.5" fill="#B68A4A" fillOpacity="0.3" />
              </pattern>

              <linearGradient id="heroBronzeBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D97724" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#B68A4A" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#D97724" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="heroPerspectiveGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97724" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Architectural Matrix Grid */}
            <rect width="1440" height="900" fill="url(#hero-blueprint-grid)" />

            {/* Horizontal & Vertical Spatial Reference Datums */}
            <line x1="0" y1="520" x2="1440" y2="520" stroke="#FFFFFF" strokeOpacity="0.12" strokeDasharray="6 6" />
            <line x1="720" y1="0" x2="720" y2="900" stroke="#FFFFFF" strokeOpacity="0.08" strokeDasharray="4 8" />

            {/* Architectural Elevation Pavilion Wireframe */}
            <polygon
              points="340,690 720,240 1100,690"
              stroke="url(#heroPerspectiveGlow)"
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
            <polygon
              points="400,690 720,310 1040,690"
              stroke="#D8D6D0"
              strokeWidth="0.8"
              strokeOpacity="0.22"
            />

            {/* Cantilever Beams & Structural Floor Plates */}
            <line x1="260" y1="460" x2="1180" y2="460" stroke="url(#heroBronzeBeam)" strokeWidth="1.2" />
            <line x1="300" y1="480" x2="1140" y2="480" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.18" />
            <line x1="360" y1="690" x2="1080" y2="690" stroke="#B68A4A" strokeWidth="1.5" strokeOpacity="0.6" />

            {/* Vertical Loadpath Columns */}
            <line x1="480" y1="460" x2="480" y2="690" stroke="#B68A4A" strokeWidth="1.5" strokeOpacity="0.5" />
            <line x1="720" y1="310" x2="720" y2="690" stroke="#D97724" strokeWidth="1.5" strokeOpacity="0.65" />
            <line x1="960" y1="460" x2="960" y2="690" stroke="#B68A4A" strokeWidth="1.5" strokeOpacity="0.5" />

            {/* Perspective Horizon Rays */}
            <line x1="0" y1="160" x2="720" y2="520" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.12" />
            <line x1="1440" y1="160" x2="720" y2="520" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.12" />
            <line x1="0" y1="840" x2="720" y2="520" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.12" />
            <line x1="1440" y1="840" x2="720" y2="520" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.12" />

            {/* Architectural Telemetry Labels */}
            <g className="font-mono text-[9px] fill-[#B68A4A] tracking-widest opacity-65">
              <text x="488" y="445">AXIS // 01-A</text>
              <text x="728" y="445">CTR // DATUM 00</text>
              <text x="968" y="445">AXIS // 02-B</text>
              <text x="360" y="715">BASE ELEV. // ±0.000M</text>
              <text x="730" y="230">ZENITH APERTURE // +14.600M</text>
            </g>
          </svg>
        </motion.div>
      </div>

      {/* =================================================================== */}
      {/* TOP HUD TELEMETRY BAR                                               */}
      {/* =================================================================== */}
      <div className="relative z-20 w-full pt-28 px-6 sm:px-12 md:px-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#D97724] animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C6A779]">
            ARCHEON STUDIO // NAGPUR
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
          <span className="flex items-center gap-1.5">
            <Compass size={12} className="text-[#B68A4A]" />
            21.1458° N, 79.0882° E
          </span>
          <span className="flex items-center gap-1.5">
            <Layers size={12} className="text-[#B68A4A]" />
            FORM • STRUCTURE • MATERIALITY
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize2 size={12} className="text-[#B68A4A]" />
            1:1 TECTONIC SCALE
          </span>
        </div>

        <div className="font-mono text-[10px] tracking-widest text-[#B68A4A]">
          EST. 2024
        </div>
      </div>

      {/* =================================================================== */}
      {/* MAIN EDITORIAL HERO CONTENT                                         */}
      {/* =================================================================== */}
      <div className="relative z-20 w-full pb-16 px-6 sm:px-12 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
        {/* Left Column: Signature Editorial Typography & Preserved CTAs */}
        <div className="lg:col-span-8 max-w-3xl">
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="editorial-eyebrow text-[#B68A4A] mb-4">
              Architecture • Interior Environments • Landscape
            </p>

            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-light leading-[0.92] tracking-tight text-[#F2F0EB]">
              Spaces shaped by
              <br />
              <span className="italic text-[#D97724] font-normal">intention.</span>
            </h1>

            <p className="mt-7 max-w-xl text-sm sm:text-base leading-relaxed text-white/60">
              A multidisciplinary architecture and spatial design practice crafting monolithic, light-sculpted residences and bespoke environments with quiet precision in Nagpur, India.
            </p>

            {/* Preserved Action Buttons */}
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={onOpenConsultation}
                className="group relative inline-flex items-center gap-4 bg-[#F2F0EB] text-[#111111] px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#D97724] hover:text-white"
              >
                Discuss Your Project
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>

              <button
                type="button"
                onClick={scrollToProjects}
                className="group inline-flex items-center gap-3 border border-white/20 px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-[#D8D6D0] backdrop-blur-sm transition-all duration-300 hover:border-[#B68A4A] hover:text-white"
              >
                Explore Projects
                <span className="text-[#B68A4A] group-hover:translate-y-0.5 transition-transform">↓</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Refined Architectural Stage Badges */}
        <div className="lg:col-span-4 flex items-end justify-start lg:justify-end">
          <div className="border-l border-white/15 pl-6 py-1 max-w-xs space-y-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#B68A4A]">
              ARCHITECTURAL DISCIPLINES
            </span>
            <div className="grid grid-cols-2 gap-2 font-mono text-[9px] uppercase tracking-wider text-white/55">
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#D97724]" />
                01. Form
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#B68A4A]" />
                02. Structure
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#C6A779]" />
                03. Materiality
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-white/40" />
                04. Landscape
              </div>
            </div>
            <p className="font-mono text-[8.5px] tracking-wide text-white/35">
              Nagpur Studio • Full Turnkey Execution
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BOTTOM ACCENT HAIRLINE                                              */}
      {/* =================================================================== */}
      <div className="relative z-20 w-full border-b border-white/10" />
    </div>
  );
}
