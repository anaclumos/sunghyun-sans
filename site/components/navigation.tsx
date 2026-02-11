"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RELEASES_URL } from "@/lib/constants";

const LOCALES = ["en", "kr", "jp"] as const;

export function Navigation() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let frameId = 0;
    const updateScrolledState = () => {
      frameId = 0;
      const nextValue = window.scrollY > 10;
      setIsScrolled((prev) => (prev === nextValue ? prev : nextValue));
    };

    const handleScroll = () => {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(updateScrolledState);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] transition-[background-color,border-color,box-shadow] duration-300",
        "bg-nav-glass backdrop-blur-xl",
        isScrolled && "border-b border-line shadow-sm"
      )}
    >
      <div className="max-w-container mx-auto px-container-px">
        <div className="flex h-16 items-center justify-between">
          <button
            type="button"
            onClick={scrollToTop}
            className="focus-ring rounded-md px-2 py-1 text-lg font-semibold tracking-tight text-ink hover:text-signal"
          >
            {t("brand")}
          </button>

          <div className="flex items-center gap-4">
            <div
              className="flex items-center rounded-full border border-line bg-surface-warm p-1"
              role="group"
              aria-label={t("language")}
            >
              {LOCALES.map((l) => (
                <button
                  type="button"
                  key={l}
                  onClick={() => handleLocaleChange(l)}
                  aria-pressed={locale === l}
                  aria-label={`${t("language")} ${l.toUpperCase()}`}
                  className={cn(
                    "focus-ring rounded-full px-3 py-1 text-xs font-medium transition-[color,background-color,border-color,box-shadow]",
                    locale === l
                      ? "bg-ink text-white shadow-sm"
                      : "text-warm-muted hover:bg-paper hover:text-ink"
                  )}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <Button
              asChild
              className="btn-signal focus-ring rounded-full bg-signal text-white shadow-sm hover:border-emerald-600 hover:bg-emerald-600"
            >
              <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
                {t("download")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
