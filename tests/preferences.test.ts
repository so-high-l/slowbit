import { test } from "node:test";
import assert from "node:assert/strict";
import {
  completeTour,
  defaults,
  getSceneSoundMix,
  hasCompletedTour,
  normalize,
  resetSceneSoundMix,
  resetTour,
  saveSceneSoundMix,
} from "../src/lib/preferences.ts";
import { recommend } from "../src/lib/recommendation.ts";
import type { Visual } from "../src/lib/types.ts";
test("corrupt and untrusted saved values fall back to safe preferences", () => {
  assert.deepEqual(normalize(null), defaults);
  const p = normalize({
    favoriteVisuals: ["rain", "rain", "unknown"],
    hiddenVisuals: "rain",
    soundMixesByScene: {
      rain: { rain: 15, fire: -1, wind: "loud", tones: 0.25 },
      unknown: { rain: 0.5 },
    },
    globalVolume: Infinity,
    defaultSessionDuration: -10,
    lastMood: "invalid",
  });
  assert.deepEqual(p.favoriteVisuals, ["rain"]);
  assert.deepEqual(p.hiddenVisuals, []);
  assert.equal(p.soundMixesByScene.rain?.rain, 1);
  assert.equal(p.soundMixesByScene.rain?.fire, 0);
  assert.equal(p.soundMixesByScene.rain?.wind, undefined);
  assert.equal(p.soundMixesByScene.rain?.tones, 0.25);
  assert.equal(p.globalVolume, 0.6);
  assert.equal(p.defaultSessionDuration, 10);
  assert.equal(p.lastMood, undefined);
});
const rain = { id: "rain" as const, defaultSounds: { rain: 0.4, wind: 0.2, tones: 0.1 } };
const stars = { id: "stars" as const, defaultSounds: { night: 0.3 } };
test("first visits use defaults and saved mixes are isolated by scene", () => {
  const saved = saveSceneSoundMix(
    saveSceneSoundMix(defaults, "rain", { rain: 0.75 }),
    "rain",
    { brown: 0.42 },
  );
  assert.deepEqual(getSceneSoundMix(defaults, rain), { rain: 0.4, wind: 0.2, tones: 0.1, fire: 0, forest: 0, brown: 0, night: 0 });
  assert.equal(getSceneSoundMix(saved, rain).rain, 0.75);
  assert.equal(getSceneSoundMix(saved, rain).brown, 0.42);
  assert.equal(getSceneSoundMix(saved, stars).night, 0.3);
});
test("saved scene mixes survive normalization, merge new defaults, and reset", () => {
  const saved = saveSceneSoundMix(defaults, "rain", { rain: 0.75 });
  const restored = normalize(JSON.parse(JSON.stringify(saved)));
  const updatedCatalog = { id: "rain" as const, defaultSounds: { rain: 0.4, wind: 0.2, brown: 0.18 } };
  assert.deepEqual(getSceneSoundMix(restored, updatedCatalog), { rain: 0.75, wind: 0.2, brown: 0.18, fire: 0, forest: 0, night: 0, tones: 0 });
  assert.deepEqual(resetSceneSoundMix(restored, "rain").soundMixesByScene, {});
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
test("tour completion migrates safely, deduplicates, and can be reset", () => {
  const migrated = normalize({ completedTours: ["session-basics-v1", "session-basics-v1", 4, ""] });
  assert.deepEqual(migrated.completedTours, ["session-basics-v1"]);
  assert.equal(hasCompletedTour(migrated, "session-basics-v1"), true);
  assert.strictEqual(completeTour(migrated, "session-basics-v1"), migrated);
  const completed = completeTour(migrated, "settings-v1");
  assert.deepEqual(completed.completedTours, ["session-basics-v1", "settings-v1"]);
  assert.deepEqual(resetTour(completed, "session-basics-v1").completedTours, ["settings-v1"]);
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
