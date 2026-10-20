import test from "node:test";
import assert from "node:assert/strict";
import {
  LEAD_SERVICES,
  isLeadService,
  validateLeadSubmission,
} from "../src/lib/leads.ts";

test("a valid submission is accepted and trimmed", () => {
  const result = validateLeadSubmission({
    name: "  A Client  ",
    email: "  client@example.com ",
    message: "We need help with a campaign.",
    serviceInterest: LEAD_SERVICES[0],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.name, "A Client");
  assert.equal(result.value.email, "client@example.com");
  assert.equal(result.value.serviceInterest, LEAD_SERVICES[0]);
});

test("a submission with no way to be contacted is rejected", () => {
  const result = validateLeadSubmission({ name: "Someone", message: "Hi" });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.field, "email");
});

test("a malformed email is rejected", () => {
  const result = validateLeadSubmission({ email: "not-an-email" });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.field, "email");
});

test("a telegram handle alone is enough", () => {
  const result = validateLeadSubmission({ telegram: "@someone" });
  assert.equal(result.ok, true);
});

test("an unknown service is dropped rather than stored", () => {
  const result = validateLeadSubmission({
    email: "a@b.co",
    serviceInterest: "Something invented",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.serviceInterest, null);
});

test("the honeypot field rejects a bot submission", () => {
  const result = validateLeadSubmission({
    email: "bot@example.com",
    company: "Acme Corp",
  });
  assert.equal(result.ok, false);
});

test("a message that is only links is treated as spam", () => {
  const result = validateLeadSubmission({
    email: "a@b.co",
    message: "http://one.example http://two.example http://three.example",
  });
  assert.equal(result.ok, false);
});

test("a message with one link and real prose is not spam", () => {
  const result = validateLeadSubmission({
    email: "a@b.co",
    message:
      "Hello, I found your case study at https://example.com/work and I would like to talk about a campaign for our new product launch.",
  });
  assert.equal(result.ok, true);
});

test("html in a message is stripped rather than stored", () => {
  const result = validateLeadSubmission({
    email: "a@b.co",
    message: "<script>alert(1)</script> Real text here.",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(!result.value.message?.includes("<script>"));
});

test("the service list is a closed set", () => {
  assert.equal(isLeadService("Meta Ads planning"), true);
  assert.equal(isLeadService("Free money"), false);
});

test("a non-object body is rejected", () => {
  const result = validateLeadSubmission("nope");
  assert.equal(result.ok, false);
});
