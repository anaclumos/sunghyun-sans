"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { SectionWrapper } from "@/components/section-wrapper"
import { SectionHeader } from "@/components/section-header"

export function InfoSection() {
  const t = useTranslations("Info")

  const items = [
    { key: "name", label: t("nameLabel"), value: t("nameValue") },
    { key: "families", label: t("familiesLabel"), value: t("familiesValue") },
    { key: "weights", label: t("weightsLabel"), value: t("weightsValue") },
    { key: "formats", label: t("formatsLabel"), value: t("formatsValue") },
    { key: "glyphs", label: t("glyphsLabel"), value: t("glyphsValue") },
    { key: "languages", label: t("languagesLabel"), value: t("languagesValue") },
    { key: "license", label: t("licenseLabel"), value: t("licenseValue") },
    { key: "basedOn", label: t("basedOnLabel"), value: t("basedOnValue") },
  ]

  return (
    <SectionWrapper id="info">
      <SectionHeader
        label={t("badge")}
        title={t("title")}
        description={t("description")}
      />
      <div className="bg-surface border border-line-strong rounded-3xl p-6 md:p-8">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:gap-y-8">
          {items.map((item, index) => (
            <div 
              key={item.key} 
              className={cn(
                "flex flex-col",
                index < items.length - 1 && "border-b border-line md:border-none pb-6 md:pb-0"
              )}
            >
              <dt className="type-micro font-semibold text-warm-muted tracking-widest uppercase">
                {item.label}
              </dt>
              <dd className="text-base font-semibold text-ink mt-2">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </SectionWrapper>
  )
}
