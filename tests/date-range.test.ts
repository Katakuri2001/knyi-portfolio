import test from "node:test";
import assert from "node:assert/strict";
import {
  comparisonIsMeaningful,
  formatDay,
  MIN_COMPARISON_SAMPLE,
  percentChange,
  resolveRange,
} from "../src/lib/date-range.ts";

const NOW = Math.floor(Date.UTC(2026, 9, 20, 12, 0, 0) / 1000);

test("a preset resolves to the right number of days", () => {
  const range = resolveRange({ range: "7d" }, NOW);
  const days = Math.round((range.to - range.from) / 86400);
  assert.equal(days, 7);
  assert.equal(range.preset, "7d");
  assert.match(range.label, /UTC/);
});

test("today covers the current UTC day only", () => {
  const range = resolveRange({ range: "today" }, NOW);
  const day = 24 * 60 * 60;
  assert.equal(range.to - range.from, day - 1);
});

test("the previous period is the same length, immediately before", () => {
  const range = resolveRange({ range: "28d" }, NOW);
  const currentLength = range.to - range.from;
  const previousLength = range.previous.to - range.previous.from;
  assert.equal(currentLength, previousLength);
  assert.equal(range.previous.to, range.from - 1);
});

test("a custom range is parsed from the URL", () => {
  const range = resolveRange(
    { range: "custom", from: "2026-09-01", to: "2026-09-30" },
    NOW
  );
  assert.equal(range.from, Math.floor(Date.parse("2026-09-01T00:00:00Z") / 1000));
  assert.equal(
    range.to,
    Math.floor(Date.parse("2026-09-30T00:00:00Z") / 1000) + 86399
  );
  assert.equal(range.preset, "custom");
});

test("an invalid custom range falls back rather than erroring", () => {
  const range = resolveRange(
    { range: "custom", from: "not-a-date", to: "also-not" },
    NOW
  );
  assert.equal(range.preset, "28d");
});

test("a reversed custom range falls back rather than erroring", () => {
  const range = resolveRange(
    { range: "custom", from: "2026-09-30", to: "2026-09-01" },
    NOW
  );
  assert.equal(range.preset, "28d");
});

test("an unknown preset falls back to 28 days", () => {
  const range = resolveRange({ range: "nonsense" }, NOW);
  assert.equal(range.preset, "28d");
});

test("percent change is null when there is nothing to compare", () => {
  assert.equal(percentChange(10, 0), null);
  assert.equal(percentChange(null, 10), null);
  assert.equal(percentChange(12, 10), 0.2);
});

test("a comparison on a tiny sample is not meaningful", () => {
  assert.equal(comparisonIsMeaningful(3, 2), false);
  assert.equal(comparisonIsMeaningful(0, 0), false);
  assert.equal(
    comparisonIsMeaningful(MIN_COMPARISON_SAMPLE, MIN_COMPARISON_SAMPLE),
    true
  );
});

test("dates are formatted in UTC", () => {
  assert.equal(formatDay(NOW), "2026-10-20");
});
