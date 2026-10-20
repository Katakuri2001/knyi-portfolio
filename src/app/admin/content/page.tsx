import type { Metadata } from "next";
import { PageHeader, Panel } from "@/components/admin/ui";
import { CaseStudyManager } from "@/components/admin/CaseStudyManager";
import { getCaseStudies } from "@/lib/content";

export const metadata: Metadata = {
  title: "Content & case studies — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The case-study editor, moved under Content.
 *
 * The editor itself is unchanged — the same create, edit, delete, reorder and
 * image upload it has always had. It now sits inside the console's navigation
 * rather than being the whole console.
 */
export default async function ContentPage() {
  const studies = getCaseStudies();

  return (
    <>
      <PageHeader
        index="07"
        objective="G — Content management"
        title="Content & case studies"
        purpose="The work you have finished. The first entry is the featured case study on the public site; the rest alternate between the two supporting layouts."
      />

      <Panel
        title="Case studies"
        description="Everything published in the Work section."
      >
        <CaseStudyManager
          key={studies.map((study) => study.id).join(",")}
          initial={studies}
        />
      </Panel>
    </>
  );
}
