import { HeroSection } from "@/components/hero-section";
import { WeightShowcase } from "@/components/weight-showcase";
import { PreviewSection } from "@/components/preview-section";
import { OpenTypeSection } from "@/components/opentype-section";
import { InfoSection } from "@/components/info-section";
import { LicensePricingSection } from "@/components/license-pricing-section";
import { CTASection } from "@/components/cta-section";
import dynamic from "next/dynamic";
import { GlyphLabsLoading } from "@/components/glyph-labs/glyph-labs-loading";

const GlyphLabsSection = dynamic(
  () =>
    import("@/components/glyph-labs/glyph-labs-section").then(
      (mod) => mod.GlyphLabsSection
    ),
  {
    loading: () => <GlyphLabsLoading />,
  }
);

export default function Home() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-background selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-100"
    >
      <HeroSection />
      <WeightShowcase />
      <PreviewSection />
      <GlyphLabsSection />
      <OpenTypeSection />
      <InfoSection />
      <LicensePricingSection />
      <CTASection />
    </main>
  );
}
