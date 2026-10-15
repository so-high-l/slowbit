import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { visuals } from "../src/data/catalog.ts";
import { grainientSceneSettings } from "../src/components/visuals/grainient-settings.ts";
import { sceneSoundscapes } from "../src/lib/scene-soundscapes.ts";

test("Chromatic Drift is available for Focus and Unwind with a randomized ambient playlist", () => {
  const scene = visuals.find(visual => visual.id === "chromaticDrift")!;
  assert.deepEqual(scene.modes, ["focus", "unwind"]);
  assert.equal(sceneSoundscapes.chromaticDrift?.texture?.kind, "chromatic");
  assert.equal(sceneSoundscapes.chromaticDrift?.texture?.name, "Chromatic hum");
  assert.equal(sceneSoundscapes.chromaticDrift?.playlist, "chromaticDriftAmbient");
  assert.equal(sceneSoundscapes.chromaticDrift?.mix.lofi, 0.22);
  assert.equal(sceneSoundscapes.chromaticDrift?.mix.texture, 0.04);
  assert.equal(sceneSoundscapes.chromaticDrift?.mix.binaural, 0);
});

test("immersion increases the Grainient flow while pause and reduced motion stop it", () => {
  const normal = grainientSceneSettings({ immersive: false });
  const immersive = grainientSceneSettings({ immersive: true });
  assert.ok(immersive.speed > normal.speed);
  assert.equal(grainientSceneSettings({ paused: true, immersive: true }).speed, 0);
  assert.equal(grainientSceneSettings({ reducedMotion: true, immersive: true }).speed, 0);
  assert.equal(grainientSceneSettings({ reducedMotion: true }).grainAnimated, false);
});

test("the copied Grainient code carries its required attribution and license notice", () => {
  const source = readFileSync(new URL("../src/components/visuals/GrainientScene.tsx", import.meta.url), "utf8");
  const license = readFileSync(new URL("../licenses/react-bits-grainient.md", import.meta.url), "utf8");
  assert.match(source, /Copyright \(c\) 2026 David Haz/);
  assert.match(source, /382dc89411ce8446ef2b2ed99e352c44a53a1b54/);
  assert.match(license, /MIT \+ Commons Clause License Condition v1\.0/);
  assert.match(license, /do not sell, sublicense, or redistribute the components themselves/);
});
