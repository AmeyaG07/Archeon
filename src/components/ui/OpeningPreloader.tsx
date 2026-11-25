"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";

const emptySubscribe = () => () => {};

function getSnapshot() {
  try {
    const hasSeen = sessionStorage.getItem("archeon_preloader_seen");
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    return !hasSeen && !prefersReducedMotion;
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

export function OpeningPreloader() {
  const shouldPlay = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot
  );

  const [isDismissed, setIsDismissed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize progress animation when preloader should play
  useEffect(() => {
    if (!shouldPlay || isDismissed) return;

    try {
      sessionStorage.setItem("archeon_preloader_seen", "true");
    } catch {
      // Ignore sessionStorage errors in restricted environments
    }

    const startTime = performance.now();
    const duration = 2100; // ms

    let rafId: number;
    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const ratio = Math.min(elapsed / duration, 1);
      // Easing: cubic-bezier(0.22, 1, 0.36, 1) approximation
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));

      if (ratio < 1) {
        rafId = requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
        // Hold at 100% briefly (~300ms), then trigger exit transition
        const timer = setTimeout(() => {
          setIsExiting(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    };

    rafId = requestAnimationFrame(updateProgress);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [shouldPlay, isDismissed]);

  // Keyboard shortcut (Escape) to skip
  useEffect(() => {
    if (!shouldPlay || isDismissed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExiting(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shouldPlay, isDismissed]);

  // Guaranteed unmount fallback: ensure preloader never lingers or blocks clicks
  useEffect(() => {
    if (isExiting && !isDismissed) {
      const fallbackTimer = setTimeout(() => {
        setIsDismissed(true);
      }, 600);
      return () => clearTimeout(fallbackTimer);
    }
  }, [isExiting, isDismissed]);

  // Lock body scroll while preloader is active
  useEffect(() => {
    if (shouldPlay && !isDismissed && !isExiting) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [shouldPlay, isDismissed, isExiting]);

  if (!shouldPlay || isDismissed) {
    return null;
  }

  // Exact radius for circumference of ~974px (2 * PI * 155 = 973.89)
  const textCircleRadius = 155;
  const circumference = 2 * Math.PI * textCircleRadius;

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsDismissed(true);
      }}
    >
      {!isExiting && (
        <motion.div
          key="opening-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
          }}
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center select-none cursor-default bg-[#111111] ${
            isExiting ? "pointer-events-none" : "pointer-events-auto"
          }`}
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(217, 119, 36, 0.08) 0%, transparent 65%),
              linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%, 40px 40px, 40px 40px",
          }}
        >
          {/* Subtle Radial Vignette Masking */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, transparent 35%, rgba(17,17,17,0.85) 85%, #111111 100%)",
            }}
          />

          {/* Top Studio Identification Pill */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97724] animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#A3A199]">
              ArcheOn Architectural Engine
            </span>
          </motion.div>

          {/* Center Emblem Choreography Container */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Ambient Warm Radial Backlight */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 0.75, scale: 1.15 }}
              transition={{
                duration: 2.1,
                delay: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute -inset-10 -z-10 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(217, 119, 36, 0.32) 0%, rgba(182, 138, 74, 0.12) 45%, transparent 72%)",
                filter: "blur(32px)",
              }}
            />

            {/* Emblem Sizing Wrapper (310px mobile, 380px desktop) */}
            <div className="relative w-[310px] h-[310px] sm:w-[380px] sm:h-[380px]">
              {/* ========================================================= */}
              {/* LAYER 1: BASE DIM ARCHITECTURAL SILVER/GREY LAYER (0.25) */}
              {/* ========================================================= */}
              <div className="absolute inset-0 opacity-25 text-[#77736C]">
                <motion.div
                  className="w-full h-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 26,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <svg
                    viewBox="0 0 380 380"
                    className="w-full h-full overflow-visible"
                    aria-hidden="true"
                  >
                    <defs>
                      <path
                        id="preloader-text-path-base"
                        d={`M 190, 190 m -${textCircleRadius}, 0 a ${textCircleRadius},${textCircleRadius} 0 1,1 ${
                          textCircleRadius * 2
                        },0 a ${textCircleRadius},${textCircleRadius} 0 1,1 -${
                          textCircleRadius * 2
                        },0`}
                        fill="none"
                      />
                    </defs>

                    {/* Outer drafting rings */}
                    <circle
                      cx="190"
                      cy="190"
                      r="174"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="2 6"
                      opacity="0.4"
                    />
                    <circle
                      cx="190"
                      cy="190"
                      r="165"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.75"
                      opacity="0.6"
                    />
                    <circle
                      cx="190"
                      cy="190"
                      r="142"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.75"
                      opacity="0.6"
                    />
                    <circle
                      cx="190"
                      cy="190"
                      r="108"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="4 8"
                      opacity="0.45"
                    />

                    {/* 12 Radial Compass/Drafting Ticks */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i * 30 * Math.PI) / 180;
                      const x1 = 190 + Math.cos(angle) * 142;
                      const y1 = 190 + Math.sin(angle) * 142;
                      const x2 = 190 + Math.cos(angle) * 148;
                      const y2 = 190 + Math.sin(angle) * 148;
                      return (
                        <line
                          key={`base-tick-${i}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="currentColor"
                          strokeWidth="1"
                          opacity="0.7"
                        />
                      );
                    })}

                    {/* Cardinal Crosshair Guide Marks */}
                    <line
                      x1="190"
                      y1="22"
                      x2="190"
                      y2="36"
                      stroke="currentColor"
                      strokeWidth="1.25"
                    />
                    <line
                      x1="190"
                      y1="344"
                      x2="190"
                      y2="358"
                      stroke="currentColor"
                      strokeWidth="1.25"
                    />
                    <line
                      x1="22"
                      y1="190"
                      x2="36"
                      y2="190"
                      stroke="currentColor"
                      strokeWidth="1.25"
                    />
                    <line
                      x1="344"
                      y1="190"
                      x2="358"
                      y2="190"
                      stroke="currentColor"
                      strokeWidth="1.25"
                    />

                    {/* Circular Text Orbit */}
                    <text
                      className="font-mono text-[9px] uppercase tracking-[0.24em] fill-current"
                      style={{ letterSpacing: "0.22em" }}
                    >
                      <textPath
                        href="#preloader-text-path-base"
                        startOffset="0%"
                        textLength={circumference - 10}
                        lengthAdjust="spacingAndGlyphs"
                      >
                        ARCHEON DESIGN STUDIO • ARCHITECTURE & INTERIORS •
                      </textPath>
                    </text>
                  </svg>
                </motion.div>

                {/* Center Recessed Base Logo / Architectural Monogram */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[150px] h-[150px] rounded-full border border-current/30 flex flex-col items-center justify-center p-4">
                    {/* Architectural "A" Monogram Geometry */}
                    <svg
                      viewBox="0 0 100 100"
                      className="w-16 h-16 overflow-visible text-current"
                      fill="none"
                      stroke="currentColor"
                    >
                      {/* Apex Triangle */}
                      <path
                        d="M 22 76 L 50 20 L 78 76"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Crossbeam */}
                      <line
                        x1="32"
                        y1="58"
                        x2="68"
                        y2="58"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      {/* Central Celestial Void */}
                      <circle
                        cx="50"
                        cy="58"
                        r="6"
                        strokeWidth="1.5"
                        fill="currentColor"
                        fillOpacity="0.15"
                      />
                      {/* Precision Drafting Extensions */}
                      <line
                        x1="50"
                        y1="10"
                        x2="50"
                        y2="18"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                      <line
                        x1="14"
                        y1="76"
                        x2="86"
                        y2="76"
                        strokeWidth="0.75"
                        opacity="0.5"
                      />
                    </svg>
                    <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] font-medium text-current">
                      ArcheOn
                    </span>
                    <span className="font-mono text-[6.5px] uppercase tracking-[0.2em] opacity-60 text-current">
                      Studio
                    </span>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* LAYER 2: ILLUMINATED GLOWING WARM BRONZE LAYER (#D97724)   */}
              {/* Animated clip-path from bottom to top over ~2.0s           */}
              {/* ========================================================= */}
              <motion.div
                className="absolute inset-0 text-[#D97724] pointer-events-none"
                style={{
                  filter:
                    "drop-shadow(0 0 18px rgba(217, 119, 36, 0.85)) drop-shadow(0 0 32px rgba(182, 138, 74, 0.55))",
                }}
                initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                transition={{
                  duration: 2.1,
                  delay: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <motion.div
                  className="w-full h-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 26,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <svg
                    viewBox="0 0 380 380"
                    className="w-full h-full overflow-visible"
                    aria-hidden="true"
                  >
                    <defs>
                      <path
                        id="preloader-text-path-glow"
                        d={`M 190, 190 m -${textCircleRadius}, 0 a ${textCircleRadius},${textCircleRadius} 0 1,1 ${
                          textCircleRadius * 2
                        },0 a ${textCircleRadius},${textCircleRadius} 0 1,1 -${
                          textCircleRadius * 2
                        },0`}
                        fill="none"
                      />
                      <linearGradient
                        id="glow-ring-grad"
                        x1="0%"
                        y1="100%"
                        x2="0%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="60%" stopColor="#D97724" />
                        <stop offset="100%" stopColor="#B68A4A" />
                      </linearGradient>
                    </defs>

                    {/* Outer illuminated drafting rings */}
                    <circle
                      cx="190"
                      cy="190"
                      r="174"
                      fill="none"
                      stroke="url(#glow-ring-grad)"
                      strokeWidth="1.25"
                      strokeDasharray="2 6"
                      opacity="0.8"
                    />
                    <circle
                      cx="190"
                      cy="190"
                      r="165"
                      fill="none"
                      stroke="url(#glow-ring-grad)"
                      strokeWidth="1.25"
                    />
                    <circle
                      cx="190"
                      cy="190"
                      r="142"
                      fill="none"
                      stroke="url(#glow-ring-grad)"
                      strokeWidth="1"
                    />
                    <circle
                      cx="190"
                      cy="190"
                      r="108"
                      fill="none"
                      stroke="url(#glow-ring-grad)"
                      strokeWidth="1.2"
                      strokeDasharray="4 8"
                    />

                    {/* 12 Radiant Ticks */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i * 30 * Math.PI) / 180;
                      const x1 = 190 + Math.cos(angle) * 142;
                      const y1 = 190 + Math.sin(angle) * 142;
                      const x2 = 190 + Math.cos(angle) * 149;
                      const y2 = 190 + Math.sin(angle) * 149;
                      return (
                        <line
                          key={`glow-tick-${i}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#F59E0B"
                          strokeWidth="1.5"
                        />
                      );
                    })}

                    {/* Cardinal Guides */}
                    <line
                      x1="190"
                      y1="22"
                      x2="190"
                      y2="36"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="190"
                      y1="344"
                      x2="190"
                      y2="358"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="22"
                      y1="190"
                      x2="36"
                      y2="190"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="344"
                      y1="190"
                      x2="358"
                      y2="190"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />

                    {/* Circular Illuminated Text */}
                    <text
                      className="font-mono text-[9px] uppercase tracking-[0.24em] font-medium fill-[#F59E0B]"
                      style={{ letterSpacing: "0.22em" }}
                    >
                      <textPath
                        href="#preloader-text-path-glow"
                        startOffset="0%"
                        textLength={circumference - 10}
                        lengthAdjust="spacingAndGlyphs"
                      >
                        ARCHEON DESIGN STUDIO • ARCHITECTURE & INTERIORS •
                      </textPath>
                    </text>
                  </svg>
                </motion.div>

                {/* Center Recessed Glowing Logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[150px] h-[150px] rounded-full border border-[#D97724] bg-[#171513]/90 shadow-[0_0_24px_rgba(217,119,36,0.5)] flex flex-col items-center justify-center p-4">
                    {/* Glowing Architectural "A" Monogram Geometry */}
                    <svg
                      viewBox="0 0 100 100"
                      className="w-16 h-16 overflow-visible text-[#F59E0B]"
                      fill="none"
                      stroke="currentColor"
                    >
                      {/* Apex Triangle */}
                      <path
                        d="M 22 76 L 50 20 L 78 76"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Crossbeam */}
                      <line
                        x1="32"
                        y1="58"
                        x2="68"
                        y2="58"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      {/* Central Celestial Void with intense inner gold radiance */}
                      <circle
                        cx="50"
                        cy="58"
                        r="6"
                        strokeWidth="1.5"
                        fill="#F59E0B"
                        fillOpacity="0.4"
                      />
                      {/* Precision Drafting Extensions */}
                      <line
                        x1="50"
                        y1="10"
                        x2="50"
                        y2="18"
                        strokeWidth="1"
                        opacity="0.8"
                      />
                      <line
                        x1="14"
                        y1="76"
                        x2="86"
                        y2="76"
                        strokeWidth="0.8"
                        opacity="0.8"
                      />
                    </svg>
                    <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] font-medium text-[#F59E0B]">
                      ArcheOn
                    </span>
                    <span className="font-mono text-[6.5px] uppercase tracking-[0.2em] text-[#B68A4A]">
                      Studio
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Progress Bar & State Telemetry */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#77736C]">
                  {progress < 45
                    ? "INITIALIZING SPATIAL MATRIX"
                    : progress < 90
                    ? "CALIBRATING LIGHT & GEOMETRY"
                    : "ARCHEON SYSTEM READY"}
                </span>
                <span className="font-mono text-[10px] tabular-nums font-medium text-[#D97724]">
                  {progress}%
                </span>
              </div>

              {/* Minimal Progress Rule */}
              <div className="w-48 h-[1.5px] bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#B68A4A] via-[#D97724] to-[#F59E0B]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Right Escape Button */}
          <button
            type="button"
            onClick={() => setIsExiting(true)}
            className="absolute bottom-6 right-8 text-[9px] font-mono uppercase tracking-[0.2em] text-[#77736C] hover:text-[#D97724] transition-colors"
          >
            [ESC / Skip]
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
