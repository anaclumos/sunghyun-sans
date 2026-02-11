"use client";

import { useTranslations } from "next-intl";

import { RELEASES_URL } from "@/lib/constants";
import { motion } from "motion/react";
import { fadeInUp } from "@/lib/animations";

export function CTASection() {
  const t = useTranslations("CTA");

  return (
    <section className="bg-gradient-to-br from-emerald-500 to-emerald-700 py-section-y">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="section-container text-center"
      >
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight text-balance">
            {t("heading")}
          </h2>
          
          <p className="text-lg md:text-xl text-emerald-100 mb-12 max-w-2xl leading-relaxed text-balance">
            {t("description")}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-transparent bg-white px-8 py-4 text-lg font-semibold text-emerald-700 shadow-lg transition-[background-color,color,border-color,box-shadow] hover:bg-emerald-50"
            >
              {t("ctaDownload")}
            </a>
            
            <a
              href="#preview"
              className="focus-ring inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white transition-[background-color,border-color,color] hover:border-white hover:bg-white/10"
            >
              {t("ctaSpecimens")}
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
