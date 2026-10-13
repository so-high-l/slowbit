import { test } from "node:test";
import assert from "node:assert/strict";
import { distantComet, orbitStars, orbitDust, spacePoint } from "../src/components/visuals/orbit-space.ts";

test("layered space drifts in normal mode and remains bounded over long sessions", () => {
  const count = orbitStars.length + orbitDust.length;
  for (const [w, h] of [[1440, 900], [390, 844], [260, 160]]) {
    for (const dust of [false, true]) {
      for (const point of dust ? orbitDust : orbitStars) {
        const first = spacePoint(point, w, h, 0, dust);
        assert.notDeepEqual(spacePoint(point, w, h, 10, dust), first);
        for (const t of [60, 3600, 86400]) {
          const p = spacePoint(point, w, h, t, dust);
          assert.ok(p.x >= -12 && p.x < w + 12);
          assert.ok(p.y >= -12 && p.y < h + 12);
          assert.deepEqual(spacePoint(point, w, h, t, dust), p, "a paused clock produces a stable frame");
        }
      }
    }
  }
  assert.equal(orbitStars.length + orbitDust.length, count, "no particles accumulate");
});

test("the distant comet fades in and out, is infrequent, and never appears with reduced motion", () => {
  assert.equal(distantComet(0), null);
  assert.equal(distantComet(18), null);
  assert.equal(distantComet(32), null);
  assert.equal(distantComet(73), null);
  assert.ok(distantComet(18.01)!.alpha < 0.001);
  assert.ok(distantComet(31.99)!.alpha < 0.001);
  assert.equal(distantComet(25)!.alpha, 0.3);
  assert.deepEqual(distantComet(25), distantComet(99));
  for (let t = 0; t < 150; t++) assert.equal(distantComet(t, true), null);
});
