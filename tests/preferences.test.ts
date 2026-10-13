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
import { silentMix } from "../src/lib/sound-presets.ts";
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
  assert.deepEqual(getSceneSoundMix(defaults, rain), { ...silentMix, rain: 0.4, wind: 0.2, tones: 0.1 });
  assert.equal(getSceneSoundMix(saved, rain).rain, 0.75);
  assert.equal(getSceneSoundMix(saved, rain).brown, 0.42);
  assert.equal(getSceneSoundMix(saved, stars).night, 0.3);
});
test("saved scene mixes survive normalization, merge new defaults, and reset", () => {
  const saved = saveSceneSoundMix(defaults, "rain", { rain: 0.75 });
  const restored = normalize(JSON.parse(JSON.stringify(saved)));
  const updatedCatalog = { id: "rain" as const, defaultSounds: { rain: 0.4, wind: 0.2, brown: 0.18 } };
  assert.deepEqual(getSceneSoundMix(restored, updatedCatalog), { ...silentMix, rain: 0.75, wind: 0.2, brown: 0.18 });
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

test("binaural frequency migrates, validates, persists per scene and resets with the mix", async () => {
  const { getSceneBeatHz, saveSceneBeatHz } = await import("../src/lib/preferences.ts");
  assert.deepEqual(normalize({}).beatHzByScene, {});
  assert.equal(getSceneBeatHz(defaults, "snow"), 2.5);
  let saved = saveSceneBeatHz(defaults, "snow", 9.5);
  saved = saveSceneSoundMix(saved, "snow", { binaural: 0, rain: 0.17 });
  const restored = normalize(JSON.parse(JSON.stringify(saved)));
  assert.equal(getSceneBeatHz(restored, "snow"), 9.5);
  assert.equal(getSceneBeatHz(restored, "aurora"), 6);
  assert.equal(restored.soundMixesByScene.snow?.binaural, 0);
  assert.equal(restored.soundMixesByScene.snow?.rain, 0.17);
  assert.equal(getSceneBeatHz(resetSceneSoundMix(restored, "snow"), "snow"), 2.5);
  const invalid = normalize({ beatHzByScene: { snow: 200, aurora: -1, pond: NaN, ink: "loud", ocean: 6, unknown: 8, constructor: 9 } });
  assert.deepEqual(invalid.beatHzByScene, { snow: 30, aurora: 1 });
  assert.strictEqual(saveSceneBeatHz(defaults, "ocean", 8), defaults);
});

test("all scenes default beats off and Reset removes an explicitly enabled beat", async () => {
  const { visuals } = await import("../src/data/catalog.ts");
  for (const visual of visuals) {
    assert.equal(getSceneSoundMix(defaults, visual).binaural, 0, visual.name);
    const custom = saveSceneSoundMix(defaults, visual.id, { binaural: 0.07 });
    const restored = normalize(JSON.parse(JSON.stringify(custom)));
    assert.equal(getSceneSoundMix(restored, visual).binaural, 0.07, "manual choices remain editable");
    assert.equal(getSceneSoundMix(resetSceneSoundMix(restored, visual.id), visual).binaural, 0);
  }
});

test("Vinyl piano volume persists independently and an explicit mute survives reload", async () => {
  const { visuals } = await import("../src/data/catalog.ts");
  const vinyl = visuals.find(v => v.id === "vinyl")!;
  const saved = saveSceneSoundMix(defaults, "vinyl", { vinylMusic: 0.12, ambience: 0.31 });
  const restored = normalize(JSON.parse(JSON.stringify(saved)));
  assert.equal(getSceneSoundMix(restored, vinyl).vinylMusic, 0.12);
  assert.equal(getSceneSoundMix(restored, vinyl).ambience, 0.31);
  const muted = normalize(JSON.parse(JSON.stringify(saveSceneSoundMix(restored, "vinyl", { vinylMusic: 0 }))));
  assert.equal(getSceneSoundMix(muted, vinyl).vinylMusic, 0);
});
