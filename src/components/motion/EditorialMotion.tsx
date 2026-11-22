"use client";

import React from "react";
import {
  motion,
  Variants,
} from "framer-motion";

const LUXURY_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface RevealTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

/**
 * RevealText
 * Smooth masked editorial upward rise that triggers reliably in all viewports.
 */
export function RevealText({
  children,
  className = "",
  delay = 0,
  duration = 0.85,
}: RevealTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration,
        delay,
        ease: LUXURY_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ClipRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

/**
 * ClipReveal
 * Architectural curtain reveal with subtle scale easing for imagery and cards.
 */
export function ClipReveal({
  children,
  className = "",
  delay = 0,
  duration = 1.0,
}: ClipRevealProps) {
  return (
    <motion.div
      initial={{
        clipPath: "inset(10% 0% 10% 0%)",
        scale: 1.05,
        opacity: 0.5,
      }}
      whileInView={{
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        opacity: 1,
      }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration,
        delay,
        ease: LUXURY_EASE,
      }}
      className={`overflow-hidden will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface HairlineRuleProps {
  className?: string;
  color?: string;
  delay?: number;
  duration?: number;
  origin?: "left" | "right" | "center";
}

/**
 * HairlineRule
 * Architectural bronze/stone divider line that draws in on scroll.
 */
export function HairlineRule({
  className = "",
  color = "bg-[#D8D6D0]",
  delay = 0,
  duration = 0.85,
  origin = "left",
}: HairlineRuleProps) {
  const originClass =
    origin === "center"
      ? "origin-center"
      : origin === "right"
      ? "origin-right"
      : "origin-left";

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration,
        delay,
        ease: LUXURY_EASE,
      }}
      className={`h-px w-full ${color} ${originClass} will-change-transform ${className}`}
    />
  );
}

interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (staggerDelay: number = 0.08) => ({
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.04,
    },
  }),
};

/**
 * StaggerGrid
 * Orchestrates staggered reveals across child StaggerItem components.
 */
export function StaggerGrid({
  children,
  className = "",
  staggerDelay = 0.08,
}: StaggerGridProps) {
  return (
    <motion.div
      variants={gridContainerVariants}
      custom={staggerDelay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      ease: LUXURY_EASE,
    },
  },
};

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * StaggerItem
 * Individual staggered element inside StaggerGrid.
 */
export function StaggerItem({
  children,
  className = "",
}: StaggerItemProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
