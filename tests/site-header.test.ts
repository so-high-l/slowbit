import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync(new URL("../src/components/Shell.tsx", import.meta.url), "utf8");
const landing = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const session = readFileSync(new URL("../src/app/session/page.tsx", import.meta.url), "utf8");
const header = readFileSync(new URL("../src/components/SiteHeader.tsx", import.meta.url), "utf8");

test("content pages and check-in share one stable navigation while sessions stay separate", () => {
  assert.match(shell, /<SiteHeader \/>/);
  assert.match(landing, /<SiteHeader \/>/);
  assert.doesNotMatch(session, /SiteHeader/);
  for (const destination of ["/favorites/", "/settings/", "https://github.com/so-high-l/slowbit"]) {
    assert.match(header, new RegExp(destination.replaceAll("/", "\\/")));
  }
  assert.match(header, /VolumeX/);
  assert.match(header, /Volume2/);
});
