"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/section-wrapper";
import { SectionHeader } from "@/components/section-header";
import { OT_FEATURES, OT_REFERENCE_FEATURES } from "@/lib/constants";
import { useState } from "react";
import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
          <ToggleGroup
            type="single"
            value={activeFeature}
            onValueChange={(v) => {
              if (v) setActiveFeature(v);
            }}
            className="flex flex-wrap gap-2 pb-6 border-b border-line justify-start"
          >
            {OT_FEATURES.map(({ code }) => (
              <ToggleGroupItem
                key={code}
                value={code}
                className={cn(
                  "bg-transparent shadow-none border-none", // Reset base styles
                  "focus-ring rounded-full px-4 py-2 text-sm transition-[color,background-color,border-color,box-shadow] h-auto min-w-0",
                  "data-[state=on]:bg-ink data-[state=on]:text-paper data-[state=on]:border-transparent data-[state=on]:shadow-sm",
                  "data-[state=off]:bg-transparent data-[state=off]:text-warm-muted data-[state=off]:border data-[state=off]:border-line-strong data-[state=off]:hover:border-ink data-[state=off]:hover:text-ink"
                )}
              >
                <span className="font-mono font-bold text-xs">{code}</span>
                <span>{t(`feature_${code}_name`)}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

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

        <Collapsible
          open={isReferenceExpanded}
          onOpenChange={setIsReferenceExpanded}
          className="flex flex-col items-start"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="focus-ring flex items-center gap-2 rounded-md py-2 text-sm text-warm-muted transition-colors hover:text-ink"
            >
              {isReferenceExpanded ? t("hideAll") : t("showAll")}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="w-full overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-6">
              {OT_REFERENCE_FEATURES.map(({ code, name }) => (
                <div
                  key={code}
                  className="flex items-center gap-2 border border-line rounded-full px-3 py-1.5"
                >
                  <span className="font-mono text-xs font-bold text-ink">
                    {code}
                  </span>
                  <span className="text-xs text-warm-muted truncate" title={name}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>
    </SectionWrapper>
  );
}
