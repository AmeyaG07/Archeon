"use client";

import React, { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Compass, Layers, Maximize2 } from "lucide-react";

interface ArchitecturalRevealHeroProps {
  onOpenConsultation?: () => void;
}

const STAGES = [
  {
    number: "01",
    label: "Form",
    title: "Spatial Volumetrics & Context",
    description: "Orientation, volume distribution, and massing responding directly to solar vectors and landscape typology.",
    range: [0.0, 0.25] as const,
  },
  {
    number: "02",
    label: "Structure",
    title: "Tectonic Skeleton & Loadpaths",
    description: "Monolithic concrete post-and-lintel structural framework with expansive column-free interior vistas.",
    range: [0.25, 0.55] as const,
  },
  {
    number: "03",
    label: "Interior & Materiality",
    title: "Tactile Textures & Light Sculpting",
    description: "Bespoke stone, dark architectural bronze, fluted glass, and calibrated apertures diffusing natural zenithal light.",
    range: [0.55, 0.85] as const,
  },
  {
    number: "04",
    label: "Landscape",
    title: "Natural Continuum & Living Courtyards",
    description: "Seamless dissolving of interior-exterior thresholds through endemic stone courtyards and water reflections.",
    range: [0.85, 1.0] as const,
  },
];

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function ArchitecturalRevealHero({
  onOpenConsultation,
}: ArchitecturalRevealHeroProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const percentTextRef = useRef<HTMLSpanElement>(null);
  const elevationGridRef = useRef<SVGSVGElement>(null);

  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const activeStage = STAGES[activeStageIndex];

  const scrollToProjects = useCallback(() => {
    const el = document.getElementById("projects");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let videoDuration = 0;
    if (videoRef.current) {
      videoDuration = videoRef.current.duration || 0;
    }

    let lastStage = 0;

    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        const progress = self.progress;

        // 1. Update scrubbed video if present & playable
        if (videoRef.current && videoDuration > 0 && !isNaN(videoDuration)) {
          const targetTime = progress * videoDuration;
          if (isFinite(targetTime)) {
            videoRef.current.currentTime = targetTime;
          }
        }

        // 2. Direct DOM update for vertical progress bar (high perf, no react re-renders)
        if (railRef.current) {
          railRef.current.style.transform = `scaleY(${Math.max(0.04, progress)})`;
        }

        // 3. Direct DOM update for telemetry readout
        if (percentTextRef.current) {
          percentTextRef.current.innerText = `${Math.round(progress * 100)}%`;
        }

        // 4. Subtle parallax scale & perspective on procedural architectural backdrop
        if (elevationGridRef.current) {
          const scale = 1 + progress * 0.12;
          const rotateX = progress * 8;
          elevationGridRef.current.style.transform = `scale(${scale}) perspective(1000px) rotateX(${rotateX}deg)`;
        }

        // 5. Stage index determination
        let nextStage = 0;
        if (progress >= 0.85) {
          nextStage = 3;
        } else if (progress >= 0.55) {
          nextStage = 2;
        } else if (progress >= 0.25) {
          nextStage = 1;
        } else {
          nextStage = 0;
        }

        if (nextStage !== lastStage) {
          lastStage = nextStage;
          setActiveStageIndex(nextStage);
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-[300vh] bg-[#111111] text-[#F2F0EB]"
    >
      {/* =================================================================== */}
      {/* CSS STICKY VIEWPORT CONTAINER (ZERO GSAP PIN JITTER / LENIS CLEAN)   */}
      {/* =================================================================== */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* ================================================================= */}
        {/* MEDIA LAYER: VIDEO SCRUBBER OR LUXURY ARCHITECTURAL PROCEDURAL      */}
        {/* ================================================================= */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {/* Subtle Radial Vignette for Obsidian Studio Ambiance */}
          <div
            className="absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(circle at 50% 48%, rgba(217, 119, 36, 0.05) 0%, rgba(17, 17, 17, 0.7) 60%, #111111 96%)",
            }}
          />

          {/* 1. HTML5 Video Element (Scrubbed when asset is present) */}
          {!videoFailed && (
            <video
              ref={videoRef}
              src="/videos/archeon-reveal.mp4"
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={() => setVideoReady(true)}
              onError={() => setVideoFailed(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                videoReady ? "opacity-65" : "opacity-0"
              }`}
            />
          )}

          {/* 2. Luxury Procedural Architectural Backdrop (Fallback & Base Layer) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Fine Blueprint / Elevation Drafting Matrix */}
            <svg
              ref={elevationGridRef}
              viewBox="0 0 1440 900"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-cover transition-transform duration-300 ease-out will-change-transform opacity-40"
            >
              <defs>
                <pattern
                  id="hero-arch-grid"
                  width="80"
                  height="80"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 80 0 L 0 0 0 80"
                    fill="none"
                    stroke="#D8D6D0"
                    strokeWidth="0.5"
                    strokeOpacity="0.08"
                  />
                  <circle cx="80" cy="80" r="1.5" fill="#B68A4A" fillOpacity="0.25" />
                </pattern>

                <linearGradient id="bronzeLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D97724" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#B68A4A" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Background Sub-Grid */}
              <rect width="1440" height="900" fill="url(#hero-arch-grid)" />

              {/* Central Vanishing Point Horizon & Coordinate Axes */}
              <line x1="0" y1="520" x2="1440" y2="520" stroke="#FFFFFF" strokeOpacity="0.12" strokeDasharray="6 6" />
              <line x1="720" y1="0" x2="720" y2="900" stroke="#FFFFFF" strokeOpacity="0.08" strokeDasharray="4 8" />

              {/* Dynamic Architectural Wireframe Volumetrics */}
              {/* Outer Pavilion Geometry */}
              <polygon
                points="360,680 720,260 1080,680"
                stroke="url(#bronzeLineGrad)"
                strokeWidth="1.2"
                strokeOpacity="0.45"
              />
              <polygon
                points="420,680 720,320 1020,680"
                stroke="#D8D6D0"
                strokeWidth="0.75"
                strokeOpacity="0.2"
              />

              {/* Cantilever Horizon Beams */}
              <line x1="280" y1="460" x2="1160" y2="460" stroke="#B68A4A" strokeWidth="1" strokeOpacity="0.35" />
              <line x1="320" y1="480" x2="1120" y2="480" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.15" />

              {/* Structural Columns */}
              <line x1="480" y1="460" x2="480" y2="720" stroke="#B68A4A" strokeWidth="1.5" strokeOpacity="0.5" />
              <line x1="720" y1="460" x2="720" y2="720" stroke="#D97724" strokeWidth="1.5" strokeOpacity="0.6" />
              <line x1="960" y1="460" x2="960" y2="720" stroke="#B68A4A" strokeWidth="1.5" strokeOpacity="0.5" />

              {/* Diagonal Architectural Sightlines */}
              <line x1="0" y1="180" x2="720" y2="520" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.1" />
              <line x1="1440" y1="180" x2="720" y2="520" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.1" />
              <line x1="0" y1="820" x2="720" y2="520" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.1" />
              <line x1="1440" y1="820" x2="720" y2="520" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.1" />

              {/* Precision Dimension Callouts */}
              <g className="font-mono text-[9px] fill-[#B68A4A] tracking-widest opacity-60">
                <text x="488" y="450">AXIS // 01-A</text>
                <text x="728" y="450">CTR // DATUM 00</text>
                <text x="968" y="450">AXIS // 02-B</text>
                <text x="360" y="700">BASE LEVEL // ±0.000M</text>
                <text x="730" y="250">ZENITH APERTURE // +14.600M</text>
              </g>
            </svg>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TOP HUD TELEMETRY BAR                                             */}
        {/* ================================================================= */}
        <div className="relative z-20 w-full pt-28 px-6 sm:px-12 md:px-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D97724] animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C6A779]">
              ARCHEON STUDIO // SPATIAL REVEAL
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
            <span className="flex items-center gap-1.5">
              <Compass size={12} className="text-[#B68A4A]" />
              21.1458° N, 79.0882° E
            </span>
            <span className="flex items-center gap-1.5">
              <Layers size={12} className="text-[#B68A4A]" />
              REVEAL CHOREOGRAPHY
            </span>
            <span className="flex items-center gap-1.5">
              <Maximize2 size={12} className="text-[#B68A4A]" />
              1:1 TECTONIC SCALE
            </span>
          </div>

          <div className="font-mono text-[10px] tracking-widest text-[#F2F0EB]">
            SCRUB: <span ref={percentTextRef} className="text-[#D97724]">0%</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MAIN EDITORIAL HERO CONTENT & RIGHT STAGE PROGRESS RAIL           */}
        {/* ================================================================= */}
        <div className="relative z-20 w-full pb-16 px-6 sm:px-12 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          {/* Left Column: Signature Editorial Typography & Preserved CTAs */}
          <div className="lg:col-span-8 max-w-3xl">
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
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

              {/* Action Buttons */}
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

          {/* Right Column: 4-Stage Architectural Scrub Indicator */}
          <div className="lg:col-span-4 flex items-end justify-start lg:justify-end">
            <div className="flex items-start gap-5 max-w-sm border-l border-white/15 pl-6 py-2">
              {/* Bronze Progress Rail */}
              <div className="relative w-1 h-32 bg-white/10 rounded-full overflow-hidden shrink-0 mt-1">
                <div
                  ref={railRef}
                  className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#D97724] via-[#B68A4A] to-[#F59E0B] origin-top transition-transform duration-75"
                  style={{ transform: "scaleY(0.04)" }}
                />
              </div>

              {/* Active Stage Callout with Framer Motion AnimatePresence */}
              <div className="min-h-[110px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-[#D97724]">
                      {activeStage.number}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                      {"// "}
                      {activeStage.label}
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStage.number}
                      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <h4 className="font-serif text-lg text-[#F2F0EB] leading-tight">
                        {activeStage.title}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-white/50">
                        {activeStage.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {STAGES.map((s, idx) => (
                    <div
                      key={s.number}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        idx === activeStageIndex
                          ? "w-6 bg-[#D97724]"
                          : "w-2 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BOTTOM ACCENT HAIRLINE (ANCHORS TRANSITION INTO EXPERTISE)        */}
        {/* ================================================================= */}
        <div className="relative z-20 w-full border-b border-white/10" />
      </div>
    </div>
  );
}
