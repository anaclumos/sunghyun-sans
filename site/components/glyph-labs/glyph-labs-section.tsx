"use client";

import { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/section-wrapper";
import { SectionHeader } from "@/components/section-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  GlyphViewerCard,
  GlyphViewerOverlay,
} from "@/components/glyph-labs/glyph-viewer";

const FONT_CONFIGS = [
  { name: "Sunghyun Sans", url: "/fonts/SunghyunSans-Regular.otf", color: "#10b981", dotClass: "bg-emerald-500", latinOnly: false, hasWeights: true },
  { name: "Open Runde", url: "/fonts/OpenRunde-Regular.otf", color: "#f59e0b", dotClass: "bg-amber-500", latinOnly: true, hasWeights: true },
  { name: "Inter", url: "/fonts/Inter-Regular.otf", color: "#8b5cf6", dotClass: "bg-violet-500", latinOnly: true, hasWeights: true },
  { name: "Pretendard", url: "/fonts/PretendardStd-Regular.otf", color: "#3b82f6", dotClass: "bg-blue-500", latinOnly: false, hasWeights: true },
];

const NON_LATIN_RE = /[\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/;
const KOREAN_RE = /[\uAC00-\uD7AF\u3130-\u318F\u1100-\u11FF]/;
const JAPANESE_RE = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uF900-\uFAFF]/;

const WEIGHT_ENTRIES = [
  { value: 100, suffix: "Thin", label: "Thin" },
  { value: 200, suffix: "ExtraLight", label: "ExtraLight" },
  { value: 300, suffix: "Light", label: "Light" },
  { value: 400, suffix: "Regular", label: "Regular" },
  { value: 500, suffix: "Medium", label: "Medium" },
  { value: 600, suffix: "SemiBold", label: "SemiBold" },
  { value: 700, suffix: "Bold", label: "Bold" },
  { value: 800, suffix: "ExtraBold", label: "ExtraBold" },
  { value: 900, suffix: "Black", label: "Black" },
] as const;

type WeightValue = (typeof WEIGHT_ENTRIES)[number]["value"];

const WEIGHT_MAP = new Map(WEIGHT_ENTRIES.map((w) => [w.value, w]));

const WEIGHTED_FAMILIES: Record<string, string> = {
  "Sunghyun Sans": "/fonts/SunghyunSans",
  "Sunghyun Sans KR": "/fonts/SunghyunSansKR",
  "Sunghyun Sans JP": "/fonts/SunghyunSansJP",
  "Open Runde": "/fonts/OpenRunde",
  "Inter": "/fonts/Inter",
  "Pretendard": "/fonts/PretendardStd",
  "Pretendard KR": "/fonts/Pretendard",
  "Pretendard JP": "/fonts/PretendardJP",
};

const FONT_AVAILABLE_WEIGHTS: Record<string, readonly WeightValue[]> = {
  "Open Runde": [400, 500, 600, 700],
};

function nearestWeight(name: string, target: WeightValue): WeightValue {
  const available = FONT_AVAILABLE_WEIGHTS[name];
  if (!available) return target;
  return available.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
}

const EXTRA_FONTS: Array<{ name: string; url: string }> = [
  { name: "Sunghyun Sans KR", url: "/fonts/SunghyunSansKR-Regular.otf" },
  { name: "Sunghyun Sans JP", url: "/fonts/SunghyunSansJP-Regular.otf" },
  { name: "Pretendard KR", url: "/fonts/Pretendard-Regular.otf" },
  { name: "Pretendard JP", url: "/fonts/PretendardJP-Regular.otf" },
];

const SCRIPT_VARIANTS: Record<string, { kr: string; jp: string }> = {
  "Sunghyun Sans": { kr: "Sunghyun Sans KR", jp: "Sunghyun Sans JP" },
  "Pretendard": { kr: "Pretendard KR", jp: "Pretendard JP" },
};

const FONT_SOURCES = [
  ...FONT_CONFIGS.map(({ name, url }) => ({ name, url })),
  ...EXTRA_FONTS,
];
const FONT_URL_BY_NAME = new Map<string, string>(
  FONT_SOURCES.map(({ name, url }) => [name, url])
);
const FONT_PROMISE_CACHE = new Map<string, Promise<opentype.Font>>();

