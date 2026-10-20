import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyBrowser,
  classifyChannel,
  classifyDevice,
  mergeAttribution,
  readUtm,
  referrerHost,
} from "../src/lib/analytics/attribution.ts";

test("UTM parameters are normalised and capped", () => {
  const utm = readUtm(
    "?utm_source=LinkedIn&utm_medium=Social&utm_campaign=Spring%20Push&utm_term=a%3Cb%3E"
  );
  assert.equal(utm.source, "linkedin");
  assert.equal(utm.medium, "social");
  assert.equal(utm.campaign, "spring-push");
  assert.equal(utm.term, "a-b");
});

test("a missing UTM parameter is null, never an empty string", () => {
  const utm = readUtm("?utm_source=&other=1");
  assert.equal(utm.source, null);
  assert.equal(utm.medium, null);
});

test("an over-long UTM value is capped", () => {
  const utm = readUtm(`?utm_source=${"a".repeat(500)}`);
  assert.ok((utm.source ?? "").length <= 100);
});

test("a UTM source wins over an inferred referrer", () => {
  const channel = classifyChannel(
    { source: "newsletter", medium: "email", campaign: null, content: null, term: null },
    "mail.google.com"
  );
  assert.equal(channel, "email");
});

test("paid medium on a non-search source is paid social", () => {
  const channel = classifyChannel(
    { source: "facebook", medium: "cpc", campaign: null, content: null, term: null },
    null
  );
  assert.equal(channel, "paid_social");
});

test("a search engine referrer is organic search", () => {
  const channel = classifyChannel(
    { source: null, medium: null, campaign: null, content: null, term: null },
    "www.google.com"
  );
  assert.equal(channel, "organic_search");
});

test("no referrer and no UTM is direct", () => {
  const channel = classifyChannel(
    { source: null, medium: null, campaign: null, content: null, term: null },
    null
  );
  assert.equal(channel, "direct");
});

test("a referrer host is reduced to a hostname", () => {
  assert.equal(
    referrerHost("https://www.google.com/search?q=secret+term"),
    "google.com"
  );
  assert.equal(referrerHost("not a url"), null);
  assert.equal(referrerHost(null), null);
});

test("device category is coarse and never a fingerprint", () => {
  assert.equal(classifyDevice(390, false), "mobile");
  assert.equal(classifyDevice(800, false), "tablet");
  assert.equal(classifyDevice(1440, false), "desktop");
  assert.equal(classifyDevice(undefined, true), "mobile");
});

test("browser family is coarse and never a user-agent string", () => {
  const family = classifyBrowser(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120"
  );
  assert.equal(family, "chrome");
  assert.ok(!String(family).includes("Mozilla"));
  assert.equal(classifyBrowser(undefined), null);
});

test("first touch is never overwritten", () => {
  const merged = mergeAttribution(
    {
      channel: "organic_search",
      referrerHost: "google.com",
      utm: {
        source: "google",
        medium: "organic",
        campaign: "seo",
        content: null,
        term: null,
      },
    },
    {
      channel: "referral",
      referrerHost: "example.com",
      utm: {
        source: "partner",
        medium: "referral",
        campaign: "launch",
        content: null,
        term: null,
      },
    }
  );

  assert.equal(merged.first.channel, "organic_search");
  assert.equal(merged.first.utm.campaign, "seo");
  assert.equal(merged.last.channel, "referral");
});

test("direct traffic does not overwrite a real source", () => {
  const merged = mergeAttribution(
    {
      channel: "organic_search",
      referrerHost: "google.com",
      utm: {
        source: "google",
        medium: "organic",
        campaign: null,
        content: null,
        term: null,
      },
    },
    {
      channel: "direct",
      referrerHost: null,
      utm: {
        source: null,
        medium: null,
        campaign: null,
        content: null,
        term: null,
      },
    }
  );

  assert.equal(merged.last.channel, "organic_search");
  assert.equal(merged.first.channel, "organic_search");
});

test("the first visit establishes both first and last", () => {
  const incoming = {
    channel: "referral" as const,
    referrerHost: "example.com",
    utm: {
      source: "partner",
      medium: "referral",
      campaign: null,
      content: null,
      term: null,
    },
  };
  const merged = mergeAttribution(null, incoming);
  assert.equal(merged.first.channel, "referral");
  assert.equal(merged.last.channel, "referral");
});