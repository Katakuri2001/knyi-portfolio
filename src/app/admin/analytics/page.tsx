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
  deviceBreakdown,
  eventTypeBreakdown,
  landingPages,
  overviewMetrics,
  recentEvents,
  sessionSeries,
  visitorCount,
} from "@/lib/db/events";
import { resolveRange } from "@/lib/date-range";

export const metadata: Metadata = {
  title: "Analytics — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
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
  const series = sessionSeries(range);
  const channels = channelBreakdown(range);
  const devices = deviceBreakdown(range);
  const events = eventTypeBreakdown(range);
  const landings = landingPages(range, 12);
  const caseStudies = caseStudyInterest(range);
  const feed = recentEvents(20);
  const returning = visitorCount(range);

  const engagedRate =
    metrics.sessions > 0 ? metrics.engagedSessions / metrics.sessions : null;

  return (
    <>
      <PageHeader
        index="02"
        objective="B — Website visitor intelligence"
        title="Analytics"
        purpose={`What visitors did on the site, measured first-party. ${range.label}.`}
        actions={<DateRangePicker current={range.preset} />}
      />

      {metrics.totalEvents === 0 ? (
        <EmptyState
          title="No events have been recorded"
          body={
            <>
              Nothing has been tracked yet. Events start arriving once a
              visitor is tracked — either the first-party tracker, which needs
              consent, or Google Analytics, which needs a measurement id. See{" "}
              <a
                href="/admin/integrations"
                className="text-accent-ink underline underline-offset-4"
              >
                Integrations
              </a>
              .
            </>
          }
        />
      ) : null}

      <PanelGrid columns={4}>
        <StatCard
          label="Sessions"
          value={metrics.sessions}
          note={range.label}
        />
        <StatCard
          label="Unique visitors"
          value={returning}
          note="distinct pseudonymous ids"
        />
        <StatCard
          label="Engaged rate"
          value={engagedRate === null ? "—" : `${(engagedRate * 100).toFixed(1)}%`}
          note="30s+ or 2+ events"
        />
        <StatCard
          label="Total events"
          value={metrics.totalEvents}
          note="all tracked interactions"
        />
        <StatCard
          label="Previous period sessions"
          value={previous.sessions}
          note="the comparison window"
        />
        <StatCard
          label="Contact CTA clicks"
          value={metrics.contactClicks}
          note="contact and email links"
        />
        <StatCard
          label="Organic search sessions"
          value={metrics.organicSessions}
        />
        <StatCard
          label="Returning visitors"
          value={
            metrics.returningVisitorRate === null
              ? "—"
              : `${(metrics.returningVisitorRate * 100).toFixed(1)}%`
          }
        />
      </PanelGrid>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Sessions per day"
          description={`${range.label} · every day is shown, including the empty ones`}
        >
          <TrendChart data={series} label="Sessions per day" />
        </Panel>

        <Panel title="Acquisition channels" description="Sessions by channel">
          <BarChart
            label="Sessions by channel"
            data={channels.map((row) => ({
              label: row.channel.replace(/_/g, " "),
              value: row.sessions,
            }))}
          />
        </Panel>

        <Panel title="Devices" description="Sessions by device category">
          <BarChart
            label="Sessions by device"
            data={devices.map((row) => ({
              label: row.device,
              value: row.sessions,
            }))}
          />
        </Panel>

        <Panel title="Events by type" description="Everything that was tracked">
          <BarChart
            label="Events by type"
            data={events.map((row) => ({
              label: row.name.replace(/_/g, " "),
              value: row.count,
            }))}
          />
        </Panel>

        <Panel title="Landing pages" description="Where sessions begin">
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

        <Panel title="Case study interest" description="Views and contact clicks">
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

      <div className="mt-4">
        <Panel
          title="Recent events"
          description="The last 20 recorded interactions. Event data carries no personal details."
        >
          {feed.length === 0 ? (
            <EmptyState
              title="Nothing recorded yet"
              body="Events appear here as soon as a visitor is tracked."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-border text-meta text-muted-text">
                    <th className="py-2 pr-4 font-medium">Time (UTC)</th>
                    <th className="py-2 pr-4 font-medium">Event</th>
                    <th className="py-2 pr-4 font-medium">Path</th>
                    <th className="py-2 pr-4 font-medium">Channel</th>
                    <th className="py-2 pr-4 font-medium">Device</th>
                    <th className="py-2 font-medium">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {feed.map((event) => (
                    <tr key={event.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-geist-mono text-muted-text">
                        {new Date(event.occurred_at * 1000)
                          .toISOString()
                          .slice(5, 16)
                          .replace("T", " ")}
                      </td>
                      <td className="py-2 pr-4 text-foreground">
                        {event.name.replace(/_/g, " ")}
                      </td>
                      <td className="py-2 pr-4 text-muted-text">{event.path ?? "—"}</td>
                      <td className="py-2 pr-4 text-muted-text">
                        {(event.channel ?? "unknown").replace(/_/g, " ")}
                      </td>
                      <td className="py-2 pr-4 text-muted-text">
                        {event.device_category ?? "—"}
                      </td>
                      <td className="py-2 text-accent-ink">
                        {event.conversion ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
