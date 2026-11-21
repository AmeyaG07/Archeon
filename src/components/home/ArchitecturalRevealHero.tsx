"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";

interface ArchitecturalRevealHeroProps {
  onOpenConsultation?: () => void;
}

export function ArchitecturalRevealHero({
  onOpenConsultation,
}: ArchitecturalRevealHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);

  const [videoReady, setVideoReady] = useState(false);

  // Play video on mount
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (video.readyState >= 2) {
        setVideoReady(true);
      }
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Handled gracefully if autoplay blocked
        });
      }
    }
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  const scrollToProjects = useCallback(() => {
    const el = document.getElementById("projects");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <section
      ref={heroSectionRef}
      id="heroSection"
      className="relative w-full h-screen min-h-[720px] max-h-[1200px] pt-[80px] pb-6 sm:pb-8 overflow-hidden bg-[#0A0A0A] text-[#F2EFE9] flex flex-col justify-between select-none"
    >
      {/* =================================================================== */}
      {/* 1. FULL-BLEED BACKGROUND ARCHITECTURAL VIDEO LAYER                  */}
      {/* =================================================================== */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#080808]">
        {/* Autoplaying, Looping, Muted Full-Viewport Hero Architectural Video */}
        <video
          ref={videoRef}
          id="bgHeroVideo"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          src="/hero-architectural-video.mp4"
          onCanPlay={handleVideoCanPlay}
          onPlaying={handleVideoCanPlay}
          onLoadedData={handleVideoCanPlay}
        >
          <source
            src="/hero-architectural-video.mp4"
            type="video/mp4"
          />
        </video>

        {/* Refined Dark Architectural Scrim / Vignette: High Contrast on Left, Open Clarity on Right */}
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: `
              linear-gradient(
                90deg,
                rgba(8, 8, 8, 0.94) 0%,
                rgba(8, 8, 8, 0.82) 32%,
                rgba(8, 8, 8, 0.35) 58%,
                rgba(8, 8, 8, 0.12) 80%,
                rgba(8, 8, 8, 0.05) 100%
              ),
              linear-gradient(
                180deg,
                rgba(8, 8, 8, 0.72) 0%,
                rgba(8, 8, 8, 0.15) 20%,
                rgba(8, 8, 8, 0.15) 75%,
                rgba(8, 8, 8, 0.88) 100%
              )
            `,
          }}
        />
      </div>

      {/* =================================================================== */}
      {/* 2. SUB-HEADER METADATA BAR                                         */}
      {/* =================================================================== */}
      {/* <div className="relative z-10 w-full px-4 sm:px-10 lg:px-14 pt-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6 font-mono text-[10px] tracking-[0.22em] uppercase text-[#9A948A]">
          {/* Left Studio Location */}
          {/* <div className="flex items-center gap-2.5 text-[#B8894A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8621E] inline-block animate-pulse" />
            <span>ARCHEON STUDIO // NAGPUR</span>
          </div> */}

          {/* Center Coordinates & Tectonic Specs */}
          {/* <div className="hidden lg:flex items-center gap-8 text-[#8D8880]">
            <span className="flex items-center gap-2">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B8894A"
                strokeWidth="1.6"
              >
                <circle cx="12" cy="12" r="9" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              21.1458° N, 79.0882° E
            </span>
            <span className="flex items-center gap-2">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B8894A"
                strokeWidth="1.6"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 12 12 17 22 12" />
                <polyline points="2 17 12 22 22 17" />
              </svg>
              FORM · STRUCTURE · MATERIALITY
            </span>
            <span className="flex items-center gap-2">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B8894A"
                strokeWidth="1.6"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              1:1 TECTONIC SCALE
            </span>
          </div> */}

          {/* Right Established Year */}
          {/* <div className="text-[#B8894A]">EST. 2024</div>
        </div>
      </div> */}

      {/* =================================================================== */}
      {/* 3. MAIN LEFT HERO CONTENT                                           */}
      {/* =================================================================== */}
      <div className="relative z-10 w-full px-4 sm:px-10 lg:px-14 my-auto py-8 lg:py-12">
        <div className="max-w-[720px]">
          {/* Eyebrow */}
          <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.24em] sm:tracking-[0.28em] uppercase text-[#B8894A] mb-4 sm:mb-6">
            ARCHITECTURE &nbsp;·&nbsp; INTERIOR ENVIRONMENTS &nbsp;·&nbsp; LANDSCAPE
          </p>

          {/* Display Serif Headline */}
          <h1 className="font-serif font-normal text-[44px] xs:text-[54px] sm:text-[76px] lg:text-[98px] xl:text-[108px] leading-[0.96] sm:leading-[0.92] tracking-[-0.025em] text-[#F2EFE9]">
            Spaces shaped by<br />
            <span className="italic text-[#C8621E] font-normal">intention.</span>
          </h1>

          {/* Editorial Subcopy */}
          <p className="mt-6 sm:mt-8 max-w-[560px] text-[15px] sm:text-[17px] leading-[1.72] font-light text-[#C2BEB6]">
            A multidisciplinary architecture and spatial design practice crafting
            monolithic, light-sculpted residences and bespoke environments with quiet
            precision in Nagpur, India.
          </p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. BOTTOM ROW: DOWNWARD CTA BUTTONS & ARCHITECTURAL DISCIPLINES     */}
      {/* =================================================================== */}
      <div className="relative z-10 w-full px-4 sm:px-10 lg:px-14 pb-8 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Bottom-Left: Downward CTA Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenConsultation}
            className="w-full sm:w-auto justify-center px-6 sm:px-7 py-3.5 sm:py-4 bg-[#F2EFE9] text-[#0A0A0A] hover:bg-white transition-all font-mono text-[11px] tracking-[0.22em] uppercase inline-flex items-center gap-3 font-medium shadow-xl hover:shadow-2xl hover:-translate-y-0.5 touch-target"
          >
            <span>DISCUSS YOUR PROJECT</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={scrollToProjects}
            className="w-full sm:w-auto justify-center px-6 sm:px-7 py-3.5 sm:py-4 bg-black/60 backdrop-blur-md border border-white/25 text-[#F2EFE9] hover:border-white/55 hover:bg-white/[0.08] transition-all font-mono text-[11px] tracking-[0.22em] uppercase inline-flex items-center gap-3 shadow-xl hover:-translate-y-0.5 touch-target"
          >
            <span>EXPLORE PROJECTS</span>
            <span aria-hidden="true">↓</span>
          </button>
        </div>

        {/* Bottom-Right: Architectural Disciplines Block with Solid Dark Background */}
        <aside className="rounded-xl border border-white/15 bg-black/80 p-4 sm:p-5 backdrop-blur-md shadow-2xl self-start md:self-end max-w-sm">
          <div className="flex items-center justify-between gap-4 mb-2.5">
            <p className="font-mono text-[9.5px] tracking-[0.24em] uppercase text-[#B8894A]">
              ARCHITECTURAL DISCIPLINES
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8621E] inline-block animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[9.5px] tracking-[0.16em] uppercase text-[#C8C3BA]">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#C8621E] inline-block" />
              <span>01. FORM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#C8621E] inline-block" />
              <span>02. STRUCTURE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#C8621E] inline-block" />
              <span>03. MATERIALITY</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#C8621E] inline-block" />
              <span>04. LANDSCAPE</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 font-mono text-[9px] tracking-[0.14em] text-[#8D8880]">
            Nagpur Studio · Full Turnkey Execution
          </div>
        </aside>
      </div>
    </section>
  );
}
