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
import { CampaignRegister } from "@/components/admin/CampaignRegister";
import { channelBreakdown, landingPages } from "@/lib/db/events";
import { listObservations } from "@/lib/db/campaigns";
import { leadsByCampaign } from "@/lib/db/leads";
import { resolveRange } from "@/lib/date-range";

export const metadata: Metadata = {
  title: "Acquisition & campaigns — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CampaignsPage({
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

  const channels = await channelBreakdown(range);
  const landings = await landingPages(range, 10);
  const observations = await listObservations();
  const byCampaign = await leadsByCampaign(range);

  const attributed = observations.filter((row) => row.campaign);

  return (
    <>
      <PageHeader
        index="04"
        objective="C — Lead generation"
        title="Acquisition & campaigns"
        purpose={`Where the traffic came from and which campaigns produced enquiries. ${range.label}.`}
        actions={<DateRangePicker current={range.preset} />}
      />

      <div className="mb-6 border-l-2 border-accent-ink/50 bg-surface px-5 py-4">
        <p className="text-[0.875rem] leading-relaxed text-foreground">
          <strong className="font-medium">
            Two different things are shown here, and they are not merged.
          </strong>{" "}
          <span className="text-muted-text">
            <em>Observed</em> traffic is what actually arrived, measured from
            the UTM parameters on incoming visits. <em>Registered</em> campaigns
            are your own records of what a campaign was for. Cost per lead and
            return on ad spend are not shown, because no advertising spend data
            is connected — inventing one would be worse than leaving it out.
          </span>
        </p>
      </div>

      <PanelGrid columns={4}>
        <StatCard
          label="Campaigns observed"
          value={attributed.length}
          note="distinct UTM campaigns seen"
        />
        <StatCard
          label="Campaign sessions"
          value={attributed.reduce((sum, row) => sum + row.sessions, 0)}
        />
        <StatCard
          label="Enquiries from campaigns"
          value={byCampaign
            .filter((row) => row.campaign !== "Unattributed")
            .reduce((sum, row) => sum + row.leads, 0)}
        />
        <StatCard
          label="Unattributed enquiries"
          value={
            byCampaign.find((row) => row.campaign === "Unattributed")?.leads ??
            0
          }
          note="shown, not guessed"
        />
      </PanelGrid>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Observed campaigns"
          description="UTM combinations that actually arrived"
        >
          {observations.length === 0 ? (
            <EmptyState
              title="No campaign traffic yet"
              body="Campaigns appear here when a visit arrives with UTM parameters. Tag your links with utm_source, utm_medium and utm_campaign."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-border text-meta text-muted-text">
                    <th className="py-2 pr-3 font-medium">Source</th>
                    <th className="py-2 pr-3 font-medium">Medium</th>
                    <th className="py-2 pr-3 font-medium">Campaign</th>
                    <th className="py-2 pr-3 text-right font-medium">Sessions</th>
                    <th className="py-2 text-right font-medium">Enquiries</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((row) => (
                    <tr
                      key={`${row.source}-${row.medium}-${row.campaign}`}
                      className="border-b border-border/60"
                    >
                      <td className="py-2 pr-3 text-foreground">{row.source}</td>
                      <td className="py-2 pr-3 text-muted-text">
                        {row.medium ?? "—"}
                      </td>
                      <td className="py-2 pr-3 text-muted-text">
                        {row.campaign ?? "—"}
                      </td>
                      <td className="py-2 pr-3 text-right text-muted-text">
                        {row.sessions}
                      </td>
                      <td className="py-2 text-right text-muted-text">
                        {row.leads}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          title="Channels"
          description="How every session was classified"
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

        <Panel
          title="Landing pages"
          description="Where sessions began, with the enquiries each produced"
        >
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
          title="Attribution model"
          description="How a channel is assigned to a visit"
        >
          <dl>
            {[
              [
                "First touch",
                "The channel that first brought the visitor in. This is what “where did they come from” means.",
              ],
              [
                "Last non-direct",
                "The most recent channel that was not typing the URL. Direct never overwrites a real source.",
              ],
              [
                "Direct",
                "No referrer and no UTM parameters. Recorded as unknown, never assumed.",
              ],
              [
                "Retention",
                "Attribution is stored against the pseudonymous visitor id, which is deleted after 180 days.",
              ],
            ].map(([term, description]) => (
              <div
                key={term}
                className="flex flex-col gap-1 border-b border-border py-2.5 last:border-b-0 sm:flex-row sm:gap-6"
              >
                <dt className="w-40 flex-none text-[0.875rem] font-medium text-foreground">
                  {term}
                </dt>
                <dd className="text-[0.8125rem] leading-relaxed text-muted-text">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Campaign register"
          description="Your own record of what each campaign was for"
        >
          <CampaignRegister />
        </Panel>
      </div>
    </>
  );
}
