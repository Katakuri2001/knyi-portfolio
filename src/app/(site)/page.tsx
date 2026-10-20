import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ExpertiseSection } from "@/components/ExpertiseSection";
import { CampaignCaseStudySection } from "@/components/CampaignCaseStudySection";
import { WorkingMethodSection } from "@/components/WorkingMethodSection";
import { ToolsSection } from "@/components/ToolsSection";
import { EducationSection } from "@/components/EducationSection";
import { ContactSection } from "@/components/ContactSection";
import { SiteFooter } from "@/components/SiteFooter";

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
 */
export const revalidate = 3600;

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