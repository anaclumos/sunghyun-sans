"use client";

import { useTranslations } from "next-intl";

export function GlyphLabsLoading() {
  const t = useTranslations("Labs");

  return (
    <section id="labs" className="py-section-y" aria-live="polite">
      <div className="section-container">
        <div className="rounded-3xl border border-line bg-surface p-8 text-warm-muted">
          {t("loadingFonts")}
        </div>
      </div>
    </section>
  );
}
