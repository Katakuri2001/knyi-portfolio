import type { Metadata } from "next";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
} from "@/components/admin/ui";
import { SeoAuditRunner } from "@/components/admin/SeoAuditRunner";
import { SeoMetadataEditor } from "@/components/admin/SeoMetadataEditor";
import { auditIssues, latestAuditRun, listAuditRuns } from "@/lib/db/seo";
import { listSeoMetadata } from "@/lib/db/seo";
import {
  ga4ReportOrNull,
  searchConsoleQuery,
  searchConsoleSiteUrl,
  serviceAccountFromEnv,
} from "@/lib/google/apis";
import { PUBLIC_ROUTES } from "@/lib/seo/public-routes";

export const metadata: Metadata = {
  title: "SEO intelligence — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  const run = await latestAuditRun();
  const runCount = (await listAuditRuns(1)).length;
  const issues = run ? await auditIssues(run.id) : [];
  const overrides = await listSeoMetadata();

  /* --- Search Console --- */
  let searchData: {
    connected: boolean;
    message: string;
    totals: { clicks: number; impressions: number; ctr: number; position: number } | null;
    topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
    topPages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
  } = {
    connected: false,
    message: "",
    totals: null,
    topQueries: [],
    topPages: [],
  };

  if (!serviceAccountFromEnv()) {
    searchData.message =
      "GOOGLE_SERVICE_ACCOUNT_JSON is not set, so Search Console cannot be read.";
  } else if (!searchConsoleSiteUrl()) {
    searchData.message =
      "SEARCH_CONSOLE_SITE_URL is not set, so there is no property to read.";
  } else {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 27 * 86400 * 1000);
      const fmt = (date: Date) => date.toISOString().slice(0, 10);

      const [queryData, pageData] = await Promise.all([
        searchConsoleQuery({
          dimensions: ["query"],
          startDate: fmt(start),
          endDate: fmt(end),
          rowLimit: 20,
        }),
        searchConsoleQuery({
          dimensions: ["page"],
          startDate: fmt(start),
          endDate: fmt(end),
          rowLimit: 20,
        }),
      ]);

      searchData = {
        connected: true,
        message: `Read from Search Console, ${fmt(start)} → ${fmt(end)}.`,
        totals: queryData.totals,
        topQueries: queryData.rows.map((row) => ({
          query: row.keys[0] ?? "",
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })),
        topPages: pageData.rows.map((row) => ({
          page: row.keys[0] ?? "",
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })),
      };
    } catch (error) {
      searchData.message = `Search Console could not be read: ${(error as Error).message.slice(0, 200)}`;
    }
  }

  /* --- GA4 organic search report --- */
  const ga4 = await ga4ReportOrNull({
    dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
    dimensions: ["sessionDefaultChannelGroup"],
    metrics: [{ name: "sessions" }],
  });

  return (
    <>
      <PageHeader
        index="03"
        objective="A — Organic search growth"
        title="SEO intelligence"
        purpose="Search visibility, technical issues, and the metadata of every public page. Findings come from checking the site itself and from Google — never from a score that was invented."
      />

      {/* --- Technical audit --- */}
      <Panel
        title="Technical audit"
        description="Checks the site's own rendered pages, robots.txt and sitemap.xml."
        action={<SeoAuditRunner />}
      >
        {!run ? (
          <EmptyState
            title="No audit has been run yet"
            body="Run the audit to check the current state of the public pages."
          />
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-4">
              <StatCard
                label="Pages checked"
                value={run.pages_checked}
              />
              <StatCard label="Errors" value={run.error_count} />
              <StatCard label="Warnings" value={run.warning_count} />
              <StatCard label="Informational" value={run.info_count} />
            </div>

            {issues.length === 0 ? (
              <EmptyState
                title="No issues found"
                body="The last audit found nothing to report. Run it again after any change to the public pages."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] text-left text-[0.8125rem]">
                  <thead>
                    <tr className="border-b border-border text-meta text-muted-text">
                      <th className="py-2 pr-4 font-medium">Severity</th>
                      <th className="py-2 pr-4 font-medium">URL</th>
                      <th className="py-2 pr-4 font-medium">Issue</th>
                      <th className="py-2 pr-4 font-medium">What it means</th>
                      <th className="py-2 font-medium">Fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue) => (
                      <tr key={issue.id} className="border-b border-border/60 align-top">
                        <td className="py-2.5 pr-4">
                          <StatusPill
                            tone={
                              issue.severity === "error"
                                ? "error"
                                : issue.severity === "warning"
                                  ? "warn"
                                  : "muted"
                            }
                          >
                            {issue.severity}
                          </StatusPill>
                        </td>
                        <td className="py-2.5 pr-4 font-geist-mono text-[0.75rem] text-muted-text">
                          {issue.url}
                        </td>
                        <td className="py-2.5 pr-4 text-foreground">
                          {issue.issue_type.replace(/_/g, " ")}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-text">
                          {issue.message}
                        </td>
                        <td className="py-2.5 text-muted-text">
                          {issue.remediation ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-4 text-[0.75rem] text-muted-text">
              Last run {new Date(run.started_at * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC
              {run.status === "failed" && run.error
                ? ` · failed: ${run.error}`
                : ""}
              {" · "}
              {runCount} run(s) recorded
            </p>
          </>
        )}
      </Panel>

      {/* --- Search Console --- */}
      <div className="mt-4">
        <Panel
          title="Search visibility"
          description="Clicks, impressions, click-through rate and average position."
        >
          {!searchData.connected ? (
            <EmptyState
              title="Search Console is not connected"
              body={
                <>
                  {searchData.message} To connect it: verify the website property
                  in Search Console, add the service account as a user with Full
                  permission, then set{" "}
                  <code className="font-geist-mono">GOOGLE_SERVICE_ACCOUNT_JSON</code>{" "}
                  and{" "}
                  <code className="font-geist-mono">SEARCH_CONSOLE_SITE_URL</code>.
                </>
              }
            />
          ) : (
            <>
              <p className="mb-4 text-[0.8125rem] text-muted-text">
                {searchData.message}
              </p>

              <div className="grid gap-3 sm:grid-cols-4">
                <StatCard
                  label="Clicks"
                  value={searchData.totals?.clicks ?? 0}
                />
                <StatCard
                  label="Impressions"
                  value={searchData.totals?.impressions ?? 0}
                />
                <StatCard
                  label="Click-through rate"
                  value={
                    searchData.totals
                      ? `${(searchData.totals.ctr * 100).toFixed(1)}%`
                      : "—"
                  }
                />
                <StatCard
                  label="Average position"
                  value={
                    searchData.totals
                      ? searchData.totals.position.toFixed(1)
                      : "—"
                  }
                />
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="text-eyebrow mb-2 text-foreground">Top queries</h3>
                  {searchData.topQueries.length === 0 ? (
                    <p className="text-[0.8125rem] text-muted-text">
                      No query data for this period.
                    </p>
                  ) : (
                    <table className="w-full text-left text-[0.8125rem]">
                      <thead>
                        <tr className="border-b border-border text-meta text-muted-text">
                          <th className="py-1.5 pr-3 font-medium">Query</th>
                          <th className="py-1.5 pr-3 text-right font-medium">Clicks</th>
                          <th className="py-1.5 pr-3 text-right font-medium">Imp.</th>
                          <th className="py-1.5 text-right font-medium">Pos.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchData.topQueries.slice(0, 12).map((row) => (
                          <tr key={row.query} className="border-b border-border/60">
                            <td className="py-1.5 pr-3 text-foreground">
                              {row.query}
                            </td>
                            <td className="py-1.5 pr-3 text-right text-muted-text">
                              {row.clicks}
                            </td>
                            <td className="py-1.5 pr-3 text-right text-muted-text">
                              {row.impressions}
                            </td>
                            <td className="py-1.5 text-right text-muted-text">
                              {row.position.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div>
                  <h3 className="text-eyebrow mb-2 text-foreground">Top pages</h3>
                  {searchData.topPages.length === 0 ? (
                    <p className="text-[0.8125rem] text-muted-text">
                      No page data for this period.
                    </p>
                  ) : (
                    <table className="w-full text-left text-[0.8125rem]">
                      <thead>
                        <tr className="border-b border-border text-meta text-muted-text">
                          <th className="py-1.5 pr-3 font-medium">Page</th>
                          <th className="py-1.5 pr-3 text-right font-medium">Clicks</th>
                          <th className="py-1.5 pr-3 text-right font-medium">Imp.</th>
                          <th className="py-1.5 text-right font-medium">Pos.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchData.topPages.slice(0, 12).map((row) => (
                          <tr key={row.page} className="border-b border-border/60">
                            <td className="py-1.5 pr-3 text-foreground break-all">
                              {row.page.replace(/^https?:\/\/[^/]+/, "")}
                            </td>
                            <td className="py-1.5 pr-3 text-right text-muted-text">
                              {row.clicks}
                            </td>
                            <td className="py-1.5 pr-3 text-right text-muted-text">
                              {row.impressions}
                            </td>
                            <td className="py-1.5 text-right text-muted-text">
                              {row.position.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* --- Metadata editor --- */}
      <div className="mt-4">
        <Panel
          title="Page metadata"
          description="Overrides for the public pages. A page with no override keeps the code defaults."
        >
          <SeoMetadataEditor routes={PUBLIC_ROUTES} overrides={overrides} />
        </Panel>
      </div>

      {/* --- GA4 channel split --- */}
      {ga4 ? (
        <div className="mt-4">
          <Panel
            title="Google Analytics 4 — channels"
            description="Sessions by default channel group, from GA4. Independent of the first-party record."
          >
            <table className="w-full text-left text-[0.8125rem]">
              <thead>
                <tr className="border-b border-border text-meta text-muted-text">
                  <th className="py-1.5 pr-3 font-medium">Channel group</th>
                  <th className="py-1.5 text-right font-medium">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {(ga4.rows ?? []).map((row) => (
                  <tr key={row.dimensionValues[0]} className="border-b border-border/60">
                    <td className="py-1.5 pr-3 text-foreground">
                      {row.dimensionValues[0]}
                    </td>
                    <td className="py-1.5 text-right text-muted-text">
                      {row.metricValues[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      ) : null}
    </>
  );
}
