import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { visuals } from "../src/data/catalog.ts";
import { availableVisuals } from "../src/lib/scene-availability.ts";
import { sceneSoundscapes } from "../src/lib/scene-soundscapes.ts";
import { supportsImmersiveMode } from "../src/lib/scene-immersive.ts";
import { soundLabel } from "../src/lib/sound-controls.ts";
import { loceanTrackFiles, loceanTrackUrls, trackDisplayName } from "../src/lib/focus-music.ts";

test("L’océan is a Focus-only loaded-video scene without Z mode", () => {
  const scene = visuals.find(visual => visual.id === "loceanRooftop")!;
  assert.equal(scene.name, "L’océan");
  assert.equal(scene.subtitle, "Atlantic light. One quiet task ahead.");
  assert.deepEqual(scene.tags, ["Focus", "Atlantic", "Ocean", "Sunset"]);
  assert.ok(availableVisuals(visuals, "focus").includes(scene));
  assert.ok(!availableVisuals(visuals, "unwind").includes(scene));
  assert.equal(supportsImmersiveMode(scene.id), false);
  assert.deepEqual(scene.defaultSounds, { lofi: 0.31, ambience: 0.58, seaBirds: 0.58, brown: 0, binaural: 0 });
  assert.equal(sceneSoundscapes[scene.id]?.ambience?.name, "Atlantic waves");
  assert.equal(sceneSoundscapes[scene.id]?.playlist, "loceanRadio");
  assert.equal(soundLabel(scene.id, "lofi", "Lofi"), "L’océan Radio");
  assert.equal(soundLabel(scene.id, "seaBirds", "Sea birds"), "Sea birds");
  for (const file of ["source-master.png", "poster.jpg", "locean-rooftop-loop.webm", "locean-rooftop-loop.mp4"])
    assert.ok(existsSync(`public/videos/locean-rooftop/${file}`), file);
  assert.ok(existsSync("scripts/generate-locean-rooftop-video.mjs"));
});

test("L’océan radio shuffles its fourteen exact R2 tracks", () => {
  assert.deepEqual(loceanTrackFiles, [
    "dreamy_sunset.mp3",
    "guembridiculous.mp3",
    "kaddour_hits.mp3",
    "geneve_groove.mp3",
    "afromantic.mp3",
    "jazzilian_2026.mp3",
    "maybe_next_night.mp3",
    "sunny_afternoon_in_marrakesh.mp3",
    "unresolved_thoughts.mp3",
    "across_the_atlantic.mp3",
    "afrolin.mp3",
    "dropped_from_high.mp3",
    "golden_pizzicato.mp3",
    "violin_over_water.mp3",
    "cielo_de_tarifa.mp3",
    "foggy_window.mp3",
    "its_not_leviosa.mp3",
    "lantern_on_water.mp3",
    "piacello_strokes.mp3",
    "secret_garden.mp3",
    "sunbirth_path.mp3",
  ]);
  assert.deepEqual(loceanTrackUrls(""), []);
  assert.deepEqual(loceanTrackUrls("https://assets.example/"), [
    "https://assets.example/audio/focus/locean/dreamy_sunset.mp3",
    "https://assets.example/audio/focus/locean/guembridiculous.mp3",
    "https://assets.example/audio/focus/locean/kaddour_hits.mp3",
    "https://assets.example/audio/focus/locean/geneve_groove.mp3",
    "https://assets.example/audio/focus/locean/afromantic.mp3",
    "https://assets.example/audio/focus/locean/jazzilian_2026.mp3",
    "https://assets.example/audio/focus/locean/maybe_next_night.mp3",
    "https://assets.example/audio/focus/locean/sunny_afternoon_in_marrakesh.mp3",
    "https://assets.example/audio/focus/locean/unresolved_thoughts.mp3",
    "https://assets.example/audio/focus/locean/across_the_atlantic.mp3",
    "https://assets.example/audio/focus/locean/afrolin.mp3",
    "https://assets.example/audio/focus/locean/dropped_from_high.mp3",
    "https://assets.example/audio/focus/locean/golden_pizzicato.mp3",
    "https://assets.example/audio/focus/locean/violin_over_water.mp3",
    "https://assets.example/audio/focus/locean/cielo_de_tarifa.mp3",
    "https://assets.example/audio/focus/locean/foggy_window.mp3",
    "https://assets.example/audio/focus/locean/its_not_leviosa.mp3",
    "https://assets.example/audio/focus/locean/lantern_on_water.mp3",
    "https://assets.example/audio/focus/locean/piacello_strokes.mp3",
    "https://assets.example/audio/focus/locean/secret_garden.mp3",
    "https://assets.example/audio/focus/locean/sunbirth_path.mp3",
  ]);
  assert.deepEqual(loceanTrackUrls("https://assets.example").map(trackDisplayName), ["Dreamy Sunset", "Guembridiculous", "Kaddour Hits", "Geneve Groove", "Afromantic", "Jazzilian 2026", "Maybe Next Night", "Sunny Afternoon In Marrakesh", "Unresolved Thoughts", "Across The Atlantic", "Afrolin", "Dropped From High", "Golden Pizzicato", "Violin Over Water", "Cielo De Tarifa", "Foggy Window", "Its Not Leviosa", "Lantern On Water", "Piacello Strokes", "Secret Garden", "Sunbirth Path"]);
});
