
"use client";

import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import type { ServiceItem } from "@/config/siteConfig";

interface ServiceDetailViewProps {
  service: ServiceItem;
  onBack?: () => void;
  onEnquire?: (service: ServiceItem) => void;
}

export function ServiceDetailView({
  service,
  onBack,
  onEnquire,
}: ServiceDetailViewProps) {
  return (
    <main className="min-h-screen bg-[#F2F0EB] text-[#111111]">
      {/* Top Navigation */}
      <div className="editorial-container pt-10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#77736C] transition-colors hover:text-[#A58A64]"
        >
          <ArrowLeft size={15} strokeWidth={1.4} />
          Back to Services
        </button>
      </div>

      {/* Service Introduction */}
      <section className="editorial-container pb-20 pt-20 md:pb-32 md:pt-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <p className="editorial-eyebrow text-[#A58A64]">
              {service.code} / Our Expertise
            </p>

            <h1 className="mt-8 max-w-4xl font-serif text-5xl leading-[1.1] tracking-tight md:text-7xl">
              {service.title}
            </h1>

            <p className="mt-8 max-w-2xl font-serif text-2xl leading-relaxed text-[#77736C] md:text-3xl">
              {service.tagline}
            </p>
          </div>

          <div className="flex flex-col justify-end lg:col-span-4">
            <p className="text-sm leading-8 text-[#66635D]">
              Explore the scope, design considerations and deliverables
              associated with this service.
            </p>

            <button
              type="button"
              onClick={() => onEnquire?.(service)}
              className="mt-8 inline-flex min-h-14 items-center justify-between gap-8 border border-[#A58A64] px-6 py-4 text-left transition-colors hover:bg-[#A58A64] hover:text-white"
            >
              <span className="text-xs uppercase tracking-widest">
                Discuss This Service
              </span>
              <ArrowUpRight size={18} strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </section>

      {/* Scope and Deliverables */}
      <section className="border-t border-[#D8D6D0] bg-white py-20 md:py-28">
        <div className="editorial-container">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-20">
            {/* Scope */}
            <div>
              <p className="editorial-eyebrow text-[#A58A64]">
                01 / Scope of Work
              </p>

              <h2 className="mt-6 font-serif text-3xl md:text-4xl">
                What we consider
              </h2>

              <div className="mt-10 border-t border-[#D8D6D0]">
                {service.scope.map((item, index) => (
                  <div
                    key={`${index}-${item}`}
                    className="flex gap-5 border-b border-[#D8D6D0] py-6"
                  >
                    <span className="font-mono text-xs text-[#A58A64]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <p className="text-sm leading-7 text-[#44413B]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <p className="editorial-eyebrow text-[#A58A64]">
                02 / Deliverables
              </p>

              <h2 className="mt-6 font-serif text-3xl md:text-4xl">
                What the service includes
              </h2>

              <div className="mt-10 border-t border-[#D8D6D0]">
                {service.deliverables.map((item, index) => (
                  <div
                    key={`${index}-${item}`}
                    className="flex items-start gap-4 border-b border-[#D8D6D0] py-6"
                  >
                    <Check
                      size={17}
                      strokeWidth={1.5}
                      className="mt-1 shrink-0 text-[#A58A64]"
                    />

                    <p className="text-sm leading-7 text-[#44413B]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-[#111111] py-20 text-[#F2F0EB] md:py-28">
        <div className="editorial-container">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div>
              <p className="editorial-eyebrow text-[#B68A4A]">
                Continue the Conversation
              </p>

              <h2 className="mt-6 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
                Let&apos;s discuss your
                <br />
                next project.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onEnquire?.(service)}
              className="inline-flex min-h-14 items-center justify-between gap-8 border border-[#B68A4A] px-6 py-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#B68A4A]"
            >
              Enquire Now
              <ArrowUpRight size={18} strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
