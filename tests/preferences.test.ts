import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, defaults } from "../src/lib/preferences.ts";
import { recommend } from "../src/lib/recommendation.ts";
import type { Visual } from "../src/lib/types.ts";
test("corrupt and untrusted saved values fall back to safe preferences", () => {
  assert.deepEqual(normalize(null), defaults);
  const p = normalize({
    favoriteVisuals: ["rain", "rain", "unknown"],
    hiddenVisuals: "rain",
    audioVolumes: { rain: 15, fire: -1, wind: "loud" },
    globalVolume: Infinity,
    defaultSessionDuration: -10,
    lastMood: "invalid",
  });
  assert.deepEqual(p.favoriteVisuals, ["rain"]);
  assert.deepEqual(p.hiddenVisuals, []);
  assert.equal(p.audioVolumes.rain, 1);
  assert.equal(p.audioVolumes.fire, 0);
  assert.equal(p.audioVolumes.wind, defaults.audioVolumes.wind);
  assert.equal(p.globalVolume, 0.6);
  assert.equal(p.defaultSessionDuration, 10);
  assert.equal(p.lastMood, undefined);
});
test("no timer and mute preferences survive normalization", () => {
  const p = normalize({
    ...defaults,
    defaultSessionDuration: null,
    muted: true,
  });
  assert.equal(p.defaultSessionDuration, null);
  assert.equal(p.muted, true);
});
const catalog: Visual[] = [
  {
    id: "rain",
    name: "Rain",
    subtitle: "",
    tags: [],
    recommendedMoods: ["fried"],
    defaultSounds: {},
  },
  {
    id: "stars",
    name: "Stars",
    subtitle: "",
    tags: [],
    recommendedMoods: ["fried"],
    defaultSounds: {},
  },
  {
    id: "drift",
    name: "Drift",
    subtitle: "",
    tags: [],
    recommendedMoods: ["chill"],
    defaultSounds: {},
  },
];
test("hidden scenes never enter mood recommendations or fallback", () => {
  const prefs = { ...defaults, hiddenVisuals: ["rain", "stars"] as const };
  assert.equal(
    recommend(
      catalog,
      "fried",
      { ...prefs, hiddenVisuals: [...prefs.hiddenVisuals] },
      () => 0,
    )?.id,
    "drift",
  );
  assert.equal(
    recommend(
      catalog,
      "fried",
      { ...defaults, hiddenVisuals: ["rain", "stars", "drift"] },
      () => 0,
    ),
    undefined,
  );
});
test("favorites receive modest extra weight without excluding other matches", () => {
  const prefs = { ...defaults, favoriteVisuals: ["rain"] as const };
  const choose = (n: number) =>
    recommend(
      catalog,
      "fried",
      { ...prefs, favoriteVisuals: [...prefs.favoriteVisuals] },
      () => n,
    )?.id;
  assert.equal(choose(0), "rain");
  assert.equal(choose(0.5), "rain");
  assert.equal(choose(0.9), "stars");
});
