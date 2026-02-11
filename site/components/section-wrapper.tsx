"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { fadeInUp } from "@/lib/animations";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  bg?: "paper" | "paper-2" | "surface-warm";
  motion?: "in-view" | "none";
  width?: "contained" | "full";
}

export function SectionWrapper({
  children,
  className,
  id,
  bg,
  motion: motionMode = "in-view",
  width = "contained",
}: SectionWrapperProps) {
  const BG_CLASS: Record<string, string> = {
    "paper": "",
    "paper-2": "bg-paper-2",
    "surface-warm": "bg-surface-warm",
  };
  const bgClass = bg ? BG_CLASS[bg] ?? "" : "";

  const Content = width === "full" ? (
    <div className={className}>{children}</div>
  ) : (
    <div className={cn("section-container", className)}>
      {children}
    </div>
  );

  if (motionMode === "none") {
    return <section id={id} className={cn("py-section-y overflow-x-clip", bgClass)}>{Content}</section>;
  }

  return (
    <section id={id} className={cn("py-section-y overflow-x-clip", bgClass)}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        variants={fadeInUp}
      >
        {Content}
      </motion.div>
    </section>
  );
}
