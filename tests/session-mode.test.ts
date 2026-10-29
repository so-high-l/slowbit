import { test } from "node:test";
import assert from "node:assert/strict";
import { availableFocusScene, durationForMode, focusSceneByMood, modeDurations } from "../src/lib/session-mode.ts";
import { availableVisuals } from "../src/lib/scene-availability.ts";
import { visuals } from "../src/data/catalog.ts";
import { defaults, getSceneSoundMix, normalize } from "../src/lib/preferences.ts";

test("mode duration choices preserve compatible values and replace incompatible ones", () => {
  assert.deepEqual(modeDurations.focus, [25, 45, 60, null]);
  assert.deepEqual(modeDurations.unwind, [5, 10, 15, null]);
  assert.equal(durationForMode("focus", 10), 25);
  assert.equal(durationForMode("unwind", 60), 10);
  assert.equal(durationForMode("focus", 45), 45);
  assert.equal(durationForMode("focus", null), null);
  assert.equal(durationForMode("unwind", null), null);
});

test("each Focus mood maps to a distinct scene and falls back around hidden scenes", () => {
  assert.deepEqual(focusSceneByMood, {
    fresh: "morningLattice",
    low_energy: "japaneseCafe",
    sleepy: "readingRoom",
    distracted: "quietMachine",
    focused: "nightDrive",
  });
  assert.equal(new Set(Object.values(focusSceneByMood)).size, 5);
  for (const [mood, scene] of Object.entries(focusSceneByMood)) {
    assert.equal(availableFocusScene(mood as keyof typeof focusSceneByMood, []), scene);
    assert.notEqual(availableFocusScene(mood as keyof typeof focusSceneByMood, [scene]), scene);
  }
});

test("Focus and Unwind expose their catalogs with two shared abstract scenes", () => {
  const focus = availableVisuals(visuals, "focus").map(scene => scene.id);
  const unwind = availableVisuals(visuals, "unwind").map(scene => scene.id);

  assert.deepEqual(focus, ["morningLattice", "quietMachine", "nightDrive", "readingRoom", "japaneseCafe", "trainCarriage", "focusComingSoon", "deepPassage", "chromaticDrift"]);
  assert.deepEqual(focus.filter(id => unwind.includes(id)), ["deepPassage", "chromaticDrift"]);
  assert.equal(unwind.length, visuals.length - 7);
  const placeholder = visuals.find(scene => scene.id === "focusComingSoon")!;
  assert.deepEqual(placeholder.defaultSounds, {});
  assert.ok(Object.values(getSceneSoundMix(defaults, placeholder)).every(volume => volume === 0));
});
test("session mode and focus durations survive saved preference normalization", () => {
  for (const duration of [25, 45, 60, null]) {
    const saved = normalize({ mode: "focus", defaultSessionDuration: duration });
    assert.equal(saved.mode, "focus");
    assert.equal(saved.defaultSessionDuration, duration);
  }
  assert.equal(normalize({ mode: "invalid" }).mode, "unwind");
});
