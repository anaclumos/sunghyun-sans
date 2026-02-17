"use client"

import { useTranslations } from "next-intl"
import { SectionWrapper } from "@/components/section-wrapper"
import { SectionHeader } from "@/components/section-header"

export function FAQSection() {
  const t = useTranslations("FAQ")

  const items = [
    { key: "clientSafe", q: t("q1"), a: t("a1") },
    { key: "howBuilt", q: t("q2"), a: t("a2") },
    { key: "copyright", q: t("q3"), a: t("a3") },
  ]

  return (
    <SectionWrapper id="faq">
      <SectionHeader
        label={t("badge")}
        title={t("title")}
        description={t("description")}
      />
      <div className="grid grid-cols-1 gap-6">
        {items.map((item) => (
          <div
            key={item.key}
            className="bg-surface border border-line-strong rounded-3xl p-6 md:p-8"
          >
            <h3 className="text-base md:text-lg font-semibold text-ink mb-3">
              {item.q}
            </h3>
            <p className="type-body text-warm-muted">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
