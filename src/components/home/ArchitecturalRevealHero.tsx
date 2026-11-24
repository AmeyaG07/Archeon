"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
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
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${videoReady ? "opacity-100" : "opacity-0"
            }`}
          style={{
            filter: "contrast(1.08) brightness(1.08) saturate(1.12)",
            transform: "translateZ(0)",
            willChange: "transform",
          }}
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

        {/* Refined Architectural Scrim: Rich left-to-right gradient fade ensuring supreme typography legibility */}
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: `
              radial-gradient(
                circle at 100% 100%,
                rgba(10, 10, 10, 0.92) 0%,
                rgba(10, 10, 10, 0.65) 60px,
                rgba(10, 10, 10, 0.2) 110px,
                transparent 150px
              ),
              linear-gradient(
                90deg,
                rgba(5, 5, 5, 0.92) 0%,
                rgba(6, 6, 6, 0.85) 20%,
                rgba(6, 6, 6, 0.68) 36%,
                rgba(7, 7, 7, 0.38) 52%,
                rgba(8, 8, 8, 0.14) 68%,
                rgba(8, 8, 8, 0.0) 82%
              ),
              linear-gradient(
                180deg,
                rgba(8, 8, 8, 0.5) 0%,
                transparent 18%,
                transparent 78%,
                rgba(8, 8, 8, 0.65) 100%
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
        <div className="relative max-w-[720px]">
          {/* Subtle localized atmospheric backdrop ensuring text visibility over background bokeh */}
          <div
            className="pointer-events-none absolute -inset-y-12 -inset-x-8 sm:-inset-x-12 rounded-3xl -z-10 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse 95% 85% at 20% 50%, rgba(5, 5, 5, 0.75) 0%, rgba(5, 5, 5, 0.42) 55%, transparent 95%)",
            }}
          />

          {/* Eyebrow */}
          {/* <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.24em] sm:tracking-[0.28em] uppercase text-[#B8894A] mb-4 sm:mb-6">
            ARCHITECTURE &nbsp;·&nbsp; INTERIOR ENVIRONMENTS &nbsp;·&nbsp; LANDSCAPE
          </p> */}

          {/* Hero Heading - 3-Line Editorial Composition */}
          <h1 className="font-sans font-bold text-[28px] xs:text-[34px] sm:text-[40px] lg:text-[54px] xl:text-[58px] leading-[1.04] sm:leading-[0.98] tracking-[-0.035em] text-[#E8E3D9] drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]">
            <span className="italic text-[#B8A68A] font-bold">Spaces Designed</span>
            <br />
            <span>Around the</span>
            <br />
            <span className="italic text-[#B8A68A] font-bold">Way You Live.</span>
          </h1>

          {/* Editorial Subcopy */}
          <p className="mt-6 sm:mt-8 max-w-[540px] text-[14px] sm:text-[15px] lg:text-[16px] leading-[1.75] font-light text-[#C2BEB6] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            We design thoughtful architecture and interiors that bring together beauty,
            comfort, and functionality. From your first idea to the final details,
            we create spaces that feel truly yours.
          </p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. BOTTOM ROW: DOWNWARD CTA BUTTONS & ARCHITECTURAL DISCIPLINES     */}
      {/* =================================================================== */}
      <div className="relative z-10 w-full px-4 sm:px-10 lg:px-14 pb-8 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Bottom-Left: Glassmorphic CTA Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
          {/* Primary Glassmorphic Button: Discuss Your Project */}
          <button
            type="button"
            onClick={onOpenConsultation}
            className="group relative w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-4 px-7 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#C6A779]/25 via-[#B68A4A]/20 to-[#C8621E]/15 hover:from-[#C6A779]/40 hover:via-[#B68A4A]/30 hover:to-[#C8621E]/25 backdrop-blur-2xl border border-[#C6A779]/50 hover:border-[#C6A779] text-[#F2EFE9] font-['Outfit',sans-serif] text-[13px] sm:text-[13.5px] font-medium tracking-[0.12em] uppercase shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_rgba(182,138,74,0.3)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_12px_40px_rgba(182,138,74,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden"
          >
            {/* Shimmer light reflection effect */}
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

            <span className="relative z-10">Discuss Your Project</span>
            <span className="relative z-10 w-7 h-7 rounded-full bg-white/10 border border-white/25 flex items-center justify-center text-[#E0D8C3] group-hover:bg-[#C6A779] group-hover:text-black transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight size={14} strokeWidth={2.2} />
            </span>
          </button>

          {/* Secondary Glassmorphic Button: Explore Projects */}
          {/* <button
            type="button"
            onClick={scrollToProjects}
            className="group relative w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-4 px-7 py-3.5 sm:py-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-2xl border border-white/20 hover:border-white/50 text-[#E8E5DF] hover:text-white font-['Outfit',sans-serif] text-[13px] sm:text-[13.5px] font-medium tracking-[0.12em] uppercase shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden"
          >
            {/* Shimmer light reflection effect */}
          {/* <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

            <span className="relative z-10">Explore Projects</span>
            <span className="relative z-10 w-7 h-7 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-[#C6A779] group-hover:bg-white/25 group-hover:text-white transition-all duration-300 group-hover:translate-y-0.5">
              <ArrowDown size={14} className="text-[#C6A779] group-hover:text-white transition-colors" strokeWidth={2.2} />
            </span>
          </button> */}
        </div>

        {/* Bottom-Right: ArcheOn Atelier Brand Seal & Logo Badge (Covering bottom-right video watermark) */}
        <div className="relative z-20 self-start md:self-end flex items-center gap-3 px-4 py-2 rounded-full bg-black/85 backdrop-blur-2xl border border-[#B68A4A]/40 shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
            <Image
              src="/brand-assets/logo-transparent.png"
              alt="ArcheOn Design Studio"
              width={34}
              height={34}
              priority
              className="object-contain drop-shadow-[0_0_10px_rgba(182,138,74,0.6)]"
            />
          </div>
          <div className="flex flex-col border-l border-white/20 pl-2.5 pr-1">
            <span className="font-['Cinzel',serif] text-[9.5px] font-semibold tracking-[0.24em] text-[#E0D8C3] uppercase">
              ArcheOn
            </span>
            <span className="font-mono text-[7.5px] tracking-[0.16em] text-[#B68A4A] uppercase">
              Ar. Mandar Bhalekar
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
