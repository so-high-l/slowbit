import { test } from "node:test";
import assert from "node:assert/strict";
import { paintReadingRoom, readingRoomImagePaths } from "../src/components/visuals/ReadingRoom.ts";
import { visuals } from "../src/data/catalog.ts";
import { availableVisuals } from "../src/lib/scene-availability.ts";
import { defaults, getSceneSoundMix, normalize, saveSceneSoundMix } from "../src/lib/preferences.ts";
import { sceneSoundscapes } from "../src/lib/scene-soundscapes.ts";
import { readingRoomImmersiveMix, soundLabel } from "../src/lib/sound-controls.ts";
import type { Particle } from "../src/components/visuals/drawing.ts";

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

const particles: Particle[] = Array.from({ length: 50 }, (_, index) => ({
  x: (index % 10) / 10,
  y: (index % 7) / 7,
  r: 1,
  s: 0.4,
  phase: index * 0.3,
}));

function frame(focus: number, reducedMotion = false, t = 20) {
  const result = canvas();
  const dark = { name: "dark" } as unknown as CanvasImageSource;
  const light = { name: "light" } as unknown as CanvasImageSource;
  paintReadingRoom(
    { ctx: result.ctx, w: 1600, h: 900, t, particles, focus, reducedMotion },
    { get: key => key === "dark" ? dark as HTMLImageElement : light as HTMLImageElement },
  );
  return { ...result, dark, light };
}

test("Reading Room is Focus-only with its own persistent jazz mix", () => {
  const scene = visuals.find(visual => visual.id === "readingRoom")!;
  assert.equal(scene.name, "Reading Room");
  assert.equal(scene.subtitle, "Settle in. Let the room hold the rest.");
  assert.ok(availableVisuals(visuals, "focus").includes(scene));
  assert.ok(!availableVisuals(visuals, "unwind").includes(scene));
  assert.equal(sceneSoundscapes.readingRoom?.playlist, "readingRoomJazz");
  assert.equal(soundLabel(scene.id, "lofi", "Lofi"), "Jazz Radio");
  assert.deepEqual(scene.defaultSounds, { rain: 0.18, night: 0.08, lofi: 0.05, binaural: 0 });

  const saved = normalize(saveSceneSoundMix(defaults, scene.id, { rain: 0.12, night: 0.04, lofi: 0.09 }));
  const restored = getSceneSoundMix(saved, scene);
  assert.equal(restored.rain, 0.12);
  assert.equal(restored.night, 0.04);
  assert.equal(restored.lofi, 0.09);
});

test("Reading Room crossfades perfectly aligned dark and lit images", () => {
  assert.match(readingRoomImagePaths.dark, /dark\.png$/);
  const normal = frame(0);
  const normalImages = normal.operations.filter(operation => operation[0] === "drawImage");
  assert.equal(normalImages.length, 1);
  assert.equal(normalImages[0][1], normal.dark);

  const transition = frame(0.5);
  const images = transition.operations.filter(operation => operation[0] === "drawImage");
  assert.equal(images.length, 2);
  assert.equal(images[0][1], transition.dark);
  assert.equal(images[1][1], transition.light);
  assert.deepEqual(images[0].slice(2), images[1].slice(2), "both images use the exact same cover transform");
  assert.equal(transition.saves(), 0);
});

test("Reading Room Z keeps rain, raises jazz, clears other layers, and preserves saved values", () => {
  const scene = visuals.find(visual => visual.id === "readingRoom")!;
  const saved = getSceneSoundMix(defaults, scene);
  const normal = readingRoomImmersiveMix(saved, false);
  const immersive = readingRoomImmersiveMix(saved, true);
  assert.strictEqual(normal, saved);
  assert.equal(immersive.rain, saved.rain);
  assert.equal(immersive.lofi, 0.24);
  assert.equal(immersive.night, 0);
  assert.equal(immersive.brown, 0);
  assert.equal(saved.night, 0.08);
  assert.equal(saved.lofi, 0.05);
});

test("Reading Room reduced motion freezes atmospheric drift while preserving light state", () => {
  assert.deepEqual(frame(0.7, true, 0).operations, frame(0.7, true, 600).operations);
});
