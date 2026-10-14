import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ExpertiseSection } from "@/components/ExpertiseSection";
import { CampaignCaseStudySection } from "@/components/CampaignCaseStudySection";
import { WorkingMethodSection } from "@/components/WorkingMethodSection";
import { ToolsSection } from "@/components/ToolsSection";
import { EducationSection } from "@/components/EducationSection";
import { ContactSection } from "@/components/ContactSection";
import { SiteFooter } from "@/components/SiteFooter";

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