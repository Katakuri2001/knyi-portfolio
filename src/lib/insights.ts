/**
 * Evidence-based insights.
 *
 * Every statement produced here is a direct comparison of two measured
 * numbers. Nothing is inferred, nothing is predicted, and a comparison is
 * suppressed when the sample is too small to mean anything.
 *
 * There is no language model in this path, and there is no template that
 * produces a sentence about a period for which no data exists.
 */

import {
  comparisonIsMeaningful,
  percentChange,
} from "./date-range.ts";

export type Insight = {
  id: string;
  text: string;
  tone: "positive" | "negative" | "neutral";
};

export type InsightInput = {
  visitors: number | null;
  previousVisitors: number | null;
  organicSessions: number | null;
  previousOrganicSessions: number | null;
  leads: number | null;
  previousLeads: number | null;
  sessions: number | null;
  previousSessions: number | null;
  topChannel: { channel: string; sessions: number } | null;
  topCaseStudy: { title: string; views: number } | null;
  hasAnyData: boolean;
};

const formatPercent = (value: number): string =>
  `${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;

export function buildInsights(input: InsightInput): Insight[] {
  if (!input.hasAnyData) return [];

  const insights: Insight[] = [];

  const visitorChange = percentChange(
    input.visitors,
    input.previousVisitors
  );
  if (comparisonIsMeaningful(input.visitors, input.previousVisitors)) {
    insights.push({
      id: "visitors",
      tone: (visitorChange ?? 0) >= 0 ? "positive" : "negative",
      text: `Visitors ${formatPercent(visitorChange ?? 0)} compared with the previous period (${input.visitors} vs ${input.previousVisitors}).`,
    });
  }

  const organicChange = percentChange(
    input.organicSessions,
    input.previousOrganicSessions
  );
  if (
    comparisonIsMeaningful(input.organicSessions, input.previousOrganicSessions)
  ) {
    insights.push({
      id: "organic",
      tone: (organicChange ?? 0) >= 0 ? "positive" : "negative",
      text: `Organic search sessions ${formatPercent(organicChange ?? 0)} compared with the previous period (${input.organicSessions} vs ${input.previousOrganicSessions}).`,
    });
  }

  const leadChange = percentChange(input.leads, input.previousLeads);
  if (comparisonIsMeaningful(input.leads, input.previousLeads)) {
    insights.push({
      id: "leads",
      tone: (leadChange ?? 0) >= 0 ? "positive" : "negative",
      text: `Enquiries ${formatPercent(leadChange ?? 0)} compared with the previous period (${input.leads} vs ${input.previousLeads}).`,
    });
  }

  if (input.topChannel && input.topChannel.sessions > 0) {
    insights.push({
      id: "channel",
      tone: "neutral",
      text: `${input.topChannel.channel.replace(/_/g, " ")} was the largest acquisition channel in this period, with ${input.topChannel.sessions} session${input.topChannel.sessions === 1 ? "" : "s"}.`,
    });
  }

  if (input.topCaseStudy && input.topCaseStudy.views > 0) {
    insights.push({
      id: "case-study",
      tone: "neutral",
      text: `“${input.topCaseStudy.title}” was the most-viewed case study, with ${input.topCaseStudy.views} view${input.topCaseStudy.views === 1 ? "" : "s"}.`,
    });
  }

  if (input.sessions && input.leads !== null) {
    const rate = input.leads / input.sessions;
    insights.push({
      id: "conversion",
      tone: "neutral",
      text: `Enquiry conversion rate was ${(rate * 100).toFixed(1)}% (${input.leads} of ${input.sessions} sessions).`,
    });
  }

  return insights;
}
