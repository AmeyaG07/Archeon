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
      {/* Thematic Background: Planetary Rotation & Nagpur Studio Radar Geographic Scan */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden select-none">
        {/* Full-Bleed Global Earth Rotating Video Layer */}
        <div className="absolute right-[-10%] sm:right-[5%] top-1/2 -translate-y-1/2 w-[650px] sm:w-[850px] lg:w-[1050px] h-[650px] sm:h-[850px] lg:h-[1050px] overflow-hidden rounded-full pointer-events-none opacity-30 mix-blend-screen">
          <video
            className="w-full h-full object-cover object-center brightness-110 contrast-125"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source
              src="https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4"
              type="video/mp4"
            />
            <source
              src="https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4"
              type="video/mp4"
            />
          </video>
          {/* Radial Feather Vignette around the Earth Sphere */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,#111111_78%)]" />
        </div>

        {/* Full-Bleed Ambient Colorful Shade & Atmospheric Aura */}
        {/* 1. Primary Full-Section Amber / Terracotta Ambient Wash */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 70% 40%, rgba(200, 98, 30, 0.3) 0%, rgba(217, 119, 36, 0.18) 40%, rgba(184, 137, 74, 0.08) 65%, transparent 85%)",
          }}
        />

        {/* 2. Left-Side Editorial Heading Warm Underglow */}
        <div
          className="absolute top-1/4 -left-20 h-[550px] w-[650px] rounded-full blur-[140px] opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(200, 98, 30, 0.35) 0%, rgba(217, 119, 36, 0.15) 55%, transparent 80%)",
          }}
        />

        {/* 3. Breathing Amber / Terracotta Horizon Glow Spreading Downwards */}
        <div className="absolute -bottom-20 left-0 right-0 h-[480px] bg-gradient-to-t from-[#C8621E]/28 via-[#D97724]/14 to-transparent blur-[90px] animate-[pulse_7s_ease-in-out_infinite]" />

        {/* 4. Top-Right Ambient Beacon */}
        <div
          className="absolute -top-32 right-10 h-[600px] w-[600px] rounded-full blur-[120px] opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(200, 98, 30, 0.28) 0%, rgba(184, 137, 74, 0.12) 50%, transparent 75%)",
          }}
        />

        {/* Nagpur Geographic Coordinates Radar Scan SVG */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.09]"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Concentric Radar Rings from Nagpur Studio Hub */}
          <g transform="translate(1080, 420)">
            <circle cx="0" cy="0" r="380" stroke="#B8894A" strokeWidth="0.8" strokeDasharray="4 8" />
            <circle cx="0" cy="0" r="280" stroke="#C8621E" strokeWidth="0.8" strokeDasharray="3 6" />
            <circle cx="0" cy="0" r="180" stroke="#B8894A" strokeWidth="1" strokeDasharray="2 4" />
            <circle cx="0" cy="0" r="90" stroke="#C8621E" strokeWidth="1" />
            <circle cx="0" cy="0" r="6" fill="#C8621E" className="animate-ping" style={{ animationDuration: "3s" }} />
            <circle cx="0" cy="0" r="4" fill="#F59E0B" />

            {/* Rotating Radar Sweep Line */}
            <g className="animate-[spin_18s_linear_infinite]">
              <line x1="0" y1="0" x2="380" y2="0" stroke="#D97724" strokeWidth="1.2" strokeOpacity="0.8" />
            </g>
          </g>

          {/* Coordinate Crosshairs & Latitude / Longitude Grids */}
          <line x1="0" y1="420" x2="1440" y2="420" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="6 6" strokeOpacity="0.3" />
          <line x1="1080" y1="0" x2="1080" y2="900" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="6 6" strokeOpacity="0.3" />

          {/* Telemetry Coordinate Stamps */}
          <g fill="#D97724" fontFamily="monospace" fontSize="9" letterSpacing="2.5">
            <text x="1095" y="405">RADAR CENTER // 21.1458° N, 79.0882° E</text>
            <text x="1095" y="440">SANCTUARY BEACON // NAGPUR HUB</text>
            <text x="60" y="412">LATITUDE PARALLEL // 21.1458° N</text>
          </g>
        </svg>
      </div>

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
