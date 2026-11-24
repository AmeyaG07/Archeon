"use client";

import React from "react";
import { ArrowUpRight, MapPin, MoveUpRight } from "lucide-react";
import { RevealText } from "@/components/motion/EditorialMotion";
import { ArchitecturalGlobe } from "./ArchitecturalGlobe";

interface ContactSectionProps {
  onOpenConsultation: () => void;
}

export function ContactSection({
  onOpenConsultation,
}: ContactSectionProps) {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#111111] py-20 lg:py-28 text-[#F2F0EB]"
    >
      {/* Background Architectural Grid Lines & Atmospheric Gradient */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden select-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(198,167,121,0.06),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="editorial-container relative z-10">
        <div className="grid gap-12 lg:gap-14 xl:gap-16 lg:grid-cols-12 items-center">
          
          {/* Left Column: Heading, CTA, Studio Location & Principal Architect */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center relative z-20">
            <div className="max-w-2xl">
              <RevealText>
                <h2 className="font-serif text-5xl sm:text-7xl xl:text-8xl font-light leading-[0.92] tracking-tight">
                  Have a space
                </h2>
              </RevealText>
              <RevealText delay={0.12}>
                <h2 className="font-serif text-5xl sm:text-7xl xl:text-8xl font-light leading-[0.92] tracking-tight">
                  in <span className="italic text-[#D97724]">mind?</span>
                </h2>
              </RevealText>
            </div>

            <RevealText delay={0.22}>
              <p className="mt-6 max-w-lg font-['Outfit',sans-serif] text-[13.5px] leading-relaxed text-white/60">
                Tell us about your ideas, aspirations and project.
                Let&apos;s begin with a conversation.
              </p>
            </RevealText>

            <div className="mt-8">
              <button
                type="button"
                onClick={onOpenConsultation}
                className="group relative inline-flex min-h-14 items-center gap-8 overflow-hidden bg-[#F2F0EB] px-8 text-[11px] font-medium uppercase tracking-[0.16em] text-[#111111] shadow-[0_0_30px_rgba(217,119,36,0.25)] transition-all duration-300 hover:bg-[#D97724] hover:text-white hover:shadow-[0_0_45px_rgba(217,119,36,0.6)] cursor-pointer"
              >
                Request a Consultation
                <ArrowUpRight
                  size={17}
                  className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </button>
            </div>

            {/* Architectural Hairline Divider */}
            <div className="my-10 h-[1px] w-full max-w-xl bg-white/10" />

            {/* Studio Location & Principal Architect - Refined 2-Column Subgrid on Left Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-xl">
              {/* Block 1: Studio Location */}
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-3">
                  STUDIO LOCATION
                </p>

                <div className="flex items-start gap-3">
                  <MapPin
                    size={17}
                    className="mt-1 shrink-0 text-[#C6A779]"
                  />

                  <address className="font-['Outfit',sans-serif] text-[13px] not-italic leading-relaxed text-white/70">
                    1st Floor, Krishna-Kunj, 90,
                    <br />
                    Dharempeth Layout,
                    <br />
                    opposite Aaji Aajoba Park,
                    <br />
                    Deendayal Nagar,
                    <br />
                    Nagpur, Maharashtra 440022,
                    <br />
                    India.
                  </address>
                </div>

                <a
                  href="https://maps.app.goo.gl/wLidaC62gQLccoNY8"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    window.open("https://maps.app.goo.gl/wLidaC62gQLccoNY8", "_blank", "noopener,noreferrer");
                  }}
                  className="group mt-4 inline-flex items-center gap-2 border border-[#C6A779]/60 bg-[#C6A779]/10 hover:bg-[#C6A779] hover:text-[#111111] hover:border-[#C6A779] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#E0D8C3] transition-all shadow-sm rounded-xs cursor-pointer z-30 relative font-medium"
                >
                  <span>GET DIRECTIONS</span>
                  <MoveUpRight
                    size={12}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              </div>

              {/* Block 2: Principal Architect */}
              <div className="flex flex-col justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-3">
                    PRINCIPAL ARCHITECT
                  </p>

                  <h3 className="font-serif text-3xl font-light text-white tracking-tight leading-tight">
                    Ar. Mandar Bhalekar
                  </h3>

                  <p className="mt-2 font-['Outfit',sans-serif] text-[12.5px] text-white/60 leading-relaxed">
                    Founder &amp; Principal Architect
                    <br />
                    ArcheOn Design Studio
                  </p>
                </div>

                {/* Studio Geographic Telemetry Stamp */}
                <div className="mt-5 pt-3 border-t border-white/10 font-mono text-[9px] uppercase tracking-wider text-[#C6A779]/75 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97724]" />
                  <span>NAGPUR HQ · 21.1458° N, 79.0882° E</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Refined 3D Architectural Armillary Planetary Globe Showcase */}
          <div className="lg:col-span-5 xl:col-span-5 w-full flex items-center justify-center">
            <ArchitecturalGlobe />
          </div>

        </div>
      </div>
    </section>
  );
}
