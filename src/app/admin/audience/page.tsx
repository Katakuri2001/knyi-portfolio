import type { Metadata } from "next";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import {
  BarChart,
  EmptyState,
  PageHeader,
  Panel,
  PanelGrid,
  StatCard,
} from "@/components/admin/ui";
import {
  caseStudyInterest,
  deviceBreakdown,
  landingPages,
  overviewMetrics,
  serviceInterest,
} from "@/lib/db/events";
import { resolveRange } from "@/lib/date-range";

export const metadata: Metadata = {
  title: "Audience intelligence — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AudiencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  );
  const range = resolveRange(flat);

  const metrics = await overviewMetrics(range);
  const devices = await deviceBreakdown(range);
  const services = await serviceInterest(range);
  const landings = await landingPages(range, 10);
  const caseStudies = await caseStudyInterest(range);

  const hasData =
    metrics.sessions > 0 || metrics.leads > 0 || devices.length > 0;

  return (
    <>
      <PageHeader
        index="06"
        objective="D — Remarketing audiences"
        title="Audience intelligence"
        purpose={`Who the site is reaching, in aggregate. ${range.label}.`}
        actions={<DateRangePicker current={range.preset} />}
      />

      <div className="mb-6 border-l-2 border-accent-ink/50 bg-surface px-5 py-4">
        <p className="text-[0.875rem] leading-relaxed text-muted-text">
          Everything here is <strong className="font-medium text-foreground">aggregate</strong>.
          A visitor is a random pseudonymous id — there is no name, no email, no
          IP address and no device fingerprinting, so no individual can be
          identified or tracked across sites. Segments for remarketing are built
          from these behaviours on your own property, and are only activated
          where a visitor has given marketing consent.
        </p>
      </div>

      {!hasData ? (
        <EmptyState
          title="No audience data yet"
          body="Once visitors are tracked, this page shows what kind of visits and content they are. Nothing is inferred about who they are."
        />
      ) : null}

      <PanelGrid columns={4}>
        <StatCard label="Visitors" value={metrics.visitors} />
        <StatCard
          label="Returning visitors"
          value={
            metrics.returningVisitorRate === null
              ? "—"
              : `${(metrics.returningVisitorRate * 100).toFixed(1)}%`
          }
          note="visited on more than one day"
        />
        <StatCard label="Enquiries" value={metrics.leads} />
        <StatCard
          label="Enquiries with a service stated"
          value={
            services.find((row) => row.service !== "unspecified")?.count ?? 0
          }
          note="the service they asked about"
        />
      </PanelGrid>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Device category" description="Where the visits came from">
          <BarChart
            label="Sessions by device"
            data={devices.map((row) => ({
              label: row.device,
              value: row.sessions,
            }))}
          />
        </Panel>

        <Panel
          title="Service interest"
          description="What people said they needed, from the enquiry form"
        >
          {services.length === 0 ? (
            <EmptyState
              title="No service interest recorded"
              body="Enquiries that name a service are grouped here. Enquiries without one are shown as unspecified rather than being guessed at."
            />
          ) : (
            <BarChart
              label="Enquiries by service"
              data={services.map((row) => ({
                label: row.service,
                value: row.count,
              }))}
            />
          )}
        </Panel>

        <Panel
          title="Most visited pages"
          description="Landing pages, by session"
        >
          <BarChart
            label="Landing pages by sessions"
            data={landings.map((row) => ({
              label: row.path,
              value: row.sessions,
            }))}
          />
        </Panel>

        <Panel
          title="Most visited case studies"
          description="Which work people actually look at"
        >
          {caseStudies.length === 0 ? (
            <EmptyState
              title="No case study views yet"
              body="Case study views are recorded when a visitor reaches a case study section."
            />
          ) : (
            <BarChart
              label="Case study views"
              secondaryLabel="CTA clicks"
              data={caseStudies.map((row) => ({
                label: row.title ?? row.id,
                value: row.views,
                secondary: row.cta_clicks,
              }))}
            />
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Remarketing audiences"
          description="Behaviours that can be turned into an audience"
        >
          <dl>
            {[
              [
                "Viewed a service",
                "A visitor reached the expertise or tools section.",
                "metaAds, contentStrategy, marketingAnalysis",
              ],
              [
                "Viewed a case study",
                "A visitor reached a case study in the Work section.",
                "case_study_view",
              ],
              [
                "Started the contact form",
                "A visitor began filling in the enquiry form but may not have sent it.",
                "contact_form_start",
              ],
              [
                "Sent the enquiry",
                "A visitor submitted the form successfully.",
                "contact_form_submit, lead_created",
              ],
              [
                "Clicked a contact link",
                "A visitor clicked the email or contact action.",
                "contact_cta_click, email_click",
              ],
            ].map(([title, description, event]) => (
              <div
                key={title}
                className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-12 sm:gap-6"
              >
                <dt className="text-[0.875rem] font-medium text-foreground sm:col-span-3">
                  {title}
                </dt>
                <dd className="text-[0.8125rem] leading-relaxed text-muted-text sm:col-span-6">
                  {description}
                </dd>
                <dd className="font-geist-mono text-[0.6875rem] text-muted-text sm:col-span-3">
                  {event}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[0.75rem] leading-relaxed text-muted-text">
            These are the behaviours your own site records. A platform audience
            is only created when the pixel is configured and the visitor has
            given marketing consent — see Integrations.
          </p>
        </Panel>
      </div>
    </>
  );
}
