"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/section-wrapper";
import { SectionHeader } from "@/components/section-header";
import { OT_FEATURES, OT_REFERENCE_FEATURES } from "@/lib/constants";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function OpenTypeSection() {
  const t = useTranslations("OpenType");
  const [activeFeature, setActiveFeature] = useState<string>(OT_FEATURES[0].code);
  const [isReferenceExpanded, setIsReferenceExpanded] = useState(false);
  const referencePanelId = "ot-reference-panel";

  return (
    <SectionWrapper id="features">
      <SectionHeader
        label={t("badge")}
        title={t("title")}
        description={t("description")}
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-8"
      >
        <motion.div
          variants={staggerItem}
          className="bg-surface border border-line-strong rounded-3xl p-6 md:p-8"
        >
          <div className="flex flex-wrap gap-2 pb-6 border-b border-line">
            {OT_FEATURES.map(({ code }) => (
              <button
                key={code}
                type="button"
                onClick={() => setActiveFeature(code)}
                aria-pressed={activeFeature === code}
                className={cn(
                  "focus-ring flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-[color,background-color,border-color,box-shadow]",
                  activeFeature === code
                    ? "bg-ink text-white border border-transparent shadow-sm"
                    : "bg-transparent text-warm-muted border border-line-strong hover:border-ink hover:text-ink"
                )}
              >
                <span className="font-mono font-bold text-xs">{code}</span>
                <span>{t(`feature_${code}_name`)}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-6">
            <div className="flex flex-col gap-3">
              <span className="type-micro font-semibold text-warm-muted tracking-widest">
                Off
              </span>
              <div
                className="type-display text-ink whitespace-pre-line"
                style={{ fontFeatureSettings: "normal" }}
              >
                {t(`feature_${activeFeature}_example`)}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:border-l md:border-line md:pl-8">
              <span className="type-micro font-semibold text-signal tracking-widest">
                On
              </span>
              <div
                className="type-display text-ink whitespace-pre-line"
                style={{ fontFeatureSettings: `"${activeFeature}" 1` }}
              >
                {t(`feature_${activeFeature}_example`)}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-line">
            <code className="text-xs font-mono text-warm-muted">
              font-feature-settings: &quot;{activeFeature}&quot; 1;
            </code>
          </div>
        </motion.div>

        <div className="flex flex-col items-start">
          <button
            type="button"
            onClick={() => setIsReferenceExpanded((prev) => !prev)}
            aria-expanded={isReferenceExpanded}
            aria-controls={referencePanelId}
            className="focus-ring flex items-center gap-2 rounded-md py-2 text-sm text-warm-muted transition-colors hover:text-ink"
          >
            {isReferenceExpanded ? t("hideAll") : t("showAll")}
          </button>

          <AnimatePresence>
            {isReferenceExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  transitionEnd: { overflow: "visible" },
                }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                id={referencePanelId}
                className="w-full overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-6">
                  {OT_REFERENCE_FEATURES.map(({ code, name }) => (
                    <div
                      key={code}
                      className="flex items-center gap-2 border border-line rounded-full px-3 py-1.5"
                    >
                      <span className="font-mono text-xs font-bold text-ink">{code}</span>
                      <span className="text-xs text-warm-muted truncate" title={name}>{name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
