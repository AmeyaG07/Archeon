
"use client";

import React from "react";
import { ArrowUpRight, MapPin, MoveUpRight } from "lucide-react";

interface ContactSectionProps {
  onOpenConsultation: () => void;
}

export function ContactSection({
  onOpenConsultation,
}: ContactSectionProps) {
  return (
    <section
      id="contact"
      className="bg-[#111111] py-24 text-[#F2F0EB] sm:py-32"
    >
      <div className="editorial-container">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* Main CTA */}
          <div className="lg:col-span-7">
            <p className="editorial-eyebrow text-[#B68A4A]">
              05 / Start a Conversation
            </p>

            <h2 className="mt-8 max-w-3xl font-serif text-6xl font-light leading-[0.92] tracking-tight sm:text-8xl">
              Have a space
              <br />
              in <span className="italic text-[#C6A779]">mind?</span>
            </h2>

            <p className="mt-8 max-w-lg text-sm leading-8 text-white/60">
              Tell us about your ideas, aspirations and project.
              Let&apos;s begin with a conversation.
            </p>

            <button
              type="button"
              onClick={onOpenConsultation}
              className="group mt-10 inline-flex min-h-14 items-center gap-8 bg-[#F2F0EB] px-7 text-[10px] font-medium uppercase tracking-[0.15em] text-[#111111] transition-colors duration-300 hover:bg-[#B68A4A]"
            >
              Request a Consultation
              <ArrowUpRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </button>
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

            <div className="mt-14 border-t border-white/20 pt-8">
              <p className="editorial-eyebrow text-[#B68A4A]">
                Principal Architect
              </p>

              <p className="mt-4 font-serif text-3xl text-white">
                Ar. Mandar Bhalekar
              </p>

              <p className="mt-2 text-xs text-white/45">
                ArcheOn Design Studio
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
