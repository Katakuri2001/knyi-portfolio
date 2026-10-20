/**
 * The console's information architecture.
 *
 * One list, used by the navigation, the page headers and the sitemap check.
 * The route is derived from the key so a new section cannot be added to the nav
 * without also getting a page.
 */

export type ConsoleSection = {
  key: string;
  href: string;
  label: string;
  /** One line explaining what the section is for. */
  purpose: string;
  /** The business objective this section serves. */
  objective: string;
};

export const CONSOLE_SECTIONS: ConsoleSection[] = [
  {
    key: "overview",
    href: "/admin",
    label: "Overview",
    purpose: "The whole picture on one page — traffic, search, leads and revenue signals.",
    objective: "Executive summary",
  },
  {
    key: "analytics",
    href: "/admin/analytics",
    label: "Analytics",
    purpose: "Visitor behaviour, acquisition and engagement over time.",
    objective: "B — Website visitor intelligence",
  },
  {
    key: "seo",
    href: "/admin/seo",
    label: "SEO intelligence",
    purpose: "Search visibility, technical issues, and page-level metadata.",
    objective: "A — Organic search growth",
  },
  {
    key: "campaigns",
    href: "/admin/campaigns",
    label: "Acquisition & campaigns",
    purpose: "Where visitors came from, which campaigns ran, and what they produced.",
    objective: "C — Lead generation",
  },
  {
    key: "leads",
    href: "/admin/leads",
    label: "Conversions & leads",
    purpose: "Every enquiry, its source, and where it is in the pipeline.",
    objective: "C — Lead generation",
  },
  {
    key: "audience",
    href: "/admin/audience",
    label: "Audience intelligence",
    purpose: "Aggregate audience composition and the content that attracts it.",
    objective: "D — Remarketing audiences",
  },
  {
    key: "content",
    href: "/admin/content",
    label: "Content & case studies",
    purpose: "The portfolio content, including the case-study editor.",
    objective: "G — Content management",
  },
  {
    key: "experiments",
    href: "/admin/experiments",
    label: "Experiments & optimisation",
    purpose: "A log of what you changed, what you measured, and what happened.",
    objective: "E — Conversion optimisation",
  },
  {
    key: "integrations",
    href: "/admin/integrations",
    label: "Integrations",
    purpose: "The live status of every connected service, and how to connect more.",
    objective: "F — Business development",
  },
  {
    key: "reports",
    href: "/admin/reports",
    label: "Reports",
    purpose: "Period summaries and exports, built from the same data as the dashboard.",
    objective: "F — Business development",
  },
  {
    key: "settings",
    href: "/admin/settings",
    label: "Settings",
    purpose: "Profile, contact details, and the site's own configuration.",
    objective: "G — Content management",
  },
];

export function sectionFor(key: string): ConsoleSection | undefined {
  return CONSOLE_SECTIONS.find((section) => section.key === key);
}
