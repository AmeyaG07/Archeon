"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SwarmArrowDef {
  id: string;
  color: string;
  // Outward Sweep (reveals row)
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  // Return & Merge into Round Emblem (clock center)
  returnMidX: number;
  returnMidY: number;
  returnX: number;
  returnY: number;
  // Timing
  delay: number;
  duration: number;
}

// Multi-directional swarm arrows:
// Slower speeds, diverse start origins (top, down below, side),
// sweeping across distinct rows, dwelling at row ends while content displays,
// then turning around and returning back into the round clock emblem!
export const COLUMN_SWARM_ARROWS: Record<string, SwarmArrowDef[]> = {
  explore: [
    {
      id: "exp_1",
      color: "#F59E0B", // Amber
      startX: -70,
      startY: 10, // from left
      midX: 40,
      midY: 20,
      endX: 120,
      endY: 45, // Row 1: Header + Studio
      returnMidX: -60,
      returnMidY: 65,
      returnX: -180, // Clock dial center
      returnY: 120,
      delay: 0.2,
      duration: 4.8,
    },
    {
      id: "exp_2",
      color: "#FBBF24", // Gold
      startX: -50,
      startY: 180, // from down/bottom-left
      midX: 30,
      midY: 105,
      endX: 110,
      endY: 90, // Row 2: Expertise + Projects
      returnMidX: -70,
      returnMidY: 105,
      returnX: -180,
      returnY: 120,
      delay: 0.45,
      duration: 4.8,
    },
    {
      id: "exp_3",
      color: "#FB923C", // Warm Amber-Orange
      startX: 40,
      startY: 230, // from down below
      midX: 60,
      midY: 165,
      endX: 110,
      endY: 155, // Row 3: Process + Contact
      returnMidX: -60,
      returnMidY: 140,
      returnX: -180,
      returnY: 120,
      delay: 0.7,
      duration: 4.8,
    },
  ],
  disciplines: [
    {
      id: "disc_1",
      color: "#06B6D4", // Cyan
      startX: 50,
      startY: -45, // from high above
      midX: 30,
      midY: 20,
      endX: 130,
      endY: 45, // Row 1: Header + Architecture
      returnMidX: -180,
      returnMidY: 60,
      returnX: -420, // Clock dial center
      returnY: 120,
      delay: 0.3,
      duration: 4.9,
    },
    {
      id: "disc_2",
      color: "#38BDF8", // Sky Blue
      startX: -60,
      startY: 85, // from side
      midX: 45,
      midY: 95,
      endX: 130,
      endY: 105, // Row 2: Interior Design + Landscape
      returnMidX: -190,
      returnMidY: 110,
      returnX: -420,
      returnY: 120,
      delay: 0.55,
      duration: 4.9,
    },
    {
      id: "disc_3",
      color: "#14B8A6", // Teal
      startX: 20,
      startY: 240, // from down below
      midX: 50,
      midY: 175,
      endX: 125,
      endY: 165, // Row 3: 3D Visualisation + Turnkey
      returnMidX: -180,
      returnMidY: 150,
      returnX: -420,
      returnY: 120,
      delay: 0.8,
      duration: 4.9,
    },
  ],
  portals: [
    {
      id: "port_1",
      color: "#EC4899", // Magenta
      startX: 85,
      startY: -30, // from top-right
      midX: 45,
      midY: 45,
      endX: 155,
      endY: 65, // Row 1: Header + Client Portal
      returnMidX: -300,
      returnMidY: 80,
      returnX: -660, // Clock dial center
      returnY: 120,
      delay: 0.4,
      duration: 5.0,
    },
    {
      id: "port_2",
      color: "#A855F7", // Purple
      startX: -40,
      startY: 190, // from down below
      midX: 35,
      midY: 125,
      endX: 155,
      endY: 120, // Row 2: Vendor Portal
      returnMidX: -300,
      returnMidY: 120,
      returnX: -660,
      returnY: 120,
      delay: 0.7,
      duration: 5.0,
    },
  ],
  inquiries: [
    {
      id: "inq_1",
      color: "#10B981", // Emerald
      startX: -30,
      startY: -25, // from top
      midX: 40,
      midY: 30,
      endX: 140,
      endY: 55, // Row 1: Header + Email & Phone
      returnMidX: -420,
      returnMidY: 70,
      returnX: -900, // Clock dial center
      returnY: 120,
      delay: 0.35,
      duration: 5.1,
    },
    {
      id: "inq_2",
      color: "#C6A779", // Warm Gold
      startX: 110,
      startY: 95, // from right side
      midX: 45,
      midY: 105,
      endX: 135,
      endY: 115, // Row 2: Schedule a Consultation
      returnMidX: -420,
      returnMidY: 115,
      returnX: -900,
      returnY: 120,
      delay: 0.65,
      duration: 5.1,
    },
    {
      id: "inq_3",
      color: "#F43F5E", // Rose
      startX: 30,
      startY: 230, // from down below
      midX: 35,
      midY: 195,
      endX: 95,
      endY: 195, // Row 3: Follow Us & Social Icons
      returnMidX: -420,
      returnMidY: 160,
      returnX: -900,
      returnY: 120,
      delay: 0.9,
      duration: 5.1,
    },
  ],
};

