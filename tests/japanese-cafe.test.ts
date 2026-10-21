import { test } from "node:test";
import assert from "node:assert/strict";
import { visuals } from "../src/data/catalog.ts";
import { availableVisuals } from "../src/lib/scene-availability.ts";
import { japaneseCafeTrackFiles, japaneseCafeTrackUrls } from "../src/lib/focus-music.ts";
import { defaults, getSceneSoundMix, normalize, saveSceneSoundMix } from "../src/lib/preferences.ts";
import { recordingProfile } from "../src/lib/audio-profiles.ts";
import { sceneSoundscapes } from "../src/lib/scene-soundscapes.ts";
import { japaneseCafeImmersiveMix, soundLabel } from "../src/lib/sound-controls.ts";

test("Japanese Corner Café is Focus-only and uses the shared scene audio controls", () => {
  const scene = visuals.find(visual => visual.id === "japaneseCafe")!;
  assert.equal(scene.name, "Japanese Corner Café");
  assert.equal(scene.subtitle, "A warm cup. A quiet corner. One thing at a time.");
  assert.ok(availableVisuals(visuals, "focus").includes(scene));
  assert.ok(!availableVisuals(visuals, "unwind").includes(scene));
  assert.equal(sceneSoundscapes.japaneseCafe?.playlist, "japaneseCafeLofi");
  assert.equal(soundLabel(scene.id, "lofi", "Lofi"), "Café Lo-fi Radio");
  assert.deepEqual(scene.defaultSounds, { lofi: 0.14, ambience: 0.7, rain: 0.15, binaural: 0 });
  assert.equal(soundLabel(scene.id, "ambience", "Ambience"), "Café ambience");
  assert.deepEqual(recordingProfile(scene.id, "ambience"), {
    file: "785167__artsnbytes__osaka-city-centre-cafe-calm.flac",
    loopCrossfade: 2,
    level: 1,
    cutoff: 4600,
    highpass: 80,
  });

  const saved = normalize(saveSceneSoundMix(defaults, scene.id, { lofi: 0.14, brown: 0.03 }));
  assert.equal(getSceneSoundMix(saved, scene).lofi, 0.14);
  assert.equal(getSceneSoundMix(saved, scene).brown, 0.03);
});

test("Japanese café ambience becomes distant outside without changing saved controls", () => {
  const inside = { ...getSceneSoundMix(defaults, visuals.find(visual => visual.id === "japaneseCafe")!) };
  const outside = japaneseCafeImmersiveMix(inside, true);
  assert.equal(outside.ambience, inside.ambience * 0.28);
  assert.equal(outside.lofi, inside.lofi);
  assert.equal(japaneseCafeImmersiveMix(inside, false), inside);
});

test("Japanese café R2 objects keep exact names and are URL encoded", () => {
  assert.equal(japaneseCafeTrackFiles.length, 34);
  assert.equal(new Set(japaneseCafeTrackFiles).size, japaneseCafeTrackFiles.length);
  const urls = japaneseCafeTrackUrls("https://assets.example/");
  assert.equal(urls.length, 34);
  assert.equal(urls[0], "https://assets.example/audio/lofi/jap-cafe/HoliznaCC0%20-%20So%20Broke.mp3");
  assert.ok(urls.every(url => !url.includes(" ")));
});
