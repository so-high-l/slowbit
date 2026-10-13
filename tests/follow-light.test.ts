import { test } from "node:test";
import assert from "node:assert/strict";
import { visuals } from "../src/data/catalog.ts";
import { followLightPosition, paintFollowLight, sceneLights } from "../src/components/visuals/follow-light.ts";
import { deepBlueImmersion, paintDeepBlue } from "../src/components/visuals/DeepBlue.ts";

// Record drawing operations to check still frames, canvas isolation, and paths.
function canvas() {
  const operations: unknown[][] = [];
  let saves = 0;
  const gradient = { addColorStop: (...args: unknown[]) => operations.push(["stop", ...args]) };
  const ctx = new Proxy({ globalAlpha: 1 }, {
    get(target, key) {
      if (key === "globalAlpha") return target.globalAlpha;
      return (...args: unknown[]) => {
        operations.push([key, ...args]);
        if (key === "save") saves++;
        if (key === "restore") saves--;
        if (String(key).startsWith("create")) return gradient;
      };
    },
    set(target, key, value) {
      operations.push([key, value === gradient ? "gradient" : value]);
      if (key === "globalAlpha") target.globalAlpha = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, operations, saves: () => saves };
}

test("every scene has a slow, bounded guide and a stationary reduced-motion point", () => {
  assert.equal(Object.keys(sceneLights).length, visuals.length);
  for (const { id } of visuals) {
    const still = followLightPosition(id, 0, true);
    for (let t = 0; t <= 600; t += 0.5) {
      const p = followLightPosition(id, t);
      assert.ok(p.x > 0.2 && p.x < 0.85 && p.y > 0.2 && p.y < 0.75, id);
      const next = followLightPosition(id, t + 1 / 30);
      assert.ok(Math.hypot(next.x - p.x, next.y - p.y) < 0.001, "no jumps or fast sweeps");
      assert.deepEqual(followLightPosition(id, t, true), still);
    }
  }
});

test("the guide draws nothing outside immersion and reduced motion has no pulse", () => {
  const off = canvas();
  paintFollowLight(off.ctx, "jelly", 1440, 900, 0, 0);
  assert.equal(off.operations.length, 0);
  const first = canvas(), later = canvas();
  paintFollowLight(first.ctx, "jelly", 1440, 900, 0, 1, true);
  paintFollowLight(later.ctx, "jelly", 1440, 900, 90, 1, true);
  assert.deepEqual(first.operations, later.operations);
  assert.equal(first.saves(), 0);
});

test("Deep Blue returns to the original camera and disables camera travel for reduced motion", () => {
  assert.deepEqual(deepBlueImmersion(0), { strength: 0, travel: 0, zoom: 1 });
  assert.equal(deepBlueImmersion(1).zoom, 1.12);
  assert.deepEqual(deepBlueImmersion(1, true), { strength: 1, travel: 0, zoom: 1 });
  for (const [w, h] of [[1440, 900], [390, 844], [260, 160]]) {
    for (const focus of [0, 0.5, 1]) {
      const frame = canvas();
      paintDeepBlue({ ctx: frame.ctx, w, h, t: 30, particles: [], focus });
      assert.equal(frame.saves(), 0, "camera transforms never leak into controls or other scenes");
      for (const op of frame.operations) {
        for (const value of op) if (typeof value === "number") assert.ok(Number.isFinite(value));
      }
    }
  }
});
