"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { RELEASES_URL, GITHUB_URL } from "@/lib/constants";

import { weightCascade, fadeInUp } from "@/lib/animations";

export function HeroSection() {
  const t = useTranslations("Hero");

  return (
    <section className="relative min-h-hero pt-32 pb-20 flex items-center">
      <div className="section-container w-full max-w-container mx-auto px-container-px">
        <div className="flex flex-col items-center text-center">
          <motion.h1
            custom={0}
            variants={weightCascade}
            initial="hidden"
            animate="visible"
            className="font-semibold type-hero text-ink whitespace-pre-line text-balance"
          >
            {t("title")}
          </motion.h1>
          
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="type-body text-warm-muted max-w-xl mt-8 mb-10 text-balance"
          >
            {t("description")}
          </motion.p>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"
          >
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-signal bg-signal px-8 py-3 text-base font-semibold text-white shadow-sm transition-[background-color,border-color,box-shadow] hover:border-emerald-600 hover:bg-emerald-600"
            >
              {t("ctaDownload")}
            </a>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-line-strong px-8 py-3 text-base font-semibold text-ink transition-[background-color,border-color,color] hover:border-ink hover:bg-paper-2"
            >
              {t("ctaGitHub")}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
