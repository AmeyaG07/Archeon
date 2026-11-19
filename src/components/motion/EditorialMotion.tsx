"use client";

import React from "react";
import {
  motion,
  useReducedMotion,
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
 * Masked line/block rise with an editorial luxury cubic-bezier.
 */
export function RevealText({
  children,
  className = "",
  delay = 0,
  duration = 0.95,
}: RevealTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "105%", opacity: 0.05 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          duration,
          delay,
          ease: LUXURY_EASE,
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
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
 * Architectural curtain reveal with subtle scale easing for imagery and visual cards.
 */
export function ClipReveal({
  children,
  className = "",
  delay = 0,
  duration = 1.1,
}: ClipRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{
        clipPath: "inset(12% 0% 12% 0%)",
        scale: 1.06,
        opacity: 0.4,
      }}
      whileInView={{
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        opacity: 1,
      }}
      viewport={{ once: true, amount: 0.2 }}
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
  duration = 0.9,
  origin = "left",
}: HairlineRuleProps) {
  const shouldReduceMotion = useReducedMotion();

  const originClass =
    origin === "center"
      ? "origin-center"
      : origin === "right"
      ? "origin-right"
      : "origin-left";

  if (shouldReduceMotion) {
    return <div className={`h-px w-full ${color} ${className}`} />;
  }

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.3 }}
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
  visible: (staggerDelay: number = 0.1) => ({
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.05,
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
  staggerDelay = 0.1,
}: StaggerGridProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

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
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
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
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
