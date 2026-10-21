import type { Metadata } from "next";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ExpertiseSection } from "@/components/ExpertiseSection";
import { CampaignCaseStudySection } from "@/components/CampaignCaseStudySection";
import { WorkingMethodSection } from "@/components/WorkingMethodSection";
import { ToolsSection } from "@/components/ToolsSection";
import { EducationSection } from "@/components/EducationSection";
import { ContactSection } from "@/components/ContactSection";
import { SiteFooter } from "@/components/SiteFooter";
import { getSeoMetadata } from "@/lib/db/seo";
import type { SeoMetadataRow } from "@/lib/db/types.ts";

/**
 * The page is prerendered and served from the full route cache.
 *
 * `revalidate` gives it an ISR window, which is what makes
 * `revalidatePath("/")` from the /admin console actually regenerate the HTML.
 * Without an explicit revalidate value the route is a one-shot static
 * artefact, and the admin's changes would never reach the public page.
 *
 * The content layer reads `content/*.json` from disk during the render, so a
 * regeneration picks up whatever the console last wrote.
 *
 * The value is a literal because Next requires a statically analysable segment
 * configuration. A static export prerenders every route regardless, so the
 * window is irrelevant there — see `scripts/build-pages.mjs`.
 */
export const revalidate = 3600;

/**
 * Per-page metadata, with the console's overrides applied on top of the
 * code defaults.
 *
 * A path with no override row keeps the defaults, so removing an override
 * restores them — the editor writes to the public page, it does not shadow it
 * with a copy.
 */
export async function generateMetadata(): Promise<Metadata> {
  // The override lives in the database, which a static export does not have.
  // If it cannot be read, the code defaults below are used — the export still
  // builds, and the console's overrides simply do not apply there.
  let override: SeoMetadataRow | null = null;
  try {
    override = await getSeoMetadata("/");
  } catch {
    override = null;
  }

  const title = override?.seo_title ?? undefined;
  const description = override?.meta_description ?? undefined;
  const canonical = override?.canonical_url ?? undefined;
  const ogTitle = override?.og_title ?? undefined;
  const ogDescription = override?.og_description ?? undefined;
  const ogImage = override?.og_image ?? undefined;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    ...(ogTitle || ogDescription || ogImage
      ? {
          openGraph: {
            title: ogTitle ?? title ?? undefined,
            description: ogDescription ?? description ?? undefined,
            ...(ogImage ? { images: [ogImage] } : {}),
          },
        }
      : {}),
    ...(override?.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ExpertiseSection />
      <CampaignCaseStudySection />
      <WorkingMethodSection />
      <ToolsSection />
      <EducationSection />
      <ContactSection />
      <SiteFooter />
    </>
  );
}
