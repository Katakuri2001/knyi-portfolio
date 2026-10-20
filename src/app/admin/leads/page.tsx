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
import { LeadManager } from "@/components/admin/LeadManager";
import { leadCounts, leadsByCampaign } from "@/lib/db/leads";
import { overviewMetrics } from "@/lib/db/events";
import { resolveRange } from "@/lib/date-range";

export const metadata: Metadata = {
  title: "Conversions & leads — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LeadsPage({
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

  const counts = leadCounts(range);
  const metrics = overviewMetrics(range);
  const byCampaign = leadsByCampaign(range);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <>
      <PageHeader
        index="05"
        objective="C — Lead generation"
        title="Conversions & leads"
        purpose={`Every enquiry, where it came from, and where it is in the pipeline. ${range.label}.`}
        actions={<DateRangePicker current={range.preset} />}
      />

      <PanelGrid columns={4}>
        <StatCard label="Total enquiries" value={total} note={range.label} />
        <StatCard label="New" value={counts.new ?? 0} />
        <StatCard
          label="Qualified and beyond"
          value={
            (counts.qualified ?? 0) +
            (counts.proposal_sent ?? 0) +
            (counts.won ?? 0)
          }
        />
        <StatCard
          label="Enquiry conversion rate"
          value={
            metrics.conversionRate === null
              ? "—"
              : `${(metrics.conversionRate * 100).toFixed(1)}%`
          }
          note="enquiries ÷ sessions"
        />
      </PanelGrid>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Pipeline" description="Where every enquiry currently sits">
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
        </Panel>

        <Panel
          title="Enquiries by campaign"
          description="Attribution recorded at the moment of submission"
        >
          {byCampaign.length === 0 ? (
            <EmptyState
              title="No attributed enquiries"
              body="Enquiries submitted with a campaign in the URL are grouped here. Unattributed enquiries are shown as “Unattributed” rather than being guessed."
            />
          ) : (
            <BarChart
              label="Enquiries by campaign"
              secondaryLabel="Qualified"
              data={byCampaign.map((row) => ({
                label: `${row.campaign}${
                  row.source ? ` · ${row.source}` : ""
                }`,
                value: row.leads,
                secondary: row.qualified,
              }))}
            />
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="All enquiries"
          description="Search, filter and update. Lead details are private and are never sent to an analytics provider."
        >
          <LeadManager />
        </Panel>
      </div>
    </>
  );
}
