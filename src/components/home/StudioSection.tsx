"use client";

import React from "react";
import { siteConfig } from "@/config/siteConfig";
import {
  RevealText,
  HairlineRule,
  StaggerGrid,
  StaggerItem,
} from "@/components/motion/EditorialMotion";

export function StudioSection() {
  return (
    <section
      id="studio"
      className="relative overflow-hidden bg-[#F2F0EB] py-24 md:py-36"
    >
      <div className="editorial-container">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-10">

          {/* Section Label */}
          <div className="lg:col-span-3">
            <p className="editorial-eyebrow text-[#777777]">
              01 / The Studio
            </p>

            <HairlineRule
              color="bg-[#B68A4A]"
              className="mt-8 hidden w-16 lg:block"
            />
          </div>

          {/* Main Introduction */}
          <div className="lg:col-span-9">
            <div className="max-w-4xl">
              <RevealText>
                <h2 className="font-serif text-4xl leading-[1.15] tracking-tight text-[#111111] md:text-6xl lg:text-7xl">
                  Design is not just about spaces.
                </h2>
              </RevealText>
              <RevealText delay={0.1}>
                <h2 className="font-serif text-4xl leading-[1.15] tracking-tight text-[#A58A64] md:text-6xl lg:text-7xl">
                  It is about how we experience them.
                </h2>
              </RevealText>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
              <div>
                <p className="editorial-eyebrow text-[#A58A64] mb-4">
                  Our Philosophy
                </p>

                <RevealText delay={0.12}>
                  <p className="text-base leading-8 text-[#44423E] md:text-lg">
                    {siteConfig.philosophy}
                  </p>
                </RevealText>
              </div>

              <div>
                <p className="editorial-eyebrow text-[#A58A64] mb-4">
                  Our Approach
                </p>

                <RevealText delay={0.16}>
                  <p className="text-base leading-8 text-[#44423E] md:text-lg">
                    {siteConfig.about.story}
                  </p>
                </RevealText>
              </div>
            </div>

            {/* Approach Principles */}
            <div className="mt-16">
              <HairlineRule color="bg-[#D8D6D0]" className="mb-8" />
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <p className="editorial-eyebrow text-[#777777]">
                  Design Principles
                </p>

                <span className="font-mono text-[10px] tracking-widest text-[#99958D]">
                  ARCHEON / DS
                </span>
              </div>

              <StaggerGrid
                staggerDelay={0.08}
                className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3"
              >
                {siteConfig.about.approach.map((principle, index) => (
                  <StaggerItem
                    key={`${index}-${principle}`}
                    className="border-t border-[#D8D6D0] py-6 pr-6"
                  >
                    <span className="font-mono text-xs font-semibold text-[#A58A64]">
                      0{index + 1}
                    </span>

                    <p className="mt-4 text-base leading-7 text-[#222222]">
                      {principle}
                    </p>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </div>

            {/* Principal */}
            <div className="mt-16">
              <HairlineRule color="bg-[#D8D6D0]" className="mb-8" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="editorial-eyebrow text-[#777777]">
                    Principal Architect
                  </p>

                  <p className="mt-3 font-serif text-2xl text-[#111111]">
                    {siteConfig.principal}
                  </p>
                </div>

                <p className="font-mono text-[10px] uppercase tracking-widest text-[#777777]">
                  {siteConfig.businessDisplayName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
