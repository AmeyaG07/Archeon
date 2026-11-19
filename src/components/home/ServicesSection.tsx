
"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import type { ServiceItem } from "@/config/siteConfig";

interface ServicesSectionProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
}

export function ServicesSection({
  services,
  onSelectService,
}: ServicesSectionProps) {
  return (
    <section
      id="expertise"
      className="bg-[#F2F0EB] py-24 sm:py-32"
    >
      <div className="editorial-container">

        {/* Section Introduction */}
        <div className="mb-16 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="editorial-eyebrow text-[#B68A4A]">
              02 / Our Expertise
            </p>

            <h2 className="mt-6 max-w-3xl font-serif text-5xl font-light leading-[0.95] tracking-tight text-[#111111] sm:text-7xl">
              A considered approach
              <br />
              to <span className="italic">every space.</span>
            </h2>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <p className="max-w-md text-sm leading-8 text-[#777777]">
              From the first architectural idea to the final
              material detail, our disciplines work together
              to create cohesive spatial environments.
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid border-l border-t border-[#D8D6D0] sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelectService(service)}
              className={`group relative flex min-h-[300px] flex-col justify-between border-b border-r border-[#D8D6D0] p-7 text-left transition-colors duration-500 hover:bg-white sm:p-9 ${
                index === 0 || index === 4
                  ? "lg:col-span-1"
                  : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="editorial-eyebrow text-[#B68A4A]">
                    {service.code}
                  </span>

                  <span className="font-mono text-xs text-[#AAA69D]">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="mt-12 max-w-xs font-serif text-4xl font-normal leading-[1.05] text-[#111111] transition-transform duration-500 group-hover:translate-x-1 sm:text-[2.7rem]">
                  {service.title}
                </h3>

                <p className="mt-5 max-w-sm text-sm leading-7 text-[#777777]">
                  {service.tagline}
                </p>
              </div>

              <div className="mt-12 flex items-center justify-between border-t border-[#D8D6D0] pt-5">
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#55534F] transition-colors group-hover:text-[#B68A4A]">
                  Explore Discipline
                </span>

                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8D6D0] text-[#111111] transition-all duration-300 group-hover:border-[#B68A4A] group-hover:bg-[#B68A4A]">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Closing Statement */}
        <div className="mt-12 flex flex-col gap-4 border-b border-[#D8D6D0] pb-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-2xl italic text-[#777777]">
            One vision. Multiple disciplines. A cohesive result.
          </p>

          <span className="editorial-eyebrow text-[#AAA69D]">
            Architecture / Interiors / Landscape / Execution
          </span>
        </div>
      </div>
    </section>
  );
}
