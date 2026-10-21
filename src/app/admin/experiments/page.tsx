import type { Metadata } from "next";
import { EmptyState, PageHeader, Panel, PanelGrid, StatCard } from "@/components/admin/ui";
import { ExperimentLog } from "@/components/admin/ExperimentLog";
import { listExperiments } from "@/lib/db/experiments";

export const metadata: Metadata = {
  title: "Experiments & optimisation — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ExperimentsPage() {
  const experiments = await listExperiments();

  const running = experiments.filter((item) => item.status === "running").length;
  const concluded = experiments.filter((item) => item.status === "concluded").length;

  return (
    <>
      <PageHeader
        index="08"
        objective="E — Conversion optimisation"
        title="Experiments & optimisation"
        purpose="What you changed, what you were watching, and what you saw. A log of your own experiments, kept honestly."
      />

      <div className="mb-6 border-l-2 border-accent-ink/50 bg-surface px-5 py-4">
        <p className="text-[0.875rem] leading-relaxed text-muted-text">
          There is no automated A/B testing engine here, and this log does not
          pretend otherwise. With no control group there is nothing to compare
          against, so the console never declares a winner — what it records is
          your hypothesis, your change, and what you actually observed. That is
          worth more than a significance score computed on a handful of
          sessions.
        </p>
      </div>

      <PanelGrid columns={4}>
        <StatCard label="Recorded experiments" value={experiments.length} />
        <StatCard label="Running" value={running} />
        <StatCard label="Concluded" value={concluded} />
        <StatCard
          label="Planned"
          value={experiments.filter((item) => item.status === "planned").length}
        />
      </PanelGrid>

      <div className="mt-4">
        <Panel
          title="Experiment log"
          description="Hypothesis, change, metric, result and next action."
        >
          {experiments.length === 0 ? (
            <div className="mb-6">
              <EmptyState
                title="No experiments recorded"
                body="Record a hypothesis, the change you want to make, and the metric you will watch. It takes two minutes and it stops the same change being made twice."
              />
            </div>
          ) : null}
          <ExperimentLog initial={experiments} />
        </Panel>
      </div>
    </>
  );
}
