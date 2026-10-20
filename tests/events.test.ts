import test from "node:test";
import assert from "node:assert/strict";
import {
  ANALYTICS_EVENTS,
  conversionFor,
  isAnalyticsEventName,
  validateEvent,
} from "../src/lib/analytics/events.ts";

test("only names on the allowlist are accepted", () => {
  assert.equal(isAnalyticsEventName("page_view"), true);
  assert.equal(isAnalyticsEventName("hack_the_database"), false);
  assert.equal(isAnalyticsEventName(42), false);

  const rejected = validateEvent("not_an_event", {});
  assert.equal(rejected, null);
});

test("every event on the list is a valid name", () => {
  for (const name of ANALYTICS_EVENTS) {
    assert.equal(isAnalyticsEventName(name), true, `${name} should be allowed`);
  }
});

test("properties outside an event's schema are dropped, not stored", () => {
  const result = validateEvent("page_view", {
    path: "/",
    channel: "organic_search",
    somethingElse: "should not survive",
  });
  assert.ok(result);
  assert.equal(result.props.path, "/");
  assert.equal(result.props.somethingElse, undefined);
});

test("a payload containing personal data rejects the whole event", () => {
  for (const key of [
    "email",
    "name",
    "phone",
    "message",
    "password",
    "token",
    "ip",
    "url",
  ]) {
    const result = validateEvent("page_view", { path: "/", [key]: "value" });
    assert.equal(result, null, `${key} should reject the event`);
  }
});

test("non-scalar property values are dropped rather than stringified", () => {
  const result = validateEvent("page_view", {
    path: "/",
    channel: { nested: "object" },
  });
  assert.ok(result);
  assert.equal(result.props.channel, undefined);
});

test("an over-long string value is dropped", () => {
  const result = validateEvent("page_view", { path: "x".repeat(500) });
  assert.ok(result);
  assert.equal(result.props.path, undefined);
});

test("a non-object props bag yields an event with no properties", () => {
  const result = validateEvent("page_view", "not an object");
  assert.ok(result);
  assert.deepEqual(result.props, {});
});

test("conversion events are identified by name", () => {
  assert.equal(conversionFor("lead_created"), "lead_created");
  assert.equal(conversionFor("qualified_lead"), "qualified_lead");
  assert.equal(conversionFor("outbound_conversion"), "outbound_conversion");
  assert.equal(conversionFor("page_view"), null);
});
