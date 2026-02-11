"use client"

import { useTranslations, useLocale } from "next-intl"
import { cn } from "@/lib/utils"
import { SectionWrapper } from "@/components/section-wrapper"
import { SectionHeader } from "@/components/section-header"
import { Slider } from "@/components/ui/slider"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/** Headline text is displayed ~2.67x larger than body to mimic a typical heading/body ratio */
const HEADLINE_SCALE = 2.67

type ComparisonFont = {
  name: string
  family: string
  dotClass: string
  latinOnly: boolean
}

type TranslationFn = (key: string, values?: Record<string, string>) => string

interface PreviewControlsProps {
  size: number
  weight: number
  comparisonFonts: ComparisonFont[]
  visibleFonts: Set<string>
  setSize: (size: number) => void
  setWeight: (weight: number) => void
  toggleFont: (name: string) => void
  t: TranslationFn
}

interface PreviewSampleProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  ariaLabel: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  textareaClassName: string
  textClassName: string
  textareaStyle: React.CSSProperties
  rows: number
  fontSize: number
  fontWeight: number
  activeFonts: ComparisonFont[]
  displayText: string
  autoResize: (el: HTMLTextAreaElement | null) => void
  t: TranslationFn
}

function FontComparisonList({
  fonts,
  displayText,
  fontSize,
  fontWeight,
  textClassName,
  t,
}: {
  fonts: ComparisonFont[]
  displayText: string
  fontSize: number
  fontWeight: number
  textClassName: string
  t: (key: string, values?: Record<string, string>) => string
}) {
  return (
    <>
      {fonts.map((f) => (
        <div key={f.name} className="pl-4 border-l-2 border-line-strong">
          <div
            className={cn(textClassName, "opacity-80")}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight,
              fontFamily: `'${f.family}', sans-serif`,
            }}
          >
            {displayText}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn("h-1.5 w-1.5 rounded-full", f.latinOnly ? "bg-gray-400" : f.dotClass)}
              aria-hidden="true"
            />
            <span className="type-micro text-warm-muted">{f.latinOnly ? "system-ui" : f.name}</span>
            {f.latinOnly && (
              <span className="type-micro text-warm-muted opacity-60">({t("latinOnlyNotice", { fontName: f.name })})</span>
            )}
          </div>
        </div>
      ))}
    </>
  )
}

function SourceFontLabel({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="mt-2 flex items-center gap-2">
      <span
        className="h-1.5 w-1.5 rounded-full bg-emerald-500"
        aria-hidden="true"
      />
      <span className="type-micro text-warm-muted">Sunghyun Sans</span>
    </div>
  )
}

function useAutoResizeTextarea(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  deps: readonly unknown[]
) {
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      autoResize(ref.current)
    })
    return () => cancelAnimationFrame(raf)
  }, [autoResize, ref, ...deps])

  return autoResize
}

