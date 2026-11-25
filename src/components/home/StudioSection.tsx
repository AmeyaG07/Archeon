"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Compass, Sparkles, Layers, Box, CheckCircle2 } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import {
  RevealText,
  HairlineRule,
  StaggerGrid,
  StaggerItem,
} from "@/components/motion/EditorialMotion";

// Dynamically load WebGL 3D Villa Assembly client-side only (prevents SSR worker OOM)
const VillaLumiereBackground = dynamic(
  () =>
    import("./VillaLumiereBackground").then((mod) => mod.VillaLumiereBackground),
  { ssr: false }
);

export function StudioSection() {
  const [activeTab, setActiveTab] = useState<"philosophy" | "approach" | "principles" | null>(null);
  const [hoveredTab, setHoveredTab] = useState<"philosophy" | "approach" | "principles" | null>(null);

  const timelineTabs = [
    {
      id: "philosophy" as const,
      title: "Philosophy",
    },
    {
      id: "approach" as const,
      title: "Approach",
    },
    {
      id: "principles" as const,
      title: "Principles",
    },
  ];

  return (
    <section
      id="studio"
      className="relative overflow-hidden bg-[#F2F0EB] py-20 sm:py-28 md:py-36 scroll-mt-24 sm:scroll-mt-32"
    >
      {/* 3D Villa Lumière Layer-Responsive Assembly Background */}
      <VillaLumiereBackground activeTab={activeTab} hoveredTab={hoveredTab} />

      <div className="editorial-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* =========================================================================
              LEFT COLUMN: 100% VISIBLE FROSTED ARCHITECTURAL EDITORIAL PANEL
              ========================================================================= */}
          <div className="lg:col-span-6 xl:col-span-5 relative">
            <div
              id="studio-editorial-panel"
              className="rounded-3xl bg-[#F2F0EB]/92 backdrop-blur-xl p-4 xs:p-6 sm:p-9 md:p-11 border border-[#23211E]/10 shadow-[0_24px_50px_-16px_rgba(35,33,30,0.08)] transition-all duration-300"
            >
              
              {/* Main Architectural Statement Headline */}
              <div className="mb-8">
                <RevealText>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[46px] leading-[1.12] tracking-tight text-[#111111]">
                    Design is not just about spaces.
                  </h2>
                </RevealText>
                <RevealText delay={0.08}>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[46px] leading-[1.12] tracking-tight text-[#9F7947] italic mt-1.5">
                    It is about how we experience them.
                  </h2>
                </RevealText>
              </div>

              {/* Architectural Vertical Timeline Tiles: Minimalist & Sleek */}
              <div className="relative mb-7 pl-6 sm:pl-7 max-w-[210px] sm:max-w-[230px]">
                {/* Continuous Timeline Track Line */}
                <div className="absolute left-[9px] sm:left-[11px] top-3 bottom-3 w-[1.5px] bg-gradient-to-b from-[#B68A4A]/70 via-stone-300 to-stone-200/50" />

                <div className="flex flex-col gap-2">
                  {timelineTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isHovered = hoveredTab === tab.id;
                    const isHighlighted = isActive || isHovered;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                        onMouseEnter={() => setHoveredTab(tab.id)}
                        onMouseLeave={() => setHoveredTab(null)}
                        className={`group relative flex items-center w-full px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                          isHighlighted
                            ? "bg-white/95 border-[#B68A4A]/50 shadow-[0_4px_16px_-4px_rgba(182,138,74,0.18)] translate-x-1"
                            : "bg-white/40 hover:bg-white/75 border-stone-300/50 hover:border-stone-400/70 text-stone-600 hover:text-[#111111]"
                        }`}
                      >
                        {/* Timeline Node Dot on the Vertical Line */}
                        <span
                          className={`absolute -left-6 sm:-left-7 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                            isHighlighted
                              ? "w-3 h-3 rounded-full bg-[#B68A4A] ring-4 ring-[#B68A4A]/25 shadow-xs"
                              : "w-2 h-2 rounded-full border border-stone-400 bg-[#F2F0EB] group-hover:border-[#B68A4A]"
                          }`}
                        />

                        {/* Title only - clean typography */}
                        <span
                          className={`font-mono text-[10.5px] sm:text-[11px] tracking-[0.14em] uppercase transition-colors ${
                            isHighlighted
                              ? "font-bold text-[#111111]"
                              : "font-medium text-stone-600 group-hover:text-[#111111]"
                          }`}
                        >
                          {tab.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Content Panel Based on Active / Hovered Tab */}
              <div className="min-h-[170px] relative transition-all duration-300">
                {((hoveredTab || activeTab || "philosophy") === "philosophy") && (
                  <div className="animate-in fade-in duration-300">
                    <p className="font-serif text-lg sm:text-xl leading-relaxed text-[#2D2A26] italic font-normal">
                      &ldquo;{siteConfig.philosophy}&rdquo;
                    </p>
                    
                    {/* Architectural Pillar Badges */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      {["Raw Basalt Strata", "Post-Tensioned Concrete", "Sculpted Natural Light"].map((pill) => (
                        <span
                          key={pill}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-stone-800/10 font-mono text-[9px] tracking-widest uppercase text-stone-700 shadow-xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9F7947]" />
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {((hoveredTab || activeTab) === "approach") && (
                  <div className="animate-in fade-in duration-300">
                    <p className="text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#3C3833] font-light">
                      {siteConfig.about.story}
                    </p>

                    {/* Deliverable Metrics */}
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { label: "Execution", val: "Full Turnkey" },
                        { label: "Scope", val: "4 Disciplines" },
                        { label: "Standard", val: "1:1 Tectonic" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl bg-white/70 p-2.5 border border-stone-800/10 shadow-xs"
                        >
                          <div className="font-mono text-[8.5px] tracking-wider uppercase text-stone-500">
                            {item.label}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] font-semibold text-[#111111]">
                            {item.val}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {((hoveredTab || activeTab) === "principles") && (
                  <div className="animate-in fade-in duration-300 space-y-3">
                    {siteConfig.about.approach.map((principle, index) => (
                      <div
                        key={principle}
                        className="group flex items-start gap-3 rounded-xl bg-white/60 hover:bg-white p-3 border border-stone-800/10 transition-all duration-200 hover:shadow-xs"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#9F7947]/15 text-[#9F7947] font-mono text-[10px] font-bold flex items-center justify-center">
                          0{index + 1}
                        </span>
                        <p className="text-[13.5px] leading-relaxed text-[#222222] group-hover:text-black transition-colors">
                          {principle}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Hairline & Principal Architect Seal */}
              <div className="mt-8 pt-6 border-t border-stone-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-stone-500">
                    Principal Architect
                  </div>
                  <div className="mt-1 font-serif text-xl sm:text-2xl text-[#111111] font-medium">
                    {siteConfig.principal}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono text-[9px] tracking-widest uppercase text-stone-500">
                      Practice Status
                    </div>
                    <div className="font-mono text-[10.5px] font-medium text-[#9F7947] tracking-wider uppercase">
                      Turnkey Architecture
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-[#9F7947]/30 bg-white flex items-center justify-center text-[#9F7947] shadow-xs">
                    <CheckCircle2 size={15} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: PROUD 3D VILLA LUMIÈRE PERSPECTIVE HUD
              ========================================================================= */}
          <div className="lg:col-span-5 xl:col-span-6 relative flex flex-col justify-end self-stretch min-h-[250px] sm:min-h-[320px] lg:min-h-[580px] pointer-events-none">
            {/* Bottom-Right 3D Interactive Orbit Hint */}
            <div className="self-end pb-2 pr-2 pointer-events-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-800/10 bg-white/80 px-3.5 py-1.5 font-mono text-[9px] tracking-widest text-stone-600 uppercase shadow-xs backdrop-blur-sm">
                <Compass size={11} className="text-[#9F7947]" />
                <span>360° ORBITAL TECTONIC STUDY · SCALE 1:50</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
