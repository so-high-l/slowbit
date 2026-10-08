import { test } from "node:test";
import assert from "node:assert/strict";
import { createInkTrail, advanceInkTrail, INK_TRAIL_LENGTH } from "../src/components/visuals/ink-trail.ts";

test("ink stays bounded through a long session and freezes cleanly when paused", () => {
  for (const seed of [1, 18742, 39001523, 617777777]) {
    const trail = createInkTrail(seed);
    for (let frame = 0; frame < 36000; frame++) {
      advanceInkTrail(trail, 1 / 30);
      assert.ok(Math.hypot(trail.x, trail.y) < 1.15);
      assert.equal(trail.points.length, INK_TRAIL_LENGTH);
    }
    const before = structuredClone(trail);
    advanceInkTrail(trail, 0);
    assert.deepEqual(trail, before);
    const point = { x: trail.x, y: trail.y };
    advanceInkTrail(trail, 100);
    assert.ok(Math.hypot(trail.x - point.x, trail.y - point.y) < 0.02);
  }
});

test("ink motion follows elapsed time rather than display refresh rate", () => {
  const slow = createInkTrail(81723);
  const fast = createInkTrail(81723);
  for (let i = 0; i < 600; i++) advanceInkTrail(slow, 1 / 30);
  for (let i = 0; i < 1200; i++) advanceInkTrail(fast, 1 / 60);
  assert.deepEqual(slow.points, fast.points);
  assert.notDeepEqual(slow.points, createInkTrail(28713).points);
});
