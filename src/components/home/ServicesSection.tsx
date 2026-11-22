"use client";

import React, { useState, useRef } from "react";
import { ArrowUpRight, RotateCw, Volume2, VolumeX } from "lucide-react";
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

interface CADNode {
  id: string;
  disciplineId: string;
  tag: string;
  elevation: string;
  title: string;
  spec: string;
  pulseColor: string;
}

const CAD_NODES: CADNode[] = [
  {
    id: "node-arch",
    disciplineId: "architecture",
    tag: "LVL 02 · ARCHITECTURE",
    elevation: "+8.450m OVERHANG",
    title: "Cantilever Suite Plate",
    spec: "Post-tensioned steel · Low-E glazing",
    pulseColor: "bg-amber-500",
  },
  {
    id: "node-interior",
    disciplineId: "interior",
    tag: "LVL 01 · INTERIOR DESIGN",
    elevation: "±0.000m FINISHED FLOOR",
    title: "Monolithic Living Atrium",
    spec: "Cast basalt · Double light well",
    pulseColor: "bg-orange-500",
  },
  {
    id: "node-sky",
    disciplineId: "visualization",
    tag: "LVL 03 · 3D VISUALISATION",
    elevation: "+14.200m ROOF DECK",
    title: "Sky-Lounge & Pergola",
    spec: "Acoustic timber slats · Horizon pool",
    pulseColor: "bg-yellow-400",
  },
  {
    id: "node-landscape",
    disciplineId: "landscape",
    tag: "EXT · LANDSCAPE ECOLOGY",
    elevation: "-0.450m SUNKEN PATIO",
    title: "Xeriscape Water Mirror",
    spec: "Nagpur endemic flora · Reflection pond",
    pulseColor: "bg-emerald-500",
  },
];

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
      className="relative overflow-hidden bg-[#0A0A0A] py-24 sm:py-32 scroll-mt-24 sm:scroll-mt-32 text-white"
    >
      {/* =========================================================================
          CONTINUOUS 360° ROTATING 3D VILLA BACKGROUND ANIMATION
          ========================================================================= */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden select-none">
        {/* The Autoplaying, Looping Background Video */}
        <video
          ref={videoRef}
          src="/expertise-architectural-video.mp4"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="auto"
          className="h-full w-full object-cover object-center opacity-45 sm:opacity-60 filter contrast-[1.12] brightness-[1.05]"
        />

        {/* Cinematic Vignette & Radial Contrast Scrims for Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/90 via-[#0A0A0A]/35 to-[#0A0A0A]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 via-transparent to-[#0A0A0A]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0A0A0A]/30 to-[#0A0A0A]/80" />

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
          className="absolute inset-0 h-full w-full opacity-[0.08]"
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
          FOREGROUND EDITORIAL CONTENT
          ========================================================================= */}
      <div className="editorial-container relative z-10">
        {/* Section Introduction */}
        <div className="mb-14">
          <RevealText>
            <h2 className="max-w-4xl font-serif text-5xl font-light leading-[0.98] tracking-tight text-[#F2F0EB] sm:text-6xl lg:text-7xl">
              A considered approach
            </h2>
          </RevealText>
          <RevealText delay={0.12}>
            <h2 className="max-w-4xl font-serif text-5xl font-light leading-[0.98] tracking-tight text-[#F2F0EB] sm:text-6xl lg:text-7xl mt-2">
              to <span className="italic text-[#C6A779]">every space.</span>
            </h2>
          </RevealText>
        </div>

        <HairlineRule color="bg-white/15" className="mb-0" />

        {/* Services Staggered Interactive Grid Over Video Background */}
        <StaggerGrid
          staggerDelay={0.08}
          className="grid border-l border-white/10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service, index) => {
            const isMatch =
              activeDiscipline === "all" || activeDiscipline === service.id;

            return (
              <StaggerItem
                key={service.id}
                className={`border-b border-r border-white/10 ${
                  index === 0 || index === 4 ? "lg:col-span-1" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectService(service)}
                  onMouseEnter={() => setActiveDiscipline(service.id)}
                  className={`group relative flex min-h-[310px] w-full flex-col justify-between overflow-hidden p-7 text-left backdrop-blur-md transition-all duration-500 sm:p-9 ${
                    activeDiscipline === service.id
                      ? "bg-[#181818]/90 border-t-2 border-t-[#D97724] shadow-2xl shadow-black/70 -translate-y-1.5"
                      : "bg-[#101010]/60 hover:bg-[#181818]/85 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/60"
                  } ${isMatch ? "opacity-100" : "opacity-45"}`}
                >
                  {/* Chromatic Edge Sweep Line on Hover / Active */}
                  <div
                    className={`absolute left-0 top-0 h-[2px] bg-gradient-to-r from-[#D97724] via-[#C6A779] to-[#F59E0B] transition-all duration-500 ease-out ${
                      activeDiscipline === service.id
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  />

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="editorial-eyebrow text-[#B68A4A]">
                        {service.code}
                      </span>

                      <span className="font-mono text-xs text-white/40">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-10 max-w-xs font-serif text-3xl font-normal leading-[1.05] text-[#F2F0EB] transition-transform duration-500 group-hover:translate-x-1 sm:text-4xl">
                      {service.title}
                    </h3>

                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#A8A59E]">
                      {service.tagline}
                    </p>
                  </div>

                  <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/60 transition-colors group-hover:text-[#B68A4A]">
                      Explore Discipline
                    </span>

                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                        activeDiscipline === service.id
                          ? "border-[#B68A4A] bg-[#B68A4A] text-white"
                          : "border-white/20 text-white group-hover:border-[#B68A4A] group-hover:bg-[#B68A4A] group-hover:text-white"
                      }`}
                    >
                      <ArrowUpRight
                        size={16}
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
        <HairlineRule color="bg-white/15" className="mt-12" />
        <div className="py-8 text-white/70">
          <p className="font-serif text-2xl italic text-[#B8B5AD]">
            One vision. Multiple disciplines. A cohesive result.
          </p>
        </div>
      </div>
    </section>
  );
}
