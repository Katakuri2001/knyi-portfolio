import type { Metadata } from "next";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import {
  BarChart,
  EmptyState,
  PageHeader,
  Panel,
  PanelGrid,
  StatCard,
  TrendChart,
} from "@/components/admin/ui";
import { ReportExports } from "@/components/admin/ReportExports";
import {
  caseStudyInterest,
  channelBreakdown,
  eventTypeBreakdown,
  landingPages,
  leadSeries,
  overviewMetrics,
  sessionSeries,
} from "@/lib/db/events";
import { leadCounts, leadsByCampaign } from "@/lib/db/leads";
import { listExperiments } from "@/lib/db/experiments";
import { resolveRange } from "@/lib/date-range";

export const metadata: Metadata = {
  title: "Reports — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ReportsPage({
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

  const metrics = overviewMetrics(range);
  const previous = overviewMetrics(range.previous);
  const counts = leadCounts(range);
  const channels = channelBreakdown(range);
  const landings = landingPages(range, 8);
  const caseStudies = caseStudyInterest(range);
  const conversions = eventTypeBreakdown(range);
  const experiments = listExperiments();

  const exportQuery = new URLSearchParams({
    range: range.preset,
    ...(range.preset === "custom"
      ? { from: flat.from ?? "", to: flat.to ?? "" }
      : {}),
  }).toString();

  return (
    <>
      <PageHeader
        index="10"
        objective="F — Business development"
        title="Reports"
        purpose={`A single view of the period, built from the same data as the rest of the console. ${range.label}.`}
        actions={<DateRangePicker current={range.preset} />}
      />

      <Panel
        title="Export"
        description="CSV, for the same period. Values that could be read as a spreadsheet formula are escaped, and the message body is left out unless you ask for it."
      >
        <ReportExports exportQuery={exportQuery} />
      </Panel>

      <div className="mt-4">
        <PanelGrid columns={4}>
          <StatCard label="Visitors" value={metrics.visitors} />
          <StatCard label="Sessions" value={metrics.sessions} />
          <StatCard
            label="Previous period sessions"
            value={previous.sessions}
            note="the comparison window"
          />
          <StatCard label="Enquiries" value={metrics.leads} />
          <StatCard label="Qualified and beyond" value={metrics.qualifiedLeads} />
          <StatCard
            label="Contact clicks"
            value={metrics.contactClicks}
          />
          <StatCard
            label="Engaged sessions"
            value={metrics.engagedSessions}
          />
          <StatCard
            label="Organic search sessions"
            value={metrics.organicSessions}
          />
        </PanelGrid>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Traffic over time" description="Sessions per day">
          <TrendChart data={sessionSeries(range)} label="Sessions per day" />
        </Panel>

        <Panel title="Enquiries over time" description="New enquiries per day">
          <TrendChart data={leadSeries(range)} label="Enquiries per day" />
        </Panel>

        <Panel title="Acquisition" description="Sessions and enquiries by channel">
          <BarChart
            label="Sessions by channel"
            secondaryLabel="Enquiries"
            data={channels.map((row) => ({
              label: row.channel.replace(/_/g, " "),
              value: row.sessions,
              secondary: row.leads,
            }))}
          />
        </Panel>

        <Panel title="Conversion events" description="Interactions with intent">
          <BarChart
            label="Conversion events"
            data={conversions.map((row) => ({
              label: row.name.replace(/_/g, " "),
              value: row.count,
            }))}
          />
        </Panel>

        <Panel title="Top content" description="Landing pages and case studies">
          <BarChart
            label="Top landing pages"
            data={landings.map((row) => ({
              label: row.path,
              value: row.sessions,
            }))}
          />
        </Panel>

        <Panel title="Campaign performance" description="Enquiries by campaign">
          {leadsByCampaign(range).length === 0 ? (
            <EmptyState
              title="No attributed enquiries"
              body="Enquiries with a campaign in the URL appear here."
            />
          ) : (
            <BarChart
              label="Enquiries by campaign"
              secondaryLabel="Qualified"
              data={leadsByCampaign(range).map((row) => ({
                label: row.campaign,
                value: row.leads,
                secondary: row.qualified,
              }))}
            />
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Case study performance" description="Views and contact clicks">
          {caseStudies.length === 0 ? (
            <EmptyState
              title="No case study views"
              body="Views are recorded when a visitor reaches a case study."
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

        <Panel
          title="Experiment outcomes"
          description="Your own recorded results — no significance is claimed"
        >
          {experiments.length === 0 ? (
            <EmptyState
              title="No experiments recorded"
              body="The experiment log records what you changed and what you observed."
            />
          ) : (
            <ul className="divide-y divide-border">
              {experiments.map((experiment) => (
                <li key={experiment.id} className="py-3">
                  <p className="text-[0.875rem] leading-relaxed text-foreground">
                    {experiment.hypothesis}
                  </p>
                  <p className="mt-1 font-geist-mono text-[0.6875rem] text-muted-text">
                    {experiment.status}
                    {experiment.result ? ` · ${experiment.result}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Pipeline summary" description="Enquiries by status">
          <dl className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(counts).map(([status, count]) => (
              <div
                key={status}
                className="flex items-baseline justify-between gap-4 border-b border-border py-2.5"
              >
                <dt className="text-[0.875rem] text-foreground">
                  {status.replace(/_/g, " ")}
                </dt>
                <dd className="font-geist-mono text-[0.9375rem] text-muted-text">
                  {count}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
}
