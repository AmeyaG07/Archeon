
"use client";

import { ArrowUpRight } from "lucide-react";

interface ConsultationCTASectionProps {
  onOpenConsultation?: () => void;
}

export function ConsultationCTASection({
  onOpenConsultation,
}: ConsultationCTASectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#111111] py-28 text-[#F2F0EB] md:py-40">
      {/* Background Detail */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full border border-white/[0.06]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-[370px] w-[370px] rounded-full border border-[#B68A4A]/20"
      />

      <div className="editorial-container relative">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-9">
            <p className="editorial-eyebrow text-[#B68A4A]">
              08 / Begin a Conversation
            </p>

            <h2 className="mt-8 max-w-5xl font-serif text-5xl leading-[1.1] tracking-tight md:text-7xl lg:text-8xl">
              Have a space
              <br />
              in mind?
              <span className="text-[#B68A4A]"> Let&apos;s shape it.</span>
            </h2>

            <p className="mt-9 max-w-xl text-sm leading-8 text-white/55 md:text-base">
              Every meaningful project begins with a conversation.
              Tell us about your ideas, aspirations and the space you
              want to create.
            </p>
          </div>

          <div className="lg:col-span-3 lg:flex lg:justify-end">
            <button
              type="button"
              onClick={onOpenConsultation}
              className="group inline-flex min-h-14 items-center justify-between gap-8 border border-[#B68A4A] px-6 py-4 text-left transition-colors duration-300 hover:bg-[#B68A4A]"
            >
              <span className="text-xs uppercase tracking-[0.16em] text-[#F2F0EB]">
                Discuss Your Project
              </span>

              <ArrowUpRight
                size={19}
                strokeWidth={1.4}
                className="text-[#B68A4A] transition-colors duration-300 group-hover:text-white"
              />
            </button>
          </div>
        </div>

        <div className="mt-24 flex flex-col justify-between gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            ARCHEON DESIGN STUDIO
          </span>

          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            ARCHITECTURE · INTERIORS · SPATIAL DESIGN
          </span>
        </div>
      </div>
    </section>
  );
}
