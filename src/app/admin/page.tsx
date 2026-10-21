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
import {
  caseStudyInterest,
  channelBreakdown,
  eventTypeBreakdown,
  landingPages,
  leadSeries,
  overviewMetrics,
  sessionSeries,
} from "@/lib/db/events";
import { leadCounts } from "@/lib/db/leads";
import {
  comparisonIsMeaningful,
  percentChange,
  resolveRange,
} from "@/lib/date-range";
import { buildInsights } from "@/lib/insights";
import { integrationsOverview } from "@/lib/integrations";

export const metadata: Metadata = {
  title: "Overview — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage({
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
  const current = await overviewMetrics(range);
  const previous = await overviewMetrics(range.previous);

  const hasAnyData = current.totalEvents > 0 || current.leads > 0;

  const channels = await channelBreakdown(range);
  const series = await sessionSeries(range);
  const leadTrend = await leadSeries(range);
  const landings = await landingPages(range, 8);
  const caseStudies = await caseStudyInterest(range);
  const conversions = (await eventTypeBreakdown(range)).filter((row) =>
    ["contact_cta_click", "email_click", "contact_form_submit", "lead_created", "service_interest", "case_study_cta_click"].includes(
      row.name
    )
  );
  const counts = await leadCounts(range);

  const insights = buildInsights({
    visitors: current.visitors,
    previousVisitors: previous.visitors,
    organicSessions: current.organicSessions,
    previousOrganicSessions: previous.organicSessions,
    leads: current.leads,
    previousLeads: previous.leads,
    sessions: current.sessions,
    previousSessions: previous.sessions,
    topChannel: channels[0] ?? null,
    topCaseStudy: caseStudies[0] ?? null,
    hasAnyData,
  });

  const integrations = await integrationsOverview();

  function compare(
    value: number | null,
    previousValue: number | null
  ): { change: number | null; meaningful: boolean } {
    return {
      change: percentChange(value, previousValue),
      meaningful: comparisonIsMeaningful(value, previousValue),
    };
  }

  const visitorCompare = compare(current.visitors, previous.visitors);
  const organicCompare = compare(current.organicSessions, previous.organicSessions);
  const leadCompare = compare(current.leads, previous.leads);
  const sessionCompare = compare(current.sessions, previous.sessions);

  return (
    <>
      <PageHeader
        index="01"
        objective="Executive summary"
        title="Overview"
        purpose={`How the site performed across ${range.label.toLowerCase()}. Every figure is measured, not modelled.`}
        actions={<DateRangePicker current={range.preset} />}
      />

      {!hasAnyData ? (
        <div className="mb-6">
          <EmptyState
            title="No traffic has been recorded yet"
            body={
              <>
                Analytics is collecting nothing because no visitor has been
                tracked in this period, and because consent has not been given
                yet. Connect an integration on the{" "}
                <a
                  href="/admin/integrations"
                  className="text-accent-ink underline underline-offset-4"
                >
                  Integrations
                </a>{" "}
                page, or wait for the first visit.
              </>
            }
          />
        </div>
      ) : null}

      {/* KPI row */}
      <PanelGrid columns={4}>
        <StatCard
          label="Visitors"
          value={current.visitors}
          comparison={visitorCompare.meaningful ? visitorCompare.change : null}
          comparisonLabel="vs previous period"
          note={range.label}
        />
        <StatCard
          label="Sessions"
          value={current.sessions}
          comparison={sessionCompare.meaningful ? sessionCompare.change : null}
          comparisonLabel="vs previous period"
        />
        <StatCard
          label="Engaged sessions"
          value={current.engagedSessions}
          note="30s+ or 2+ events"
        />
        <StatCard
          label="Organic search sessions"
          value={current.organicSessions}
          comparison={organicCompare.meaningful ? organicCompare.change : null}
          comparisonLabel="vs previous period"
        />
        <StatCard
          label="Total enquiries"
          value={current.leads}
          comparison={leadCompare.meaningful ? leadCompare.change : null}
          comparisonLabel="vs previous period"
        />
        <StatCard
          label="Qualified enquiries"
          value={current.qualifiedLeads}
          note="qualified, proposal sent, or won"
        />
        <StatCard
          label="Enquiry conversion rate"
          value={
            current.conversionRate === null
              ? "—"
              : `${(current.conversionRate * 100).toFixed(1)}%`
          }
          note="enquiries ÷ sessions"
        />
        <StatCard
          label="Returning visitors"
          value={
            current.returningVisitorRate === null
              ? "—"
              : `${(current.returningVisitorRate * 100).toFixed(1)}%`
          }
          note="visited on more than one day"
        />
      </PanelGrid>

      {/* Insights */}
      {insights.length > 0 ? (
        <div className="mt-6 border border-border bg-surface p-5">
          <h2 className="text-eyebrow text-foreground">What the data shows</h2>
          <ul className="mt-3 space-y-2">
            {insights.map((insight) => (
              <li
                key={insight.id}
                className="flex items-start gap-3 text-[0.9375rem] leading-relaxed"
              >
                <span
                  aria-hidden="true"
                  className={[
                    "mt-2.5 block h-px w-3 flex-none",
                    insight.tone === "positive"
                      ? "bg-accent-ink"
                      : insight.tone === "negative"
                        ? "bg-red-800/60"
                        : "bg-border",
                  ].join(" ")}
                />
                <span className="text-foreground">{insight.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Charts */}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Visitor trend"
          description={`Sessions per day · ${range.label}`}
        >
          <TrendChart data={series} label="Sessions per day" />
        </Panel>

        <Panel
          title="Acquisition by channel"
          description={`Sessions and enquiries per channel · ${range.label}`}
        >
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

        <Panel title="Enquiries over time" description={`${range.label}`}>
          <TrendChart data={leadTrend} label="Enquiries per day" />
        </Panel>

        <Panel
          title="Conversion events"
          description="Interactions that show intent"
        >
          <BarChart
            label="Conversion events"
            data={conversions.map((row) => ({
              label: row.name.replace(/_/g, " "),
              value: row.count,
            }))}
          />
        </Panel>

        <Panel title="Top landing pages" description="Where sessions begin">
          <BarChart
            label="Landing pages by sessions"
            secondaryLabel="Enquiries"
            data={landings.map((row) => ({
              label: row.path,
              value: row.sessions,
              secondary: row.leads,
            }))}
          />
        </Panel>

        <Panel
          title="Top case studies"
          description="By views, with contact clicks"
        >
          <BarChart
            label="Case study views"
            secondaryLabel="CTA clicks"
            data={caseStudies.map((row) => ({
              label: row.title ?? row.id,
              value: row.views,
              secondary: row.cta_clicks,
            }))}
          />
        </Panel>
      </div>

      {/* Pipeline + integrations */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Enquiry pipeline" description="Current state of every lead">
          <dl>
            {(
              [
                ["new", "New"],
                ["contacted", "Contacted"],
                ["qualified", "Qualified"],
                ["proposal_sent", "Proposal sent"],
                ["won", "Won"],
                ["lost", "Lost"],
                ["archived", "Archived"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0"
              >
                <dt className="text-[0.875rem] text-foreground">{label}</dt>
                <dd className="font-geist-mono text-[0.9375rem] text-muted-text">
                  {counts[key] ?? 0}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href="/admin/leads"
            className="mt-4 inline-block text-[0.8125rem] text-accent-ink underline underline-offset-4"
          >
            Manage enquiries →
          </a>
        </Panel>

        <Panel
          title="Connected services"
          description="Live status of every integration"
        >
          <dl>
            {integrations.map((integration) => (
              <div
                key={integration.key}
                className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0"
              >
                <dt className="text-[0.875rem] text-foreground">
                  {integration.label}
                </dt>
                <dd className="text-right">
                  <span
                    className={[
                      "text-[0.6875rem] font-medium uppercase tracking-wide",
                      integration.status === "connected"
                        ? "text-accent-ink"
                        : integration.status === "error"
                          ? "text-red-900"
                          : "text-muted-text",
                    ].join(" ")}
                  >
                    {integration.status.replace(/_/g, " ")}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <a
            href="/admin/integrations"
            className="mt-4 inline-block text-[0.8125rem] text-accent-ink underline underline-offset-4"
          >
            All integrations →
          </a>
        </Panel>
      </div>
    </>
  );
}
