"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUpRight, ArrowDown } from "lucide-react";

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
      <div className="relative z-10 w-full px-4 sm:px-10 lg:px-14 my-auto py-6 sm:py-8 lg:py-10">
        <div className="relative max-w-[720px] p-6 sm:p-8 lg:p-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {/* Subtle Ambient Gold Glow in Top-Left Corner of Card */}
          <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#B68A4A]/20 blur-3xl" />

          {/* Top Atelier Badge */}
          <div className="relative z-10 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-[#B68A4A]/30 mb-5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8621E] animate-pulse" />
            <span className="font-mono text-[9px] sm:text-[9.5px] uppercase tracking-[0.24em] text-[#E0D8C3] font-medium">
              ARCHEON ATELIER · NAGPUR
            </span>
            <span className="text-[10px] text-[#B68A4A]">✦</span>
            <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-[#B68A4A]">
              EST. 2024
            </span>
          </div>

          {/* Eyebrow */}
          <p className="relative z-10 font-mono text-[10.5px] sm:text-[11px] tracking-[0.24em] sm:tracking-[0.28em] uppercase text-[#C6A779] font-medium mb-3 sm:mb-4 flex flex-wrap items-center gap-2">
            <span>ARCHITECTURE</span>
            <span className="text-[#C8621E]">·</span>
            <span>INTERIOR ENVIRONMENTS</span>
            <span className="text-[#C8621E]">·</span>
            <span>LANDSCAPE</span>
          </p>

          {/* Display Serif Headline */}
          <h1 className="relative z-10 font-serif font-normal text-[36px] xs:text-[44px] sm:text-[56px] lg:text-[68px] xl:text-[76px] leading-[1.0] sm:leading-[0.98] tracking-[-0.025em] text-[#F2EFE9]">
            Spaces Designed
            <br />
            <span className="italic font-normal bg-gradient-to-r from-[#D97724] via-[#F59E0B] to-[#C6A779] bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(217,119,36,0.25)]">
              Around the Way You Live.
            </span>
          </h1>

          {/* Editorial Subcopy with Architectural Left Accent */}
          <div className="relative z-10 mt-6 sm:mt-8 border-l-2 border-[#B68A4A]/50 pl-4 sm:pl-5">
            <p className="max-w-[560px] text-[14.5px] sm:text-[15.5px] lg:text-[16.5px] leading-[1.75] font-light text-[#D4D0C7]">
              We design thoughtful architecture and interiors that bring together beauty,
              comfort, and functionality. From your first idea to the final details,
              we create spaces that feel truly yours.
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. BOTTOM ROW: DOWNWARD CTA BUTTONS & ARCHITECTURAL DISCIPLINES     */}
      {/* =================================================================== */}
      <div className="relative z-10 w-full px-4 sm:px-10 lg:px-14 pb-8 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Bottom-Left: Upgraded Luxury CTA Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
          {/* Primary CTA: Discuss Your Project */}
          <button
            type="button"
            onClick={onOpenConsultation}
            className="group relative w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-3.5 px-7 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#C6A779] via-[#B68A4A] to-[#A07438] text-[#0A0A0A] font-['Outfit',sans-serif] text-[13px] sm:text-[13.5px] font-semibold tracking-[0.12em] uppercase shadow-[0_6px_28px_rgba(182,138,74,0.4)] hover:shadow-[0_8px_36px_rgba(182,138,74,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer"
          >
            {/* Shimmer light reflection effect */}
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

            <span className="relative z-10">Discuss Your Project</span>
            <span className="relative z-10 w-7 h-7 rounded-full bg-black/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight size={15} strokeWidth={2.4} />
            </span>
          </button>

          {/* Secondary CTA: Explore Projects */}
          <button
            type="button"
            onClick={scrollToProjects}
            className="group relative w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-3.5 px-7 py-3.5 sm:py-4 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-[#F2EFE9] font-['Outfit',sans-serif] text-[13px] sm:text-[13.5px] font-medium tracking-[0.12em] uppercase shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-[#C6A779]/80 hover:bg-white/[0.1] hover:shadow-[0_0_25px_rgba(198,167,121,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <span className="relative z-10">Explore Projects</span>
            <span className="relative z-10 w-7 h-7 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-y-0.5">
              <ArrowDown size={14} className="text-[#C6A779]" strokeWidth={2.4} />
            </span>
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
