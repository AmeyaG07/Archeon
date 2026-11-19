"use client";

import React from "react";
import { ArrowUpRight, MapPin, MoveUpRight } from "lucide-react";
import {
  RevealText,
  HairlineRule,
} from "@/components/motion/EditorialMotion";

interface ContactSectionProps {
  onOpenConsultation: () => void;
}

export function ContactSection({
  onOpenConsultation,
}: ContactSectionProps) {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#111111] py-24 text-[#F2F0EB] sm:py-32"
    >
      {/* Ambient Horizon Glow */}
      <div className="pointer-events-none absolute -bottom-32 left-1/2 h-[320px] w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-t from-[#D97724]/20 via-[#B68A4A]/10 to-transparent blur-[80px]" />

      <div className="editorial-container relative z-10">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* Main CTA */}
          <div className="lg:col-span-7">
            <p className="editorial-eyebrow text-[#B68A4A]">
              05 / Start a Conversation
            </p>

            <div className="mt-8 max-w-3xl">
              <RevealText>
                <h2 className="font-serif text-6xl font-light leading-[0.92] tracking-tight sm:text-8xl">
                  Have a space
                </h2>
              </RevealText>
              <RevealText delay={0.12}>
                <h2 className="font-serif text-6xl font-light leading-[0.92] tracking-tight sm:text-8xl">
                  in <span className="italic text-[#D97724]">mind?</span>
                </h2>
              </RevealText>
            </div>

            <RevealText delay={0.22}>
              <p className="mt-8 max-w-lg text-sm leading-8 text-white/60">
                Tell us about your ideas, aspirations and project.
                Let&apos;s begin with a conversation.
              </p>
            </RevealText>

            <div className="mt-10">
              <button
                type="button"
                onClick={onOpenConsultation}
                className="group relative inline-flex min-h-14 items-center gap-8 overflow-hidden bg-[#F2F0EB] px-8 text-[10px] font-medium uppercase tracking-[0.16em] text-[#111111] shadow-[0_0_30px_rgba(217,119,36,0.25)] transition-all duration-300 hover:bg-[#D97724] hover:text-white hover:shadow-[0_0_45px_rgba(217,119,36,0.6)]"
              >
                Request a Consultation
                <ArrowUpRight
                  size={17}
                  className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="border-t border-white/20 pt-10 lg:col-span-4 lg:col-start-9 lg:border-t-0 lg:pt-2">
            <div>
              <p className="editorial-eyebrow text-[#B68A4A]">
                Studio Location
              </p>

              <div className="mt-6 flex items-start gap-4">
                <MapPin
                  size={19}
                  className="mt-1 shrink-0 text-[#B68A4A]"
                />

                <address className="text-sm not-italic leading-8 text-white/75">
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
                className="group mt-7 inline-flex items-center gap-3 border-b border-[#B68A4A]/60 pb-2 text-[10px] uppercase tracking-[0.14em] text-[#C6A779] transition-colors hover:text-white"
              >
                Get Directions
                <MoveUpRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>

            <div className="mt-14">
              <HairlineRule color="bg-white/20" className="mb-8" />
              <p className="editorial-eyebrow text-[#B68A4A]">
                Principal Architect
              </p>

              <p className="mt-4 font-serif text-3xl text-white">
                Ar. Mandar Bhalekar
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
