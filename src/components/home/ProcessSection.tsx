"use client";

import React, { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  RevealText,
  HairlineRule,
} from "@/components/motion/EditorialMotion";

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
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "end 60%"],
  });

  const railScaleY = useTransform(scrollYProgress, [0, 1], [0.05, 1]);

  return (
    <section
      id="process"
      className="relative overflow-hidden bg-[#F2F0EB] pt-8 pb-24 sm:pt-10 sm:pb-32"
    >
      {/* Thematic Background: Sequential Construction Blueprint Conduit & Stage Nodes */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden select-none">
        {/* Soft Shifting Stage Light */}
        <div
          className="absolute top-1/3 -left-32 h-[550px] w-[550px] rounded-full blur-[110px]"
          style={{
            background:
              "radial-gradient(circle, rgba(217, 119, 36, 0.08) 0%, rgba(182, 138, 74, 0.03) 50%, transparent 75%)",
          }}
        />

        {/* Faint Sequential Stage Conduit SVG */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.07]"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Vertical Milestone Axis Lines */}
          <line x1="80" y1="0" x2="80" y2="900" stroke="#B68A4A" strokeWidth="1" strokeDasharray="3 5" />
          <line x1="280" y1="0" x2="280" y2="900" stroke="#777777" strokeWidth="0.6" strokeDasharray="6 8" />
          <line x1="1360" y1="0" x2="1360" y2="900" stroke="#B68A4A" strokeWidth="0.8" strokeDasharray="4 6" />

          {/* Sequential Step Pulse Nodes */}
          <g fill="#D97724">
            <circle cx="80" cy="220" r="4" className="animate-ping" style={{ animationDuration: "3s" }} />
            <circle cx="80" cy="220" r="3" />
            <circle cx="80" cy="420" r="4" className="animate-ping" style={{ animationDuration: "3.5s" }} />
            <circle cx="80" cy="420" r="3" />
            <circle cx="80" cy="620" r="4" className="animate-ping" style={{ animationDuration: "4s" }} />
            <circle cx="80" cy="620" r="3" />
            <circle cx="80" cy="800" r="4" className="animate-ping" style={{ animationDuration: "4.5s" }} />
            <circle cx="80" cy="800" r="3" />
          </g>

          {/* Technical Stage Milestone Stamps */}
          <g fill="#B68A4A" fontFamily="monospace" fontSize="8.5" letterSpacing="2.5">
            <text x="100" y="215">MILESTONE 01 // DISCOVERY & BRIEF</text>
            <text x="100" y="415">MILESTONE 02 // VOLUMETRIC SYNTHESIS</text>
            <text x="100" y="615">MILESTONE 03 // TECTONIC COORDINATION</text>
            <text x="100" y="795">MILESTONE 04 // CRAFTSMANSHIP & REALISATION</text>
          </g>
        </svg>
      </div>

      <div className="editorial-container relative z-10">
        {/* Introduction */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">

            <div className="mt-1">
              <RevealText>
                <h2 className="font-serif text-5xl font-light leading-[0.95] tracking-tight sm:text-7xl">
                  From first thought
                </h2>
              </RevealText>
              <RevealText delay={0.12}>
                <h2 className="font-serif text-5xl font-light leading-[0.95] tracking-tight sm:text-7xl">
                  to <span className="italic">finished space.</span>
                </h2>
              </RevealText>
            </div>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <RevealText delay={0.2}>
              <p className="text-sm leading-8 text-[#777777]">
                A considered sequence of understanding, exploration,
                refinement and realisation. Every stage builds upon
                the decisions made before it.
              </p>
            </RevealText>
          </div>
        </div>

        <HairlineRule color="bg-[#D8D6D0]" className="mt-16 mb-0" />

        {/* Process Timeline with Scroll-Driven Bronze Rail */}
        <div ref={containerRef} className="relative mt-8">
          {/* Vertical Bronze Track & Rail (Desktop) */}
          <div className="absolute left-[2.2rem] top-0 bottom-0 hidden w-0.5 bg-[#D8D6D0] md:block">
            <motion.div
              style={{ scaleY: railScaleY }}
              className="w-full h-full bg-gradient-to-b from-[#D97724] via-[#B68A4A] to-[#F59E0B] origin-top"
            />
          </div>

          {processStages.map((stage, idx) => (
            <motion.article
              key={stage.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: idx * 0.08 }}
              className="group relative grid gap-6 border-b border-[#D8D6D0] py-10 transition-colors duration-300 hover:bg-white/60 sm:py-12 lg:grid-cols-12 lg:gap-8"
            >
              <div className="flex items-center gap-4 lg:col-span-1">
                <span className="font-mono text-xs font-semibold tracking-widest text-[#B68A4A] group-hover:text-[#D97724] transition-colors">
                  {stage.number}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#B68A4A] md:hidden" />
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
                    className="h-fit border border-[#D8D6D0] bg-white/40 px-3 py-2 text-[9px] uppercase tracking-wider text-[#777777] transition-colors group-hover:border-[#B68A4A]/50 group-hover:text-[#111111]"
                  >
                    {detail}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>

        {/* Closing CTA */}
        <div className="mt-14 py-4">
          <p className="max-w-xl font-serif text-2xl italic leading-relaxed text-[#777777]">
            Every meaningful space begins with a meaningful conversation.
          </p>
        </div>
      </div>
    </section>
  );
}
