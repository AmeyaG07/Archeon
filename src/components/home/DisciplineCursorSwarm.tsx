"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CursorDef {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  // Keyframe coordinates within relative container
  x: (number | string)[];
  y: (number | string)[];
  rotations: number[];
  delay: number;
  duration: number;
}

const DISCIPLINE_CURSORS: CursorDef[] = [
  {
    id: "cur_arch",
    name: "ARCH · LVL 02",
    color: "#F59E0B", // Amber
    glowColor: "rgba(245, 158, 11, 0.45)",
    x: ["4%", "18%", "26%", "26%", "12%", "4%"],
    y: ["15%", "18%", "38%", "38%", "28%", "15%"],
    rotations: [-25, -15, 10, 10, -35, -25],
    delay: 0.2,
    duration: 6.2,
  },
  {
    id: "cur_int",
    name: "INT · BESPOKE",
    color: "#D97724", // Terracotta Bronze
    glowColor: "rgba(217, 119, 36, 0.45)",
    x: ["38%", "52%", "60%", "60%", "46%", "38%"],
    y: ["14%", "22%", "40%", "40%", "26%", "14%"],
    rotations: [-20, -10, 15, 15, -30, -20],
    delay: 0.6,
    duration: 6.6,
  },
  {
    id: "cur_land",
    name: "LAND · ECOLOGY",
    color: "#10B981", // Emerald
    glowColor: "rgba(16, 185, 129, 0.45)",
    x: ["72%", "85%", "92%", "92%", "78%", "72%"],
    y: ["16%", "20%", "39%", "39%", "30%", "16%"],
    rotations: [-28, -12, 12, 12, -32, -28],
    delay: 1.0,
    duration: 6.4,
  },
  {
    id: "cur_vis",
    name: "VIS · 3D CINEMA",
    color: "#06B6D4", // Cyan
    glowColor: "rgba(6, 182, 212, 0.45)",
    x: ["6%", "22%", "28%", "28%", "14%", "6%"],
    y: ["58%", "64%", "88%", "88%", "72%", "58%"],
    rotations: [-22, -8, 16, 16, -26, -22],
    delay: 1.4,
    duration: 6.8,
  },
  {
    id: "cur_turnkey",
    name: "EXEC · 1:1 TECTONIC",
    color: "#E11D48", // Rose Red
    glowColor: "rgba(225, 29, 72, 0.45)",
    x: ["40%", "54%", "62%", "62%", "48%", "40%"],
    y: ["56%", "62%", "86%", "86%", "70%", "56%"],
    rotations: [-24, -14, 18, 18, -28, -24],
    delay: 1.8,
    duration: 6.5,
  },
];

interface DisciplineCursorSwarmProps {
  activeDiscipline?: string;
  cycleKey?: number;
}

export function DisciplineCursorSwarm({
  activeDiscipline = "all",
  cycleKey = 0,
}: DisciplineCursorSwarmProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none">
      <AnimatePresence>
        {DISCIPLINE_CURSORS.map((cursor) => {
          return (
            <motion.div
              key={`${cursor.id}_${cycleKey}`}
              initial={{
                opacity: 0,
                x: cursor.x[0],
                y: cursor.y[0],
                scale: 0.8,
                rotate: cursor.rotations[0],
              }}
              animate={{
                opacity: [0, 1, 1, 1, 0.9, 0],
                x: cursor.x,
                y: cursor.y,
                scale: [0.8, 1.05, 1.15, 0.92, 1.0, 0.8],
                rotate: cursor.rotations,
              }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{
                duration: cursor.duration,
                delay: cursor.delay,
                repeat: Infinity,
                repeatDelay: 1.2,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.25, 0.5, 0.65, 0.88, 1],
              }}
              className="absolute will-change-transform"
            >
              <div className="relative flex items-start gap-1.5 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                {/* 1. Luminous Cursor Arrow */}
                <div className="relative">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill={cursor.color}
                    className="drop-shadow-[0_0_10px_currentColor]"
                    style={{ color: cursor.color }}
                  >
                    <path d="M3 3l7 18 3-7 7-3L3 3z" />
                  </svg>

                  {/* Pulsing Core Beacon at Arrow Tip */}
                  <span
                    className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: cursor.color,
                      boxShadow: `0 0 12px 3px ${cursor.color}`,
                    }}
                  />

                  {/* Gentle Click Pulse Ring */}
                  <motion.span
                    animate={{
                      scale: [1, 2.4, 2.8],
                      opacity: [0.9, 0.3, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatDelay: cursor.duration - 1.2,
                      delay: cursor.delay + cursor.duration * 0.5,
                      ease: "easeOut",
                    }}
                    className="absolute -top-2 -left-2 h-4 w-4 rounded-full border pointer-events-none"
                    style={{ borderColor: cursor.color }}
                  />
                </div>

                {/* 2. Floating Agent Badge HUD Tag */}
                <div
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 backdrop-blur-md border border-white/20 text-[8.5px] font-mono tracking-wider font-semibold uppercase text-white shadow-lg"
                  style={{
                    backgroundColor: "rgba(10, 10, 10, 0.88)",
                    borderLeft: `2.5px solid ${cursor.color}`,
                    boxShadow: `0 4px 12px ${cursor.glowColor}`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full animate-ping"
                    style={{ backgroundColor: cursor.color }}
                  />
                  <span>{cursor.name}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
