"use client";

import React, { useState, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import type { ServiceItem } from "@/config/siteConfig";
import {
  RevealText,
  HairlineRule,
  StaggerGrid,
  StaggerItem,
} from "@/components/motion/EditorialMotion";

interface ServicesSectionProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
}

export function ServicesSection({
  services,
  onSelectService,
}: ServicesSectionProps) {
  const [activeDiscipline, setActiveDiscipline] = useState<string>("all");
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSelectDiscipline = (discId: string) => {
    setActiveDiscipline(discId);
  };

  return (
    <section
      id="expertise"
      className="relative overflow-hidden bg-[#0A0A0A] py-14 sm:py-16 md:py-20 scroll-mt-24 sm:scroll-mt-32 text-white"
    >
      {/* =========================================================================
          CONTINUOUS 360° ROTATING 3D VILLA BACKGROUND ANIMATION
          ========================================================================= */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden select-none">
        {/* The Autoplaying, Looping Background Video */}
        <video
          ref={videoRef}
          src="/homepage_enhanced_full_hd.mp4"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="auto"
          className="h-full w-full object-cover object-center opacity-65 sm:opacity-75 filter contrast-[1.1] brightness-[1.05]"
        />

        {/* Balanced Vignette Scrim for Text Legibility & Crisp Video */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/75 via-[#0A0A0A]/30 to-[#0A0A0A]/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/65 via-transparent to-[#0A0A0A]/65" />

        {/* Ambient Warm Terracotta & Amber Light Halo */}
        <div
          className="absolute top-1/3 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]"
          style={{
            background:
              "radial-gradient(circle, rgba(217, 119, 36, 0.14) 0%, rgba(182, 138, 74, 0.05) 50%, transparent 75%)",
          }}
        />

        {/* Precision Axonometric 3D Wireframe Grid Overlay */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.03]"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="expertise-bg-grid-v3"
              width="80"
              height="46.188"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 80 23.094 L 40 46.188 L 0 23.094 Z"
                fill="none"
                stroke="#B68A4A"
                strokeWidth="0.5"
              />
              <path
                d="M 0 23.094 L 80 23.094"
                stroke="#D97724"
                strokeWidth="0.3"
                strokeDasharray="2 4"
              />
            </pattern>
          </defs>
          <rect width="1440" height="900" fill="url(#expertise-bg-grid-v3)" />
        </svg>
      </div>

      {/* =========================================================================
          FOREGROUND EDITORIAL CONTENT (COMPACT SIZING & PROPORTIONS)
          ========================================================================= */}
      <div className="editorial-container relative z-10">
        {/* Section Introduction */}
        <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.24em] uppercase text-[#B68A4A] mb-1.5 flex items-center gap-2">
              <span>STUDIO EXPERTISE · 5 DISCIPLINES</span>
            </div>
            <RevealText>
              <h2 className="max-w-3xl font-serif text-3xl sm:text-4xl lg:text-[44px] font-light leading-[1.08] tracking-tight text-[#F2F0EB]">
                A considered approach <span className="italic text-[#C6A779]">to every space.</span>
              </h2>
            </RevealText>
          </div>

          <div className="hidden md:block text-right">
            <span className="font-mono text-[9px] tracking-widest uppercase text-white/40">
              TURNKEY ARCHITECTURE &amp; INTERIORS
            </span>
          </div>
        </div>

        <HairlineRule color="bg-white/15" className="mb-0" />

        {/* Services Staggered Interactive Grid (Compact 3-col / 2-col Layout) */}
        <StaggerGrid
          staggerDelay={0.06}
          className="grid border-l border-white/10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service, index) => {
            const isMatch =
              activeDiscipline === "all" || activeDiscipline === service.id;

            return (
              <StaggerItem
                key={service.id}
                className={`border-b border-r border-white/10 ${index === 4 ? "sm:col-span-2 lg:col-span-1" : ""
                  }`}
              >
                <button
                  type="button"
                  data-cursor-label="Explore"
                  onClick={() => {
                    handleSelectDiscipline(service.id);
                    onSelectService(service);
                  }}
                  onMouseEnter={() => handleSelectDiscipline(service.id)}
                  className={`group relative flex min-h-[225px] sm:min-h-[240px] lg:min-h-[250px] w-full flex-col justify-between overflow-hidden p-5 sm:p-6 lg:p-6 text-left backdrop-blur-md transition-all duration-400 cursor-pointer ${activeDiscipline === service.id
                    ? "bg-[#181818]/95 border-t-2 border-t-[#D97724] shadow-xl shadow-black/70 -translate-y-1"
                    : "bg-[#101010]/63 hover:bg-[#181818]/88 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60"
                    } ${isMatch ? "opacity-100" : "opacity-[0.58]"}`}
                >
                  {/* Chromatic Edge Sweep Line on Hover / Active */}
                  <div
                    className={`absolute left-0 top-0 h-[2px] bg-gradient-to-r from-[#D97724] via-[#C6A779] to-[#F59E0B] transition-all duration-500 ease-out ${activeDiscipline === service.id
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                      }`}
                  />

                  <div>
                    {/* Top Header inside Card */}
                    <div className="flex items-center justify-end">
                      <span className="font-mono text-[10px] text-white/40">
                        0{index + 1}
                      </span>
                    </div>

                    {/* Discipline Title */}
                    <h3 className="mt-4 sm:mt-5 max-w-xs font-serif text-xl sm:text-2xl lg:text-[24px] font-normal leading-[1.1] text-[#F2F0EB] transition-transform duration-300 group-hover:translate-x-0.5">
                      {service.title}
                    </h3>

                    {/* Discipline Tagline */}
                    <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-[#A8A59E] line-clamp-2 sm:line-clamp-3">
                      {service.tagline}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/10">
                    <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/60 transition-colors group-hover:text-[#B68A4A]">
                      Explore Discipline
                    </span>

                    <span
                      className={`flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border transition-all duration-300 ${activeDiscipline === service.id
                        ? "border-[#B68A4A] bg-[#B68A4A] text-white shadow-md shadow-[#B68A4A]/30"
                        : "border-white/20 text-white group-hover:border-[#B68A4A] group-hover:bg-[#B68A4A] group-hover:text-white"
                        }`}
                    >
                      <ArrowUpRight
                        size={14}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </div>
                </button>
              </StaggerItem>
            );
          })}
        </StaggerGrid>

        {/* Closing Statement */}
        <HairlineRule color="bg-white/15" className="mt-8 sm:mt-10" />
        <div className="py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-white/70 text-xs sm:text-[13px]">
          <p className="font-serif text-lg sm:text-xl italic text-[#B8B5AD]">
            One vision. Multiple disciplines. A cohesive result.
          </p>
          <span className="font-mono text-[9px] tracking-widest uppercase text-[#B68A4A]">
            INTEGRATED PRACTICE · 1:1 TECTONIC EXECUTION
          </span>
        </div>
      </div>
    </section>
  );
}
