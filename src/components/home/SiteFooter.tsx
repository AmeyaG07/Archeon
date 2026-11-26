
"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { siteConfig } from "@/config/siteConfig";
import { useAuth } from "@/providers/AuthProvider";
import {
  DEFAULT_STUDIO_PROFILE,
  StudioProfileData,
  fetchPublicStudioProfile,
  getOfficeMapsHref,
} from "@/lib/studioProfile";
import {
  SwarmCursorArrow,
  AgenticRow,
  AgenticLaunchStreams,
  COLUMN_SWARM_ARROWS,
  BOTTOM_BAR_ARROW,
} from "./FooterAgenticBuild";

const FooterClockEmblem = dynamic(
  () => import("@/components/home/FooterClockEmblem").then((m) => m.FooterClockEmblem),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] w-[260px] rounded-full border border-white/10 bg-white/[0.02] animate-pulse" />
    ),
  }
);

interface SiteFooterProps {
  onOpenClientPortal: () => void;
  onOpenVendorPortal: () => void;
  onOpenConsultation?: () => void;
}

const exploreLinks = [
  { label: "Studio", href: "#studio" },
  { label: "Expertise", href: "#expertise" },
  { label: "Projects", href: "#projects" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

const disciplines = [
  "Architecture",
  "Interior Design",
  "Landscape Architecture",
  "3D Visualisation",
  "Turnkey Execution",
];

const socialLinks = [
  {
    name: "Instagram",
    href: "https://instagram.com/dsarcheon",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com/dsarcheon",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/archeon-design-studio",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

export function SiteFooter({
  onOpenClientPortal,
  onOpenVendorPortal,
  onOpenConsultation,
}: SiteFooterProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const footerRef = useRef<HTMLDivElement>(null);

  // Agentic Build States: 0 = idle/waiting, 1 = launch streams, 2 = wireframe tracing, 3 = detail reveal, 4 = complete
  const [buildStep, setBuildStep] = useState<number>(0);
  const [hasBuilt, setHasBuilt] = useState<boolean>(false);
  const [buildCycle, setBuildCycle] = useState<number>(0);
  const [studioProfile, setStudioProfile] = useState<StudioProfileData>(DEFAULT_STUDIO_PROFILE);

  useEffect(() => {
    fetchPublicStudioProfile().then(setStudioProfile).catch(() => { });
  }, []);

  const isBuildingRef = useRef<boolean>(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const lastReplayTime = useRef<number>(0);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  // Dynamic multi-stage agentic swarm sequence:
  // 1. Launch outward streams (0ms)
  // 2. Multi-directional cursor swarm sweeps across rows revealing content (250ms)
  // 3. Content 100% displayed; cursors dwell at row ends and turn around (2000ms)
  // 4. Cursors fly back across layout and merge into the round clock emblem (2800ms)
  // 5. Complete / idle; all cursors merged, ready for next hover/click (4600ms)
  const startBuildSequence = () => {
    // Step 1: Photons launch outward
    setBuildStep(1);

    // Step 2: Cursors glide across distinct rows
    timersRef.current.push(
      setTimeout(() => {
        setBuildStep(2);
      }, 250)
    );

    // Step 3: Content fully displayed; cursors dwell and turn around
    timersRef.current.push(
      setTimeout(() => {
        setBuildStep(3);
      }, 2000)
    );

    // Step 4: Cursors return back & merge into the round timepiece emblem
    timersRef.current.push(
      setTimeout(() => {
        setBuildStep(4);
      }, 2800)
    );

    // Step 5: Merge completed; settled back into eternal orbit, ready for next hover/click
    timersRef.current.push(
      setTimeout(() => {
        setBuildStep(5);
        isBuildingRef.current = false;
      }, 4600)
    );
  };

  // Clean, deterministic replay function for both click and hover
  const replaySwarmAnimation = () => {
    clearAllTimers();
    // Temporarily unmount any currently active cursors
    setBuildStep(0);
    isBuildingRef.current = true;
    setHasBuilt(true);

    // 35ms reset frame ensures React & Framer Motion cleanly unmount previous cycle and remount at t=0
    const resetTimer = setTimeout(() => {
      setBuildCycle((c) => c + 1);
      startBuildSequence();
    }, 35);
    timersRef.current.push(resetTimer);
  };

  // Hover trigger for the clock element:
  // Replays animation smoothly whenever the mouse hovers over the clock
  const handleEmblemHover = () => {
    const now = Date.now();
    // Allow replay on hover (debounced by 350ms so slight tremor doesn't spam, but hovering always replays)
    if (now - lastReplayTime.current > 350) {
      lastReplayTime.current = now;
      replaySwarmAnimation();
    }
  };

  // Click trigger: always immediately forces a replay
  const handleClockClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    lastReplayTime.current = Date.now();
    replaySwarmAnimation();
  };

  // Automatic Trigger on Initial Scroll into Viewport
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasBuilt) {
          replaySwarmAnimation();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearAllTimers();
    };
  }, [hasBuilt]);

  const handleClientPortalClick = () => {
    router.push("/client");
  };

  const handleVendorPortalClick = () => {
    router.push("/vendor");
  };

  const scrollToSection = (href: string) => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.push("/" + href);
      return;
    }
    if (href.startsWith("#")) {
      const target = document.querySelector(href) as HTMLElement | null;
      if (target) {
        const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 75);
        window.scrollTo({ top, behavior: "smooth" });
        if (typeof (window as any).lenis?.scrollTo === "function") {
          try {
            (window as any).lenis.scrollTo(top);
          } catch { }
        }
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (typeof (window as any).lenis?.scrollTo === "function") {
      try {
        (window as any).lenis.scrollTo(0);
      } catch { }
    }
  };

  return (
    <footer
      ref={footerRef}
      className="relative overflow-hidden bg-[#000000] text-[#F2F0EB] border-t border-white/10"
    >
      {/* Dynamic Agentic Launch Streams connecting Emblem to Columns & Return Suction */}
      <AgenticLaunchStreams
        step={buildStep}
        isMerging={buildStep === 4}
        cycleKey={buildCycle}
      />

      <div className="editorial-container relative z-10 pt-10 lg:pt-12 pb-6 lg:pb-8">

        {/* Main Section: Left (Clock Animation) & Right (4 Columns) */}
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-14 items-start">

          {/* Left Side: Clock Animation Logo & Interactive Replay / Hover Trigger */}
          <div className="w-full lg:w-[260px] shrink-0 flex flex-col items-center lg:items-start">
            <div
              role="button"
              tabIndex={0}
              onClick={handleClockClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClockClick();
                }
              }}
              onMouseEnter={handleEmblemHover}
              aria-label="Click or hover to replay architectural agentic build"
              className="inline-block transition-transform duration-300 hover:scale-[1.03] cursor-pointer text-left group outline-none focus:outline-none focus-visible:outline-none ring-0 border-0"
              style={{ outline: "none", border: "none", boxShadow: "none" }}
              title="Hover or click timepiece emblem to replay agentic build animation"
            >
              <FooterClockEmblem
                isBuilding={buildStep >= 1 && buildStep < 5}
                isMerging={buildStep === 4}
                onClick={handleClockClick}
                onHover={handleEmblemHover}
              />
            </div>
          </div>

          {/* Right Side: 4-Column Content with Multi-Arrow Swarm & Row Reveals */}
          <div className="flex-1 min-w-0 w-full lg:border-l lg:border-white/15 lg:pl-10 xl:pl-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-6 xl:gap-8">

              {/* Column 1: EXPLORE (3 Arrows in 3 Rows: Top, Bottom-Left, Below) */}
              <div className="relative flex flex-col">
                {COLUMN_SWARM_ARROWS.explore.map((arrow) => (
                  <SwarmCursorArrow
                    key={arrow.id}
                    arrow={arrow}
                    isActive={buildStep >= 1 && buildStep < 5}
                    cycleKey={buildCycle}
                  />
                ))}

                {/* Row 1: Header + Studio */}
                <AgenticRow
                  delay={0.5}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <p
                    className="font-mono uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-5"
                    style={{ fontSize: "13px", letterSpacing: "0.22em" }}
                  >
                    EXPLORE
                  </p>

                  <a
                    href={exploreLinks[0].href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(exploreLinks[0].href);
                    }}
                    className="block text-left font-outfit text-white/70 hover:text-white transition-colors duration-200 cursor-pointer mb-3"
                    style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                  >
                    {exploreLinks[0].label}
                  </a>
                </AgenticRow>

                {/* Row 2: Expertise + Projects */}
                <AgenticRow
                  delay={0.9}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <div className="flex flex-col gap-3 mb-3">
                    <a
                      href={exploreLinks[1].href}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(exploreLinks[1].href);
                      }}
                      className="text-left font-outfit text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      {exploreLinks[1].label}
                    </a>
                    <a
                      href={exploreLinks[2].href}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(exploreLinks[2].href);
                      }}
                      className="text-left font-outfit text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      {exploreLinks[2].label}
                    </a>
                  </div>
                </AgenticRow>

                {/* Row 3: Process + Contact */}
                <AgenticRow
                  delay={1.3}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <div className="flex flex-col gap-3">
                    <a
                      href={exploreLinks[3].href}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(exploreLinks[3].href);
                      }}
                      className="text-left font-outfit text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      {exploreLinks[3].label}
                    </a>
                    <a
                      href={exploreLinks[4].href}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(exploreLinks[4].href);
                      }}
                      className="text-left font-outfit text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      {exploreLinks[4].label}
                    </a>
                  </div>
                </AgenticRow>
              </div>

              {/* Column 2: DISCIPLINES (3 Arrows in 3 Rows: High-Above, Mid-Left, Down-Below) */}
              <div className="relative flex flex-col">
                {COLUMN_SWARM_ARROWS.disciplines.map((arrow) => (
                  <SwarmCursorArrow
                    key={arrow.id}
                    arrow={arrow}
                    isActive={buildStep >= 1 && buildStep < 5}
                    cycleKey={buildCycle}
                  />
                ))}

                {/* Row 1: Header + Architecture */}
                <AgenticRow
                  delay={0.6}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <p
                    className="font-mono uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-5"
                    style={{ fontSize: "13px", letterSpacing: "0.22em" }}
                  >
                    DISCIPLINES
                  </p>

                  <button
                    type="button"
                    onClick={() => scrollToSection("#expertise")}
                    className="block text-left font-outfit text-white/70 hover:text-white transition-colors duration-200 cursor-pointer mb-3"
                    style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                  >
                    {disciplines[0]}
                  </button>
                </AgenticRow>

                {/* Row 2: Interior Design + Landscape Architecture */}
                <AgenticRow
                  delay={1.0}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <div className="flex flex-col gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => scrollToSection("#expertise")}
                      className="text-left font-outfit text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      {disciplines[1]}
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection("#expertise")}
                      className="text-left font-outfit text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      {disciplines[2]}
                    </button>
                  </div>
                </AgenticRow>

                {/* Row 3: 3D Visualisation + Turnkey Execution */}
                <AgenticRow
                  delay={1.4}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => scrollToSection("#expertise")}
                      className="text-left font-outfit text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      {disciplines[3]}
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection("#expertise")}
                      className="text-left font-outfit text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      {disciplines[4]}
                    </button>
                  </div>
                </AgenticRow>
              </div>

              {/* Column 3: PRIVATE ACCESS (2 Arrows: Top-Right & Down-Below) */}
              <div className="relative flex flex-col col-span-2 sm:col-span-1">
                {COLUMN_SWARM_ARROWS.portals.map((arrow) => (
                  <SwarmCursorArrow
                    key={arrow.id}
                    arrow={arrow}
                    isActive={buildStep >= 1 && buildStep < 5}
                    cycleKey={buildCycle}
                  />
                ))}

                {/* Row 1: Header + Client Portal Card */}
                <AgenticRow
                  delay={0.8}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <p
                    className="font-mono uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-5"
                    style={{ fontSize: "13px", letterSpacing: "0.22em" }}
                  >
                    PRIVATE ACCESS
                  </p>

                  <Link
                    href="/client"
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 hover:border-white/30 text-white/90 hover:text-white transition-all group shadow-sm cursor-pointer mb-3"
                  >
                    <span
                      className="font-outfit"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      Client Portal
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="text-white/60 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </AgenticRow>

                {/* Row 2: Vendor Portal Card */}
                <AgenticRow
                  delay={1.2}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <Link
                    href="/vendor"
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 hover:border-white/30 text-white/90 hover:text-white transition-all group shadow-sm cursor-pointer"
                  >
                    <span
                      className="font-outfit"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      Vendor Portal
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="text-white/60 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </AgenticRow>
              </div>

              {/* Column 4: STUDIO INQUIRIES & FOLLOW US (3 Arrows: Top, Mid-Right, Down-Below) */}
              <div className="relative flex flex-col col-span-2 sm:col-span-1">
                {COLUMN_SWARM_ARROWS.inquiries.map((arrow) => (
                  <SwarmCursorArrow
                    key={arrow.id}
                    arrow={arrow}
                    isActive={buildStep >= 1 && buildStep < 5}
                    cycleKey={buildCycle}
                  />
                ))}

                {/* Row 1: Header + Email & Phone */}
                <AgenticRow
                  delay={0.7}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <p
                    className="font-mono uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-5"
                    style={{ fontSize: "13px", letterSpacing: "0.22em" }}
                  >
                    STUDIO INQUIRIES
                  </p>

                  <div className="flex flex-col gap-2 font-outfit text-white/70 mb-3">
                    <a
                      href={`mailto:${studioProfile.email}`}
                      className="hover:text-white transition-colors truncate"
                      title={studioProfile.email}
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      {studioProfile.email}
                    </a>
                    <a
                      href={`tel:${studioProfile.phone.replace(/\s+/g, "")}`}
                      className="hover:text-white transition-colors tracking-wide"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif', fontWeight: 400 }}
                    >
                      {studioProfile.phone}
                    </a>
                    {studioProfile.offices.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-[#C6A779]/85">
                        {studioProfile.offices.map((office, idx) => (
                          <React.Fragment key={office.id}>
                            <a
                              href={getOfficeMapsHref(office)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={office.address}
                              className="hover:text-white transition-colors"
                            >
                              {office.label}
                            </a>
                            {idx < studioProfile.offices.length - 1 && (
                              <span className="text-white/25">·</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </AgenticRow>

                {/* Row 2: Schedule a Consultation Button */}
                <AgenticRow
                  delay={1.1}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <div className="mb-5">
                    <button
                      type="button"
                      onClick={onOpenConsultation || (() => scrollToSection("#contact"))}
                      className="inline-flex items-center gap-1.5 font-outfit font-medium text-[#C6A779] hover:text-[#E0D8C3] transition-colors cursor-pointer group"
                      style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: 'var(--font-outfit), "Outfit", sans-serif' }}
                    >
                      <span>Schedule a Consultation</span>
                      <ArrowUpRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </button>
                  </div>
                </AgenticRow>

                {/* Row 3: Follow Us & Logos */}
                <AgenticRow
                  delay={1.5}
                  isRevealed={hasBuilt || buildStep >= 2}
                  cycleKey={buildCycle}
                >
                  <div className="pt-4 border-t border-white/10">
                    <p
                      className="font-mono uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-3"
                      style={{ fontSize: "13px", letterSpacing: "0.22em" }}
                    >
                      FOLLOW US
                    </p>

                    <div className="flex items-center gap-2">
                      {socialLinks.map((s) => (
                        <a
                          key={s.name}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.name}
                          title={s.name}
                          className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-white/10 hover:border-[#C6A779]/60 text-white/70 hover:text-[#C6A779] flex items-center justify-center transition-all shadow-sm group"
                        >
                          <span className="transition-transform duration-200 group-hover:scale-110">
                            {s.icon}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </AgenticRow>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar with Horizontal Swarm Beam */}
        <div className="relative mt-8 lg:mt-10 border-t border-white/10 pt-5">
          <SwarmCursorArrow
            arrow={BOTTOM_BAR_ARROW}
            isActive={buildStep >= 1 && buildStep < 5}
            cycleKey={buildCycle}
          />
          {buildStep >= 2 && (
            <motion.div
              key={`bar_${buildCycle}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[#F59E0B] via-[#06B6D4] to-[#C6A779] origin-left shadow-[0_0_8px_#06B6D4]"
            />
          )}
          <AgenticRow
            delay={1.2}
            isRevealed={hasBuilt || buildStep >= 2}
            cycleKey={buildCycle}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-white/40 tracking-wider">
              <p>
                © 2026 ARCHEON DESIGN STUDIO   |{" "}
                <a
                  href="https://vigilantforensic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#C5A36D] transition-colors"
                >
                  WEBSITE POWERED BY VIGILANT FORENSICS RESEARCH AND ANALYTICS
                </a>
              </p>
              <p className="text-center sm:text-left text-[9.5px]">
                All Rights Reserved. Architecture · Interior · Landscape · Turnkey.
              </p>


            </div>
          </AgenticRow>
        </div>
      </div>
    </footer>
  );
}
