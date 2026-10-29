import test from "node:test";
import assert from "node:assert/strict";
import { visuals } from "../src/data/catalog.ts";
import { availableVisuals } from "../src/lib/scene-availability.ts";
import { sceneSoundscapes } from "../src/lib/scene-soundscapes.ts";
import { defaults, getSceneSoundMix, normalize, saveSceneSoundMix } from "../src/lib/preferences.ts";
import { soundLabel, trainCarriageImmersiveMix } from "../src/lib/sound-controls.ts";

test("Train Carriage is Focus-only and reuses the carriage preset with Lo-fi", () => {
  const scene = visuals.find(visual => visual.id === "trainCarriage")!;
  assert.equal(scene.name, "Train Carriage");
  assert.ok(availableVisuals(visuals, "focus").includes(scene));
  assert.ok(!availableVisuals(visuals, "unwind").includes(scene));
  assert.equal(sceneSoundscapes.trainCarriage?.playlist, "trainCarriageLofi");
  assert.equal(soundLabel(scene.id, "lofi", "Lofi"), "Carriage Lo-fi Radio");
  assert.deepEqual(scene.defaultSounds, { train: 0.73, rain: 0.06, lofi: 0.21, binaural: 0 });

  const saved = normalize(saveSceneSoundMix(defaults, scene.id, { train: 0.12, rain: 0.04, lofi: 0.16 }));
  assert.equal(getSceneSoundMix(saved, scene).train, 0.12);
  assert.equal(getSceneSoundMix(saved, scene).rain, 0.04);
  assert.equal(getSceneSoundMix(saved, scene).lofi, 0.16);
});

test("Train Carriage immersion lowers live music and effects without mutating saved values", () => {
  const scene = visuals.find(visual => visual.id === "trainCarriage")!;
  const saved = getSceneSoundMix(defaults, scene);
  assert.strictEqual(trainCarriageImmersiveMix(saved, false), saved);

  const immersive = trainCarriageImmersiveMix(saved, true);
  assert.equal(immersive.lofi, saved.lofi * 0.82);
  assert.equal(immersive.train, saved.train * 0.55);
  assert.equal(immersive.rain, saved.rain * 0.55);
  assert.equal(saved.lofi, 0.21);
  assert.equal(saved.train, 0.73);
  assert.equal(saved.rain, 0.06);
});
