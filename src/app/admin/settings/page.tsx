import type { Metadata } from "next";
import { PageHeader, Panel, PanelGrid } from "@/components/admin/ui";
import { ProfileEditor } from "@/components/admin/ProfileEditor";
import { getProfile } from "@/lib/content";
import { getCaseStudies } from "@/lib/content";
import { listSeoMetadata } from "@/lib/db/seo";
import { INTEGRATIONS } from "@/lib/integrations";

export const metadata: Metadata = {
  title: "Settings — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getProfile();
  const caseStudies = await getCaseStudies();
  const overrides = await listSeoMetadata();

  return (
    <>
      <PageHeader
        index="11"
        objective="G — Content management"
        title="Settings"
        purpose="Your details, the site's configuration, and what the console can see."
      />

      <Panel
        title="Profile and contact details"
        description="These appear on the public site — the hero, the About section and the Contact section."
      >
        <ProfileEditor profile={profile} />
      </Panel>

      <div className="mt-4">
        <PanelGrid columns={2}>
          <Panel title="Content" description="What the public site is made of">
            <dl>
              {[
                ["Profile fields", Object.keys(profile).length],
                ["Case studies", caseStudies.length],
                ["SEO metadata overrides", overrides.length],
                [
                  "Service groups",
                  3,
                ],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0"
                >
                  <dt className="text-[0.875rem] text-foreground">
                    {label as string}
                  </dt>
                  <dd className="font-geist-mono text-[0.9375rem] text-muted-text">
                    {value as number}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel
            title="Environment"
            description="What this deployment is configured with"
          >
            <dl>
              {[
                ["Node version", process.version],
                ["Data directory", "./data (inside the project)"],
                [
                  "Public site URL",
                  process.env.NEXT_PUBLIC_SITE_URL ?? "not set",
                ],
                ["Base path", process.env.NEXT_PUBLIC_BASE_PATH ?? "(root)"],
                ["Admin password", process.env.ADMIN_PASSWORD ? "set" : "not set"],
                [
                  "Google service account",
                  process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "set" : "not set",
                ],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0"
                >
                  <dt className="text-[0.875rem] text-foreground">
                    {label as string}
                  </dt>
                  <dd className="max-w-[60%] truncate text-right font-geist-mono text-[0.75rem] text-muted-text">
                    {value as string}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[0.75rem] leading-relaxed text-muted-text">
              Only whether a variable is set is shown. No value, and no secret,
              is ever rendered into the page.
            </p>
          </Panel>
        </PanelGrid>
      </div>

      <div className="mt-4">
        <Panel
          title="Content export"
          description="The live content, as a file"
        >
          <p className="max-w-prose text-[0.875rem] leading-relaxed text-muted-text">
            The site&apos;s copy lives in the database, so the console can
            write to it on a platform with no filesystem. The files in
            <code className="mx-1 font-geist-mono text-[0.8125rem]">content/</code>
            are the seed that a fresh deployment starts from. Download the
            current content to keep the repository in step with what the site
            is serving.
          </p>
          <a
            href="/api/admin/content/export"
            download
            className="glass-primary mt-4 inline-flex items-center gap-2 px-4 py-2.5"
          >
            Download the current content
          </a>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Integrations summary"
          description="The full list, with setup instructions, is on the Integrations page."
        >
          <ul className="divide-y divide-border">
            {INTEGRATIONS.map((integration) => (
              <li
                key={integration.key}
                className="flex flex-wrap items-baseline justify-between gap-3 py-2.5"
              >
                <span className="text-[0.875rem] text-foreground">
                  {integration.label}
                </span>
                <span className="text-[0.8125rem] text-muted-text">
                  {integration.purpose}
                </span>
              </li>
            ))}
          </ul>
          <a
            href="/admin/integrations"
            className="mt-4 inline-block text-[0.8125rem] text-accent-ink underline underline-offset-4"
          >
            Open Integrations →
          </a>
        </Panel>
      </div>
    </>
  );
}