function PreviewControls({
  size,
  weight,
  comparisonFonts,
  visibleFonts,
  setSize,
  setWeight,
  toggleFont,
  t,
}: PreviewControlsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-preview gap-x-8 gap-y-4 pb-8 border-b border-line">
      <div className="flex flex-col justify-between gap-2">
        <div className="flex items-baseline justify-between h-5">
          <span className="text-xs font-medium text-warm-muted uppercase tracking-wider">
            {t("sizeLabel")}
          </span>
          <span className="text-xs font-mono text-ink tabular-nums">
            {size}px
          </span>
        </div>
        <Slider
          aria-label={t("sizeLabel")}
          min={12}
          max={72}
          step={1}
          defaultValue={[18]}
          value={[size]}
          onValueChange={(v) => setSize(v[0])}
          className="cursor-pointer"
        />
      </div>

      <div className="flex flex-col justify-between gap-2">
        <div className="flex items-baseline justify-between h-5">
          <span className="text-xs font-medium text-warm-muted uppercase tracking-wider">
            {t("weightLabel")}
          </span>
          <span className="text-xs font-mono text-ink tabular-nums">
            {weight}
          </span>
        </div>
        <Slider
          aria-label={t("weightLabel")}
          min={100}
          max={900}
          step={100}
          defaultValue={[400]}
          value={[weight]}
          onValueChange={(v) => setWeight(v[0])}
          className="cursor-pointer"
        />
      </div>

      <div className="flex flex-col justify-between gap-2">
        <div className="h-5 flex items-baseline">
          <span className="text-xs font-medium text-warm-muted uppercase tracking-wider">
            {t("compareLabel")}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {comparisonFonts.map((f) => (
            <button
              type="button"
              key={f.name}
              onClick={() => toggleFont(f.name)}
              aria-pressed={visibleFonts.has(f.name)}
              className={cn(
                "focus-ring flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-[color,background-color,border-color,box-shadow]",
                visibleFonts.has(f.name)
                  ? "bg-ink text-white shadow-sm"
                  : "border border-line-strong bg-transparent text-warm-muted hover:border-ink hover:text-ink"
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full", f.dotClass)}
                aria-hidden="true"
              />
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewSample({
  textareaRef,
  ariaLabel,
  name,
  value,
  onChange,
  placeholder,
  textareaClassName,
  textClassName,
  textareaStyle,
  rows,
  fontSize,
  fontWeight,
  activeFonts,
  displayText,
  autoResize,
  t,
}: PreviewSampleProps) {
  return (
    <div className="space-y-8">
      <div className="relative group">
        <textarea
          ref={textareaRef}
          aria-label={ariaLabel}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={textareaClassName}
          style={textareaStyle}
          rows={rows}
          onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
        />
        <SourceFontLabel visible={activeFonts.length > 0} />
      </div>

      <FontComparisonList
        fonts={activeFonts}
        displayText={displayText}
        fontSize={fontSize}
        fontWeight={fontWeight}
        textClassName={textClassName}
        t={t}
      />
    </div>
  )
}

const PRETENDARD_VARIANTS: Record<string, { name: string; family: string }> = {
  en: { name: "Pretendard Std", family: "Pretendard Std" },
  kr: { name: "Pretendard", family: "Pretendard" },
  jp: { name: "Pretendard JP", family: "Pretendard JP" },
}

function getComparisonFonts(locale: string) {
  const pretendard = PRETENDARD_VARIANTS[locale] ?? PRETENDARD_VARIANTS.en
  const latinOnly = locale === "kr" || locale === "jp"
  return [
    { name: "Open Runde", family: "Open Runde", dotClass: "bg-amber-500", latinOnly },
    { name: "Inter", family: "Inter", dotClass: "bg-violet-500", latinOnly },
    { name: pretendard.name, family: pretendard.family, dotClass: "bg-blue-500", latinOnly: false },
  ]
}

export function PreviewSection() {
  const t = useTranslations("Preview")
  const locale = useLocale()
  const comparisonFonts = useMemo(() => getComparisonFonts(locale), [locale])

  const [size, setSize] = useState(18)
  const [weight, setWeight] = useState(400)
  const [headlineText, setHeadlineText] = useState("")
  const [bodyText, setBodyText] = useState("")
  const [visibleFonts, setVisibleFonts] = useState<Set<string>>(new Set())

  const defaultHeadline = t("headlineText")
  const defaultBody = t("bodyText")

  const headlineRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const resizeDeps = [headlineText, bodyText, size, weight] as const
  const autoResizeHeadline = useAutoResizeTextarea(headlineRef, resizeDeps)
  const autoResizeBody = useAutoResizeTextarea(bodyRef, resizeDeps)

  const toggleFont = (name: string) => {
    setVisibleFonts((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const activeFonts = useMemo(
    () => comparisonFonts.filter((f) => visibleFonts.has(f.name)),
    [comparisonFonts, visibleFonts]
  )

  const displayHeadline = headlineText || defaultHeadline
  const displayBody = bodyText || defaultBody

  return (
    <SectionWrapper id="preview" bg="paper-2">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-1/4 shrink-0">
          <SectionHeader
            label={t("badge")}
            title={t("title")}
            description={t("description")}
            className="mb-0"
          />
        </div>

        <div className="w-full lg:w-3/4">
          <div className="bg-surface border border-line-strong rounded-3xl p-6 md:p-8 flex flex-col min-h-panel">

            <PreviewControls
              size={size}
              weight={weight}
              comparisonFonts={comparisonFonts}
              visibleFonts={visibleFonts}
              setSize={setSize}
              setWeight={setWeight}
              toggleFont={toggleFont}
              t={t}
            />

            <div className="flex-1 flex flex-col gap-16 pt-8">

              <PreviewSample
                textareaRef={headlineRef}
                ariaLabel={t("headlineInputLabel")}
                name="preview-headline"
                value={headlineText}
                onChange={setHeadlineText}
                placeholder={defaultHeadline}
                textareaClassName="focus-ring w-full resize-none rounded-md bg-transparent text-ink leading-none tracking-tight placeholder:text-ink/30"
                textClassName="text-ink tracking-tight leading-none break-words"
                textareaStyle={{ fontSize: `${size * HEADLINE_SCALE}px`, fontWeight: weight }}
                rows={1}
                fontSize={size * HEADLINE_SCALE}
                fontWeight={weight}
                activeFonts={activeFonts}
                displayText={displayHeadline}
                autoResize={autoResizeHeadline}
                t={t}
              />

              <PreviewSample
                textareaRef={bodyRef}
                ariaLabel={t("bodyInputLabel")}
                name="preview-body"
                value={bodyText}
                onChange={setBodyText}
                placeholder={defaultBody}
                textareaClassName="focus-ring w-full resize-none rounded-md bg-transparent text-ink-2 leading-relaxed placeholder:text-ink-2/30"
                textClassName="text-ink-2 leading-relaxed"
                textareaStyle={{ fontSize: `${size}px`, fontWeight: weight }}
                rows={3}
                fontSize={size}
                fontWeight={weight}
                activeFonts={activeFonts}
                displayText={displayBody}
                autoResize={autoResizeBody}
                t={t}
              />

            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