export const BOTTOM_BAR_ARROW: SwarmArrowDef = {
  id: "btm_beam",
  color: "#FFFFFF",
  startX: -30,
  startY: 0,
  midX: 450,
  midY: 0,
  endX: 1080,
  endY: 0,
  returnMidX: 420,
  returnMidY: -160,
  returnX: -30,
  returnY: -280,
  delay: 0.6,
  duration: 5.0,
};

// =========================================================================
// AGENTIC BUILDER CURSOR ARROW
// Slower, majestic kinematics: sweeps outward -> unveils content ->
// dwells at row end -> banks & returns back -> merges into round emblem
// =========================================================================

export function SwarmCursorArrow({
  arrow,
  isActive,
  cycleKey = 0,
}: {
  arrow: SwarmArrowDef;
  isActive: boolean;
  cycleKey?: number;
}) {
  // Keyframe timeline breakdown:
  // 0% -> 28%: Launch & accelerate from origin to midpoint
  // 28% -> 48%: Glides over row, revealing the content text cleanly
  // 48% -> 58%: Dwells at row end while content illuminates; turns around toward clock
  // 58% -> 84%: Curving return flight back toward the round clock emblem
  // 84% -> 100%: Collapses into the clock dial center with photon dispersion merge!
  const times = [0, 0.28, 0.48, 0.58, 0.84, 1.0];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key={`${arrow.id}_${cycleKey}`}
          initial={{
            opacity: 0,
            x: arrow.startX,
            y: arrow.startY,
            scale: 0.65,
            rotate: -35,
          }}
          animate={{
            opacity: [0, 1, 1, 1, 0.9, 0],
            x: [
              arrow.startX,
              arrow.midX,
              arrow.endX,
              arrow.endX,
              arrow.returnMidX,
              arrow.returnX,
            ],
            y: [
              arrow.startY,
              arrow.midY,
              arrow.endY,
              arrow.endY,
              arrow.returnMidY,
              arrow.returnY,
            ],
            scale: [0.65, 1.15, 1.0, 1.05, 0.8, 0.0],
            rotate: [-35, -22, -10, 175, 185, 195],
          }}
          transition={{
            duration: arrow.duration,
            delay: arrow.delay,
            times: times,
            ease: [0.25, 1, 0.35, 1],
          }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          className="absolute pointer-events-none z-30"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="relative">
            {/* Autonomous Cursor Arrow Icon */}
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill={arrow.color}
              className="drop-shadow-[0_0_8px_currentColor]"
              style={{ color: arrow.color }}
            >
              <path d="M3 3l7 18 3-7 7-3L3 3z" />
            </svg>

            {/* Luminous Pulsing Photon Core at Arrow Tip */}
            <span
              className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: arrow.color,
                boxShadow: `0 0 10px 2.5px ${arrow.color}`,
              }}
            />

            {/* Glowing return stream trail */}
            <span
              className="absolute top-1 left-1 w-4 h-0.5 rounded-full -rotate-45 pointer-events-none opacity-60"
              style={{
                background: `linear-gradient(to right, ${arrow.color}, transparent)`,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =========================================================================
// AGENTIC ROW REVEAL WRAPPER (Wipes text row into view as arrow sweeps)
// =========================================================================

interface AgenticRowProps {
  delay: number;
  isRevealed: boolean;
  children: React.ReactNode;
  className?: string;
  cycleKey?: number;
}

export function AgenticRow({
  delay,
  isRevealed,
  children,
  className = "",
  cycleKey = 0,
}: AgenticRowProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: isRevealed ? 1 : 0.04,
        x: isRevealed ? 0 : -8,
        filter: isRevealed ? "blur(0px)" : "blur(2.5px)",
      }}
      transition={{
        duration: 0.65,
        delay: delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`relative ${className}`}
    >
      {/* Light streak sweep when revealing or replaying */}
      {isRevealed && (
        <motion.span
          key={`streak_${cycleKey}`}
          initial={{ scaleX: 0, opacity: 0.9 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.7, delay: delay, ease: "easeOut" }}
          className="absolute -left-1 -right-1 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none origin-left"
        />
      )}
      {children}
    </motion.div>
  );
}

