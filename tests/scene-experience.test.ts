import { test } from "node:test";
import assert from "node:assert/strict";
import { sceneMix } from "../src/lib/sound-presets.ts";
import { visuals } from "../src/data/catalog.ts";
import { advanceDepth } from "../src/components/visuals/depth.ts";
test("scene presets replace old tracks, remain editable, and never mutate their defaults", () => {
  const rain = sceneMix(visuals.find((v) => v.id === "rain")!);
  const stars = sceneMix(visuals.find((v) => v.id === "stars")!);
  assert.deepEqual(rain, { rain: 0.35, wind: 0.08, brown: 0.08, fire: 0, forest: 0, night: 0, tones: 0 });
  assert.equal(stars.rain, 0);
  assert.ok(stars.tones > 0);
  stars.tones = 0.9;
  assert.equal(sceneMix(visuals.find((v) => v.id === "stars")!).tones, 0.16);
  for (const visual of visuals) {
    const mix = sceneMix(visual);
    assert.equal(Object.keys(mix).length, 7);
    assert.ok(Object.values(mix).every((n) => n >= 0 && n <= 1));
  }
});
test("continuous depth motion recycles a fixed particle pool instead of accumulating scale or objects", () => {
  const points = Array.from({ length: 20 }, (_, i) => ({
    x: i / 20,
    y: 1 - i / 20,
  }));
  const original = [...points];
  for (let frame = 0; frame < 30000; frame++)
    advanceDepth(points, 0.05, 1, 0.09, () => 0.5);
  assert.equal(points.length, 20);
  for (let i = 0; i < points.length; i++) {
    assert.equal(points[i], original[i]);
    assert.ok(Number.isFinite(points[i].x) && Number.isFinite(points[i].y));
    assert.ok(points[i].x >= -0.08 && points[i].x <= 1.08);
    assert.ok(points[i].y >= -0.08 && points[i].y <= 1.08);
  }
  const stopped = structuredClone(points);
  advanceDepth(points, 0.05, 0, 0.09);
  assert.deepEqual(points, stopped);
});
