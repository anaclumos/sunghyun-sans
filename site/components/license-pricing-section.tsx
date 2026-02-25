"use client"

import { useTranslations } from "next-intl"
import { SectionWrapper } from "@/components/section-wrapper"
import { SectionHeader } from "@/components/section-header"
import { Check, X, ArrowRight } from "lucide-react"
import { GITHUB_URL } from "@/lib/constants"

export function LicensePricingSection() {
  const t = useTranslations("LicensePricing")

  const permissions = [
    t("perm1"),
    t("perm2"),
    t("perm3"),
    t("perm4"),
    t("perm5"),
  ]

  const restrictions = [
    t("restrict1"),
    t("restrict2"),
    t("restrict3"),
  ]

  return (
    <SectionWrapper id="license" bg="paper-2">
      <SectionHeader
        label={t("badge")}
        title={t("title")}
        description={t("description")}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface border border-line-strong rounded-3xl p-8 flex flex-col justify-between h-full">
          <div>
            <div className="type-micro font-semibold text-warm-muted tracking-widest uppercase mb-4">
              {t("priceLabel")}
            </div>
            <div className="text-6xl font-bold text-ink mb-4 tracking-tight">
              {t("price")}
            </div>
            <p className="type-body text-warm-muted">
              {t("priceDescription")}
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-line">
             <a 
              href={`${GITHUB_URL}/blob/main/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-ink font-medium hover:text-signal transition-colors group"
            >
              {t("viewLicense")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface border border-line-strong rounded-3xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-ink mb-6">
                {t("permissionsTitle")}
              </h3>
              <ul className="space-y-4">
                {permissions.map((perm) => (
                  <li key={perm} className="flex items-start gap-3">
                    <div className="mt-1 min-w-5 min-h-5 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                    <span className="type-body text-ink">{perm}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg md:text-xl font-semibold text-ink mb-6">
                {t("restrictionsTitle")}
              </h3>
              <ul className="space-y-4">
                {restrictions.map((restrict) => (
                  <li key={restrict} className="flex items-start gap-3">
                    <div className="mt-1 min-w-5 min-h-5 rounded-full bg-rose-100/50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <X className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                    <span className="type-body text-warm-muted">{restrict}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
