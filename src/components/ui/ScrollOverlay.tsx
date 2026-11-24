"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { siteConfig, ServiceItem, PortfolioProject } from "@/config/siteConfig";
import { useAudio } from "@/providers/AudioProvider";
import { ArrowDown, ChevronRight, ExternalLink, Compass, CheckCircle2, Shield, Phone, Mail, MessageSquare, Layers, MapPin, Navigation, GitCommit, FileText, Clock, Sparkles, Hammer } from "lucide-react";

interface ScrollOverlayProps {
  onScrollProgress: (progress: number) => void;
  onSelectService: (service: ServiceItem) => void;
  onSelectProject: (project: PortfolioProject) => void;
  onOpenConsultation: (serviceId?: string) => void;
}

export function ScrollOverlay({
  onScrollProgress,
  onSelectService,
  onSelectProject,
  onOpenConsultation
}: ScrollOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSfx } = useAudio();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        onScrollProgress(self.progress);
      }
    });

    return () => {
      trigger.kill();
    };
  }, [onScrollProgress]);

  return (
    <div ref={containerRef} className="relative z-10 w-full pointer-events-none">
      {/* SECTION 0: HERO (Architectural Subterranean Cave) */}
      <section className="h-screen min-h-[700px] flex flex-col justify-between px-6 md:px-14 py-24 select-none">
        <div />
        <div className="max-w-2xl pointer-events-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] tracking-wider mb-4 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>ARCHITECTURAL & TURNKEY PRACTICE</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-bold tracking-tight text-white font-mono uppercase mb-4 leading-none">
            {siteConfig.name} <span className="text-amber-500 font-light">/ DS</span>
          </h1>

          <p className="text-stone-300 font-sans text-base sm:text-xl font-light leading-relaxed mb-6 max-w-xl">
            {siteConfig.philosophy}
          </p>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-stone-400">
            <span className="text-white font-semibold">{siteConfig.principal}</span>
            <span>•</span>
            <span className="text-amber-400/90">{siteConfig.registrationNote}</span>
            <span>•</span>
            <span className="text-stone-500">{siteConfig.handle}</span>
          </div>
        </div>

        {/* Scroll Prompt & Interactive Hint */}
        <div className="pointer-events-auto flex items-center justify-between text-xs font-mono text-stone-400">
          <div className="flex items-center space-x-2 animate-bounce">
            <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Scroll down through spatial disciplines</span>
          </div>
          <span className="hidden sm:inline-block text-stone-500 font-mono">
            [ 3D MONOLITHIC CAVE VIEWPORT ]
          </span>
        </div>
      </section>

      {/* SECTION 1: SERVICE 01 - ARCHITECTURE */}
      <section className="h-screen min-h-[700px] flex items-center justify-start px-6 md:px-16">
        <div className="pointer-events-auto max-w-md p-6 sm:p-8 rounded-2xl border border-stone-800 bg-[#161412]/85 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono tracking-widest text-amber-500 font-bold">
              {siteConfig.services[0].code}
            </span>
            <span className="text-xs font-mono text-stone-400">DISCIPLINE 01</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono mb-2">
            {siteConfig.services[0].title}
          </h2>
          <p className="text-stone-300 font-sans text-sm font-light leading-relaxed mb-5">
            {siteConfig.services[0].tagline}
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                playSfx("click-project");
                onSelectService(siteConfig.services[0]);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-mono text-amber-200 transition-all shadow-sm"
            >
              <span>Explore Scope</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <span className="text-[11px] font-mono text-stone-500">
              Or click 3D monolith
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: SERVICE 02 - INTERIOR DESIGN */}
      <section className="h-screen min-h-[700px] flex items-center justify-end px-6 md:px-16">
        <div className="pointer-events-auto max-w-md p-6 sm:p-8 rounded-2xl border border-stone-800 bg-[#161412]/85 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono tracking-widest text-orange-400 font-bold">
              {siteConfig.services[1].code}
            </span>
            <span className="text-xs font-mono text-stone-400">DISCIPLINE 02</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono mb-2">
            {siteConfig.services[1].title}
          </h2>
          <p className="text-stone-300 font-sans text-sm font-light leading-relaxed mb-5">
            {siteConfig.services[1].tagline}
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                playSfx("click-project");
                onSelectService(siteConfig.services[1]);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-xs font-mono text-orange-200 transition-all shadow-sm"
            >
              <span>Explore Scope</span>
              <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
            </button>
            <span className="text-[11px] font-mono text-stone-500">
              Or click 3D monolith
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3: SERVICE 03 - LANDSCAPE ARCHITECTURE */}
      <section className="h-screen min-h-[700px] flex items-center justify-start px-6 md:px-16">
        <div className="pointer-events-auto max-w-md p-6 sm:p-8 rounded-2xl border border-stone-800 bg-[#161412]/85 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono tracking-widest text-emerald-400 font-bold">
              {siteConfig.services[2].code}
            </span>
            <span className="text-xs font-mono text-stone-400">DISCIPLINE 03</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono mb-2">
            {siteConfig.services[2].title}
          </h2>
          <p className="text-stone-300 font-sans text-sm font-light leading-relaxed mb-5">
            {siteConfig.services[2].tagline}
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                playSfx("click-project");
                onSelectService(siteConfig.services[2]);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono text-emerald-200 transition-all shadow-sm"
            >
              <span>Explore Scope</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <span className="text-[11px] font-mono text-stone-500">
              Or click 3D monolith
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 4: SERVICE 04 - 3D VISUALISATION */}
      <section className="h-screen min-h-[700px] flex items-center justify-end px-6 md:px-16">
        <div className="pointer-events-auto max-w-md p-6 sm:p-8 rounded-2xl border border-stone-800 bg-[#161412]/85 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono tracking-widest text-sky-400 font-bold">
              {siteConfig.services[3].code}
            </span>
            <span className="text-xs font-mono text-stone-400">DISCIPLINE 04</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono mb-2">
            {siteConfig.services[3].title}
          </h2>
          <p className="text-stone-300 font-sans text-sm font-light leading-relaxed mb-5">
            {siteConfig.services[3].tagline}
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                playSfx("click-project");
                onSelectService(siteConfig.services[3]);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-xs font-mono text-sky-200 transition-all shadow-sm"
            >
              <span>Explore Scope</span>
              <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
            </button>
            <span className="text-[11px] font-mono text-stone-500">
              Or click 3D monolith
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 5: SERVICE 05 - TURNKEY EXECUTION */}
      <section className="h-screen min-h-[700px] flex items-center justify-start px-6 md:px-16">
        <div className="pointer-events-auto max-w-md p-6 sm:p-8 rounded-2xl border border-stone-800 bg-[#161412]/85 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono tracking-widest text-purple-400 font-bold">
              {siteConfig.services[4].code}
            </span>
            <span className="text-xs font-mono text-stone-400">DISCIPLINE 05</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono mb-2">
            {siteConfig.services[4].title}
          </h2>
          <p className="text-stone-300 font-sans text-sm font-light leading-relaxed mb-5">
            {siteConfig.services[4].tagline}
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                playSfx("click-project");
                onSelectService(siteConfig.services[4]);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-mono text-purple-200 transition-all shadow-sm"
            >
              <span>Explore Scope</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
            </button>
            <span className="text-[11px] font-mono text-stone-500">
              Or click 3D monolith
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 6: CURATED PORTFOLIO SHOWCASE */}
      <section className="min-h-screen py-24 px-6 md:px-16">
        <div className="pointer-events-auto max-w-5xl mx-auto">
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-500 mb-2">
            <Compass className="w-4 h-4" />
            <span className="uppercase tracking-widest font-bold">SELECTED ARCHITECTURAL WORKS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white font-mono mb-4">
            Built Portfolio & Case Studies
          </h2>
          <p className="text-stone-400 font-sans text-sm sm:text-base font-light mb-10 max-w-xl">
            Each project is an individual response to natural geology, climate, and structural discipline.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {siteConfig.projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  playSfx("click-project");
                  onSelectProject(proj);
                }}
                className="group cursor-pointer p-6 rounded-2xl border border-stone-800 bg-[#161412]/80 hover:bg-[#1f1c19] transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-stone-500 mb-2">
                    <span>{proj.code}</span>
                    <span className="text-amber-400">{proj.year}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-mono mb-2 group-hover:text-amber-400 transition-colors">
                    {proj.title}
                  </h3>
                  <div className="text-xs text-stone-400 font-sans mb-3">
                    {proj.location} • {proj.area}
                  </div>
                  <p className="text-xs text-stone-300 font-sans font-light line-clamp-3 mb-4">
                    {proj.heroSummary}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono text-amber-500">
                  <span>View Case Study</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: HOW WE WORK // ARCHITECTURAL DELIVERY PROCESS (PDF Section 3.1 & 3.3) */}
      <section className="min-h-screen py-24 px-6 md:px-16 border-t border-stone-800/80">
        <div className="pointer-events-auto max-w-5xl mx-auto">
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-500 mb-2">
            <GitCommit className="w-4 h-4" />
            <span className="uppercase tracking-widest font-bold">SECTION 3.1 & 3.3 // HOW WE WORK</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white font-mono mb-4">
            The Architectural Methodology
          </h2>
          <p className="text-stone-400 font-sans text-sm sm:text-base font-light mb-12 max-w-2xl leading-relaxed">
            From geological site exploration to single-window turnkey handover, our structured 6-stage lifecycle guarantees design purity, transparent accounting, and uncompromising craftsmanship.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Discovery & Brief Definition",
                tagline: "Site Analysis & Spatial Philosophy",
                description: "Topographical surveys, climate and solar azimuth mapping, client lifestyle zoning, and budget band validation.",
                outputs: ["Site Climate Study", "Zoning Diagrams", "Design Brief Document"],
                highlight: "Free consultation intake with DPDP privacy safeguards"
              },
              {
                step: "02",
                title: "Schematic Concept & 3D Massing",
                tagline: "Volume, Light & Cavity Sculpting",
                description: "Translating terrain into volumetric stone forms. Subterranean courtyards, cantilevered planes, and spatial flow studies.",
                outputs: ["Volumetric Massing", "Preliminary Floorplans", "3D Mood & Light Studies"],
                highlight: "Real-time 3D walkthrough previews for client approval"
              },
              {
                step: "03",
                title: "Design Development & Engineering",
                tagline: "Multi-Disciplinary Synchronization",
                description: "BIM integration with structural, MEP, acoustic, and landscape consultants. Detailed material schedules and joinery details.",
                outputs: ["Structural Coordinated BIM", "MEP Schematics", "Material Moodboards"],
                highlight: "Synchronized with Allied Consultants Tier 1"
              },
              {
                step: "04",
                title: "Statutory Approvals & GFC Drawings",
                tagline: "Precision Working Documentation",
                description: "Good-For-Construction (GFC) drawings, municipal statutory submission packs, structural calculations, and BOQ estimates.",
                outputs: ["GFC Drawing Packs", "Detailed BOQ / Tender", "Statutory Dossier"],
                highlight: "Milestone-controlled drawing releases via Client Portal"
              },
              {
                step: "05",
                title: "Turnkey Execution & Supervision",
                tagline: "Single-Window On-Site Craftsmanship",
                description: "On-site quality supervision, material provenance tracking (quarry basalt, honed travertine), contractor coordination, and progress billing.",
                outputs: ["Weekly Site Reports", "Quality Check Logs", "Progress Milestone Invoices"],
                highlight: "Dual-tier Maker-Checker approval on all vendor bills"
              },
              {
                step: "06",
                title: "Handover, Snags & Aftercare",
                tagline: "Archival Documentation & Settled Records",
                description: "Defect liability review, as-built drawing archives, operations manuals, two-party cash ledger closures, and post-occupancy care.",
                outputs: ["As-Built Dossier", "Snag Rectification Signoff", "Reconciled Statements"],
                highlight: "Permanent auditable ledger and digital handover pack"
              }
            ].map((stage, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-stone-800 bg-[#151311]/90 backdrop-blur-xl hover:border-amber-500/50 transition-all flex flex-col justify-between group space-y-4 font-mono text-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold font-mono text-amber-500/80 group-hover:text-amber-400 transition-colors">
                      {stage.step}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 font-mono">
                      STAGE {stage.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white font-mono mb-1">
                    {stage.title}
                  </h3>
                  <div className="text-amber-400/90 text-[11px] mb-3 font-medium">
                    {stage.tagline}
                  </div>
                  <p className="text-stone-300 font-sans text-xs font-light leading-relaxed mb-4">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-800/80 space-y-2">
                  <div className="text-[10px] uppercase text-stone-500 font-mono">Key Deliverables:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {stage.outputs.map((out, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[10px] text-stone-300">
                        {out}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-emerald-400/90 font-mono pt-1">
                    ✓ {stage.highlight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: ALLIED ORGANISATIONS & ENGINEERING DIRECTORY (PDF Section 12.1) */}
      <section className="min-h-screen py-24 px-6 md:px-16 border-t border-stone-800/80">
        <div className="pointer-events-auto max-w-5xl mx-auto">
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 mb-2">
            <Layers className="w-4 h-4" />
            <span className="uppercase tracking-widest font-bold">SECTION 12.1 // ALLIED CONSULTANTS & ENGINEERING DIRECTORY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white font-mono mb-4">
            Integrated Allied Disciplines
          </h2>
          <p className="text-stone-400 font-sans text-sm sm:text-base font-light mb-10 max-w-2xl leading-relaxed">
            ArcheOn acts as the single-window architectural lead, synchronizing specialized engineering disciplines under unified BIM coordinates and strict Maker-Checker financial protocols.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                code: "DISC_ENG_01",
                discipline: "Structural Engineering & Seismic Analysis",
                partner: "Apex Structural Engineers",
                scope: "Post-tensioned concrete cantilevers, rock-anchored foundations, and basalt slab calculations.",
                status: "OFFICIAL ALLIED PARTNER • TIER 1"
              },
              {
                code: "DISC_ENG_02",
                discipline: "MEP, HVAC & Building Physics",
                partner: "Terra MEP Solutions",
                scope: "Concealed geothermal cooling channels, rainwater harvesting plumbing, and zero-loss electrical grids.",
                status: "OFFICIAL ALLIED PARTNER • TIER 1"
              },
              {
                code: "DISC_ENG_03",
                discipline: "Architectural & Circadian Lighting",
                partner: "Lumina Circadian Systems",
                scope: "Custom bronze cove fixtures, dark-sky compliant landscape optics, and automated solar track controls.",
                status: "OFFICIAL ALLIED PARTNER • TIER 1"
              },
              {
                code: "DISC_ENG_04",
                discipline: "Acoustic Engineering & Spatial Sound",
                partner: "Sonics Architectural Acoustics",
                scope: "Subterranean resonance dampening, perforated travertine acoustic panels, and water acoustic reflection.",
                status: "OFFICIAL ALLIED PARTNER • TIER 1"
              },
              {
                code: "DISC_ENG_05",
                discipline: "Geotechnical & Soil Mechanics",
                partner: "Apex Geotechnical Surveyors",
                scope: "Core borehole drilling, seismic slope stability analysis, and basalt rock load testing.",
                status: "OFFICIAL ALLIED PARTNER • TIER 1"
              },
              {
                code: "DISC_ENG_06",
                discipline: "Landscape Ecology & Native Botany",
                partner: "BioTerrain Ecosystems",
                scope: "Endemic Western Ghats flora mapping, drought-tolerant micro-climates, and bio-retention swales.",
                status: "OFFICIAL ALLIED PARTNER • TIER 1"
              }
            ].map((collab, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-stone-800 bg-[#161412]/80 backdrop-blur-xl hover:border-amber-500/40 transition-all space-y-2.5 font-mono text-xs"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-amber-500 font-bold">{collab.code}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                    {collab.status}
                  </span>
                </div>
                <div className="text-sm font-bold text-white font-mono">{collab.discipline}</div>
                <div className="text-stone-300 font-semibold text-xs">{collab.partner}</div>
                <p className="text-stone-400 font-sans text-xs font-light leading-relaxed">
                  {collab.scope}
                </p>
                <div className="pt-2 border-t border-stone-800/80 text-[10px] text-stone-500 flex items-center justify-between">
                  <span>Coordination: Single-Window ArcheOn BIM</span>
                  <span className="text-emerald-400">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="min-h-screen flex flex-col justify-between px-6 md:px-16 py-24">
        <div className="pointer-events-auto max-w-3xl">
          <div className="text-xs font-mono text-amber-500 tracking-widest mb-3 uppercase">
            {"/// Studio Philosophy"}
          </div>
          <blockquote className="text-2xl sm:text-4xl font-medium text-white font-mono leading-relaxed mb-6">
            &ldquo;{siteConfig.missionStatement}&rdquo;
          </blockquote>
          <p className="text-stone-400 font-sans text-sm sm:text-base font-light leading-relaxed mb-8">
            {siteConfig.about.story}
          </p>
          <button
            onClick={() => {
              playSfx("manifesto");
              onOpenConsultation();
            }}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-mono text-xs font-bold tracking-wider transition-all shadow-[0_0_25px_rgba(245,158,11,0.35)]"
          >
            <span>Initiate Project Consultation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pointer-events-auto my-12 p-6 sm:p-8 rounded-2xl border border-stone-800 bg-[#141210]/90 backdrop-blur-xl max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-amber-500 font-bold uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>STUDIO LOCATION // NAGPUR HEADQUARTERS</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-mono">
                {siteConfig.businessDisplayName}
              </h3>
              <p className="text-stone-300 font-sans text-xs sm:text-sm font-light leading-relaxed">
                {siteConfig.contact.office}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={siteConfig.contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold transition-all shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>View on Google Maps</span>
                </a>
                <a
                  href={siteConfig.contact.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-stone-400" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-stone-800/80 bg-stone-900/60 font-mono text-xs space-y-3">
              <div className="text-stone-400 uppercase text-[10px] tracking-wider font-bold">
                {"/// Principal Architect & Practice Lead"}
              </div>
              <div className="text-base font-bold text-white">
                {siteConfig.principal}
              </div>
              <div className="text-stone-400 font-sans text-xs">
                Multidisciplinary spatial planning across Residential, Commercial, Landscape, and Turnkey Engineering.
              </div>
              <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-500">
                Operating Hours: {siteConfig.contact.hours}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar with Official Logo */}
        <footer className="pointer-events-auto border-t border-stone-800 pt-8 mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-mono text-xs text-stone-400">
          <div className="flex items-center space-x-4">
            <Image
              src="/brand-assets/logo.png"
              alt="MB's ArcheOn Design Studio"
              width={140}
              height={40}
              className="h-9 w-auto object-contain brightness-105"
            />
            <div className="border-l border-stone-800 pl-4 space-y-0.5">
              <div className="text-white font-bold tracking-wider">
                {siteConfig.name}
              </div>
              <div className="text-[11px] text-stone-500">
                {siteConfig.copyright} — {siteConfig.rights}
              </div>
              <div className="text-[10px] text-stone-600">
                {siteConfig.legalEntityNote}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs font-mono">
            <a
              href={siteConfig.contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center space-x-1"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Nagpur Studio</span>
            </a>
            <span className="text-stone-600 hidden sm:inline">•</span>
            <span className="text-stone-300">{siteConfig.contact.email}</span>
            <span className="text-stone-600 hidden sm:inline">•</span>
            <span className="text-amber-500">{siteConfig.handle}</span>
          </div>
        </footer>
      </section>
    </div>
  );
}
