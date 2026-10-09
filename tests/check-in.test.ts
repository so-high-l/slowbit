import { test } from "node:test";
import assert from "node:assert/strict";
import { checkIns, checkInMix, availableCheckInScene, stationOrder } from "../src/lib/check-in.ts";
import { visuals } from "../src/data/catalog.ts";

test("mood suggestions have distinct scenes and mixes; quieter moods do not inherit musical tracks", () => {
  assert.equal(new Set(stationOrder.map(mood => availableCheckInScene(mood, []))).size, stationOrder.length);
  assert.equal(new Set(stationOrder.map(mood => JSON.stringify(checkInMix(mood)))).size, stationOrder.length);
  assert.equal(checkInMix("fried").tones, 0);
  assert.equal(checkInMix("overstimulated").tones, 0);
  for (const mood of stationOrder) assert.equal(checkInMix(mood).brown, 0);
  assert.ok(checkIns.overstimulated.pace < checkIns.restless.pace);
  const mix = checkInMix("fried");
  mix.rain = 1;
  assert.equal(checkInMix("fried").rain, 0.4);
});
test("check-in falls back around hidden scenes and explicitly handles all hidden", () => {
  const all = visuals.map(visual => visual.id);
  for (const mood of stationOrder) {
    const hidden = [checkIns[mood].scene];
    assert.ok(!hidden.includes(availableCheckInScene(mood, hidden)!));
    assert.equal(availableCheckInScene(mood, all), undefined);
  }
});
