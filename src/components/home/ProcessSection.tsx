
"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

const processStages = [
  {
    number: "01",
    title: "Discovery",
    subtitle: "Understanding the brief",
    description:
      "We begin by understanding your aspirations, site conditions, functional requirements and project priorities.",
    details: ["Client consultation", "Site understanding", "Project brief"],
  },
  {
    number: "02",
    title: "Concept",
    subtitle: "Developing the vision",
    description:
      "Ideas take shape through spatial exploration, design direction, material thinking and conceptual development.",
    details: ["Design direction", "Spatial planning", "Concept development"],
  },
  {
    number: "03",
    title: "Development",
    subtitle: "Refining every detail",
    description:
      "The selected direction is developed through drawings, visualisation, material decisions and technical coordination.",
    details: ["Design development", "Technical drawings", "Consultant coordination"],
  },
  {
    number: "04",
    title: "Execution",
    subtitle: "Bringing design to life",
    description:
      "Where included in the agreed scope, design intent is carried into execution through coordination, quality reviews and project handover.",
    details: ["Site coordination", "Quality reviews", "Project handover"],
  },
];

interface ProcessSectionProps {
  onOpenConsultation: () => void;
}

export function ProcessSection({
  onOpenConsultation,
}: ProcessSectionProps) {
  return (
    <section
      id="process"
      className="bg-[#F2F0EB] py-24 sm:py-32"
    >
      <div className="editorial-container">
        {/* Introduction */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="editorial-eyebrow text-[#B68A4A]">
              04 / How We Work
            </p>

            <h2 className="mt-6 font-serif text-5xl font-light leading-[0.95] tracking-tight sm:text-7xl">
              From first thought
              <br />
              to <span className="italic">finished space.</span>
            </h2>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <p className="text-sm leading-8 text-[#777777]">
              A considered sequence of understanding, exploration,
              refinement and realisation. Every stage builds upon
              the decisions made before it.
            </p>
          </div>
        </div>

        {/* Process Timeline */}
        <div className="mt-20 border-t border-[#D8D6D0]">
          {processStages.map((stage) => (
            <article
              key={stage.number}
              className="group grid gap-6 border-b border-[#D8D6D0] py-10 transition-colors duration-300 hover:bg-white/50 sm:py-12 lg:grid-cols-12 lg:gap-8"
            >
              <div className="lg:col-span-1">
                <span className="font-mono text-xs tracking-widest text-[#B68A4A]">
                  {stage.number}
                </span>
              </div>

              <div className="lg:col-span-4">
                <p className="editorial-eyebrow text-[#AAA69D]">
                  {stage.subtitle}
                </p>

                <h3 className="mt-3 font-serif text-4xl font-normal text-[#111111] transition-transform duration-300 group-hover:translate-x-1 sm:text-5xl">
                  {stage.title}
                </h3>
              </div>

              <div className="lg:col-span-4">
                <p className="max-w-lg text-sm leading-8 text-[#777777]">
                  {stage.description}
                </p>
              </div>

              <div className="flex flex-wrap content-start gap-2 lg:col-span-3 lg:justify-end">
                {stage.details.map((detail) => (
                  <span
                    key={detail}
                    className="h-fit border border-[#D8D6D0] px-3 py-2 text-[9px] uppercase tracking-wider text-[#777777]"
                  >
                    {detail}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Closing CTA */}
        <div className="mt-14 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl font-serif text-2xl italic leading-relaxed text-[#777777]">
            Every meaningful space begins with a meaningful conversation.
          </p>

          <button
            type="button"
            onClick={onOpenConsultation}
            className="group inline-flex min-h-14 shrink-0 items-center justify-center gap-5 bg-[#111111] px-7 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-[#B68A4A] hover:text-[#111111]"
          >
            Begin Your Project
            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
