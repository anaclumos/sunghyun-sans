"use client";

import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/animations";

const WEIGHT_SAMPLES = [
  { name: "Thin", value: 100, text: "The quick brown fox jumps over the lazy dog" },
  { name: "ExtraLight", value: 200, text: "Internationalization" },
  { name: "Light", value: 300, text: "Millimeter waves" },
  { name: "Regular", value: 400, text: "Assimilation engine" },
  { name: "Medium", value: 500, text: "Botanica Francisco" },
  { name: "SemiBold", value: 600, text: "San Francisco" },
  { name: "Bold", value: 700, text: "15 Mango Avenue" },
  { name: "ExtraBold", value: 800, text: "Comedy Morning" },
  { name: "Black", value: 900, text: "Hamburgefonstiv" },
];

export function WeightShowcase() {
  return (
    <section className="py-section-y overflow-x-clip">
      <div className="section-container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="flex flex-col"
        >
          {WEIGHT_SAMPLES.map((w) => (
            <motion.div
              key={w.value}
              variants={staggerItem}
              className="group flex items-baseline gap-4 md:gap-8 py-3 md:py-4 border-b border-line last:border-none -mx-4 px-4 rounded-lg"
            >
              <div className="flex items-baseline gap-3 shrink-0 w-36 md:w-52">
                <span className="text-sm text-warm-muted font-medium">{w.name}</span>
                <span className="text-xs text-fg-1 font-mono tabular-nums">{w.value}</span>
              </div>
              <span
                className="min-w-0 type-weight-sample truncate leading-snug text-ink"
                style={{ fontWeight: w.value }}
              >
                {w.text}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