// =========================================================================
// LAUNCH STREAM OVERLAY
// 1. Outward energetic streams from Clock Dial to Columns during launch
// 2. Converging suction/absorption arcs pulling cursors back during merge
// =========================================================================

export function AgenticLaunchStreams({
  step,
  isMerging = false,
  cycleKey = 0,
}: {
  step: number;
  isMerging?: boolean;
  cycleKey?: number;
}) {
  const isLaunching = step === 1 || step === 2;
  const showReturnArcs = isMerging || step === 4;

  if (!isLaunching && !showReturnArcs) return null;

  return (
    <div
      key={`launch_streams_${cycleKey}`}
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="stream-glow-3" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* OUTWARD LAUNCH STREAMS */}
        {isLaunching && (
          <>
            {/* Stream to Explore (Amber) */}
            <motion.path
              d="M 130 110 C 200 50, 260 70, 360 80"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.2"
              strokeDasharray="6 6"
              filter="url(#stream-glow-3)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />

            {/* Stream to Disciplines (Cyan) */}
            <motion.path
              d="M 130 130 C 220 90, 380 75, 560 80"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2.2"
              strokeDasharray="6 6"
              filter="url(#stream-glow-3)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 1.25, delay: 0.1, ease: "easeOut" }}
            />

            {/* Stream to Portals (Magenta) */}
            <motion.path
              d="M 130 150 C 260 130, 520 95, 780 80"
              fill="none"
              stroke="#EC4899"
              strokeWidth="2.2"
              strokeDasharray="6 6"
              filter="url(#stream-glow-3)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 1.4, delay: 0.18, ease: "easeOut" }}
            />

            {/* Stream to Inquiries (Emerald) */}
            <motion.path
              d="M 130 170 C 300 170, 680 110, 980 80"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.2"
              strokeDasharray="6 6"
              filter="url(#stream-glow-3)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 1.5, delay: 0.25, ease: "easeOut" }}
            />
          </>
        )}

        {/* RETURN & MERGE CONVERGENCE GUIDE BEAMS (Back into clock dial) */}
        {showReturnArcs && (
          <>
            {/* Return from Explore */}
            <motion.path
              d="M 360 90 C 260 80, 200 100, 130 130"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.8"
              strokeDasharray="4 6"
              filter="url(#stream-glow-3)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0] }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />

            {/* Return from Disciplines */}
            <motion.path
              d="M 560 90 C 400 85, 240 100, 130 130"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="1.8"
              strokeDasharray="4 6"
              filter="url(#stream-glow-3)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0] }}
              transition={{ duration: 1.5, delay: 0.1, ease: "easeInOut" }}
            />

            {/* Return from Portals */}
            <motion.path
              d="M 780 90 C 540 105, 270 125, 130 130"
              fill="none"
              stroke="#EC4899"
              strokeWidth="1.8"
              strokeDasharray="4 6"
              filter="url(#stream-glow-3)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0] }}
              transition={{ duration: 1.6, delay: 0.18, ease: "easeInOut" }}
            />

            {/* Return from Inquiries */}
            <motion.path
              d="M 980 90 C 700 120, 320 145, 130 130"
              fill="none"
              stroke="#10B981"
              strokeWidth="1.8"
              strokeDasharray="4 6"
              filter="url(#stream-glow-3)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0] }}
              transition={{ duration: 1.7, delay: 0.25, ease: "easeInOut" }}
            />
          </>
        )}
      </svg>
    </div>
  );
}
