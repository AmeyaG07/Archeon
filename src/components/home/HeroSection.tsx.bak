
"use client";

import React from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";

interface HeroSectionProps {
  onOpenConsultation: () => void;
}

export function HeroSection({
  onOpenConsultation,
}: HeroSectionProps) {
  const exploreProjects = () => {
    document.getElementById("projects")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <section
      id="home"
      className="relative flex min-h-[760px] h-screen max-h-[1100px] w-full items-end overflow-hidden bg-[#191916] text-white"
    >
      {/* Architectural placeholder artwork.
          Replace this composition with approved studio photography later. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#39372F] via-[#25251F] to-[#111111]" />

        {/* Architectural planes */}
        <div className="absolute -right-[8%] top-[10%] h-[95%] w-[68%] -skew-x-[12deg] border-l border-white/10 bg-gradient-to-br from-[#888071]/20 via-[#4D4B43]/20 to-transparent shadow-2xl" />

        <div className="absolute right-[12%] top-[18%] h-[75%] w-[30%] -skew-x-[12deg] border-l border-white/20 bg-gradient-to-b from-[#B9AE98]/30 via-[#716B5C]/10 to-transparent" />

        <div className="absolute bottom-0 right-[8%] h-[43%] w-[52%] -skew-x-[12deg] border-t border-white/20 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Natural light */}
        <div className="absolute -right-[10%] top-0 h-[70%] w-[60%] bg-[radial-gradient(ellipse_at_center,rgba(201,177,135,0.22),transparent_65%)]" />

        {/* Foreground shadows */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-[#111111]/20" />
      </div>

      {/* Hero Content */}
      <div className="editorial-container relative z-10 pb-24 pt-36 sm:pb-28 lg:pb-32">
        <div className="max-w-4xl">
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-10 bg-[#B68A4A]" />
            <p className="editorial-eyebrow text-[#D0AD75]">
              Architecture · Interior · Landscape
            </p>
          </div>

          <h1 className="max-w-4xl font-serif text-[clamp(3.5rem,8.5vw,8rem)] font-light leading-[0.88] tracking-[-0.045em] text-[#F2F0EB]">
            Spaces shaped
            <br />
            by <span className="italic text-[#C6A779]">intention.</span>
          </h1>

          <p className="mt-8 max-w-xl text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
            Thoughtful architecture, considered interiors and
            meaningful landscapes — designed with clarity,
            material integrity and purpose.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onOpenConsultation}
              className="group inline-flex min-h-14 items-center justify-center gap-5 bg-[#F2F0EB] px-7 text-[10px] font-medium uppercase tracking-[0.16em] text-[#111111] transition-colors duration-300 hover:bg-[#B68A4A]"
            >
              Discuss Your Project
              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </button>

            <button
              type="button"
              onClick={exploreProjects}
              className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:border-[#B68A4A] hover:text-[#D0AD75]"
            >
              Explore Projects
            </button>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="mt-20 flex flex-col gap-6 border-t border-white/20 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="editorial-eyebrow text-white/40">
              Independent Design Practice
            </p>
            <p className="mt-2 text-xs tracking-wide text-white/75">
              Led by Ar. Mandar Bhalekar
            </p>
          </div>

          <div className="flex items-center justify-between gap-10 sm:justify-end">
            <p className="editorial-eyebrow text-white/40">
              Nagpur · Maharashtra · India
            </p>

            <button
              type="button"
              onClick={exploreProjects}
              aria-label="Scroll to projects"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:border-[#B68A4A] hover:text-[#D0AD75]"
            >
              <ArrowDown size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Placeholder identification */}
      <span className="absolute right-6 top-28 z-10 hidden font-mono text-[9px] uppercase tracking-widest text-white/30 md:block">
        Architectural visual · Temporary placeholder
      </span>
    </section>
  );
}
