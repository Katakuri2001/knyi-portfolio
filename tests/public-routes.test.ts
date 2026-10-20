import test from "node:test";
import assert from "node:assert/strict";
import {
  isPrivatePath,
  knownAnchors,
  PUBLIC_ROUTES,
  publicPaths,
} from "../src/lib/seo/public-routes.ts";

test("the public route list contains no private path", () => {
  for (const route of PUBLIC_ROUTES) {
    assert.equal(isPrivatePath(route.path), false, `${route.path} is private`);
  }
});

test("the private prefixes are recognised", () => {
  assert.equal(isPrivatePath("/admin"), true);
  assert.equal(isPrivatePath("/admin/leads"), true);
  assert.equal(isPrivatePath("/api/auth"), true);
  assert.equal(isPrivatePath("/_next/static"), true);
  assert.equal(isPrivatePath("/"), false);
  assert.equal(isPrivatePath("/about"), false);
});

test("every public route has a title and a sitemap flag", () => {
  for (const route of PUBLIC_ROUTES) {
    assert.ok(route.title.length > 0);
    assert.equal(typeof route.inSitemap, "boolean");
  }
});

test("the anchor list matches the sections on the public routes", () => {
  const anchors = knownAnchors();
  for (const route of PUBLIC_ROUTES) {
    for (const section of route.sections) {
      assert.ok(anchors.has(section.id));
    }
  }
});

test("the public path list is what the sitemap uses", () => {
  assert.deepEqual(publicPaths(), PUBLIC_ROUTES.map((route) => route.path));
});