function getScriptVariant(baseName: string, char: string): string {
  const variants = SCRIPT_VARIANTS[baseName];
  if (!variants) return baseName;
  if (KOREAN_RE.test(char)) return variants.kr;
  if (JAPANESE_RE.test(char)) return variants.jp;
  return baseName;
}

function fontCacheKey(name: string, weight: WeightValue): string {
  if (WEIGHTED_FAMILIES[name]) {
    return `${name}@${weight}`;
  }
  return name;
}

function fontUrl(name: string, weight: WeightValue): string {
  const prefix = WEIGHTED_FAMILIES[name];
  if (prefix) {
    const entry = WEIGHT_MAP.get(weight);
    return `${prefix}-${entry?.suffix ?? "Regular"}.otf`;
  }
  return FONT_URL_BY_NAME.get(name) ?? "";
}

function loadFont(name: string, weight: WeightValue): Promise<opentype.Font> {
  const key = fontCacheKey(name, weight);
  const existingPromise = FONT_PROMISE_CACHE.get(key);
  if (existingPromise) return existingPromise;

  const url = fontUrl(name, weight);
  if (!url) {
    return Promise.reject(new Error(`Font URL not found for ${name}`));
  }

  const loadPromise = new Promise<opentype.Font>((resolve, reject) => {
    opentype.load(url, (err, font) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(font);
    });
  });

  FONT_PROMISE_CACHE.set(key, loadPromise);
  return loadPromise;
}

type LabsTranslator = ReturnType<typeof useTranslations>;
type FontConfig = (typeof FONT_CONFIGS)[number];

interface GlyphLabsControlsProps {
  t: LabsTranslator;
  inputValue: string;
  fontSize: number;
  fontWeight: WeightValue;
  showPoints: boolean;
  overlay: boolean;
  isNonLatin: boolean;
  visibleFonts: Set<string>;
  commitChar: (raw: string) => void;
  setInputValue: (value: string) => void;
  setFontSize: (size: number) => void;
  setFontWeight: (weight: WeightValue) => void;
  setShowPoints: (value: boolean) => void;
  setOverlay: (value: boolean) => void;
  resolveFontKey: (name: string) => string;
  toggleFont: (name: string) => void;
}

