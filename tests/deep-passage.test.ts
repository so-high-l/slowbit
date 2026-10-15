import { test } from "node:test";
import assert from "node:assert/strict";
import { visuals } from "../src/data/catalog.ts";
import { deepPassagePoint } from "../src/components/visuals/DeepPassage.ts";
import { sceneSoundscapes } from "../src/lib/scene-soundscapes.ts";
import { recordingProfile } from "../src/lib/audio-profiles.ts";

test("Deep Passage is available for Focus and Unwind with its own restrained soundscape", () => {
  const scene = visuals.find(visual => visual.id === "deepPassage")!;
  assert.deepEqual(scene.modes, ["focus", "unwind"]);
  assert.equal(sceneSoundscapes.deepPassage?.ambience?.asset, "deepPassageDrone");
  assert.equal(sceneSoundscapes.deepPassage?.ambience?.name, "Deep passage drone");
  assert.equal(sceneSoundscapes.deepPassage?.texture?.kind, "current");
  assert.equal(sceneSoundscapes.deepPassage?.mix.ambience, 0.22);
  assert.equal(sceneSoundscapes.deepPassage?.mix.wind, 0.30);
  assert.equal(sceneSoundscapes.deepPassage?.mix.texture, 0);
  assert.equal(sceneSoundscapes.deepPassage?.mix.brown, 0);
  assert.equal(sceneSoundscapes.deepPassage?.mix.binaural, 0);
  assert.deepEqual(recordingProfile("deepPassage", "ambience"), {
    file: "liecio-mysterious-drone-pad-in-perfect-loop-257593.mp3",
    loopCrossfade: 0,
    level: 0.45,
    cutoff: 3200,
    highpass: 80,
  });
});

test("Deep Passage projection expands continuously away from one vanishing point", () => {
  const w = 1400;
  const h = 900;
  const farLeft = deepPassagePoint(0.1, -1, w, h);
  const middleLeft = deepPassagePoint(0.5, -1, w, h);
  const nearLeft = deepPassagePoint(0.9, -1, w, h);
  const farRight = deepPassagePoint(0.1, 1, w, h);
  assert.ok(farLeft.x > middleLeft.x && middleLeft.x > nearLeft.x);
  assert.ok(farLeft.y < middleLeft.y && middleLeft.y < nearLeft.y);
  assert.equal(farLeft.y, farRight.y);
  assert.equal(farLeft.x + farRight.x, w);
});
