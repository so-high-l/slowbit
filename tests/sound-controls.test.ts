import { test } from "node:test";
import assert from "node:assert/strict";
import { visuals, sounds } from "../src/data/catalog.ts";
import { recordingProfile, type RecordedChannel } from "../src/lib/audio-profiles.ts";
import { sceneSoundscapes } from "../src/lib/scene-soundscapes.ts";
import { duplicateSound, soundLabel } from "../src/lib/sound-controls.ts";
import { defaults, getSceneSoundMix, normalize, saveSceneSoundMix, resetSceneSoundMix } from "../src/lib/preferences.ts";

test("all 29 scenes expose only one control per recorded file", () => {
  assert.equal(visuals.length, 29);
  for (const visual of visuals) {
    const channels: RecordedChannel[] = ["rain", "wind", "forest", "fire", "night", "brown"];
    if (sceneSoundscapes[visual.id]?.ambience) channels.push("ambience");
    if (visual.id === "orbitStudy") channels.push("orbitalPad");
    if (visual.id === "lantern") channels.push("train");
    if (visual.id === "vinyl") channels.push("vinylMusic");
    const files = channels.filter(id => id !== duplicateSound(visual.id)?.removed).map(id => recordingProfile(visual.id, id).file);
    assert.equal(new Set(files).size, files.length, visual.name);
  }
});

test("recording labels match scene-specific water, birds, forest and rain sources", () => {
  for (const visual of visuals) {
    for (const id of ["rain", "wind", "forest"] as const) {
      if (id === duplicateSound(visual.id)?.removed) continue;
      const label = soundLabel(visual.id, id, sounds.find(sound => sound.id === id)!.name);
      const file = recordingProfile(visual.id, id).file;
      if (file.includes("water-flowing")) assert.match(label, /water/i, visual.name);
      else if (file.includes("underwater")) assert.equal(label, "Underwater ambience");
      else if (file.includes("birds")) assert.equal(label, "Birdsong");
      else if (file.includes("forest-ambience")) assert.equal(label, "Forest ambience");
      else if (file.includes("forest-rain")) assert.equal(label, "Forest rain");
      else if (file.includes("rain")) assert.equal(label, "Rain");
      else if (file.includes("wind")) assert.equal(label, "Wind");
      else assert.fail(`Unverified recording ${file}`);
    }
  }
});

test("saved duplicate channels migrate once and the remaining control can mute them", () => {
  for (const id of ["embers", "nightSky", "ocean", "mist"] as const) {
    const visual = visuals.find(v => v.id === id)!;
    const { removed, kept } = duplicateSound(id)!;
    const saved = normalize({ soundMixesByScene: { [id]: { [removed]: 0.4, [kept]: 0.1 } } });
    assert.equal(getSceneSoundMix(saved, visual)[removed], 0);
    assert.equal(getSceneSoundMix(saved, visual)[kept], 0.4);
    const muted = saveSceneSoundMix(saved, id, { [kept]: 0 });
    assert.equal(getSceneSoundMix(normalize(JSON.parse(JSON.stringify(muted))), visual)[kept], 0);
  }
});

test("split controls inherit legacy levels but remain independent after edits and reload", () => {
  const pond = visuals.find(v => v.id === "pond")!;
  const windOnlyEdit = normalize({ soundMixesByScene: { pond: { wind: 0.1 } } });
  assert.equal(getSceneSoundMix(windOnlyEdit, pond).pondDrops, 0.3, "legacy bubbles followed the default water level when it was on");
  const oldFallback = normalize({ soundMixesByScene: { pond: { ambience: 0, wind: 0.1 } } });
  assert.equal(getSceneSoundMix(oldFallback, pond).pondDrops, 0.1);
  for (const id of ["clouds", "ribbonTunnel", "pond"] as const) {
    const visual = visuals.find(v => v.id === id)!;
    const original = id === "pond" ? "ambience" : "texture";
    const split = id === "pond" ? "pondDrops" : "textureTone";
    const initial = getSceneSoundMix(defaults, visual);
    const firstEdit = saveSceneSoundMix(defaults, id, { [original]: 0 });
    assert.equal(getSceneSoundMix(firstEdit, visual)[split], initial[split], "first edit leaves other layer unchanged");
    const legacy = normalize({ soundMixesByScene: { [id]: { [original]: 0.12 } } });
    assert.equal(getSceneSoundMix(legacy, visual)[split], 0.12);
    const saved = saveSceneSoundMix(legacy, id, { [split]: 0 });
    const reloaded = normalize(JSON.parse(JSON.stringify(saved)));
    assert.equal(getSceneSoundMix(reloaded, visual)[original], 0.12);
    assert.equal(getSceneSoundMix(reloaded, visual)[split], 0);
    assert.deepEqual(getSceneSoundMix(resetSceneSoundMix(reloaded, id), visual), initial);
  }
});

test("Deep blue removes saved crickets without changing other scene mixes", () => {
  const saved = normalize({ soundMixesByScene: { jelly: { night: 0.7, wind: 0.3 }, meadow: { night: 0.4 } } });
  const deepBlue = getSceneSoundMix(saved, visuals.find(v => v.id === "jelly")!);
  assert.equal(deepBlue.night, 0);
  assert.equal(deepBlue.wind, 0.3);
  assert.equal(getSceneSoundMix(saved, visuals.find(v => v.id === "meadow")!).night, 0.4);
});
