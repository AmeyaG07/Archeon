import React from "react";
import { Container, SectionHeading, Button } from "@/components/shared";
import { colors, typography, spacing, layout } from "@/config/design-tokens";
import { ArrowRight, Download, Sparkles, Compass } from "lucide-react";

export default function DesignSystemPage() {
  const paletteSwatches = [
    { name: "Obsidian", hex: colors.obsidian, role: "Primary dark / high-contrast typography", textDark: false },
    { name: "Dark Surface", hex: colors.darkSurface, role: "Cards & elevated dark elements", textDark: false },
    { name: "Architectural Ivory", hex: colors.ivory, role: "Primary public website background", textDark: true },
    { name: "White", hex: colors.white, role: "Clean elevated surfaces", textDark: true },
    { name: "Concrete Grey", hex: colors.concreteGrey, role: "Secondary metadata & subtitles", textDark: false },
    { name: "Dark Border", hex: colors.darkBorder, role: "Rule lines on obsidian surfaces", textDark: false },
    { name: "Light Border", hex: colors.lightBorder, role: "Rule lines on ivory surfaces", textDark: true },
    { name: "Muted Bronze", hex: colors.bronze, role: "Restrained luxury accents", textDark: false },
  ];

  return (
    <main className="min-h-screen bg-[#F2F0EB] text-[#111111] py-16 sm:py-24">
      <Container size="content" className="space-y-20">
        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-10">
          <SectionHeading
            eyebrow="ArcheOn Design System // Foundation"
            title="Editorial Architectural Identity"
            description="Ivory-led luxury minimalism, restrained bronze accents, and editorial typography. Verified design tokens and shared primitives for Batch 01."
            level={1}
          />
        </header>

        {/* 1. Approved Color Palette */}
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Design Tokens // Palette"
            title="Approved Chromatic System"
            description="High-contrast architectural materials: obsidian stone, raw basalt, ivory plaster, and muted cast bronze."
            level={2}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {paletteSwatches.map((s) => (
              <div
                key={s.name}
                className="p-4 rounded-sm border border-[#D8D6D0] bg-[#FFFFFF] shadow-xs flex flex-col justify-between space-y-4"
              >
                <div
                  className="h-20 w-full rounded-sm border border-black/10 flex items-end p-2.5"
                  style={{ backgroundColor: s.hex }}
                >
                  <span
                    className={`font-mono text-[11px] font-semibold tracking-wider ${
                      s.textDark ? "text-[#111111]" : "text-[#FFFFFF]"
                    }`}
                  >
                    {s.hex}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#111111]">{s.name}</h3>
                  <p className="font-sans text-xs text-[#777777] leading-relaxed mt-1">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Editorial Typography */}
        <section className="space-y-8 border-t border-[#D8D6D0] pt-16">
          <SectionHeading
            eyebrow="Design Tokens // Typography"
            title="Editorial Hierarchies"
            description="Cormorant Garamond for architectural headlines, Inter for functional reading, and IBM Plex Mono for technical precision."
            level={2}
          />

          <div className="p-8 rounded-sm bg-[#FFFFFF] border border-[#D8D6D0] space-y-8">
            <div className="space-y-2 border-b border-[#D8D6D0] pb-6">
              <span className="font-mono text-xs uppercase text-[#B68A4A]">Display Hero // Cormorant Garamond Light</span>
              <div className="font-serif text-4xl sm:text-6xl font-light text-[#111111] leading-tight">
                Sculpting spaces from raw earth, monolithic stone, and controlled light.
              </div>
            </div>

            <div className="space-y-2 border-b border-[#D8D6D0] pb-6">
              <span className="font-mono text-xs uppercase text-[#B68A4A]">Body & Interface // Inter Light</span>
              <p className="font-sans text-base sm:text-lg text-[#111111] font-light leading-relaxed max-w-3xl">
                ArcheOn Design Studio, founded by Ar. Mandar Bhalekar, is a multidisciplinary practice operating at the convergence of architectural innovation, interior styling, landscape ecology, and end-to-end turnkey delivery.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs uppercase text-[#B68A4A]">Restrained Metadata // IBM Plex Mono Regular</span>
              <div className="font-mono text-xs text-[#777777] tracking-wider space-x-3">
                <span>PRJ_ARCH_2026_01</span>
                <span>•</span>
                <span>KHANDALA, MAHARASHTRA</span>
                <span>•</span>
                <span>NET-ZERO THERMAL MASS</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Shared Buttons */}
        <section className="space-y-8 border-t border-[#D8D6D0] pt-16">
          <SectionHeading
            eyebrow="Shared Components // Button"
            title="Interactive Controls"
            description="Semantic buttons and links with accessible focus rings, loading states, and consistent editorial design tokens."
            level={2}
          />

          <div className="p-8 rounded-sm bg-[#FFFFFF] border border-[#D8D6D0] space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                Primary Obsidian
              </Button>
              <Button variant="bronze" icon={<Sparkles className="w-4 h-4" />}>
                Bronze Accent
              </Button>
              <Button variant="secondary">
                Secondary Ivory
              </Button>
              <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                Outline
              </Button>
              <Button variant="ghost">
                Ghost Action
              </Button>
              <Button variant="primary" isLoading>
                Loading State
              </Button>
            </div>

            <div className="pt-4 border-t border-[#D8D6D0] flex flex-wrap items-center gap-4">
              <span className="font-mono text-xs text-[#777777] uppercase mr-2">Sizes:</span>
              <Button size="sm" variant="secondary">Small</Button>
              <Button size="md" variant="secondary">Medium</Button>
              <Button size="lg" variant="secondary">Large</Button>
            </div>
          </div>
        </section>

        {/* 4. Section Heading in Dark Theme Mode */}
        <section className="space-y-8 border-t border-[#D8D6D0] pt-16">
          <div className="p-8 sm:p-12 rounded-sm bg-[#111111] text-[#F2F0EB]">
            <SectionHeading
              theme="dark"
              eyebrow="Dark Theme Variant // Obsidian"
              title="Monolithic Subterranean Sanctuary"
              description="Demonstrating SectionHeading component adaptability when placed against dark basalt surfaces or the upcoming footer."
              level={2}
            />
            <div className="mt-8 flex items-center space-x-4">
              <Button variant="bronze" icon={<Compass className="w-4 h-4" />}>
                Explore Discipline
              </Button>
              <Button variant="outline" className="border-[#343434] text-[#F2F0EB] hover:bg-white hover:text-black">
                Review Case Study
              </Button>
            </div>
          </div>
        </section>

        {/* Back Link */}
        <footer className="pt-8 border-t border-[#D8D6D0] flex items-center justify-between text-xs font-mono text-[#777777]">
          <span>ArcheOn Design System — Batch 01 Complete</span>
          <Button href="/" variant="ghost" size="sm">
            ← Return to Existing Homepage
          </Button>
        </footer>
      </Container>
    </main>
  );
}
