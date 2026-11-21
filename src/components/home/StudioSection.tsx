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
  const [activeTab, setActiveTab] = useState<"philosophy" | "approach" | "principles">("philosophy");

  return (
    <section
      id="studio"
      className="relative overflow-hidden bg-[#F2F0EB] py-20 sm:py-28 md:py-36 scroll-mt-24 sm:scroll-mt-32"
    >
      {/* 3D Villa Lumière 4-Part Staggered Assembly Background */}
      <VillaLumiereBackground />

      <div className="editorial-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* =========================================================================
              LEFT COLUMN: 100% VISIBLE FROSTED ARCHITECTURAL EDITORIAL PANEL
              ========================================================================= */}
          <div className="lg:col-span-6 xl:col-span-5 relative">
            <div className="rounded-3xl bg-[#F2F0EB]/92 backdrop-blur-xl p-4 xs:p-6 sm:p-9 md:p-11 border border-[#23211E]/10 shadow-[0_24px_50px_-16px_rgba(35,33,30,0.08)] transition-all duration-300">
              
              {/* Top Header Badge & Compass Motion */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="group relative flex h-7 w-7 items-center justify-center rounded-full border border-[#9F7947]/40 bg-white/60 text-[#9F7947] shadow-sm transition-transform duration-500 hover:rotate-180">
                    <Compass size={14} className="animate-[spin_24s_linear_infinite]" />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] tracking-[0.24em] uppercase text-[#777777] font-semibold">
                      01 / The Studio
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#9F7947]" />
                    <span className="font-mono text-[9px] tracking-wider uppercase text-[#9F7947]">
                      Nagpur Studio
                    </span>
                  </div>
                </div>

                {/* Live Tectonic Coordinates */}
                <div className="hidden sm:flex items-center gap-2 font-mono text-[9.5px] tracking-wider text-stone-500 bg-white/70 px-2.5 py-1 rounded-full border border-stone-800/10 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>21.1458° N, 79.0882° E</span>
                </div>
              </div>

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

              {/* Interactive Motion Tab Bar */}
              <div className="mb-7 flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-stone-200/60 border border-stone-300/60">
                <button
                  type="button"
                  onClick={() => setActiveTab("philosophy")}
                  className={`flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg font-mono text-[9.5px] sm:text-[10.5px] tracking-wider uppercase transition-all duration-300 ${
                    activeTab === "philosophy"
                      ? "bg-white text-[#111111] font-semibold shadow-sm"
                      : "text-stone-600 hover:text-[#111111] hover:bg-white/40"
                  }`}
                >
                  <Sparkles size={12} className={activeTab === "philosophy" ? "text-[#9F7947]" : "text-stone-400"} />
                  <span>01 · Philosophy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("approach")}
                  className={`flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg font-mono text-[9.5px] sm:text-[10.5px] tracking-wider uppercase transition-all duration-300 ${
                    activeTab === "approach"
                      ? "bg-white text-[#111111] font-semibold shadow-sm"
                      : "text-stone-600 hover:text-[#111111] hover:bg-white/40"
                  }`}
                >
                  <Layers size={12} className={activeTab === "approach" ? "text-[#9F7947]" : "text-stone-400"} />
                  <span>02 · Approach</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("principles")}
                  className={`flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg font-mono text-[9.5px] sm:text-[10.5px] tracking-wider uppercase transition-all duration-300 ${
                    activeTab === "principles"
                      ? "bg-white text-[#111111] font-semibold shadow-sm"
                      : "text-stone-600 hover:text-[#111111] hover:bg-white/40"
                  }`}
                >
                  <Box size={12} className={activeTab === "principles" ? "text-[#9F7947]" : "text-stone-400"} />
                  <span>03 · Principles</span>
                </button>
              </div>

              {/* Dynamic Content Panel Based on Active Tab */}
              <div className="min-h-[170px] relative transition-all duration-300">
                {activeTab === "philosophy" && (
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

                {activeTab === "approach" && (
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

                {activeTab === "principles" && (
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
          <div className="lg:col-span-5 xl:col-span-6 relative flex flex-col justify-end self-stretch min-h-[380px] lg:min-h-[580px] pointer-events-none">
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
