"use client"

import { useTranslations } from "next-intl"
import { GITHUB_URL, RELEASES_URL } from "@/lib/constants"

export function Footer() {
  const t = useTranslations("Footer")

  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="section-container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div>
            <h3 className="type-micro font-semibold text-warm-muted tracking-widest mb-6 uppercase">{t("fontFamily")}</h3>
            <ul className="space-y-3">
              <li className="text-sm text-warm-muted">{t("std")}</li>
              <li className="text-sm text-warm-muted">{t("kr")}</li>
              <li className="text-sm text-warm-muted">{t("jp")}</li>
              <li className="text-sm text-warm-muted">{t("gov")}</li>
            </ul>
          </div>

          <div>
            <h3 className="type-micro font-semibold text-warm-muted tracking-widest mb-6 uppercase">{t("resources")}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring rounded-sm text-sm text-warm-muted transition-colors hover:text-ink"
                >
                  {t("github")}
                </a>
              </li>
              <li>
                <a
                  href={RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring rounded-sm text-sm text-warm-muted transition-colors hover:text-ink"
                >
                  {t("releases")}
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring rounded-sm text-sm text-warm-muted transition-colors hover:text-ink"
                >
                  {t("license")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="type-micro font-semibold text-warm-muted tracking-widest mb-6 uppercase">{t("credits")}</h3>
            <ul className="space-y-3">
              <li className="text-sm text-warm-muted">{t("creditInter")}</li>
              <li className="text-sm text-warm-muted">{t("creditPretendard")}</li>
              <li className="text-sm text-warm-muted">{t("creditSourceHan")}</li>
              <li className="text-sm text-warm-muted">{t("creditMplus")}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-line flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-fg-1">{t("builtWith")}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-xs text-warm-muted/50 select-none hidden sm:inline-block" style={{ fontFeatureSettings: '"tnum" 1, "zero" 1, "frac" 1' }}>
              0123456789 ½
            </span>
            <p className="text-sm text-fg-1">{t("copyright")}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
