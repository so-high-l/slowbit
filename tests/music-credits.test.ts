import assert from "node:assert/strict";
import test from "node:test";
import { musicCredits, sceneMusicCredits } from "../src/lib/music-credits.ts";

test("music credits include the requested artists with tracks, scenes, and public links", () => {
  const required = ["Ondrosik", "HoliznaCC0", "ZephiraMusic", "SerenoMusic", "HoggyArt", "Turning Pages", "OpenMind Audio"];
  for (const artist of required) {
    const credit = musicCredits.find(item => item.artist === artist);
    assert.ok(credit, `${artist} is missing`);
    assert.ok(credit.tracks.length > 0, `${artist} has no tracks`);
    assert.ok(credit.tracks.every(track => track.scenes.length > 0), `${artist} has a track without a scene`);
    assert.match(credit.href, /^https:\/\//);
  }
  assert.equal(musicCredits.find(item => item.artist === "Turning Pages")?.href, "https://youtube.com/@turningpages");
});

test("scene credits are derived from track-level artist mappings", () => {
  const sunlit = sceneMusicCredits.find(item => item.scene === "Sunlit Wall");
  const cafe = sceneMusicCredits.find(item => item.scene === "Japanese Corner Café");
  assert.ok(sunlit?.tracks.some(track => track.title === "Drifting Piano" && track.artist === "HoliznaCC0"));
  assert.ok(cafe?.tracks.some(track => track.title === "Morning Coffee" && track.artist === "HoliznaCC0"));
  assert.ok(!cafe?.tracks.some(track => track.title === "Drifting Piano"));
});

test("credit entries do not expose licensing status or private contact details", () => {
  const publicCopy = JSON.stringify(musicCredits);
  assert.doesNotMatch(publicCopy, /RIGHTS REVIEW|UNKNOWN|@gmail\.com/i);
  assert.doesNotMatch(publicCopy, /AbsoluteSound|Deep Thinking Lofi Music/i);
});
