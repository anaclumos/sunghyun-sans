"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RELEASES_URL } from "@/lib/constants";

const LOCALES = ["en", "kr", "jp"] as const;

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  kr: "KR",
  jp: "JP",
};

const THEME_CYCLE = ["light", "dark", "system"] as const;

const THEME_ICONS: Record<string, React.ReactNode> = {
  light: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.5v1M8 13.5v1M13.5 8h1M1.5 8h1M11.89 4.11l.7-.7M3.41 12.59l.7-.7M11.89 11.89l.7.7M3.41 3.41l.7.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  dark: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.36 10.06A6 6 0 0 1 5.94 2.64 6 6 0 1 0 13.36 10.06Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  system: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 14h5M8 11v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const THEME_LABELS: Record<string, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System theme",
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="size-9 rounded-full" aria-hidden="true" />;
  }

  const current = theme ?? "system";
  const nextIndex = (THEME_CYCLE.indexOf(current as typeof THEME_CYCLE[number]) + 1) % THEME_CYCLE.length;
  const next = THEME_CYCLE[nextIndex];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="focus-ring flex size-9 items-center justify-center rounded-full border border-line text-warm-muted transition-colors hover:border-line-strong hover:text-ink"
      aria-label={THEME_LABELS[current]}
      title={THEME_LABELS[current]}
    >
      {THEME_ICONS[current]}
    </button>
  );
}

function LocaleDropdown() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLocaleChange = useCallback(
    (newLocale: string) => {
      router.replace(pathname, { locale: newLocale });
      setOpen(false);
    },
    [router, pathname]
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("language")}
        className="focus-ring flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-medium text-warm-muted transition-colors hover:border-line-strong hover:text-ink"
      >
        {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          className={cn("transition-transform duration-150", open && "rotate-180")}
        >
          <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("language")}
          className="absolute right-0 top-full mt-2 min-w-[5rem] overflow-hidden rounded-xl border border-line bg-paper shadow-lg backdrop-blur-xl"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              role="option"
              aria-selected={locale === l}
              onClick={() => handleLocaleChange(l)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors",
                locale === l
                  ? "bg-signal/10 text-signal"
                  : "text-warm-muted hover:bg-paper-2 hover:text-ink"
              )}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navigation() {
  const t = useTranslations("Nav");
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

          <div className="flex items-center gap-3">
            <LocaleDropdown />
            <ThemeToggle />

            <Button
              asChild
              className="btn-signal focus-ring rounded-full bg-signal text-white shadow-sm hover:border-emerald-600 hover:bg-emerald-600 dark:hover:border-emerald-700 dark:hover:bg-emerald-700"
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
