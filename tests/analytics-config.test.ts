import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

test("PostHog requires consent, rejects automatic collection, and stops after withdrawal", async () => {
  const load = async (token: string) => {
    const built = await build({
      entryPoints: ["src/lib/analytics.ts"], bundle: true, write: false, format: "esm", platform: "browser",
      define: {
        "process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN": JSON.stringify(token),
        "process.env.NEXT_PUBLIC_POSTHOG_HOST": JSON.stringify("https://eu.i.posthog.com"),
        "window": "globalThis.__slowbitWindow",
        "document": JSON.stringify({ referrer: "" }),
      },
      plugins: [{
        name: "mock-posthog", setup(builder) {
          builder.onResolve({ filter: /^posthog-js$/ }, () => ({ path: "sdk", namespace: "mock" }));
          builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
            contents: `
          export default {
            init(token, config) { globalThis.__slowbitAnalyticsTest.initCalls++; globalThis.__slowbitAnalyticsTest.config = config; },
            capture(name, properties) { globalThis.__slowbitAnalyticsTest.events.push({name, properties}); },
            opt_in_capturing() { globalThis.__slowbitAnalyticsTest.optIns++; },
            opt_out_capturing() { globalThis.__slowbitAnalyticsTest.optOuts++; },
            reset() { globalThis.__slowbitAnalyticsTest.resets++; },
            get_distinct_id() { globalThis.__slowbitAnalyticsTest.distinctIdReads++; return "ph_test_browser_id"; }
          };
        ` }));
        }
      }],
    });
    return import("data:text/javascript;base64," + Buffer.from(built.outputFiles[0].text).toString("base64"));
  };
  const values = new Map<string, string>();
  const globals = globalThis as typeof globalThis & {
    __slowbitAnalyticsTest?: { config?: Record<string, unknown>; events: unknown[]; initCalls: number; optIns: number; optOuts: number; resets: number; distinctIdReads: number };
    __slowbitWindow?: { localStorage: { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }; dispatchEvent(): boolean };
  };
  globals.__slowbitAnalyticsTest = { events: [], initCalls: 0, optIns: 0, optOuts: 0, resets: 0, distinctIdReads: 0 };
  globals.__slowbitWindow = {
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: key => { values.delete(key); },
    },
    dispatchEvent: () => true,
  };
  try {
    const disabled = await load("");
    disabled.initializeAnalytics();
    disabled.analytics.sceneSelected({ id: "rain", name: "Rainy window" });
    assert.equal(globals.__slowbitAnalyticsTest.config, undefined);
    assert.equal(globals.__slowbitAnalyticsTest.events.length, 0);
    const enabled = await load("phc_test_not_a_real_project");

    // Configuration alone is insufficient: a fresh visitor creates no SDK state.
    enabled.initializeAnalytics();
    enabled.analytics.sceneSelected({ id: "ocean", name: "Open water" });
    assert.equal(globals.__slowbitAnalyticsTest.config, undefined);
    assert.equal(globals.__slowbitAnalyticsTest.events.length, 0);
    assert.equal(enabled.getExistingAnalyticsDistinctId(), null);
    assert.equal(globals.__slowbitAnalyticsTest.distinctIdReads, 0);

    enabled.setAnalyticsConsent("granted");
    enabled.initializeAnalytics();
    enabled.analytics.sceneSelected({ id: "ocean", name: "Open water" });
    const config = globals.__slowbitAnalyticsTest.config!;
    assert.equal(config.autocapture, false);
    assert.equal(config.disable_session_recording, true);
    assert.equal(config.capture_pageview, "history_change");
    assert.equal(config.opt_out_capturing_by_default, true);
    assert.equal(config.opt_out_persistence_by_default, true);
    assert.equal(globals.__slowbitAnalyticsTest.initCalls, 1);
    assert.equal(globals.__slowbitAnalyticsTest.optIns, 1);
    assert.equal(enabled.getExistingAnalyticsDistinctId(), "ph_test_browser_id");
    assert.equal(globals.__slowbitAnalyticsTest.distinctIdReads, 1);
    const filter = config.before_send as (event: { event: string }) => unknown;
    assert.equal(filter({ event: "$snapshot" }), null);
    assert.equal(filter({ event: "$autocapture" }), null);
    assert.deepEqual(filter({ event: "$pageview" }), { event: "$pageview" });
    assert.deepEqual(globals.__slowbitAnalyticsTest.events, [
      { name: "app_visited", properties: { entry_source: "direct" } },
      { name: "scene_selected", properties: { mode: "relax", scene: "Open water", scene_id: "ocean", scene_name: "Open water" } },
    ]);
    values.set("relax_dev_preferences", JSON.stringify({ favorites: ["ocean"] }));
    values.set(enabled.ANALYTICS_CONSENT_DECIDED_AT_KEY, String(Date.now() - 30 * 24 * 60 * 60 * 1000));
    enabled.setAnalyticsConsent("declined");
    enabled.analytics.sceneSelected({ id: "rain", name: "Rainy window" });
    assert.equal(globals.__slowbitAnalyticsTest.events.length, 2);
    assert.equal(globals.__slowbitAnalyticsTest.optOuts, 2);
    assert.equal(globals.__slowbitAnalyticsTest.resets, 1);
    assert.equal(values.get(enabled.ANALYTICS_CONSENT_KEY), "declined");
    assert.equal(values.has(enabled.ANALYTICS_CONSENT_DECIDED_AT_KEY), false);
    assert.equal(enabled.getAnalyticsConsent(), "declined");
    assert.equal(enabled.getExistingAnalyticsDistinctId(), null);
    assert.equal(values.get("relax_dev_preferences"), JSON.stringify({ favorites: ["ocean"] }));

    // An old declined decision remains declined indefinitely and cannot restart capture.
    values.set(enabled.ANALYTICS_CONSENT_DECIDED_AT_KEY, String(Date.now() - 365 * 24 * 60 * 60 * 1000));
    enabled.initializeAnalytics();
    enabled.analytics.sceneSelected({ id: "rain", name: "Rainy window" });
    assert.equal(enabled.getAnalyticsConsent(), "declined");
    assert.equal(globals.__slowbitAnalyticsTest.initCalls, 1);
    assert.equal(globals.__slowbitAnalyticsTest.events.length, 2);
  } finally {
    delete globals.__slowbitAnalyticsTest;
    delete globals.__slowbitWindow;
  }
});