function GlyphLabsControls({
  t,
  inputValue,
  fontSize,
  fontWeight,
  showPoints,
  overlay,
  isNonLatin,
  visibleFonts,
  commitChar,
  setInputValue,
  setFontSize,
  setFontWeight,
  setShowPoints,
  setOverlay,
  resolveFontKey,
  toggleFont,
}: GlyphLabsControlsProps) {
  const weightLabel = WEIGHT_MAP.get(fontWeight)?.label ?? "Regular";

  return (
    <div className="w-full lg:w-1/3 space-y-6">
      <div className="space-y-4">
        <Label htmlFor="char-input" className="text-base text-ink">
          {t("character")}
        </Label>
        <Input
          id="char-input"
          name="selected-character"
          aria-label={t("character")}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => commitChar(inputValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          autoComplete="off"
          spellCheck={false}
          className="h-auto w-full rounded-2xl border-line bg-surface p-4 text-center text-4xl shadow-none transition-[background-color,border-color,box-shadow] focus-visible:border-signal focus-visible:ring-signal/25"
        />
      </div>

      <div className="bg-surface border border-line rounded-2xl p-6 space-y-6">
        <h3 className="text-base font-semibold text-ink">{t("settings")}</h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="zoom-slider" className="text-sm text-warm-muted">
              {t("zoomSize")}
            </Label>
            <span className="text-sm text-warm-muted font-mono tabular-nums">{fontSize}px</span>
          </div>
          <Slider
            id="zoom-slider"
            aria-label={t("zoomSize")}
            min={100}
            max={800}
            step={1}
            value={[fontSize]}
            onValueChange={(v) => setFontSize(v[0])}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="weight-slider" className="text-sm text-warm-muted">
              {t("weight")}
            </Label>
            <span className="text-sm text-warm-muted font-mono tabular-nums">{fontWeight} {weightLabel}</span>
          </div>
          <Slider
            id="weight-slider"
            aria-label={t("weight")}
            min={100}
            max={900}
            step={100}
            value={[fontWeight]}
            onValueChange={(v) => setFontWeight(v[0] as WeightValue)}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="show-points" className="text-sm text-warm-muted">
            {t("showControlPoints")}
          </Label>
          <Switch id="show-points" checked={showPoints} onCheckedChange={setShowPoints} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="overlay-mode" className="text-sm text-warm-muted">
            {t("overlayMode")}
          </Label>
          <Switch id="overlay-mode" checked={overlay} onCheckedChange={setOverlay} />
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-6 space-y-6">
        <h3 className="text-base font-semibold text-ink">{t("legend")}</h3>
        <div className="space-y-4">
          {FONT_CONFIGS.map((f) => {
            const disabled = isNonLatin && f.latinOnly;
            return (
              <div key={f.name} className={cn("flex items-center justify-between gap-4", disabled && "opacity-40")}>
                <div className="flex items-center gap-3">
                  <div
                    className={cn("w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10 shrink-0", disabled ? "bg-gray-400" : f.dotClass)}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-warm-muted">
                      {resolveFontKey(f.name)}
                    </span>
                    {disabled && (
                      <span className="text-xs text-fg-1">{t("latinOnlyNotice")}</span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={visibleFonts.has(f.name) && !disabled}
                  onCheckedChange={() => toggleFont(f.name)}
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface GlyphLabsDisplayGridProps {
  fonts: Record<string, opentype.Font>;
  activeFonts: FontConfig[];
  selectedChar: string;
  fontSize: number;
  showPoints: boolean;
  resolveFontCacheKey: (name: string) => string;
}

function GlyphLabsDisplayGrid({
  fonts,
  activeFonts,
  selectedChar,
  fontSize,
  showPoints,
  resolveFontCacheKey,
}: GlyphLabsDisplayGridProps) {
  return (
    <>
      {activeFonts.map((fontConfig) => (
        <div key={fontConfig.name} className="space-y-2">
          <GlyphViewerCard
            font={fonts[resolveFontCacheKey(fontConfig.name)] ?? null}
            char={selectedChar}
            fontSize={fontSize}
            showPoints={showPoints}
            color={fontConfig.color}
          />
        </div>
      ))}
    </>
  );
}

interface GlyphLabsDisplayOverlayProps {
  t: LabsTranslator;
  fonts: Record<string, opentype.Font>;
  activeFonts: FontConfig[];
  selectedChar: string;
  fontSize: number;
  showPoints: boolean;
  resolveFontCacheKey: (name: string) => string;
}

function GlyphLabsDisplayOverlay({
  t,
  fonts,
  activeFonts,
  selectedChar,
  fontSize,
  showPoints,
  resolveFontCacheKey,
}: GlyphLabsDisplayOverlayProps) {
  return (
    <div className="relative w-full aspect-square rounded-2xl bg-surface overflow-hidden border border-line">
      {activeFonts.map((fontConfig) => (
        <div
          key={fontConfig.name}
          className="absolute inset-0 mix-blend-multiply dark:mix-blend-screen"
        >
          <GlyphViewerOverlay
            font={fonts[resolveFontCacheKey(fontConfig.name)] ?? null}
            char={selectedChar}
            fontSize={fontSize}
            showPoints={showPoints}
            color={fontConfig.color}
          />
        </div>
      ))}
      <div className="absolute bottom-4 right-4 text-xs font-medium text-warm-muted bg-surface/90 px-3 py-1.5 rounded-full backdrop-blur-sm border border-line pointer-events-none">
        {t("overlayMode")}
      </div>
    </div>
  );
}

export function GlyphLabsSection() {
  const t = useTranslations("Labs");

  const [fonts, setFonts] = useState<Record<string, opentype.Font>>({});
  const [selectedChar, setSelectedChar] = useState("R");
  const [inputValue, setInputValue] = useState("R");
  const [fontSize, setFontSize] = useState(300);
  const [fontWeight, setFontWeight] = useState<WeightValue>(400);
  const [showPoints, setShowPoints] = useState(true);
  const [overlay, setOverlay] = useState(false);
  const [visibleFonts, setVisibleFonts] = useState<Set<string>>(() =>
    new Set(FONT_CONFIGS.map((f) => f.name))
  );
  const commitChar = (raw: string) => {
    const char = raw.slice(-1);
    if (char) {
      setSelectedChar(char);
      setInputValue(char);
    } else {
      setInputValue(selectedChar);
    }
  };

  const toggleFont = (name: string) => {
    setVisibleFonts((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size > 1) next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const isNonLatin = NON_LATIN_RE.test(selectedChar);
  const resolveFontKey = (name: string) => getScriptVariant(name, selectedChar);
  const activeFonts = useMemo(
    () =>
      FONT_CONFIGS.filter(
        (f) => visibleFonts.has(f.name) && !(isNonLatin && f.latinOnly)
      ),
    [visibleFonts, isNonLatin]
  );

  const requiredFontKeys = useMemo(() => {
    const keys: { name: string; weight: WeightValue; cacheKey: string }[] = [];
    const seen = new Set<string>();
    for (const font of activeFonts) {
      const resolved = getScriptVariant(font.name, selectedChar);
      const weight: WeightValue = WEIGHTED_FAMILIES[resolved]
        ? nearestWeight(resolved, fontWeight)
        : 400;
      const key = fontCacheKey(resolved, weight);
      if (!seen.has(key)) {
        seen.add(key);
        keys.push({ name: resolved, weight, cacheKey: key });
      }
    }
    return keys;
  }, [activeFonts, selectedChar, fontWeight]);

  const isLoading = useMemo(
    () => requiredFontKeys.some(({ cacheKey }) => !fonts[cacheKey]),
    [requiredFontKeys, fonts]
  );

  const resolveFontCacheKey = (name: string) => {
    const resolved = getScriptVariant(name, selectedChar);
    const weight: WeightValue = WEIGHTED_FAMILIES[resolved]
      ? nearestWeight(resolved, fontWeight)
      : 400;
    return fontCacheKey(resolved, weight);
  };

  useEffect(() => {
    const missing = requiredFontKeys.filter(({ cacheKey }) => !fonts[cacheKey]);
    if (missing.length === 0) return;

    let isCancelled = false;

    Promise.allSettled(
      missing.map(({ name, weight, cacheKey }) =>
        loadFont(name, weight).then((font) => ({ cacheKey, font }))
      )
    ).then((results) => {
      if (isCancelled) return;
      setFonts((prev) => {
        const next = { ...prev };
        for (const result of results) {
          if (result.status === "fulfilled") {
            next[result.value.cacheKey] = result.value.font;
          }
        }
        return next;
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [requiredFontKeys, fonts]);

  return (
    <SectionWrapper id="labs">
      <SectionHeader label={t("badge")} title={t("title")} description={t("description")} />

      <div className="flex flex-col lg:flex-row gap-8">
        <GlyphLabsControls
          t={t}
          inputValue={inputValue}
          fontSize={fontSize}
          fontWeight={fontWeight}
          showPoints={showPoints}
          overlay={overlay}
          isNonLatin={isNonLatin}
          visibleFonts={visibleFonts}
          commitChar={commitChar}
          setInputValue={setInputValue}
          setFontSize={setFontSize}
          setFontWeight={setFontWeight}
          setShowPoints={setShowPoints}
          setOverlay={setOverlay}
          resolveFontKey={resolveFontKey}
          toggleFont={toggleFont}
        />

        <div className="w-full lg:w-2/3 bg-surface border border-line rounded-2xl overflow-hidden">
          {isLoading ? (
            <div
              className="w-full h-panel flex items-center justify-center text-warm-muted animate-pulse text-lg font-medium"
              aria-live="polite"
            >
              {t("loadingFonts")}
            </div>
          ) : (
            <div className={cn("relative w-full min-h-panel bg-grid rounded-3xl p-8", overlay ? "flex items-center justify-center" : "grid grid-cols-1 sm:grid-cols-2 gap-6")}>
              {overlay ? (
                <GlyphLabsDisplayOverlay
                  t={t}
                  fonts={fonts}
                  activeFonts={activeFonts}
                  selectedChar={selectedChar}
                  fontSize={fontSize}
                  showPoints={showPoints}
                  resolveFontCacheKey={resolveFontCacheKey}
                />
              ) : (
                <GlyphLabsDisplayGrid
                  fonts={fonts}
                  activeFonts={activeFonts}
                  selectedChar={selectedChar}
                  fontSize={fontSize}
                  showPoints={showPoints}
                  resolveFontCacheKey={resolveFontCacheKey}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  );
}
