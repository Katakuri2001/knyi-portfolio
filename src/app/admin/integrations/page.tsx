import type { Metadata } from "next";
import { PageHeader, Panel, StatusPill } from "@/components/admin/ui";
import { IntegrationPanel } from "@/components/admin/IntegrationPanel";
import { INTEGRATIONS, missingVariables, quickStatus } from "@/lib/integrations";
import { lastState } from "@/lib/integrations";

export const metadata: Metadata = {
  title: "Integrations — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const rows = [];
  for (const definition of INTEGRATIONS) {
    const state = await lastState(definition.key);
    rows.push({
      definition,
      status: state?.status ?? quickStatus(definition),
      message: state?.message ?? null,
      lastChecked: state?.last_checked ?? null,
      lastSuccess: state?.last_success ?? null,
      missing: missingVariables(definition),
    });
  }

  return (
    <>
      <PageHeader
        index="09"
        objective="F — Business development"
        title="Integrations"
        purpose="What is connected, what is not, and exactly what to do about it. Every status comes from a real check — never from the presence of an environment variable."
      />

      <div className="mb-6 border-l-2 border-accent-ink/50 bg-surface px-5 py-4">
        <p className="text-[0.875rem] leading-relaxed text-muted-text">
          <strong className="font-medium text-foreground">
            “Connected” means it was checked.
          </strong>{" "}
          Pressing <em>Test connection</em> calls the provider and reports what
          it says. No credential, token or private key is ever sent to the
          browser — the checks run on the server.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <Panel
            key={row.definition.key}
            title={row.definition.label}
            description={row.definition.purpose}
            action={
              <div className="flex items-center gap-3">
                <StatusPill
                  tone={
                    row.status === "connected"
                      ? "ok"
                      : row.status === "error"
                        ? "error"
                        : row.status === "not_supported"
                          ? "muted"
                          : "warn"
                  }
                >
                  {row.status.replace(/_/g, " ")}
                </StatusPill>
                <IntegrationPanel integrationKey={row.definition.key} />
              </div>
            }
          >
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h3 className="text-eyebrow mb-2 text-foreground">
                  What it needs
                </h3>
                {row.definition.requires.length === 0 ? (
                  <p className="text-[0.875rem] leading-relaxed text-muted-text">
                    Nothing to configure. This site records its own events.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {row.definition.requires.map((requirement) => {
                      const missing = row.missing.includes(requirement.name);
                      return (
                        <li key={requirement.name}>
                          <p className="flex flex-wrap items-center gap-2 font-geist-mono text-[0.75rem]">
                            <span
                              className={
                                missing
                                  ? "text-red-900"
                                  : "text-accent-ink"
                              }
                            >
                              {requirement.name}
                            </span>
                            <span className="text-[0.6875rem] uppercase tracking-wide text-muted-text">
                              {requirement.kind === "public"
                                ? "public id"
                                : "secret"}
                            </span>
                            {missing ? (
                              <span className="text-[0.6875rem] text-red-900">
                                not set
                              </span>
                            ) : (
                              <span className="text-[0.6875rem] text-accent-ink">
                                set
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-[0.75rem] leading-relaxed text-muted-text">
                            {requirement.note}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="lg:col-span-7">
                <h3 className="text-eyebrow mb-2 text-foreground">How to connect it</h3>
                <p className="text-[0.875rem] leading-relaxed text-muted-text">
                  {row.definition.setup}
                </p>

                {row.message ? (
                  <p className="mt-4 border-l-2 border-border pl-3 text-[0.8125rem] leading-relaxed text-muted-text">
                    {row.message}
                  </p>
                ) : null}

                <p className="mt-4 font-geist-mono text-[0.6875rem] text-muted-text">
                  last checked:{" "}
                  {row.lastChecked
                    ? new Date(row.lastChecked * 1000)
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")
                    : "never"}
                  {" · "}
                  last success:{" "}
                  {row.lastSuccess
                    ? new Date(row.lastSuccess * 1000)
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")
                    : "never"}
                </p>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
