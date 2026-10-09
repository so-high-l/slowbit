import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

test("PostHog stays off without configuration and is restricted to the MVP events", async () => {
  const load = async (token: string) => {
    const built = await build({
      entryPoints: ["src/lib/analytics.ts"], bundle: true, write: false, format: "esm", platform: "browser",
      define: {
        "process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN": JSON.stringify(token),
        "process.env.NEXT_PUBLIC_POSTHOG_HOST": JSON.stringify("https://eu.i.posthog.com"),
        "window": "{}",
      },
      plugins: [{ name: "mock-posthog", setup(builder) {
        builder.onResolve({ filter: /^posthog-js$/ }, () => ({ path: "sdk", namespace: "mock" }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: `
          export default {
            init(token, config) { globalThis.__slowbitAnalyticsTest.config = config; },
            capture(name, properties) { globalThis.__slowbitAnalyticsTest.events.push({name, properties}); }
          };
        ` }));
      } }],
    });
    return import("data:text/javascript;base64," + Buffer.from(built.outputFiles[0].text).toString("base64"));
  };
  const globals = globalThis as typeof globalThis & { __slowbitAnalyticsTest?: { config?: Record<string, unknown>; events: unknown[] } };
  globals.__slowbitAnalyticsTest = { events: [] };
  try {
    const disabled = await load("");
    disabled.initializeAnalytics();
    disabled.analytics.sceneSelected("rain");
    assert.equal(globals.__slowbitAnalyticsTest.config, undefined);
    assert.equal(globals.__slowbitAnalyticsTest.events.length, 0);
    const enabled = await load("phc_test_not_a_real_project");
    enabled.initializeAnalytics();
    enabled.analytics.sceneSelected("ocean");
    const config = globals.__slowbitAnalyticsTest.config!;
    assert.equal(config.autocapture, false);
    assert.equal(config.disable_session_recording, true);
    assert.equal(config.capture_pageview, "history_change");
    const filter = config.before_send as (event: { event: string }) => unknown;
    assert.equal(filter({ event: "$snapshot" }), null);
    assert.equal(filter({ event: "$autocapture" }), null);
    assert.deepEqual(filter({ event: "$pageview" }), { event: "$pageview" });
    assert.deepEqual(globals.__slowbitAnalyticsTest.events, [{ name: "scene_selected", properties: { scene: "ocean" } }]);
  } finally { delete globals.__slowbitAnalyticsTest; }
});
