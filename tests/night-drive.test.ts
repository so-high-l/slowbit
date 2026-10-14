import { test } from "node:test";
import assert from "node:assert/strict";
import { paintNightDrive } from "../src/components/visuals/NightDrive.ts";
import { visuals } from "../src/data/catalog.ts";
import { availableVisuals } from "../src/lib/scene-availability.ts";
import { defaults, getSceneSoundMix, normalize, saveSceneSoundMix } from "../src/lib/preferences.ts";
import { sceneSoundscapes } from "../src/lib/scene-soundscapes.ts";
import { soundLabel } from "../src/lib/sound-controls.ts";

function canvas() {
  const operations: unknown[][] = [];
  let saves = 0;
  const gradient = { addColorStop: (...args: unknown[]) => operations.push(["addColorStop", ...args]) };
  const ctx = new Proxy({}, {
    get(_target, key) {
      return (...args: unknown[]) => {
        operations.push([key, ...args]);
        if (key === "save") saves++;
        if (key === "restore") saves--;
        if (String(key).startsWith("create")) return gradient;
      };
    },
    set(_target, key, value) {
      operations.push([key, value === gradient ? "gradient" : value]);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, operations, saves: () => saves };
}

function frame(t: number, immersiveProgress = 0, reducedMotion = false) {
  const result = canvas();
  paintNightDrive({ ctx: result.ctx, w: 1600, h: 900, t, immersiveProgress, reducedMotion });
  return result;
}

function renderedText(operations: unknown[][]) {
  return operations.filter(op => op[0] === "fillText").map(op => String(op[1]));
}

test("Night Drive is Focus-only with a persistent lo-fi and brown-noise mix", () => {
  const scene = visuals.find(visual => visual.id === "nightDrive")!;
  assert.equal(scene.name, "Night Drive");
  assert.equal(scene.subtitle, "A little further, one quiet mile at a time.");
  assert.ok(availableVisuals(visuals, "focus").includes(scene));
  assert.ok(!availableVisuals(visuals, "unwind").includes(scene));
  assert.equal(sceneSoundscapes.nightDrive?.playlist, "nightDriveLofi");
  assert.equal(soundLabel(scene.id, "lofi", "Lofi"), "Lo-fi Radio");
  assert.deepEqual(scene.defaultSounds, { lofi: 0.24, brown: 0.08, binaural: 0 });

  const saved = normalize(saveSceneSoundMix(defaults, scene.id, { lofi: 0.15, brown: 0.04 }));
  assert.equal(getSceneSoundMix(saved, scene).lofi, 0.15);
  assert.equal(getSceneSoundMix(saved, scene).brown, 0.04);
});

test("Night Drive keeps a steady 68 km/h while Z moves the cabin toward the road", () => {
  assert.ok(renderedText(frame(20, 0).operations).includes("68"));
  assert.ok(renderedText(frame(20, 0.5).operations).includes("68"));
  assert.ok(renderedText(frame(20, 1).operations).includes("68"));
  const normal = frame(20, 0).operations;
  const immersive = frame(20, 1).operations;
  assert.notDeepEqual(normal, immersive);
  assert.ok(immersive.some(op => op[0] === "scale" && Number(op[1]) >= 1.12), "the road view moves visibly closer");
  assert.ok(immersive.some(op => op[0] === "translate" && Number(op[2]) >= 50), "the dashboard lowers out of the windshield");
});

test("Night Drive is deterministic while paused and becomes still with reduced motion", () => {
  const pausedA = frame(37.5, 0.4);
  const pausedB = frame(37.5, 0.4);
  assert.deepEqual(pausedA.operations, pausedB.operations, "a frozen CanvasScene clock produces the same frame");

  const reducedA = frame(0, 0, true);
  const reducedB = frame(600, 1, true);
  assert.deepEqual(reducedA.operations, reducedB.operations);
  assert.ok(renderedText(reducedB.operations).includes("68"));
  assert.equal(reducedB.saves(), 0);
  for (const operation of reducedB.operations)
    for (const value of operation)
      if (typeof value === "number") assert.ok(Number.isFinite(value));
});
